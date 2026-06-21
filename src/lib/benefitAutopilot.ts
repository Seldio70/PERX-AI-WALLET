import { Benefit, BenefitCategory, SelectionRequest, User } from "../types";

export type TimeSlot = "morning" | "midday" | "evening" | "weekend";

export type TimeContext = {
  slot: TimeSlot;
  label: string;
  categories: BenefitCategory[];
};

export type WalletHealth = {
  monthlyBudget: number;
  available: number;
  used: number;
  reserved: number;
  daysLeft: number;
  cycleDays: number;
  usedPct: number;
  reservedPct: number;
  availablePct: number;
};

export type NearbySuggestion = {
  benefit: Benefit;
  reason: string;
};

export type AutopilotPlan = {
  items: Benefit[];
  reasoning: string;
  confidence: number;
  totalPrice: number;
  totalPoints: number;
  daysLeft: number;
  unusedPct: number;
};

// Categories that lean toward "daily convenience" vs "long-term wellbeing".
const DAILY_CONVENIENCE: BenefitCategory[] = ["Food", "Fitness", "Mobility"];
const LONG_TERM: BenefitCategory[] = ["Wellness", "Learning", "Health"];

export function getDaysLeftInCycle(now: Date = new Date()): { daysLeft: number; cycleDays: number } {
  const cycleDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(0, cycleDays - now.getDate() + 1);
  return { daysLeft, cycleDays };
}

export function getTimeContext(now: Date = new Date()): TimeContext {
  const day = now.getDay();
  const hour = now.getHours();
  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    return { slot: "weekend", label: "This weekend", categories: ["Family", "Learning", "Wellness"] };
  }
  if (hour < 11) {
    return { slot: "morning", label: "This morning", categories: ["Food", "Health"] };
  }
  if (hour < 15) {
    return { slot: "midday", label: "Around lunch", categories: ["Food"] };
  }
  return { slot: "evening", label: "After work", categories: ["Fitness", "Wellness"] };
}

function isExpired(benefit: Benefit, now: Date): boolean {
  const time = Date.parse(benefit.validUntil);
  if (Number.isNaN(time)) return false;
  return time < now.getTime();
}

function daysUntilExpiry(benefit: Benefit, now: Date): number {
  const time = Date.parse(benefit.validUntil);
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY;
  return Math.ceil((time - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeWalletHealth(input: {
  user: User;
  monthlyBudget: number;
  selectionRequests: SelectionRequest[];
  now?: Date;
}): WalletHealth {
  const now = input.now ?? new Date();
  const mine = input.selectionRequests.filter((request) => request.employeeId === input.user.id);
  const used = mine
    .filter((request) => request.status === "approved")
    .reduce((sum, request) => sum + request.totalPoints, 0);
  const reserved = mine
    .filter((request) => request.status === "pending" || request.status === "draft")
    .reduce((sum, request) => sum + request.totalPoints, 0);
  const monthlyBudget = Math.max(0, input.monthlyBudget);
  const available = Math.max(0, monthlyBudget - used - reserved);
  const { daysLeft, cycleDays } = getDaysLeftInCycle(now);
  const safeBudget = monthlyBudget || 1;

  return {
    monthlyBudget,
    available,
    used,
    reserved,
    daysLeft,
    cycleDays,
    usedPct: Math.min(1, used / safeBudget),
    reservedPct: Math.min(1, reserved / safeBudget),
    availablePct: Math.min(1, available / safeBudget)
  };
}

function categoryPreference(user: User): { prefersDaily: boolean; descriptor: string } {
  const years = user.yearsEmployed ?? 0;
  // Newer employees lean toward daily convenience; tenured ones toward wellbeing/learning.
  const prefersDaily = years < 3;
  return {
    prefersDaily,
    descriptor: prefersDaily ? "daily convenience plus fitness" : "wellbeing and learning"
  };
}

function scoreBenefit(benefit: Benefit, user: User, now: Date): number {
  let score = 50;
  const ctx = getTimeContext(now);
  const { prefersDaily } = categoryPreference(user);

  if (ctx.categories.includes(benefit.category)) score += 18;
  if (prefersDaily && DAILY_CONVENIENCE.includes(benefit.category)) score += 12;
  if (!prefersDaily && LONG_TERM.includes(benefit.category)) score += 12;

  // Offers expiring soon get a nudge so budget is not wasted.
  const expiry = daysUntilExpiry(benefit, now);
  if (expiry <= 14) score += 10;
  else if (expiry <= 30) score += 4;

  // Reasonable value: prefer mid-range so the plan isn't a single huge item.
  if (benefit.pointsPrice > 0 && benefit.pointsPrice <= 300) score += 6;

  return score;
}

export function rankBenefits(user: User, benefits: Benefit[], now: Date = new Date()): Benefit[] {
  return benefits
    .filter((benefit) => !isExpired(benefit, now))
    .map((benefit) => ({ benefit, score: scoreBenefit(benefit, user, now) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.benefit);
}

export function pickNearby(benefits: Benefit[], now: Date = new Date(), max = 3): NearbySuggestion[] {
  const ctx = getTimeContext(now);
  const active = benefits.filter((benefit) => !isExpired(benefit, now));
  const preferred = active.filter((benefit) => ctx.categories.includes(benefit.category));
  const rest = active.filter((benefit) => !ctx.categories.includes(benefit.category));
  const ordered = [...preferred, ...rest].slice(0, max);

  return ordered.map((benefit) => ({
    benefit,
    reason: nearbyReason(benefit, ctx)
  }));
}

function nearbyReason(benefit: Benefit, ctx: TimeContext): string {
  const matches = ctx.categories.includes(benefit.category);
  switch (ctx.slot) {
    case "morning":
      return matches ? "Good for a morning coffee or bite" : "Popular near you right now";
    case "midday":
      return matches ? "Perfect for a lunch break nearby" : "Handy for a midday stop";
    case "evening":
      return matches ? "Wind down after work" : "Worth a stop on the way home";
    case "weekend":
    default:
      return matches ? "Great for the weekend" : "Nearby this weekend";
  }
}

export function buildAutopilotPlan(input: {
  user: User;
  benefits: Benefit[];
  health: WalletHealth;
  now?: Date;
}): AutopilotPlan {
  const now = input.now ?? new Date();
  const ranked = rankBenefits(input.user, input.benefits, now);

  const picked: Benefit[] = [];
  const usedCategories = new Set<BenefitCategory>();
  let budget = input.health.available || input.health.monthlyBudget;

  // First pass: maximise category diversity within the available budget.
  for (const benefit of ranked) {
    if (picked.length >= 3) break;
    if (usedCategories.has(benefit.category)) continue;
    if (benefit.pointsPrice > budget) continue;
    picked.push(benefit);
    usedCategories.add(benefit.category);
    budget -= benefit.pointsPrice;
  }

  // Second pass: relax diversity if we still have room for fewer than two items.
  if (picked.length < 2) {
    for (const benefit of ranked) {
      if (picked.length >= 3) break;
      if (picked.some((item) => item.id === benefit.id)) continue;
      if (benefit.pointsPrice > budget) continue;
      picked.push(benefit);
      budget -= benefit.pointsPrice;
    }
  }

  const totalPoints = picked.reduce((sum, benefit) => sum + benefit.pointsPrice, 0);
  const totalPrice = totalPoints;
  const unusedPct = Math.round((1 - input.health.usedPct - input.health.reservedPct) * 100);

  return {
    items: picked,
    reasoning: buildReasoning(input.user, input.health, picked, unusedPct),
    confidence: computeConfidence(input.user, ranked.length, picked, input.health),
    totalPrice,
    totalPoints,
    daysLeft: input.health.daysLeft,
    unusedPct: Math.max(0, unusedPct)
  };
}

function buildReasoning(user: User, health: WalletHealth, picked: Benefit[], unusedPct: number): string {
  const { descriptor } = categoryPreference(user);
  const categories = Array.from(new Set(picked.map((benefit) => benefit.category)));
  const diversity = categories.length > 1 ? `across ${categories.length} categories (${categories.join(", ")})` : "for your top category";
  const tenure = (user.yearsEmployed ?? 0) >= 1 ? `${user.yearsEmployed} year${(user.yearsEmployed ?? 0) === 1 ? "" : "s"} here` : "your onboarding answers";
  return `You have ${health.daysLeft} day${health.daysLeft === 1 ? "" : "s"} left and ${Math.max(0, unusedPct)}% of your budget unused. Based on ${tenure}, your profile prefers ${descriptor}, so this plan spreads value ${diversity}.`;
}

function computeConfidence(user: User, poolSize: number, picked: Benefit[], health: WalletHealth): number {
  let confidence = 64;
  if (poolSize >= 6) confidence += 10;
  else if (poolSize >= 3) confidence += 5;
  if (picked.length >= 3) confidence += 8;
  else if (picked.length === 2) confidence += 4;
  const categories = new Set(picked.map((benefit) => benefit.category));
  if (categories.size >= 2) confidence += 6;
  if ((user.yearsEmployed ?? 0) >= 1) confidence += 4;
  if (health.available > 0) confidence += 4;
  return Math.max(55, Math.min(97, confidence));
}

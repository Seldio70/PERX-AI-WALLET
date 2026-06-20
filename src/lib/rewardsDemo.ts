import { Challenge, EmployeeInvite, RewardAutomation, RewardEvent } from "../types";

export const POINTS_REDEEM_RATE = 100;
export const BUDGET_PER_REDEEM = 500;

export const defaultRewardAutomations: RewardAutomation[] = [
  {
    kind: "birthday",
    enabled: true,
    points: 200,
    label: "Birthday bonus",
    description: "Auto-grant on each employee's birthday."
  },
  {
    kind: "anniversary",
    enabled: true,
    points: 150,
    label: "Work anniversary",
    description: "Per completed year with the company."
  },
  {
    kind: "seasonal",
    enabled: true,
    points: 300,
    label: "Christmas / seasonal",
    description: "Holiday drop for the whole team."
  },
  {
    kind: "welcome",
    enabled: true,
    points: 100,
    label: "Welcome bonus",
    description: "When a new employee joins via invite."
  }
];

export function createDemoInvites(employerId: string, companyId: string, companyName: string): EmployeeInvite[] {
  return [
    {
      id: "invite_demo_1",
      email: "new.hire@novaworks.al",
      code: "PERX-DEMO",
      companyId,
      companyName,
      employerId,
      startDate: "2026-01-15",
      status: "sent",
      createdAt: new Date().toISOString()
    }
  ];
}

export function createDemoChallenges(employerId: string, employeeId: string, employeeName: string): Challenge[] {
  return [
    {
      id: "challenge_demo_1",
      employeeId,
      employeeName,
      employerId,
      title: "Friday wellness walk",
      description: "Join the team walk this Friday and check in.",
      rewardPoints: 75,
      status: "open",
      target: "everyone",
      dueDate: "2026-06-27"
    },
    {
      id: "challenge_demo_2",
      employeeId,
      employeeName,
      employerId,
      title: "Try a new perk category",
      description: "Redeem from a category you have not used this month.",
      rewardPoints: 50,
      status: "open",
      target: employeeId
    }
  ];
}

export function createDemoRewardEvents(employeeId: string, employeeName: string): RewardEvent[] {
  return [
    {
      id: "reward_demo_1",
      employeeId,
      employeeName,
      kind: "welcome",
      points: 100,
      note: "Welcome to PerX perks",
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString()
    }
  ];
}

export function createDemoEmployeePoints(employeeIds: string[]): Record<string, number> {
  const points: Record<string, number> = {};
  employeeIds.forEach((id, index) => {
    points[id] = index === 0 ? 175 : 50;
  });
  return points;
}

export function rewardKindLabel(kind: RewardEvent["kind"]): string {
  switch (kind) {
    case "birthday":
      return "Birthday";
    case "anniversary":
      return "Anniversary";
    case "seasonal":
      return "Seasonal";
    case "welcome":
      return "Welcome";
    case "spot":
      return "Spot bonus";
    case "challenge":
      return "Challenge";
    default:
      return "Reward";
  }
}

export function yearsSince(startDate?: string): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 0;
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  const monthDiff = now.getMonth() - start.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < start.getDate())) {
    years -= 1;
  }
  return Math.max(0, years);
}

export function formatDateLabel(value?: string): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function generateInviteCode(): string {
  const segment = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PERX-${segment}`;
}

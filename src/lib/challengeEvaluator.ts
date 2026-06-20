import {
  Benefit,
  BenefitCategory,
  ChallengeCriterion,
  ChallengeDefinition,
  ChallengeEmployerStats,
  ChallengeProgress,
  ChallengeView,
  SelectionRequest,
  User
} from "../types";
import { criterionLabel } from "./challengePlatformTemplates";
import { EmployeeHealthSnapshot } from "./healthDataService";

export type ChallengeEvalContext = {
  employeeId: string;
  selectionRequests: SelectionRequest[];
  benefits: Benefit[];
  loginDates: string[];
  healthMetrics?: EmployeeHealthSnapshot;
  /** Only count activity on or after this timestamp (challenge / progress start). */
  challengeStartedAt?: string;
  now?: Date;
};

function dayStart(now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

function healthActivityEligible(now: Date, challengeStartedAt?: string): boolean {
  const start = challengeStartDate(challengeStartedAt);
  if (!start) return true;
  return dayStart(now) >= dayStart(start);
}

function evaluateHealthSteps(context: ChallengeEvalContext, startedAt?: string): number {
  if (!context.healthMetrics?.connected) return 0;
  const now = context.now ?? new Date();
  if (!healthActivityEligible(now, startedAt)) return 0;
  return context.healthMetrics.todaySteps ?? 0;
}

function evaluateHealthSleep(context: ChallengeEvalContext, startedAt?: string): number {
  if (!context.healthMetrics?.connected) return 0;
  const now = context.now ?? new Date();
  if (!healthActivityEligible(now, startedAt)) return 0;
  const hours = context.healthMetrics.lastNightSleepHours;
  return hours == null ? 0 : Math.floor(hours);
}

function challengeStartDate(challengeStartedAt?: string): Date | null {
  if (!challengeStartedAt) return null;
  const parsed = new Date(challengeStartedAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function effectivePeriodStart(
  period: "month" | "week" | "all_time",
  now: Date,
  challengeStartedAt?: string
): Date | null {
  const periodStartDate = periodStart(period, now);
  const challengeStart = challengeStartDate(challengeStartedAt);
  if (!periodStartDate && !challengeStart) return null;
  if (!periodStartDate) return challengeStart;
  if (!challengeStart) return periodStartDate;
  return challengeStart > periodStartDate ? challengeStart : periodStartDate;
}

function requestIsEligible(
  request: SelectionRequest,
  employeeId: string,
  notBefore: Date | null
): boolean {
  if (request.employeeId !== employeeId || request.status !== "approved") return false;
  if (!notBefore) return true;
  return new Date(request.approvedAt ?? request.createdAt) >= notBefore;
}

function periodStart(period: "month" | "week" | "all_time", now: Date): Date | null {
  if (period === "all_time") return null;
  if (period === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function approvedRequestsInPeriod(
  employeeId: string,
  selectionRequests: SelectionRequest[],
  period: "month" | "week" | "all_time",
  now: Date,
  challengeStartedAt?: string
) {
  const start = effectivePeriodStart(period, now, challengeStartedAt);
  return selectionRequests.filter((request) => requestIsEligible(request, employeeId, start));
}

function redemptionCountInPeriod(
  employeeId: string,
  selectionRequests: SelectionRequest[],
  period: "month" | "week" | "all_time",
  now: Date,
  challengeStartedAt?: string
) {
  return approvedRequestsInPeriod(
    employeeId,
    selectionRequests,
    period,
    now,
    challengeStartedAt
  ).reduce((sum, request) => sum + request.benefitIds.length, 0);
}

function categoriesUsedThisMonth(
  employeeId: string,
  selectionRequests: SelectionRequest[],
  benefits: Benefit[],
  now: Date
): Set<BenefitCategory> {
  const start = periodStart("month", now)!;
  const categories = new Set<BenefitCategory>();
  for (const request of selectionRequests) {
    if (request.employeeId !== employeeId || request.status !== "approved") continue;
    if (new Date(request.approvedAt ?? request.createdAt) < start) continue;
    for (const benefitId of request.benefitIds) {
      const benefit = benefits.find((item) => item.id === benefitId);
      if (benefit) categories.add(benefit.category);
    }
  }
  return categories;
}

function categoriesBeforePeriod(
  employeeId: string,
  selectionRequests: SelectionRequest[],
  benefits: Benefit[],
  periodStartDate: Date
): Set<BenefitCategory> {
  const categories = new Set<BenefitCategory>();
  for (const request of selectionRequests) {
    if (request.employeeId !== employeeId || request.status !== "approved") continue;
    if (new Date(request.approvedAt ?? request.createdAt) >= periodStartDate) continue;
    for (const benefitId of request.benefitIds) {
      const benefit = benefits.find((item) => item.id === benefitId);
      if (benefit) categories.add(benefit.category);
    }
  }
  return categories;
}

function newCategoriesInPeriod(
  employeeId: string,
  selectionRequests: SelectionRequest[],
  benefits: Benefit[],
  now: Date,
  challengeStartedAt?: string
): number {
  const start = effectivePeriodStart("month", now, challengeStartedAt)!;
  const before = categoriesBeforePeriod(employeeId, selectionRequests, benefits, start);
  const newCats = new Set<BenefitCategory>();
  for (const request of selectionRequests) {
    if (!requestIsEligible(request, employeeId, start)) continue;
    for (const benefitId of request.benefitIds) {
      const benefit = benefits.find((item) => item.id === benefitId);
      if (benefit && !before.has(benefit.category)) newCats.add(benefit.category);
    }
  }
  return newCats.size;
}

export function computeLoginStreak(
  loginDates: string[],
  now = new Date(),
  challengeStartedAt?: string
): number {
  const challengeStart = challengeStartDate(challengeStartedAt);
  const filtered = loginDates.filter((date) => {
    if (!challengeStart) return true;
    return new Date(date) >= challengeStart;
  });
  if (!filtered.length) return 0;
  const unique = Array.from(new Set(filtered.map((d) => d.slice(0, 10)))).sort();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  const latest = unique[unique.length - 1];
  if (latest !== today && latest !== yesterdayKey) return 0;

  let streak = 0;
  let cursor = latest === today ? now : yesterday;
  const dateSet = new Set(unique);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dateSet.has(key)) break;
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function targetFromCriterion(criterion: ChallengeCriterion): number {
  switch (criterion.kind) {
    case "redeem_count":
      return criterion.count;
    case "redeem_category":
      return criterion.count;
    case "redeem_new_category":
      return criterion.count;
    case "login_streak":
      return criterion.days;
    case "health_steps":
      return criterion.count;
    case "health_sleep":
      return criterion.hours;
    case "manual":
      return 1;
    default:
      return 1;
  }
}

export function evaluateCriterionCurrent(
  criterion: ChallengeCriterion,
  context: ChallengeEvalContext
): number {
  const now = context.now ?? new Date();
  const startedAt = context.challengeStartedAt;

  switch (criterion.kind) {
    case "redeem_count":
      return redemptionCountInPeriod(
        context.employeeId,
        context.selectionRequests,
        criterion.period,
        now,
        startedAt
      );
    case "redeem_category": {
      const start = effectivePeriodStart(criterion.period, now, startedAt)!;
      let count = 0;
      for (const request of context.selectionRequests) {
        if (!requestIsEligible(request, context.employeeId, start)) continue;
        for (const benefitId of request.benefitIds) {
          const benefit = context.benefits.find((item) => item.id === benefitId);
          if (benefit?.category === criterion.category) count += 1;
        }
      }
      return count;
    }
    case "redeem_new_category":
      return newCategoriesInPeriod(
        context.employeeId,
        context.selectionRequests,
        context.benefits,
        now,
        startedAt
      );
    case "login_streak":
      return computeLoginStreak(context.loginDates, now, startedAt);
    case "health_steps":
      return evaluateHealthSteps(context, startedAt);
    case "health_sleep":
      return evaluateHealthSleep(context, startedAt);
    case "manual":
      return 0;
    default:
      return 0;
  }
}

export function progressLabelFor(
  criterion: ChallengeCriterion,
  current: number,
  target: number,
  submittedAt?: string
): string {
  switch (criterion.kind) {
    case "redeem_count":
      return `${Math.min(current, target)} / ${target} perks used`;
    case "redeem_category":
      return current >= target
        ? `Explored ${criterion.category}`
        : `Redeem a ${criterion.category} perk`;
    case "redeem_new_category":
      return current >= target ? "New category explored" : "Redeem from a new category";
    case "login_streak":
      return `Day ${Math.min(current, target)} of ${target}`;
    case "health_steps":
      return `${Math.min(current, target).toLocaleString()} / ${target.toLocaleString()} steps today`;
    case "health_sleep":
      return current >= target
        ? `Slept ${target}+ hours`
        : `${current} / ${target} hours of sleep`;
    case "manual":
      if (submittedAt) return "Submitted — waiting for manager";
      return current >= target ? "Completed" : "Your manager will award points when done";
    default:
      return `${Math.min(current, target)} / ${target}`;
  }
}

export function isDefinitionExpired(definition: ChallengeDefinition, now = new Date()): boolean {
  if (!definition.dueDate) return false;
  const due = new Date(definition.dueDate);
  due.setHours(23, 59, 59, 999);
  return now > due;
}

export function isDefinitionNotStarted(definition: ChallengeDefinition, now = new Date()): boolean {
  if (!definition.startDate) return false;
  const start = new Date(definition.startDate);
  start.setHours(0, 0, 0, 0);
  return now < start;
}

export function definitionVisibleToEmployee(
  definition: ChallengeDefinition,
  employee: User,
  employerId: string,
  disabledTemplateKeys: Set<string>,
  now = new Date()
): boolean {
  if (!definition.active || isDefinitionExpired(definition, now) || isDefinitionNotStarted(definition, now)) {
    return false;
  }
  if (definition.source === "platform") {
    if (definition.employerId !== employerId) return false;
    if (definition.templateKey && disabledTemplateKeys.has(definition.templateKey)) return false;
  } else if (definition.employerId !== employerId) {
    return false;
  }
  if (definition.target === "everyone") return true;
  return definition.target === employee.id;
}

export function buildChallengeView(
  definition: ChallengeDefinition,
  progress: ChallengeProgress | undefined,
  context: ChallengeEvalContext
): ChallengeView {
  const evalContext: ChallengeEvalContext = {
    ...context,
    challengeStartedAt: definition.createdAt ?? context.challengeStartedAt
  };
  const target = progress?.target ?? targetFromCriterion(definition.criterion);
  const evaluated =
    progress?.status === "completed"
      ? target
      : evaluateCriterionCurrent(definition.criterion, evalContext);
  const current = progress?.status === "completed" ? target : Math.min(evaluated, target);

  return {
    ...definition,
    progressId: progress?.id,
    employeeId: context.employeeId,
    current,
    progressTarget: target,
    status: progress?.status ?? "open",
    progressLabel: progressLabelFor(definition.criterion, current, target, progress?.submittedAt),
    submittedAt: progress?.submittedAt,
    completedAt: progress?.completedAt,
    completedBy: progress?.completedBy
  };
}

export function shouldAutoComplete(view: ChallengeView): boolean {
  if (view.status === "completed") return false;
  if (view.criterion.kind === "manual") return false;
  return view.current >= view.progressTarget;
}

export function buildEmployeeChallengeViews(input: {
  definitions: ChallengeDefinition[];
  progressRows: ChallengeProgress[];
  employee: User;
  employerId: string;
  disabledTemplateKeys: string[];
  selectionRequests: SelectionRequest[];
  benefits: Benefit[];
  loginDates: string[];
  healthMetrics?: EmployeeHealthSnapshot;
  now?: Date;
}): ChallengeView[] {
  const disabled = new Set(input.disabledTemplateKeys);
  const context: ChallengeEvalContext = {
    employeeId: input.employee.id,
    selectionRequests: input.selectionRequests,
    benefits: input.benefits,
    loginDates: input.loginDates,
    healthMetrics: input.healthMetrics,
    now: input.now
  };

  return input.definitions
    .filter((definition) =>
      definitionVisibleToEmployee(definition, input.employee, input.employerId, disabled)
    )
    .map((definition) => {
      const progress = input.progressRows.find(
        (row) => row.definitionId === definition.id && row.employeeId === input.employee.id
      );
      return buildChallengeView(definition, progress, context);
    })
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "open" ? -1 : 1;
      return (b.rewardPoints ?? 0) - (a.rewardPoints ?? 0);
    });
}

export function buildEmployerChallengeStats(input: {
  definition: ChallengeDefinition;
  progressRows: ChallengeProgress[];
  employees: User[];
}): ChallengeEmployerStats {
  const relevant = input.progressRows.filter((row) => row.definitionId === input.definition.id);
  const employeeIds = new Set(input.employees.map((e) => e.id));
  const scoped = relevant.filter((row) => employeeIds.has(row.employeeId));
  const completedCount = scoped.filter((row) => row.status === "completed").length;
  const inProgressCount = scoped.filter((row) => row.status === "open" && row.current > 0).length;

  return {
    definitionId: input.definition.id,
    totalEmployees: input.employees.length,
    completedCount,
    inProgressCount
  };
}

export function employerDefinitionSummary(definition: ChallengeDefinition): string {
  const base = criterionLabel(definition.criterion);
  return definition.dueDate ? `${base} · due ${definition.dueDate}` : base;
}

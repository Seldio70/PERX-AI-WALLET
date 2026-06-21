import {
  buildChallengeView,
  buildEmployeeChallengeViews,
  isDefinitionExpired,
  shouldAutoComplete
} from "./challengeEvaluator";
import {
  ChallengeDefinition,
  ChallengeProgress,
  ChallengeView,
  RewardEvent,
  SelectionRequest,
  User
} from "../types";
import { EmployeeHealthSnapshot } from "./healthDataService";
import {
  archiveExpiredChallengeDefinitions,
  completeChallengeProgressForEmployee,
  ensureChallengeProgressRows,
  updateChallengeProgressRow
} from "./perxRepository";
import { Benefit } from "../types";

export function collectEmployerIds(
  users: User[],
  companies: Array<{ id: string; employerId: string }>
): string[] {
  const ids = new Set<string>();
  for (const company of companies) {
    if (company.employerId) ids.add(company.employerId);
  }
  for (const user of users) {
    if (user.role === "employer") ids.add(user.id);
  }
  return Array.from(ids);
}

export function resolveEmployerIdForUser(
  users: User[],
  companies: Array<{ id: string; employerId: string }>,
  user: User
): string | undefined {
  const company = companies.find((item) => item.id === user.companyId);
  if (company?.employerId) return company.employerId;

  const employerInCompany = users.find(
    (candidate) => candidate.role === "employer" && candidate.companyId === user.companyId
  );
  if (employerInCompany) return employerInCompany.id;

  if (user.invitedByUserId) {
    const inviter = users.find((candidate) => candidate.id === user.invitedByUserId);
    if (inviter?.role === "employer") return inviter.id;
  }

  const firstCompanyEmployer = companies.find((item) => item.employerId)?.employerId;
  if (firstCompanyEmployer) return firstCompanyEmployer;

  return users.find((candidate) => candidate.role === "employer")?.id;
}

export function employeesForEmployer(users: User[], companyId: string, employerId: string): User[] {
  return users.filter((user) => user.role === "employee" && user.companyId === companyId);
}

export function resolveCompanyForEmployer(
  companies: Array<{ id: string; employerId: string }>,
  users: User[],
  employerUserId: string
) {
  return (
    companies.find((company) => company.employerId === employerUserId) ??
    companies.find((company) => company.id === users.find((user) => user.id === employerUserId)?.companyId) ??
    null
  );
}

export function canonicalEmployerId(
  companies: Array<{ id: string; employerId: string }>,
  users: User[],
  employerUserId: string
): string {
  return resolveCompanyForEmployer(companies, users, employerUserId)?.employerId ?? employerUserId;
}

export function employeesForEmployerUser(
  users: User[],
  companies: Array<{ id: string; employerId: string }>,
  employerUserId: string
): User[] {
  const company = resolveCompanyForEmployer(companies, users, employerUserId);
  if (!company) return [];
  return users.filter((user) => user.role === "employee" && user.companyId === company.id);
}

export function isPersistedChallengeId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function targetEmployeeIdsForDefinition(
  definition: ChallengeDefinition,
  employees: User[]
): string[] {
  if (definition.target === "everyone") return employees.map((employee) => employee.id);
  return employees.filter((employee) => employee.id === definition.target).map((employee) => employee.id);
}

export type ChallengeEvaluationResult = {
  progressRows: ChallengeProgress[];
  employeePointsDelta: Record<string, number>;
  rewardEvents: RewardEvent[];
  expiredDefinitionIds: string[];
};

export function awardsUsedForDefinition(
  definitionId: string,
  progressRows: ChallengeProgress[]
): number {
  return progressRows.filter(
    (row) => row.definitionId === definitionId && row.status === "completed"
  ).length;
}

export function canAwardMore(
  definition: ChallengeDefinition,
  progressRows: ChallengeProgress[]
): boolean {
  if (!definition.maxAwards) return true;
  return awardsUsedForDefinition(definition.id, progressRows) < definition.maxAwards;
}

export function computeChallengeAnalytics(input: {
  definitions: ChallengeDefinition[];
  progressRows: ChallengeProgress[];
  rewardEvents: RewardEvent[];
  employees: User[];
}): {
  platformCompletionRate: number;
  employerAwardsGiven: number;
  challengePointsGranted: number;
  spotPointsGranted: number;
} {
  const employeeIds = new Set(input.employees.map((employee) => employee.id));
  const platformDefs = input.definitions.filter((definition) => definition.source === "platform");
  const platformProgress = input.progressRows.filter(
    (row) =>
      employeeIds.has(row.employeeId) &&
      platformDefs.some((definition) => definition.id === row.definitionId)
  );
  const platformCompleted = platformProgress.filter((row) => row.status === "completed").length;
  const platformCompletionRate =
    platformProgress.length > 0 ? Math.round((platformCompleted / platformProgress.length) * 100) : 0;

  const employerAwardsGiven = input.progressRows.filter(
    (row) =>
      employeeIds.has(row.employeeId) &&
      row.status === "completed" &&
      input.definitions.some(
        (definition) => definition.id === row.definitionId && definition.source === "employer"
      )
  ).length;

  const challengePointsGranted = input.rewardEvents
    .filter((event) => event.kind === "challenge" && employeeIds.has(event.employeeId))
    .reduce((sum, event) => sum + event.points, 0);
  const spotPointsGranted = input.rewardEvents
    .filter((event) => event.kind === "spot" && employeeIds.has(event.employeeId))
    .reduce((sum, event) => sum + event.points, 0);

  return {
    platformCompletionRate,
    employerAwardsGiven,
    challengePointsGranted,
    spotPointsGranted
  };
}

export async function evaluateAndCompleteChallenges(input: {
  definitions: ChallengeDefinition[];
  progressRows: ChallengeProgress[];
  employee: User;
  employerId: string;
  employees: User[];
  disabledTemplateKeys: string[];
  selectionRequests: SelectionRequest[];
  benefits: Benefit[];
  loginDates: string[];
  healthMetrics?: EmployeeHealthSnapshot;
  employeePoints: Record<string, number>;
  completedBy?: "auto" | "employer_override";
  forceDefinitionId?: string;
}): Promise<ChallengeEvaluationResult> {
  const completedBy = input.completedBy ?? "auto";
  const views = buildEmployeeChallengeViews({
    definitions: input.definitions,
    progressRows: input.progressRows,
    employee: input.employee,
    employerId: input.employerId,
    disabledTemplateKeys: input.disabledTemplateKeys,
    selectionRequests: input.selectionRequests,
    benefits: input.benefits,
    loginDates: input.loginDates,
    healthMetrics: input.healthMetrics
  });

  const progressMap = new Map(input.progressRows.map((row) => [`${row.definitionId}:${row.employeeId}`, row]));
  const nextProgress = [...input.progressRows];
  const employeePointsDelta: Record<string, number> = {};
  const rewardEvents: RewardEvent[] = [];
  let runningBalance = input.employeePoints[input.employee.id] ?? 0;
  const expiredDefinitionIds = input.definitions
    .filter((definition) => isDefinitionExpired(definition))
    .map((definition) => definition.id);

  for (const view of views) {
    const progressKey = `${view.id}:${input.employee.id}`;
    let progress = progressMap.get(progressKey);
    if (!progress) continue;

    const refreshed = buildChallengeView(view, progress, {
      employeeId: input.employee.id,
      selectionRequests: input.selectionRequests,
      benefits: input.benefits,
      loginDates: input.loginDates,
      healthMetrics: input.healthMetrics
    });

    if (progress.status === "open" && refreshed.current !== progress.current) {
      progress = { ...progress, current: refreshed.current };
      await updateChallengeProgressRow({
        progressId: progress.id,
        current: progress.current,
        target: progress.target,
        status: "open"
      });
      const idx = nextProgress.findIndex((row) => row.id === progress!.id);
      if (idx >= 0) nextProgress[idx] = progress;
    }

    const shouldComplete =
      input.forceDefinitionId === view.id ||
      (completedBy === "auto" && shouldAutoComplete(refreshed));

    if (progress.status === "completed" || !shouldComplete) continue;

    if (
      input.forceDefinitionId === view.id &&
      view.source === "employer" &&
      !canAwardMore(view, nextProgress)
    ) {
      continue;
    }

    const result = await completeChallengeProgressForEmployee({
      progress,
      definition: view,
      completedBy: input.forceDefinitionId ? "employer_override" : completedBy,
      currentBalance: runningBalance
    });

    if (!result) continue;

    runningBalance = result.newBalance;
    employeePointsDelta[input.employee.id] =
      runningBalance - (input.employeePoints[input.employee.id] ?? 0);
    const idx = nextProgress.findIndex((row) => row.id === progress!.id);
    if (idx >= 0) nextProgress[idx] = result.progress;

    rewardEvents.push({
      id: `reward_challenge_${view.id}_${input.employee.id}_${Date.now()}`,
      employeeId: input.employee.id,
      employeeName: input.employee.name,
      kind: "challenge",
      points: Math.min(view.rewardPoints, view.pointCap ?? view.rewardPoints),
      note: view.title,
      createdAt: new Date().toISOString()
    });
  }

  if (expiredDefinitionIds.length) {
    await archiveExpiredChallengeDefinitions(expiredDefinitionIds);
  }

  return {
    progressRows: nextProgress,
    employeePointsDelta,
    rewardEvents,
    expiredDefinitionIds
  };
}

export async function ensureProgressForDefinitions(input: {
  definitions: ChallengeDefinition[];
  employees: User[];
  existingProgress: ChallengeProgress[];
}): Promise<ChallengeProgress[]> {
  let merged = [...input.existingProgress];

  for (const definition of input.definitions) {
    const employeeIds = targetEmployeeIdsForDefinition(definition, input.employees);
    const missing = employeeIds.filter(
      (employeeId) =>
        !merged.some((row) => row.definitionId === definition.id && row.employeeId === employeeId)
    );
    if (!missing.length) continue;

    const created = await ensureChallengeProgressRows({ definition, employeeIds: missing });
    merged = [
      ...merged.filter(
        (row) => !created.some((item) => item.definitionId === row.definitionId && item.employeeId === row.employeeId)
      ),
      ...created
    ];
  }

  return merged;
}

export function mergeChallengeViewsForEmployee(input: {
  definitions: ChallengeDefinition[];
  progressRows: ChallengeProgress[];
  employee: User;
  employerId: string;
  disabledTemplateKeys: string[];
  selectionRequests: SelectionRequest[];
  benefits: Benefit[];
  loginDates: string[];
  healthMetrics?: EmployeeHealthSnapshot;
}): ChallengeView[] {
  return buildEmployeeChallengeViews(input);
}

export function openChallengeViews(views: ChallengeView[]): ChallengeView[] {
  return views.filter((view) => view.status === "open");
}

export function completedChallengeViews(views: ChallengeView[]): ChallengeView[] {
  return views.filter((view) => view.status === "completed");
}

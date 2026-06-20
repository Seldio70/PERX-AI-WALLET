export type Role = "employee" | "employer" | "business";

export type User = {
  id: string;
  authUserId?: string;
  name: string;
  email: string;
  role: Role;
  companyId?: string;
  yearsEmployed?: number;
  businessId?: string;
  invitedByUserId?: string;
  birthDate?: string;
  startDate?: string;
  pointsBalance?: number;
};

export type Company = {
  id: string;
  name: string;
  employerId: string;
  monthlyBudgetPerEmployee: number;
};

export type BenefitCategory =
  | "Health"
  | "Food"
  | "Fitness"
  | "Family"
  | "Learning"
  | "Mobility"
  | "Wellness";

export type Benefit = {
  id: string;
  businessId: string;
  providerId?: string;
  providerName: string;
  title: string;
  description: string;
  discount: string;
  price: number;
  pointsPrice: number;
  imageUrl: string;
  redemptionType: "QR" | "NFC";
  category: BenefitCategory;
  validUntil: string;
  city: string;
};

export type ProviderProfile = {
  id: string;
  userId: string;
  businessName: string;
  logoUrl: string;
  description: string;
  category: BenefitCategory;
  city: string;
  isApproved: boolean;
};

export type OfferDraft = {
  title: string;
  description: string;
  discount: string;
  price: string;
  pointsPrice: string;
  imageUrl: string;
  redemptionType: "QR" | "NFC";
  validUntil: string;
};

export type SelectionRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  employerId?: string;
  benefitIds: string[];
  total: number;
  totalPoints: number;
  status: "draft" | "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
};

export type EmployerInvite = {
  id: string;
  employeeId: string;
  employerEmail: string;
  companyName: string;
  status: "sent" | "accepted";
  inviteCode: string;
};

export type EmployerWalletCard = {
  id: string;
  title: string;
  points: number;
  description: string;
  accent: string;
};

export type ChallengeCriterion =
  | { kind: "redeem_count"; count: number; period: "month" | "week" | "all_time" }
  | { kind: "redeem_category"; category: BenefitCategory; count: number; period: "month" }
  | { kind: "redeem_new_category"; count: number; period: "month" }
  | { kind: "login_streak"; days: number }
  | { kind: "health_steps"; count: number; period: "day" | "week" }
  | { kind: "health_sleep"; hours: number; period: "day" }
  | { kind: "manual" };

export type ChallengeDefinition = {
  id: string;
  source: "platform" | "employer";
  employerId?: string;
  templateKey?: string;
  title: string;
  description: string;
  rewardPoints: number;
  criterion: ChallengeCriterion;
  target: "everyone" | string;
  dueDate?: string;
  startDate?: string;
  maxAwards?: number;
  pointCap?: number;
  active: boolean;
  createdAt?: string;
};

export type ChallengeProgress = {
  id: string;
  definitionId: string;
  employeeId: string;
  current: number;
  target: number;
  status: "open" | "completed";
  submittedAt?: string;
  completedAt?: string;
  completedBy?: "auto" | "employer_override";
};

/** Unified view for employee/employer UI */
export type ChallengeView = ChallengeDefinition & {
  progressId?: string;
  employeeId?: string;
  current: number;
  progressTarget: number;
  status: "open" | "completed";
  progressLabel: string;
  submittedAt?: string;
  completedAt?: string;
  completedBy?: "auto" | "employer_override";
};

export type ChallengeEmployerStats = {
  definitionId: string;
  totalEmployees: number;
  completedCount: number;
  inProgressCount: number;
};

/** @deprecated Use ChallengeDefinition + ChallengeProgress */
export type Challenge = {
  id: string;
  employeeId: string;
  employeeName: string;
  employerId: string;
  title: string;
  description: string;
  rewardPoints: number;
  status: "open" | "completed";
  target?: "everyone" | string;
  dueDate?: string;
};

export type RewardEventKind = "birthday" | "anniversary" | "seasonal" | "welcome" | "spot" | "challenge";

export type RewardEvent = {
  id: string;
  employeeId: string;
  employeeName?: string;
  kind: RewardEventKind;
  points: number;
  note: string;
  createdAt: string;
};

export type EmployeeInvite = {
  id: string;
  email: string;
  code: string;
  companyId: string;
  companyName: string;
  employerId: string;
  startDate: string;
  status: "sent" | "accepted";
  createdAt: string;
};

export type RewardAutomationKind = "birthday" | "anniversary" | "seasonal" | "welcome";

export type RewardAutomation = {
  kind: RewardAutomationKind;
  enabled: boolean;
  points: number;
  label: string;
  description: string;
};

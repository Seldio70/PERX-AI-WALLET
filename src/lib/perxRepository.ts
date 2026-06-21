import {
  Benefit,
  Challenge,
  ChallengeCriterion,
  ChallengeDefinition,
  ChallengeProgress,
  Company,
  EmployerInvite,
  EmployerWalletCard,
  ProviderProfile,
  SelectionRequest,
  User
} from "../types";
import { defaultPlatformDefinitions, RETIRED_PLATFORM_TEMPLATE_KEYS } from "./challengePlatformTemplates";
import { targetFromCriterion } from "./challengeEvaluator";
import { isLocalImageUri } from "./imageUpload";
import { pointsToAll } from "./pointsConversion";
import { getSupabaseClient } from "./supabase";

type DbUser = {
  id: string;
  auth_user_id?: string | null;
  name: string;
  email: string;
  role: User["role"];
  company_id: string | null;
  invited_by_user_id: string | null;
  years_employed: number | null;
  points_balance: number | null;
  monthly_budget_all: number | string | null;
};

type DbCompany = {
  id: string;
  name: string;
  employer_id: string | null;
  monthly_budget_per_employee: number | string;
};

type DbBenefit = {
  id: string;
  provider_id: string | null;
  business_id: string | null;
  provider_name: string;
  title: string;
  description: string | null;
  discount: string | null;
  price: number | string;
  points_price: number | string;
  image_url: string | null;
  type: "qr" | "nfc";
  category: Benefit["category"];
  city: string | null;
  valid_until: string | null;
};

type DbProviderProfile = {
  id: string;
  user_id: string;
  business_name: string;
  logo_url: string | null;
  description: string | null;
  category: Benefit["category"];
  city: string | null;
  is_approved: boolean;
};

type DbInvite = {
  id: string;
  employee_id: string;
  employer_email: string;
  company_name: string;
  status: "sent" | "accepted" | "expired";
  invite_code: string;
};

type DbSelectionRequest = {
  id: string;
  employee_id: string;
  employer_id: string | null;
  total: number | string;
  total_points: number | string | null;
  status: "draft" | "pending" | "approved" | "rejected";
  created_at: string | null;
  approved_at: string | null;
  users?: { name: string } | Array<{ name: string }> | null;
  selection_items?: Array<{ benefit_id: string }>;
};

type DbWalletCard = {
  id: string;
  title: string;
  points: number;
  description: string | null;
  accent: string | null;
};

const CHALLENGE_DEFINITION_SELECT =
  "id,source,employer_id,template_key,title,description,reward_points,criterion,target_type,target_employee_id,due_date,start_date,max_awards,point_cap,active,created_at";
const CHALLENGE_PROGRESS_SELECT =
  "id,definition_id,employee_id,current_value,target_value,status,submitted_at,completed_at,completed_by";

type DbChallengeDefinition = {
  id: string;
  source: "platform" | "employer";
  employer_id: string | null;
  template_key: string | null;
  title: string;
  description: string | null;
  reward_points: number;
  criterion: ChallengeCriterion;
  target_type: "everyone" | "employee";
  target_employee_id: string | null;
  due_date: string | null;
  start_date: string | null;
  max_awards: number | null;
  point_cap: number | null;
  active: boolean;
  created_at: string | null;
};

type DbChallengeProgress = {
  id: string;
  definition_id: string;
  employee_id: string;
  current_value: number;
  target_value: number;
  status: "open" | "completed";
  submitted_at: string | null;
  completed_at: string | null;
  completed_by: "auto" | "employer_override" | null;
};

type DbChallenge = {
  id: string;
  employee_id: string;
  employer_id: string;
  title: string;
  description: string | null;
  reward_points: number;
  status: "open" | "completed" | "archived";
  users?: { name: string } | Array<{ name: string }> | null;
};

export type PerxLiveData = {
  companies: Company[];
  users: User[];
  providerProfiles: ProviderProfile[];
  benefits: Benefit[];
  employerInvites: EmployerInvite[];
  selectionRequests: SelectionRequest[];
  employerWalletCards: EmployerWalletCard[];
  challengeDefinitions: ChallengeDefinition[];
  challengeProgress: ChallengeProgress[];
  disabledChallengeTemplates: Record<string, string[]>;
  employeeLoginDays: Record<string, string[]>;
  /** @deprecated Legacy rows; prefer challengeDefinitions */
  challenges: Challenge[];
};

function numberFromDb(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function mapProviderProfile(row: DbProviderProfile): ProviderProfile {
  const logoFallback =
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=300&q=80";
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    logoUrl:
      row.logo_url && !isLocalImageUri(row.logo_url) ? row.logo_url : logoFallback,
    description: row.description ?? "",
    category: row.category,
    city: row.city ?? "Tirana",
    isApproved: row.is_approved
  };
}

function relationName(value: { name: string } | Array<{ name: string }> | null | undefined) {
  return Array.isArray(value) ? value[0]?.name : value?.name;
}

function mapUser(row: DbUser): User {
  return {
    id: row.id,
    authUserId: row.auth_user_id ?? undefined,
    name: row.name,
    email: row.email,
    role: row.role,
    companyId: row.company_id ?? undefined,
    invitedByUserId: row.invited_by_user_id ?? undefined,
    yearsEmployed: row.years_employed ?? undefined,
    businessId: row.role === "business" ? row.id : undefined,
    pointsBalance: row.points_balance ?? 0,
    monthlyBudgetAll:
      row.monthly_budget_all == null ? undefined : numberFromDb(row.monthly_budget_all)
  };
}

function mapCompany(row: DbCompany): Company {
  return {
    id: row.id,
    name: row.name,
    employerId: row.employer_id ?? "",
    monthlyBudgetPerEmployee: numberFromDb(row.monthly_budget_per_employee)
  };
}

function mapBenefit(row: DbBenefit): Benefit {
  const imageFallback =
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80";
  const pointsPrice = numberFromDb(row.points_price);
  return {
    id: row.id,
    businessId: row.business_id ?? "",
    providerId: row.provider_id ?? undefined,
    providerName: row.provider_name,
    title: row.title,
    description: row.description ?? "",
    discount: row.discount ?? "",
    price: pointsToAll(pointsPrice),
    pointsPrice,
    imageUrl:
      row.image_url && !isLocalImageUri(row.image_url) ? row.image_url : imageFallback,
    redemptionType: row.type === "nfc" ? "NFC" : "QR",
    category: row.category,
    validUntil: row.valid_until ?? "",
    city: row.city ?? "Tirana"
  };
}

function mapInvite(row: DbInvite): EmployerInvite {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employerEmail: row.employer_email,
    companyName: row.company_name,
    status: row.status === "expired" ? "sent" : row.status,
    inviteCode: row.invite_code
  };
}

function mapSelection(row: DbSelectionRequest): SelectionRequest {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: relationName(row.users) ?? "Employee",
    employerId: row.employer_id ?? undefined,
    benefitIds: Array.from(new Set(row.selection_items?.map((item) => item.benefit_id) ?? [])),
    total: numberFromDb(row.total),
    totalPoints: numberFromDb(row.total_points),
    status: row.status,
    createdAt: row.created_at ?? new Date().toISOString(),
    approvedAt: row.approved_at ?? undefined
  };
}

function mapWalletCard(row: DbWalletCard): EmployerWalletCard {
  return {
    id: row.id,
    title: row.title,
    points: row.points,
    description: row.description ?? "",
    accent: row.accent ?? "#F7F8FA"
  };
}

function mapChallengeDefinition(row: DbChallengeDefinition): ChallengeDefinition {
  return {
    id: row.id,
    source: row.source,
    employerId: row.employer_id ?? undefined,
    templateKey: row.template_key ?? undefined,
    title: row.title,
    description: row.description ?? "",
    rewardPoints: row.reward_points,
    criterion: row.criterion ?? { kind: "manual" },
    target: row.target_type === "everyone" ? "everyone" : row.target_employee_id ?? "everyone",
    dueDate: row.due_date ?? undefined,
    startDate: row.start_date ?? undefined,
    maxAwards: row.max_awards ?? undefined,
    pointCap: row.point_cap ?? undefined,
    active: row.active,
    createdAt: row.created_at ?? undefined
  };
}

function mapChallengeProgress(row: DbChallengeProgress): ChallengeProgress {
  return {
    id: row.id,
    definitionId: row.definition_id,
    employeeId: row.employee_id,
    current: row.current_value,
    target: row.target_value,
    status: row.status,
    submittedAt: row.submitted_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    completedBy: row.completed_by ?? undefined
  };
}

function mapChallenge(row: DbChallenge): Challenge {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: relationName(row.users) ?? "Employee",
    employerId: row.employer_id,
    title: row.title,
    description: row.description ?? "",
    rewardPoints: row.reward_points,
    status: row.status === "completed" ? "completed" : "open"
  };
}

export async function fetchPerxLiveData(): Promise<PerxLiveData | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  let usersResult = await client
    .from("users")
    .select(
      "id,auth_user_id,name,email,role,company_id,invited_by_user_id,years_employed,points_balance,monthly_budget_all"
    );
  if (usersResult.error?.message?.includes("monthly_budget_all")) {
    usersResult = await client
      .from("users")
      .select("id,auth_user_id,name,email,role,company_id,invited_by_user_id,years_employed,points_balance");
  }

  const [
    companiesResult,
    providersResult,
    benefitsResult,
    invitesResult,
    selectionsResult,
    walletResult,
    definitionsResult,
    progressResult,
    disabledTemplatesResult,
    loginDaysResult,
    challengesResult
  ] = await Promise.all([
    client.from("companies").select("id,name,employer_id,monthly_budget_per_employee"),
    client.from("provider_profiles").select("id,user_id,business_name,logo_url,description,category,city,is_approved"),
    client
      .from("benefits")
      .select("id,provider_id,business_id,provider_name,title,description,discount,price,points_price,image_url,type,category,city,valid_until")
      .eq("is_active", true),
    client.from("employer_invites").select("id,employee_id,employer_email,company_name,status,invite_code"),
    client
      .from("selection_requests")
      .select("id,employee_id,employer_id,total,total_points,status,created_at,approved_at,users:employee_id(name),selection_items(benefit_id)"),
    client.from("employer_wallet_cards").select("id,title,points,description,accent"),
    client
      .from("challenge_definitions")
      .select(CHALLENGE_DEFINITION_SELECT),
    client
      .from("challenge_progress")
      .select(CHALLENGE_PROGRESS_SELECT),
    client.from("employer_disabled_challenge_templates").select("employer_id,template_key"),
    client.from("employee_login_days").select("employee_id,login_date"),
    client
      .from("challenges")
      .select("id,employee_id,employer_id,title,description,reward_points,status,users:employee_id(name)")
  ]);

  const results = [
    companiesResult,
    usersResult,
    providersResult,
    benefitsResult,
    invitesResult,
    selectionsResult,
    walletResult,
    definitionsResult,
    progressResult,
    disabledTemplatesResult,
    loginDaysResult,
    challengesResult
  ];

  const firstError = [
    companiesResult,
    usersResult,
    providersResult,
    benefitsResult,
    invitesResult,
    selectionsResult,
    walletResult
  ].find((result) => result.error)?.error;

  if (firstError) {
    console.warn(`Supabase live data unavailable: ${firstError.message}`);
    return null;
  }

  if (definitionsResult.error) {
    console.warn(`Challenge definitions unavailable: ${definitionsResult.error.message}`);
  }
  if (progressResult.error) {
    console.warn(`Challenge progress unavailable: ${progressResult.error.message}`);
  }

  const disabledChallengeTemplates: Record<string, string[]> = {};
  for (const row of (disabledTemplatesResult.data ?? []) as Array<{
    employer_id: string;
    template_key: string;
  }>) {
    if (!disabledChallengeTemplates[row.employer_id]) disabledChallengeTemplates[row.employer_id] = [];
    disabledChallengeTemplates[row.employer_id].push(row.template_key);
  }

  const employeeLoginDays: Record<string, string[]> = {};
  for (const row of (loginDaysResult.data ?? []) as Array<{ employee_id: string; login_date: string }>) {
    if (!employeeLoginDays[row.employee_id]) employeeLoginDays[row.employee_id] = [];
    employeeLoginDays[row.employee_id].push(row.login_date);
  }

  return {
    companies: ((companiesResult.data ?? []) as DbCompany[]).map(mapCompany),
    users: ((usersResult.data ?? []) as DbUser[]).map(mapUser),
    providerProfiles: ((providersResult.data ?? []) as DbProviderProfile[]).map(mapProviderProfile),
    benefits: ((benefitsResult.data ?? []) as DbBenefit[]).map(mapBenefit),
    employerInvites: ((invitesResult.data ?? []) as DbInvite[]).map(mapInvite),
    selectionRequests: ((selectionsResult.data ?? []) as DbSelectionRequest[]).map(mapSelection),
    employerWalletCards: ((walletResult.data ?? []) as DbWalletCard[]).map(mapWalletCard),
    challengeDefinitions: ((definitionsResult.data ?? []) as DbChallengeDefinition[]).map(mapChallengeDefinition),
    challengeProgress: ((progressResult.data ?? []) as DbChallengeProgress[]).map(mapChallengeProgress),
    disabledChallengeTemplates,
    employeeLoginDays,
    challenges: ((challengesResult.data ?? []) as DbChallenge[]).map(mapChallenge)
  };
}

export async function createProviderOffer(input: {
  providerUserId: string;
  providerName: string;
  title: string;
  description: string;
  discount: string;
  price: number;
  pointsPrice: number;
  imageUrl: string;
  redemptionType: "QR" | "NFC";
  category: Benefit["category"];
  city: string;
}) {
  const client = getSupabaseClient();
  if (!client) return null;

  const price = pointsToAll(input.pointsPrice);

  const profile = await client
    .from("provider_profiles")
    .select("id")
    .eq("user_id", input.providerUserId)
    .maybeSingle();

  if (profile.error) return null;

  const createdProfile =
    profile.data ??
    (
      await client
        .from("provider_profiles")
        .insert({
          user_id: input.providerUserId,
          business_name: input.providerName,
          description: "Provider profile created from the PerX mobile app.",
          category: input.category,
          city: input.city
        })
        .select("id")
        .single()
    ).data;

  if (!createdProfile) return null;

  const offer = await client
    .from("benefits")
    .insert({
      provider_id: createdProfile.id,
      business_id: input.providerUserId,
      provider_name: input.providerName,
      title: input.title,
      description: input.description,
      discount: input.discount,
      price,
      points_price: input.pointsPrice,
      image_url: input.imageUrl,
      type: input.redemptionType.toLowerCase(),
      category: input.category,
      city: input.city
    })
    .select("id,provider_id,business_id,provider_name,title,description,discount,price,points_price,image_url,type,category,city,valid_until")
    .single();

  if (offer.error || !offer.data) return null;
  return mapBenefit(offer.data as DbBenefit);
}

export async function upsertProviderProfile(input: {
  providerUserId: string;
  businessName: string;
  logoUrl: string;
  description: string;
  category: Benefit["category"];
  city: string;
}) {
  const client = getSupabaseClient();
  if (!client) return null;

  const existing = await client
    .from("provider_profiles")
    .select("id")
    .eq("user_id", input.providerUserId)
    .maybeSingle();

  if (existing.error) return null;

  const payload = {
    user_id: input.providerUserId,
    business_name: input.businessName,
    logo_url: input.logoUrl,
    description: input.description,
    category: input.category,
    city: input.city,
    is_approved: true
  };

  const result = existing.data
    ? await client
        .from("provider_profiles")
        .update(payload)
        .eq("id", existing.data.id)
        .select("id,user_id,business_name,logo_url,description,category,city,is_approved")
        .single()
    : await client
        .from("provider_profiles")
        .insert(payload)
        .select("id,user_id,business_name,logo_url,description,category,city,is_approved")
        .single();

  if (result.error || !result.data) return null;
  return mapProviderProfile(result.data as DbProviderProfile);
}

export async function createPlatformUser(input: {
  authUserId?: string;
  name: string;
  email: string;
  role: User["role"];
  companyId?: string;
  yearsEmployed?: number;
  invitedByUserId?: string;
}) {
  const client = getSupabaseClient();
  if (!client) return null;

  const result = await client
    .from("users")
    .upsert({
      auth_user_id: input.authUserId,
      name: input.name,
      email: input.email,
      role: input.role,
      company_id: input.companyId,
      years_employed: input.yearsEmployed ?? 0,
      invited_by_user_id: input.invitedByUserId,
      points_balance: input.role === "employer" ? 1000 : 0
    }, { onConflict: "email" })
    .select("id,auth_user_id,name,email,role,company_id,invited_by_user_id,years_employed,points_balance")
    .single();

  if (result.error || !result.data) return null;
  return mapUser(result.data as DbUser);
}

export async function signInOrSignUpPlatformAuth(input: {
  email: string;
  password: string;
}) {
  const client = getSupabaseClient();
  if (!client || input.password.length < 6) return null;

  const signup = await client.auth.signUp({
    email: input.email,
    password: input.password
  });

  if (signup.data.user?.id) return signup.data.user.id;

  const signin = await client.auth.signInWithPassword({
    email: input.email,
    password: input.password
  });

  if (signin.error || !signin.data.user?.id) return null;
  return signin.data.user.id;
}

export async function signInPlatformUser(input: {
  role?: User["role"];
  email: string;
  password: string;
}) {
  const client = getSupabaseClient();
  if (!client) return null;

  const auth = await client.auth.signInWithPassword({
    email: input.email,
    password: input.password
  });

  if (auth.error || !auth.data.user?.id) return null;

  const byAuthId = await client
    .from("users")
    .select("id,auth_user_id,name,email,role,company_id,invited_by_user_id,years_employed,points_balance")
    .eq("auth_user_id", auth.data.user.id)
    .maybeSingle();

  const row =
    byAuthId.data ??
    (
      await client
        .from("users")
        .select("id,auth_user_id,name,email,role,company_id,invited_by_user_id,years_employed,points_balance")
        .eq("email", input.email)
        .maybeSingle()
    ).data;

  if (!row) return null;
  const user = mapUser(row as DbUser);
  return !input.role || user.role === input.role ? user : null;
}

export async function requestPasswordReset(email: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const result = await client.auth.resetPasswordForEmail(email);
  return !result.error;
}

export async function acceptEmployerInvite(input: {
  inviteCode: string;
  employerUserId: string;
}) {
  const client = getSupabaseClient();
  if (!client) return false;

  const result = await client
    .from("employer_invites")
    .update({
      status: "accepted",
      accepted_by_user_id: input.employerUserId,
      accepted_at: new Date().toISOString()
    })
    .eq("invite_code", input.inviteCode);

  return !result.error;
}

export async function createEmployerInvite(input: {
  employeeId: string;
  employerEmail: string;
  companyName: string;
}) {
  const client = getSupabaseClient();
  const inviteCode = `PERX-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  if (!client) {
    return {
      id: `invite_${Date.now()}`,
      employeeId: input.employeeId,
      employerEmail: input.employerEmail,
      companyName: input.companyName,
      status: "sent",
      inviteCode
    } satisfies EmployerInvite;
  }

  const result = await client
    .from("employer_invites")
    .insert({
      employee_id: input.employeeId,
      employer_email: input.employerEmail,
      company_name: input.companyName,
      invite_code: inviteCode,
      status: "sent"
    })
    .select("id,employee_id,employer_email,company_name,status,invite_code")
    .single();

  if (result.error || !result.data) return null;
  return mapInvite(result.data as DbInvite);
}

export async function createSelectionRequest(input: {
  employeeId: string;
  employerId?: string;
  companyId?: string;
  benefitIds: string[];
  benefits: Benefit[];
}) {
  const client = getSupabaseClient();
  if (!client || !input.employerId) return null;

  const totalPoints = input.benefits.reduce((sum, benefit) => sum + benefit.pointsPrice, 0);
  const total = pointsToAll(totalPoints);
  const now = new Date().toISOString();
  const request = await client
    .from("selection_requests")
    .insert({
      employee_id: input.employeeId,
      employer_id: input.employerId,
      company_id: input.companyId,
      total,
      total_points: totalPoints,
      status: "approved",
      approved_at: now
    })
    .select("id")
    .single();

  if (request.error || !request.data) return null;

  const itemRows = input.benefits.map((benefit) => ({
    selection_request_id: request.data.id,
    benefit_id: benefit.id,
    provider_id: benefit.providerId,
    price: pointsToAll(benefit.pointsPrice),
    points_price: benefit.pointsPrice
  }));

  const items = await client.from("selection_items").insert(itemRows);
  if (items.error) return null;

  if (input.benefits.length) {
    await client.from("redemptions").insert(
      input.benefits.map((benefit) => ({
        benefit_id: benefit.id,
        provider_id: benefit.providerId,
        employee_id: input.employeeId,
        employer_id: input.employerId,
        selection_request_id: request.data.id,
        amount: pointsToAll(benefit.pointsPrice),
        points_spent: benefit.pointsPrice,
        status: "paid",
        qr_code: `PERX-${request.data.id}-${benefit.id}`.slice(0, 64),
        redeemed_at: now
      }))
    );
  }

  return request.data.id as string;
}

export async function approveSelectionRequest(input: {
  requestId: string;
  employerId?: string;
  totalPoints: number;
  benefits: Benefit[];
}) {
  const client = getSupabaseClient();
  if (!client) return false;

  const now = new Date().toISOString();
  const request = await client
    .from("selection_requests")
    .update({
      status: "approved",
      approved_at: now
    })
    .eq("id", input.requestId)
    .select("employee_id,employer_id")
    .single();

  if (request.error || !request.data) return false;

  const employerId = input.employerId ?? request.data.employer_id;

  if (employerId) {
    const walletResult = await client
      .from("employer_wallet_cards")
      .select("id,points")
      .eq("employer_id", employerId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!walletResult.error && walletResult.data) {
      await client
        .from("employer_wallet_cards")
        .update({ points: Math.max(0, Number(walletResult.data.points ?? 0) - input.totalPoints) })
        .eq("id", walletResult.data.id);
    }

    await client.from("points_ledger").insert({
      user_id: employerId,
      source: "selection_approved",
      points_delta: -input.totalPoints,
      description: `Selection approved (${input.totalPoints} points)`
    });
  }

  if (input.benefits.length) {
    await client.from("redemptions").insert(
      input.benefits.map((benefit) => ({
        benefit_id: benefit.id,
        provider_id: benefit.providerId,
        employee_id: request.data.employee_id,
        employer_id: employerId,
        selection_request_id: input.requestId,
        amount: pointsToAll(benefit.pointsPrice),
        points_spent: benefit.pointsPrice,
        status: "paid",
        qr_code: `PERX-${input.requestId}-${benefit.id}`.slice(0, 64),
        redeemed_at: now
      }))
    );
  }

  return true;
}

export async function seedPlatformChallengeDefinitions(employerId: string): Promise<ChallengeDefinition[]> {
  const client = getSupabaseClient();
  const seeds = defaultPlatformDefinitions(employerId);

  if (!client) return seeds;

  for (const retiredKey of RETIRED_PLATFORM_TEMPLATE_KEYS) {
    await client
      .from("challenge_definitions")
      .update({ active: false })
      .eq("employer_id", employerId)
      .eq("template_key", retiredKey);
  }

  const inserted: ChallengeDefinition[] = [];
  for (const seed of seeds) {
    const existing = await client
      .from("challenge_definitions")
      .select(CHALLENGE_DEFINITION_SELECT)
      .eq("employer_id", employerId)
      .eq("template_key", seed.templateKey ?? "")
      .maybeSingle();

    if (existing.data) {
      inserted.push(mapChallengeDefinition(existing.data as DbChallengeDefinition));
      continue;
    }

    const result = await client
      .from("challenge_definitions")
      .insert({
        source: "platform",
        employer_id: employerId,
        template_key: seed.templateKey,
        title: seed.title,
        description: seed.description,
        reward_points: seed.rewardPoints,
        criterion: seed.criterion,
        target_type: "everyone",
        point_cap: seed.pointCap,
        active: true
      })
      .select(CHALLENGE_DEFINITION_SELECT)
      .single();

    if (result.data) inserted.push(mapChallengeDefinition(result.data as DbChallengeDefinition));
  }

  return inserted.length ? inserted : seeds;
}

export async function createChallengeDefinition(input: {
  employerId: string;
  title: string;
  description: string;
  rewardPoints: number;
  criterion: ChallengeCriterion;
  target: "everyone" | string;
  dueDate?: string;
  startDate?: string;
  maxAwards?: number;
  pointCap?: number;
}): Promise<ChallengeDefinition | null> {
  const client = getSupabaseClient();
  const localId = `challenge_def_${Date.now()}`;
  const definition: ChallengeDefinition = {
    id: localId,
    source: "employer",
    employerId: input.employerId,
    title: input.title,
    description: input.description,
    rewardPoints: input.rewardPoints,
    criterion: input.criterion,
    target: input.target,
    dueDate: input.dueDate,
    startDate: input.startDate,
    maxAwards: input.maxAwards,
    pointCap: input.pointCap,
    active: true,
    createdAt: new Date().toISOString()
  };

  if (!client) return definition;

  const result = await client
    .from("challenge_definitions")
    .insert({
      source: "employer",
      employer_id: input.employerId,
      title: input.title,
      description: input.description,
      reward_points: input.rewardPoints,
      criterion: input.criterion,
      target_type: input.target === "everyone" ? "everyone" : "employee",
      target_employee_id: input.target === "everyone" ? null : input.target,
      due_date: input.dueDate ?? null,
      start_date: input.startDate ?? null,
      max_awards: input.maxAwards ?? null,
      point_cap: input.pointCap ?? null,
      active: true
    })
    .select(CHALLENGE_DEFINITION_SELECT)
    .single();

  if (result.error || !result.data) {
    console.warn(
      "[createChallengeDefinition] Supabase insert failed:",
      result.error?.message ?? "no row returned"
    );
    return definition;
  }
  return mapChallengeDefinition(result.data as DbChallengeDefinition);
}

export async function archiveChallengeDefinition(definitionId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return true;

  const result = await client
    .from("challenge_definitions")
    .update({ active: false })
    .eq("id", definitionId);

  return !result.error;
}

export async function submitChallengeProgress(input: {
  progressId: string;
}): Promise<ChallengeProgress | null> {
  const client = getSupabaseClient();
  const submittedAt = new Date().toISOString();

  if (!client) {
    return {
      id: input.progressId,
      definitionId: "",
      employeeId: "",
      current: 0,
      target: 1,
      status: "open",
      submittedAt
    };
  }

  const result = await client
    .from("challenge_progress")
    .update({ submitted_at: submittedAt })
    .eq("id", input.progressId)
    .eq("status", "open")
    .select(CHALLENGE_PROGRESS_SELECT)
    .maybeSingle();

  if (!result.data) return null;
  return mapChallengeProgress(result.data as DbChallengeProgress);
}

export async function grantSpotReward(input: {
  employeeId: string;
  rewardPoints: number;
  note: string;
  newBalance: number;
}): Promise<boolean> {
  const client = getSupabaseClient();
  await updateUserPointsBalance(input.employeeId, input.newBalance);

  if (!client) return true;

  await client.from("points_ledger").insert({
    user_id: input.employeeId,
    source: "spot_bonus",
    points_delta: input.rewardPoints,
    description: input.note
  });

  return true;
}

export async function ensureChallengeProgressRows(input: {
  definition: ChallengeDefinition;
  employeeIds: string[];
}): Promise<ChallengeProgress[]> {
  const client = getSupabaseClient();
  const target = targetFromCriterion(input.definition.criterion);
  const rows: ChallengeProgress[] = [];

  for (const employeeId of input.employeeIds) {
    const local: ChallengeProgress = {
      id: `progress_${input.definition.id}_${employeeId}`,
      definitionId: input.definition.id,
      employeeId,
      current: 0,
      target,
      status: "open"
    };

    const persistedDefinitionId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.definition.id
    );

    if (!client || !persistedDefinitionId) {
      rows.push(local);
      continue;
    }

    const existing = await client
      .from("challenge_progress")
      .select("id,definition_id,employee_id,current_value,target_value,status,submitted_at,completed_at,completed_by")
      .eq("definition_id", input.definition.id)
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (existing.data) {
      rows.push(mapChallengeProgress(existing.data as DbChallengeProgress));
      continue;
    }

    const inserted = await client
      .from("challenge_progress")
      .insert({
        definition_id: input.definition.id,
        employee_id: employeeId,
        current_value: 0,
        target_value: target,
        status: "open"
      })
      .select("id,definition_id,employee_id,current_value,target_value,status,submitted_at,completed_at,completed_by")
      .single();

    if (inserted.data) rows.push(mapChallengeProgress(inserted.data as DbChallengeProgress));
    else rows.push(local);
  }

  return rows;
}

export async function updateChallengeProgressRow(input: {
  progressId: string;
  current: number;
  target: number;
  status: "open" | "completed";
  completedBy?: "auto" | "employer_override";
}): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return true;

  const result = await client
    .from("challenge_progress")
    .update({
      current_value: input.current,
      target_value: input.target,
      status: input.status,
      completed_at: input.status === "completed" ? new Date().toISOString() : null,
      completed_by: input.completedBy ?? null
    })
    .eq("id", input.progressId);

  return !result.error;
}

export async function grantChallengeReward(input: {
  employeeId: string;
  rewardPoints: number;
  note: string;
  newBalance: number;
}): Promise<boolean> {
  const client = getSupabaseClient();
  await updateUserPointsBalance(input.employeeId, input.newBalance);

  if (!client) return true;

  await client.from("points_ledger").insert({
    user_id: input.employeeId,
    source: "challenge_completed",
    points_delta: input.rewardPoints,
    description: input.note
  });

  return true;
}

export async function completeChallengeProgressForEmployee(input: {
  progress: ChallengeProgress;
  definition: ChallengeDefinition;
  completedBy: "auto" | "employer_override";
  currentBalance: number;
}): Promise<{ progress: ChallengeProgress; newBalance: number } | null> {
  if (input.progress.status === "completed") return null;

  const rewardPoints = Math.min(
    input.definition.rewardPoints,
    input.definition.pointCap ?? input.definition.rewardPoints
  );
  const newBalance = input.currentBalance + rewardPoints;
  const completed: ChallengeProgress = {
    ...input.progress,
    current: input.progress.target,
    status: "completed",
    completedAt: new Date().toISOString(),
    completedBy: input.completedBy
  };

  await updateChallengeProgressRow({
    progressId: input.progress.id,
    current: completed.current,
    target: completed.target,
    status: "completed",
    completedBy: input.completedBy
  });

  await grantChallengeReward({
    employeeId: input.progress.employeeId,
    rewardPoints,
    note: input.definition.title,
    newBalance
  });

  return { progress: completed, newBalance };
}

export async function recordEmployeeLoginDay(employeeId: string, date = new Date()): Promise<string[]> {
  const client = getSupabaseClient();
  const loginDate = date.toISOString().slice(0, 10);

  if (!client) return [loginDate];

  await client
    .from("employee_login_days")
    .upsert({ employee_id: employeeId, login_date: loginDate }, { onConflict: "employee_id,login_date" });

  const result = await client
    .from("employee_login_days")
    .select("login_date")
    .eq("employee_id", employeeId)
    .order("login_date", { ascending: true });

  return ((result.data ?? []) as Array<{ login_date: string }>).map((row) => row.login_date);
}

export async function fetchEmployerDisabledChallengeTemplates(): Promise<Record<string, string[]>> {
  const client = getSupabaseClient();
  if (!client) return {};

  const result = await client.from("employer_disabled_challenge_templates").select("employer_id,template_key");
  if (result.error) return {};

  const grouped: Record<string, string[]> = {};
  for (const row of (result.data ?? []) as Array<{ employer_id: string; template_key: string }>) {
    if (!grouped[row.employer_id]) grouped[row.employer_id] = [];
    grouped[row.employer_id].push(row.template_key);
  }
  return grouped;
}

export async function setEmployerChallengeTemplateEnabled(
  employerId: string,
  templateKey: string,
  enabled: boolean
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return true;

  if (enabled) {
    const result = await client
      .from("employer_disabled_challenge_templates")
      .delete()
      .eq("employer_id", employerId)
      .eq("template_key", templateKey);
    return !result.error;
  }

  const result = await client.from("employer_disabled_challenge_templates").upsert(
    { employer_id: employerId, template_key: templateKey },
    { onConflict: "employer_id,template_key" }
  );
  return !result.error;
}

export async function archiveExpiredChallengeDefinitions(definitionIds: string[]): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !definitionIds.length) return;

  await client.from("challenge_definitions").update({ active: false }).in("id", definitionIds);
}

/** @deprecated Use createChallengeDefinition */
export async function createEmployeeChallenge(input: {
  employeeId: string;
  employerId: string;
  title: string;
  description: string;
  rewardPoints: number;
}) {
  const definition = await createChallengeDefinition({
    employerId: input.employerId,
    title: input.title,
    description: input.description,
    rewardPoints: input.rewardPoints,
    criterion: { kind: "manual" },
    target: input.employeeId
  });
  if (!definition) return null;

  return {
    id: definition.id,
    employeeId: input.employeeId,
    employeeName: "Employee",
    employerId: input.employerId,
    title: definition.title,
    description: definition.description,
    rewardPoints: definition.rewardPoints,
    status: "open" as const
  } satisfies Challenge;
}

/** @deprecated Use completeChallengeProgressForEmployee */
export async function completeEmployeeChallenge(input: {
  challengeId: string;
  employerId: string;
  rewardPoints: number;
  description: string;
}) {
  void input;
  return false;
}

type DbEmployerEnabledBenefit = {
  employer_id: string;
  benefit_id: string;
};

export async function fetchEmployerEnabledBenefits(): Promise<Record<string, string[]>> {
  const client = getSupabaseClient();
  if (!client) return {};

  const result = await client.from("employer_enabled_benefits").select("employer_id,benefit_id");
  if (result.error) {
    console.warn(`Employer enabled benefits unavailable: ${result.error.message}`);
    return {};
  }

  const grouped: Record<string, string[]> = {};
  for (const row of (result.data ?? []) as DbEmployerEnabledBenefit[]) {
    if (!grouped[row.employer_id]) grouped[row.employer_id] = [];
    grouped[row.employer_id].push(row.benefit_id);
  }
  return grouped;
}

export async function setEmployerBenefitEnabled(
  employerId: string,
  benefitId: string,
  enabled: boolean
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  if (enabled) {
    const result = await client
      .from("employer_enabled_benefits")
      .upsert({ employer_id: employerId, benefit_id: benefitId }, { onConflict: "employer_id,benefit_id" });
    return !result.error;
  }

  const result = await client
    .from("employer_enabled_benefits")
    .delete()
    .eq("employer_id", employerId)
    .eq("benefit_id", benefitId);
  return !result.error;
}

export async function setEmployerBenefitsEnabled(
  employerId: string,
  benefitIds: string[],
  selected: boolean
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  if (!benefitIds.length) return true;

  if (selected) {
    const result = await client.from("employer_enabled_benefits").upsert(
      benefitIds.map((benefitId) => ({ employer_id: employerId, benefit_id: benefitId })),
      { onConflict: "employer_id,benefit_id" }
    );
    return !result.error;
  }

  const result = await client
    .from("employer_enabled_benefits")
    .delete()
    .eq("employer_id", employerId)
    .in("benefit_id", benefitIds);
  return !result.error;
}

export async function updateUserPointsBalance(userId: string, newBalance: number): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from("users").update({ points_balance: Math.max(0, newBalance) }).eq("id", userId);
}

export async function updateEmployeeMonthlyBudget(
  employeeId: string,
  monthlyBudgetAll: number
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const result = await client
    .from("users")
    .update({ monthly_budget_all: Math.max(0, monthlyBudgetAll) })
    .eq("id", employeeId);
  return !result.error;
}

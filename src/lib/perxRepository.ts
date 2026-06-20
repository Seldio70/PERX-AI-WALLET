import { Benefit, Challenge, Company, EmployerInvite, EmployerWalletCard, ProviderProfile, SelectionRequest, User } from "../types";
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
  challenges: Challenge[];
};

function numberFromDb(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function mapProviderProfile(row: DbProviderProfile): ProviderProfile {
  return {
    id: row.id,
    userId: row.user_id,
    businessName: row.business_name,
    logoUrl:
      row.logo_url ??
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=300&q=80",
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
    businessId: row.role === "business" ? row.id : undefined
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
  return {
    id: row.id,
    businessId: row.business_id ?? "",
    providerId: row.provider_id ?? undefined,
    providerName: row.provider_name,
    title: row.title,
    description: row.description ?? "",
    discount: row.discount ?? "",
    price: numberFromDb(row.price),
    pointsPrice: numberFromDb(row.points_price),
    imageUrl:
      row.image_url ??
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
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
    benefitIds: row.selection_items?.map((item) => item.benefit_id) ?? [],
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

  const [
    companiesResult,
    usersResult,
    providersResult,
    benefitsResult,
    invitesResult,
    selectionsResult,
    walletResult,
    challengesResult
  ] = await Promise.all([
    client.from("companies").select("id,name,employer_id,monthly_budget_per_employee"),
    client.from("users").select("id,auth_user_id,name,email,role,company_id,invited_by_user_id,years_employed"),
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
    challengesResult
  ];

  const firstError = results.find((result) => result.error)?.error;
  if (firstError) {
    console.warn(`Supabase live data unavailable: ${firstError.message}`);
    return null;
  }

  return {
    companies: ((companiesResult.data ?? []) as DbCompany[]).map(mapCompany),
    users: ((usersResult.data ?? []) as DbUser[]).map(mapUser),
    providerProfiles: ((providersResult.data ?? []) as DbProviderProfile[]).map(mapProviderProfile),
    benefits: ((benefitsResult.data ?? []) as DbBenefit[]).map(mapBenefit),
    employerInvites: ((invitesResult.data ?? []) as DbInvite[]).map(mapInvite),
    selectionRequests: ((selectionsResult.data ?? []) as DbSelectionRequest[]).map(mapSelection),
    employerWalletCards: ((walletResult.data ?? []) as DbWalletCard[]).map(mapWalletCard),
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
      price: input.price,
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
    .select("id,auth_user_id,name,email,role,company_id,invited_by_user_id,years_employed")
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
    .select("id,auth_user_id,name,email,role,company_id,invited_by_user_id,years_employed")
    .eq("auth_user_id", auth.data.user.id)
    .maybeSingle();

  const row =
    byAuthId.data ??
    (
      await client
        .from("users")
        .select("id,auth_user_id,name,email,role,company_id,invited_by_user_id,years_employed")
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

  const total = input.benefits.reduce((sum, benefit) => sum + benefit.price, 0);
  const totalPoints = input.benefits.reduce((sum, benefit) => sum + benefit.pointsPrice, 0);
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
    price: benefit.price,
    points_price: benefit.pointsPrice
  }));

  const items = await client.from("selection_items").insert(itemRows);
  if (items.error) return null;

  const walletResult = await client
    .from("employer_wallet_cards")
    .select("id,points")
    .eq("employer_id", input.employerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!walletResult.error && walletResult.data) {
    const currentPoints = Number(walletResult.data.points ?? 0);
    await client
      .from("employer_wallet_cards")
      .update({ points: Math.max(0, currentPoints - totalPoints) })
      .eq("id", walletResult.data.id);
  }

  await client.from("points_ledger").insert({
    user_id: input.employerId,
    source: "employee_redemption",
    points_delta: -totalPoints,
    description: `Employee redeemed perks (${totalPoints} points)`
  });

  if (input.benefits.length) {
    await client.from("redemptions").insert(
      input.benefits.map((benefit) => ({
        benefit_id: benefit.id,
        provider_id: benefit.providerId,
        employee_id: input.employeeId,
        employer_id: input.employerId,
        selection_request_id: request.data.id,
        amount: benefit.price,
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
        amount: benefit.price,
        points_spent: benefit.pointsPrice,
        status: "paid",
        qr_code: `PERX-${input.requestId}-${benefit.id}`.slice(0, 64),
        redeemed_at: now
      }))
    );
  }

  return true;
}

export async function createEmployeeChallenge(input: {
  employeeId: string;
  employerId: string;
  title: string;
  description: string;
  rewardPoints: number;
}) {
  const client = getSupabaseClient();
  if (!client) return null;

  const result = await client
    .from("challenges")
    .insert({
      employee_id: input.employeeId,
      employer_id: input.employerId,
      title: input.title,
      description: input.description,
      reward_points: input.rewardPoints,
      status: "open"
    })
    .select("id,employee_id,employer_id,title,description,reward_points,status")
    .single();

  if (result.error || !result.data) return null;

  return {
    id: result.data.id,
    employeeId: result.data.employee_id,
    employeeName: "Employee",
    employerId: result.data.employer_id,
    title: result.data.title,
    description: result.data.description ?? "",
    rewardPoints: result.data.reward_points,
    status: result.data.status === "completed" ? "completed" : "open"
  } satisfies Challenge;
}

export async function completeEmployeeChallenge(input: {
  challengeId: string;
  employerId: string;
  rewardPoints: number;
  description: string;
}) {
  const client = getSupabaseClient();
  if (!client) return false;

  const challengeResult = await client
    .from("challenges")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", input.challengeId);

  if (challengeResult.error) return false;

  const walletResult = await client
    .from("employer_wallet_cards")
    .select("id,points")
    .eq("employer_id", input.employerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!walletResult.error && walletResult.data) {
    await client
      .from("employer_wallet_cards")
      .update({ points: Number(walletResult.data.points ?? 0) + input.rewardPoints })
      .eq("id", walletResult.data.id);
  }

  await client.from("points_ledger").insert({
    user_id: input.employerId,
    source: "challenge_completed",
    points_delta: input.rewardPoints,
    description: input.description
  });

  return true;
}

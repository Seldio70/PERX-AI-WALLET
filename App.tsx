import { StatusBar } from "expo-status-bar";
import {
  Bell,
  Building2,
  Check,
  ChevronRight,
  CircleDollarSign,
  LineChart,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  UsersRound,
  WalletCards
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { AllocationSlider } from "./src/components/AllocationSlider";
import { BottomNav, EmployeeTab } from "./src/components/BottomNav";
import { CapsuleButton } from "./src/components/CapsuleButton";
import { GlassPanel } from "./src/components/GlassPanel";
import { MetricPill } from "./src/components/MetricPill";
import { WalletCard } from "./src/components/WalletCard";
import { getSupabaseClient } from "./src/lib/supabase";
import {
  approveSelectionRequest,
  createProviderOffer,
  createPlatformUser,
  createSelectionRequest,
  fetchPerxLiveData,
  PerxLiveData,
  signInPlatformUser,
  signInOrSignUpPlatformAuth,
  upsertProviderProfile
} from "./src/lib/perxRepository";
import { colors, radius } from "./src/theme";
import {
  Benefit,
  BenefitCategory,
  Challenge,
  EmployerWalletCard,
  EmployerInvite,
  OfferDraft,
  ProviderProfile,
  Role,
  SelectionRequest,
  User
} from "./src/types";

type Session = {
  user: User;
  jwt: string;
};

type AppData = PerxLiveData;

const market = {
  country: "Albania",
  city: "Tirana",
  currency: "ALL",
  locale: "sq-AL"
};

const emptyAppData: AppData = {
  companies: [],
  users: [],
  providerProfiles: [],
  benefits: [],
  employerInvites: [],
  selectionRequests: [],
  employerWalletCards: [],
  challenges: []
};

const roleCopy: Record<Role, { title: string; subtitle: string; icon: typeof UserRound }> = {
  employee: {
    title: "Employee",
    subtitle: "Join, browse providers, curate perks for your employer.",
    icon: UserRound
  },
  employer: {
    title: "Employer",
    subtitle: "Wallet for points, perks, approvals, and employee challenges.",
    icon: Building2
  },
  business: {
    title: "Provider",
    subtitle: "Create a merchant profile and publish image-backed offers.",
    icon: Store
  }
};

const benefitCategoryOptions: BenefitCategory[] = [
  "Health",
  "Food",
  "Fitness",
  "Family",
  "Learning",
  "Mobility",
  "Wellness"
];

const allocationCategories: BenefitCategory[] = ["Food", "Fitness", "Family", "Learning"];

function createSessionToken(role: Role) {
  return `perx.session.${role}.${Date.now()}`;
}

function currency(value: number) {
  return `${Math.round(value).toLocaleString(market.locale)} ${market.currency}`;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [selectionRequests, setSelectionRequests] = useState<SelectionRequest[]>([]);
  const [challengeItems, setChallengeItems] = useState<Challenge[]>([]);
  const [inviteItems, setInviteItems] = useState<EmployerInvite[]>([]);
  const [walletCardItems, setWalletCardItems] = useState<EmployerWalletCard[]>([]);
  const [providerProfileItems, setProviderProfileItems] = useState<ProviderProfile[]>([]);
  const [benefitItems, setBenefitItems] = useState<Benefit[]>([]);
  const [liveData, setLiveData] = useState<AppData | null>(null);
  const [dataSource, setDataSource] = useState<"empty" | "supabase">("empty");
  const supabaseReady = Boolean(getSupabaseClient());
  const appData: AppData = {
    companies: liveData?.companies ?? emptyAppData.companies,
    users: liveData?.users ?? emptyAppData.users,
    providerProfiles: providerProfileItems,
    benefits: benefitItems,
    employerInvites: inviteItems,
    selectionRequests,
    employerWalletCards: walletCardItems,
    challenges: challengeItems
  };

  useEffect(() => {
    let active = true;

    fetchPerxLiveData().then((data) => {
      if (!active || !data) return;
      setLiveData(data);
      setSelectionRequests(data.selectionRequests);
      setChallengeItems(data.challenges);
      setInviteItems(data.employerInvites);
      setWalletCardItems(data.employerWalletCards);
      setProviderProfileItems(data.providerProfiles);
      setBenefitItems(data.benefits);
      setDataSource("supabase");
    });

    return () => {
      active = false;
    };
  }, []);

  const loginWithCredentials = async (role: Role, email: string, password: string) => {
    const user = await signInPlatformUser({ role, email, password });
    if (!user) return false;
    setSession({ user, jwt: createSessionToken(user.role) });
    return true;
  };

  const startSessionForUser = async (user: User, password?: string) => {
    const authUserId = password?.trim()
      ? await signInOrSignUpPlatformAuth({ email: user.email, password: password.trim() })
      : undefined;
    const savedUser = await createPlatformUser({
      authUserId: authUserId ?? user.authUserId,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      yearsEmployed: user.yearsEmployed,
      invitedByUserId: user.invitedByUserId
    });
    const sessionUser = savedUser ?? user;

    setSession({ user: sessionUser, jwt: createSessionToken(sessionUser.role) });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.appChrome}>
          <AppHeader
            session={session}
            supabaseReady={supabaseReady}
            onLogout={() => setSession(null)}
          />
          {session ? (
            <RoleRouter
              session={session}
              appData={appData}
              selectionRequests={selectionRequests}
              onSubmitSelection={(request) => setSelectionRequests((current) => [request, ...current])}
              onApproveSelection={(requestId) => {
                const request = selectionRequests.find((item) => item.id === requestId);
                const requestBenefits =
                  request?.benefitIds
                    .map((benefitId) => appData.benefits.find((benefit) => benefit.id === benefitId))
                    .filter((benefit): benefit is Benefit => Boolean(benefit)) ?? [];
                const totalPoints =
                  request?.totalPoints ??
                  requestBenefits.reduce((sum, benefit) => sum + benefit.pointsPrice, 0);

                void approveSelectionRequest({
                  requestId,
                  employerId: request?.employerId,
                  totalPoints,
                  benefits: requestBenefits
                });
                setSelectionRequests((current) =>
                  current.map((request) =>
                    request.id === requestId
                      ? { ...request, status: "approved", approvedAt: new Date().toISOString() }
                      : request
                  )
                );
                setWalletCardItems((current) =>
                  current.map((card, index) =>
                    index === 0 ? { ...card, points: Math.max(0, card.points - totalPoints) } : card
                  )
                );
              }}
              onUpdateProviderProfile={(profile) =>
                setProviderProfileItems((current) => [
                  profile,
                  ...current.filter((item) => item.id !== profile.id && item.userId !== profile.userId)
                ])
              }
              onAddOffer={(offer) =>
                setBenefitItems((current) => [
                  offer,
                  ...current.filter((item) => item.id !== offer.id)
                ])
              }
            />
          ) : (
            <LoginScreen
              onLogin={loginWithCredentials}
              onStartSession={startSessionForUser}
              supabaseReady={supabaseReady}
              dataSource={dataSource}
              appData={appData}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AppHeader({
  session,
  supabaseReady,
  onLogout
}: {
  session: Session | null;
  supabaseReady: boolean;
  onLogout: () => void;
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>PerX AI Wallet</Text>
        <Text style={styles.headerSub}>
          {session ? `${session.user.role} access` : "mobile benefits platform"}
        </Text>
      </View>
      <View style={styles.headerActions}>
        <View style={styles.statusPill}>
          <Text style={styles.statusDot}>{supabaseReady ? "Live" : "Off"}</Text>
          <Text style={styles.statusText}>{supabaseReady ? "Supabase" : "No DB"}</Text>
        </View>
        {session ? (
          <Pressable onPress={onLogout} style={styles.iconButton}>
            <Text style={styles.logoutText}>Out</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function LoginScreen({
  onLogin,
  onStartSession,
  supabaseReady,
  dataSource,
  appData
}: {
  onLogin: (role: Role, email: string, password: string) => Promise<boolean>;
  onStartSession: (user: User, password?: string) => Promise<void>;
  supabaseReady: boolean;
  dataSource: "empty" | "supabase";
  appData: AppData;
}) {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [selectedRole, setSelectedRole] = useState<Role>("employee");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("NovaWorks Tirana");
  const [message, setMessage] = useState("");

  const submitLogin = async () => {
    setMessage("");
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setMessage("Enter email and password.");
      return;
    }

    const ok = await onLogin(selectedRole, trimmedEmail, trimmedPassword);
    if (!ok) setMessage("Login failed. Check the role, email, and password.");
  };

  const submitSignup = async () => {
    setMessage("");
    const trimmedPassword = password.trim();
    if (trimmedPassword.length < 6) {
      setMessage("Password needs at least 6 characters.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) {
      setMessage("Enter name, email, and password to sign up.");
      return;
    }

    const matchedCompany = appData.companies.find(
      (company) => company.name.toLowerCase() === companyName.trim().toLowerCase()
    );

    await onStartSession(
      {
        id: `local_${selectedRole}_${Date.now()}`,
        name: trimmedName,
        email: trimmedEmail,
        role: selectedRole,
        companyId: selectedRole !== "business" ? matchedCompany?.id : undefined,
        yearsEmployed: selectedRole === "employee" ? 0 : undefined,
        businessId: selectedRole === "business" ? `business_${Date.now()}` : undefined
      },
      trimmedPassword
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <GlassPanel style={styles.heroPanel}>
        <View style={styles.heroIcon}>
          <Sparkles size={22} color={colors.text} />
        </View>
        <Text style={styles.heroTitle}>Benefits that learn how people live.</Text>
        <Text style={styles.heroText}>
          Mobile perks marketplace with provider signup, employee-curated offers, employer wallets,
          and an OpenAI recommendation endpoint waiting behind env variables.
        </Text>
        <View style={styles.heroMetrics}>
          <MetricPill label="Data" value={supabaseReady ? "Supabase" : "Connect DB"} />
          <MetricPill label="Market" value={market.city} />
        </View>
      </GlassPanel>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.sectionMeta}>{dataSource === "supabase" ? "Supabase data" : supabaseReady ? "No live rows yet" : "Connect Supabase"}</Text>
      </View>

      <View style={styles.segmented}>
        {(["login", "signup"] as const).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setAuthMode(mode)}
            style={[styles.segment, authMode === mode && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, authMode === mode && styles.segmentTextActive]}>
              {mode === "login" ? "Log in" : "Sign up"}
            </Text>
          </Pressable>
        ))}
      </View>

      {(["employee", "employer", "business"] as Role[]).map((role) => {
        const Icon = roleCopy[role].icon;
        const selected = selectedRole === role;
        return (
          <Pressable key={role} onPress={() => setSelectedRole(role)}>
            <GlassPanel style={[styles.roleCard, selected && styles.selectedOfferCard]} intensity={18}>
              <View style={styles.roleIcon}>
                <Icon size={22} color={colors.text} />
              </View>
              <View style={styles.roleTextWrap}>
                <Text style={styles.roleTitle}>{roleCopy[role].title}</Text>
                <Text style={styles.roleSub}>{roleCopy[role].subtitle}</Text>
              </View>
              <ChevronRight size={20} color={selected ? colors.text : colors.muted} />
            </GlassPanel>
          </Pressable>
        );
      })}

      <GlassPanel style={styles.formPanel}>
        <Text style={styles.cardTitle}>
          {authMode === "login" ? "Log in" : "Create account"}
        </Text>
        <Text style={styles.bodyText}>
          {selectedRole === "business"
            ? "Providers publish offers that become visible to employees."
            : selectedRole === "employee"
              ? "Employees browse providers and decide what their employer should see."
              : "Employers manage wallet points, approvals, and challenges."}
        </Text>
        {authMode === "signup" ? (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={selectedRole === "business" ? "Business name" : "Full name"}
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        ) : null}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={supabaseReady ? "Password" : "Password optional"}
          placeholderTextColor={colors.muted}
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
        />
        {authMode === "signup" && selectedRole !== "business" ? (
          <TextInput
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Company"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        ) : null}
        {message ? <Text style={styles.errorText}>{message}</Text> : null}
        <View style={styles.formActions}>
          <CapsuleButton
            label={authMode === "login" ? "Log in" : "Sign up"}
            onPress={() => void (authMode === "login" ? submitLogin() : submitSignup())}
          />
        </View>
      </GlassPanel>
    </ScrollView>
  );
}

function RoleRouter({
  session,
  appData,
  selectionRequests,
  onSubmitSelection,
  onApproveSelection,
  onUpdateProviderProfile,
  onAddOffer
}: {
  session: Session;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onSubmitSelection: (request: SelectionRequest) => void;
  onApproveSelection: (requestId: string) => void;
  onUpdateProviderProfile: (profile: ProviderProfile) => void;
  onAddOffer: (offer: Benefit) => void;
}) {
  if (session.user.role === "employer") {
    return (
      <EmployerExperience
        user={session.user}
        appData={appData}
        selectionRequests={selectionRequests}
        onApproveSelection={onApproveSelection}
      />
    );
  }
  if (session.user.role === "business") {
    return (
      <BusinessExperience
        user={session.user}
        appData={appData}
        selectionRequests={selectionRequests}
        onUpdateProviderProfile={onUpdateProviderProfile}
        onAddOffer={onAddOffer}
      />
    );
  }
  return (
    <EmployeeExperience
      user={session.user}
      appData={appData}
      onSubmitSelection={onSubmitSelection}
    />
  );
}

function EmployeeExperience({
  user,
  appData,
  onSubmitSelection
}: {
  user: User;
  appData: AppData;
  onSubmitSelection: (request: SelectionRequest) => void;
}) {
  const [tab, setTab] = useState<EmployeeTab>("home");

  const company =
    appData.companies.find((item) => item.id === user.companyId) ??
    appData.companies[0] ?? {
      id: "",
      name: "No company connected",
      employerId: "",
      monthlyBudgetPerEmployee: 0
    };
  const monthlyBudget = company.monthlyBudgetPerEmployee + (user.yearsEmployed ?? 0) * 500;
  const spent = 0;
  const balance = monthlyBudget - spent;

  return (
    <View style={styles.roleShell}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, styles.employeeContent]}
        showsVerticalScrollIndicator={false}
      >
        {tab === "home" ? (
          <EmployeeHome
            user={user}
            companyName={company.name}
            monthlyBudget={monthlyBudget}
            balance={balance}
            appData={appData}
          />
        ) : null}
        {tab === "wallet" ? (
          <EmployeeWallet user={user} companyName={company.name} balance={balance} appData={appData} />
        ) : null}
        {tab === "allocate" ? <BudgetAllocation user={user} monthlyBudget={monthlyBudget} appData={appData} /> : null}
        {tab === "alerts" ? <EmployeeOffers user={user} appData={appData} onSubmitSelection={onSubmitSelection} /> : null}
      </ScrollView>
      <BottomNav active={tab} onChange={setTab} />
    </View>
  );
}

function EmployeeHome({
  user,
  companyName,
  monthlyBudget,
  balance,
  appData
}: {
  user: User;
  companyName: string;
  monthlyBudget: number;
  balance: number;
  appData: AppData;
}) {
  return (
    <>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Hi, {user.name.split(" ")[0]}</Text>
        <Text style={styles.greetingSub}>Your monthly wallet is ready.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={332}>
        {appData.benefits.slice(0, 3).map((benefit) => (
          <WalletCard
            key={benefit.id}
            user={user}
            companyName={companyName}
            balance={balance}
            benefit={benefit}
          />
        ))}
      </ScrollView>

      <View style={styles.metricRow}>
        <MetricPill label="Available" value={currency(balance)} />
        <MetricPill label="Monthly" value={currency(monthlyBudget)} />
        <MetricPill label="Used" value={currency(monthlyBudget - balance)} />
      </View>

      <Section title="Spending" meta="June">
        <View style={styles.listRow}>
          <View style={styles.smallIcon}>
            <CircleDollarSign size={18} color={colors.text} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>No spending yet</Text>
            <Text style={styles.listSub}>Approved redemptions will appear after providers and offers are added.</Text>
          </View>
        </View>
      </Section>
    </>
  );
}

function EmployeeWallet({
  user,
  companyName,
  balance,
  appData
}: {
  user: User;
  companyName: string;
  balance: number;
  appData: AppData;
}) {
  const [activeBenefit, setActiveBenefit] = useState(appData.benefits[0]);
  const [nfcActive, setNfcActive] = useState(false);
  const walletBenefits = appData.benefits;
  const currentBenefit = activeBenefit ?? walletBenefits[0];
  if (!currentBenefit) {
    return (
      <Section title="Wallet" meta="No offers">
        <View style={styles.listRow}>
          <View style={styles.smallIcon}>
            <WalletCards size={18} color={colors.text} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>No wallet benefits yet</Text>
            <Text style={styles.listSub}>Provider offers will appear here after you add them.</Text>
          </View>
        </View>
      </Section>
    );
  }
  const qrValue = `PERX:${user.id}:${currentBenefit.id}:${Date.now().toString().slice(-6)}`;

  return (
    <>
      <Section title="Wallet" meta="Swipe benefits">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={332}>
          {walletBenefits.map((benefit) => (
            <Pressable key={benefit.id} onPress={() => setActiveBenefit(benefit)}>
              <WalletCard
                user={user}
                companyName={companyName}
                balance={balance}
                benefit={benefit}
              />
            </Pressable>
          ))}
        </ScrollView>
      </Section>

      <GlassPanel style={styles.qrPanel}>
        <View style={styles.qrBox}>
          <QRCode value={qrValue} size={158} color={colors.background} backgroundColor={colors.text} />
        </View>
        <View style={styles.qrText}>
          <Text style={styles.cardTitle}>{currentBenefit.title}</Text>
          <Text style={styles.bodyText}>{currentBenefit.description}</Text>
          <Text style={styles.listSub}>Session code {qrValue.slice(-6)}</Text>
        </View>
      </GlassPanel>

      <GlassPanel style={styles.nfcPanel}>
        <View style={styles.nfcCopy}>
          <Text style={styles.cardTitle}>NFC simulation</Text>
          <Text style={styles.bodyText}>
            {nfcActive ? "Hold near terminal. Awaiting provider confirmation." : "Tap to arm a wallet payment session."}
          </Text>
        </View>
        <CapsuleButton
          label={nfcActive ? "Armed" : "Tap NFC"}
          onPress={() => setNfcActive((value) => !value)}
          variant={nfcActive ? "soft" : "primary"}
        />
      </GlassPanel>
    </>
  );
}

function BudgetAllocation({ user, monthlyBudget, appData }: { user: User; monthlyBudget: number; appData: AppData }) {
  const startingValues = useMemo(() => {
    const values: Record<BenefitCategory, number> = {
      Food: 0,
      Fitness: 0,
      Family: 0,
      Learning: 0,
      Health: 0,
      Mobility: 0,
      Wellness: 0
    };

    return values;
  }, []);

  const [values, setValues] = useState(startingValues);
  const total = allocationCategories.reduce((sum, category) => sum + values[category], 0);
  const remaining = Math.max(0, monthlyBudget - total);

  const updateCategory = (category: BenefitCategory, nextValue: number) => {
    const otherTotal = allocationCategories.reduce(
      (sum, item) => sum + (item === category ? 0 : values[item]),
      0
    );
    const capped = Math.min(nextValue, Math.max(0, monthlyBudget - otherTotal));
    setValues((current) => ({ ...current, [category]: capped }));
  };

  return (
    <>
      <GlassPanel style={styles.allocationSummary}>
        <Text style={styles.cardTitle}>Monthly split</Text>
        <Text style={styles.largeNumber}>{currency(remaining)}</Text>
        <Text style={styles.bodyText}>left unallocated from {currency(monthlyBudget)}</Text>
      </GlassPanel>

      <Section title="Allocate" meta="Drag sliders">
        {allocationCategories.map((category) => (
          <AllocationSlider
            key={category}
            category={category}
            value={values[category]}
            max={monthlyBudget}
            onChange={(value) => updateCategory(category, value)}
          />
        ))}
      </Section>
    </>
  );
}

function EmployeeOffers({
  user,
  appData,
  onSubmitSelection
}: {
  user: User;
  appData: AppData;
  onSubmitSelection: (request: SelectionRequest) => void;
}) {
  const smartPackageIds: string[] = [];
  const [selectedIds, setSelectedIds] = useState<string[]>(smartPackageIds);
  const [selectedProviderNames, setSelectedProviderNames] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const marketplaceBenefits = appData.benefits;
  const marketplaceProviders = appData.providerProfiles;
  const visibleBenefits = selectedProviderNames.length
    ? marketplaceBenefits.filter((benefit) => selectedProviderNames.includes(benefit.providerName))
    : marketplaceBenefits;
  const selectedBenefits = marketplaceBenefits.filter((benefit) => selectedIds.includes(benefit.id));
  const selectedTotal = selectedBenefits.reduce((sum, benefit) => sum + benefit.price, 0);
  const selectedPoints = selectedBenefits.reduce((sum, benefit) => sum + benefit.pointsPrice, 0);
  const selectedByProvider = useMemo(
    () =>
      selectedBenefits.reduce<Record<string, Benefit[]>>((grouped, benefit) => {
        grouped[benefit.providerName] = [...(grouped[benefit.providerName] ?? []), benefit];
        return grouped;
      }, {}),
    [selectedBenefits]
  );
  const selectedProviderGroups = Object.entries(selectedByProvider);
  const company = appData.companies.find((item) => item.id === user.companyId);
  const connectedEmployerId =
    company?.employerId ||
    appData.users.find((candidate) => candidate.role === "employer" && candidate.companyId === user.companyId)?.id ||
    appData.users.find((candidate) => candidate.role === "employer")?.id;

  const toggleBenefit = (benefitId: string) => {
    setSubmitted(false);
    setSelectedIds((current) =>
      current.includes(benefitId)
        ? current.filter((id) => id !== benefitId)
        : [...current, benefitId]
    );
  };

  const toggleProvider = (providerName: string) => {
    setSubmitted(false);
    const providerBenefitIds = marketplaceBenefits
      .filter((benefit) => benefit.providerName === providerName)
      .map((benefit) => benefit.id);

    setSelectedProviderNames((current) => {
      const selected = current.includes(providerName);
      return selected ? current.filter((name) => name !== providerName) : [...current, providerName];
    });

    setSelectedIds((current) => {
      const selected = selectedProviderNames.includes(providerName);
      if (selected) {
        return current.filter((id) => !providerBenefitIds.includes(id));
      }

      return Array.from(new Set([...current, ...providerBenefitIds]));
    });
  };

  const submitSelection = () => {
    if (!selectedIds.length) return;

    const localRequest = {
      id: `request_${Date.now()}`,
      employeeId: user.id,
      employeeName: user.name,
      employerId: connectedEmployerId,
      benefitIds: selectedIds,
      total: selectedTotal,
      totalPoints: selectedPoints,
      status: "pending",
      createdAt: new Date().toISOString()
    } satisfies SelectionRequest;

    void createSelectionRequest({
      employeeId: user.id,
      employerId: connectedEmployerId,
      companyId: user.companyId,
      benefitIds: selectedIds,
      benefits: selectedBenefits
    });

    onSubmitSelection(localRequest);
    setSubmitted(true);
  };

  return (
    <>
      <GlassPanel style={styles.packagePanel}>
        <View style={styles.packageFooter}>
          <Text style={styles.confidence}>{currency(selectedTotal)}</Text>
          <CapsuleButton
            label={submitted ? "Sent to employer" : "Show employer"}
            onPress={submitSelection}
            variant={submitted ? "soft" : "primary"}
          />
        </View>
      </GlassPanel>

      <Section title="Selected package" meta={`${selectedBenefits.length} perks`}>
        <GlassPanel style={styles.packageSummaryPanel} intensity={12}>
          <View style={styles.packageSummaryHeader}>
            <View style={styles.listText}>
              <Text style={styles.cardTitle}>Ready for employer review</Text>
              <Text style={styles.bodyText}>
                Grouped by provider so the employer can see where payment will be routed.
              </Text>
            </View>
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>{selectedPoints} pts</Text>
            </View>
          </View>

          {selectedProviderGroups.length ? (
            selectedProviderGroups.map(([providerName, providerBenefits]) => (
              <View key={providerName} style={styles.listRow}>
                <View style={styles.smallIcon}>
                  <Store size={18} color={colors.text} />
                </View>
                <View style={styles.listText}>
                  <Text style={styles.listTitle}>{providerName}</Text>
                  <Text style={styles.listSub}>
                    {providerBenefits.map((benefit) => benefit.title).join(", ")}
                  </Text>
                </View>
                <Text style={styles.listAmount}>
                  {providerBenefits.reduce((sum, benefit) => sum + benefit.pointsPrice, 0)} pts
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.listRow}>
              <View style={styles.smallIcon}>
                <Plus size={18} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>No perks selected</Text>
                <Text style={styles.listSub}>Choose offers or tap a provider to include their full package.</Text>
              </View>
            </View>
          )}

          <View style={styles.packageSummaryTotals}>
            <Text style={styles.bodyText}>Cash equivalent</Text>
            <Text style={styles.confidence}>{currency(selectedTotal)}</Text>
          </View>
        </GlassPanel>
      </Section>

      <Section title="Marketplace" meta={market.city}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {marketplaceProviders.map((provider) => {
            const selected = selectedProviderNames.includes(provider.businessName);
            return (
              <Pressable key={provider.id} onPress={() => toggleProvider(provider.businessName)}>
                <GlassPanel style={[styles.providerCard, selected && styles.selectedOfferCard]} intensity={12}>
                  <Image source={{ uri: provider.logoUrl }} style={styles.providerLogo} />
                  <Text style={styles.listTitle}>{provider.businessName}</Text>
                  <Text style={styles.listSub}>{provider.category} - {provider.city}</Text>
                  <Text style={styles.selectedBadgeText}>{selected ? "Included" : "Tap to include"}</Text>
                </GlassPanel>
              </Pressable>
            );
          })}
        </ScrollView>

        {visibleBenefits.map((benefit) => {
          const selected = selectedIds.includes(benefit.id);
          return (
            <Pressable key={benefit.id} onPress={() => toggleBenefit(benefit.id)}>
              <GlassPanel
                style={[styles.offerCard, selected && styles.selectedOfferCard]}
                intensity={14}
              >
                <Image source={{ uri: benefit.imageUrl }} style={styles.offerImage} />
                <View style={styles.offerTop}>
                  <View style={styles.smallIcon}>
                    {benefit.redemptionType === "QR" ? (
                      <QrCode size={18} color={colors.text} />
                    ) : (
                      <WalletCards size={18} color={colors.text} />
                    )}
                  </View>
                  <View style={styles.listText}>
                    <Text style={styles.listTitle}>{benefit.title}</Text>
                    <Text style={styles.listSub}>
                      {benefit.providerName} - {benefit.discount} - {benefit.category}
                    </Text>
                  </View>
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>
                      {selected ? "Added" : `${benefit.pointsPrice} pts`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bodyText}>{benefit.description}</Text>
                <Text style={styles.listSub}>{currency(benefit.price)} cash equivalent</Text>
              </GlassPanel>
            </Pressable>
          );
        })}
      </Section>

      <Section title="How approval works" meta="Live flow">
        <View style={styles.listRow}>
          <View style={styles.smallIcon}>
            <UsersRound size={18} color={colors.text} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>Employer approves the package</Text>
            <Text style={styles.listSub}>
              Once approved, simulated payment is routed to each provider. Employee never receives cash.
            </Text>
          </View>
        </View>
      </Section>
    </>
  );
}

function EmployerExperience({
  user,
  appData,
  selectionRequests,
  onApproveSelection
}: {
  user: User;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onApproveSelection: (requestId: string) => void;
}) {
  const company =
    appData.companies.find((item) => item.employerId === user.id) ??
    appData.companies.find((item) => item.id === user.companyId) ?? {
      id: "",
      name: "No company connected",
      employerId: user.id,
      monthlyBudgetPerEmployee: 0
    };
  const employees = appData.users.filter((item) => item.role === "employee" && item.companyId === company.id);
  const [budgets, setBudgets] = useState(
    Object.fromEntries(
      employees.map((employee) => [
        employee.id,
        company.monthlyBudgetPerEmployee + (employee.yearsEmployed ?? 0) * 500
      ])
    ) as Record<string, number>
  );

  const totalBudget = Object.values(budgets).reduce((sum, value) => sum + value, 0);
  const pendingCount = selectionRequests.filter((request) => request.status === "pending").length;
  const employerPoints = appData.employerWalletCards.reduce((sum, card) => sum + card.points, 0);
  const spendablePoints = appData.employerWalletCards[0]?.points ?? 999999;
  const [approvalNotice, setApprovalNotice] = useState("");

  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>{company.name}</Text>
        <Text style={styles.greetingSub}>Employer operations dashboard</Text>
      </View>

      <View style={styles.metricRow}>
        <MetricPill label="Employees" value={`${employees.length}`} />
        <MetricPill label="Points" value={`${employerPoints.toLocaleString(market.locale)}`} />
        <MetricPill label="Pending" value={`${pendingCount}`} />
      </View>

      {approvalNotice ? <Text style={styles.errorText}>{approvalNotice}</Text> : null}

      <Section title="Points wallet" meta="Cards">
        {appData.employerWalletCards.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {appData.employerWalletCards.map((card) => (
            <GlassPanel key={card.id} style={styles.pointsCard} intensity={16}>
              <View style={[styles.pointsAccent, { backgroundColor: card.accent }]} />
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.pointsValue}>{card.points.toLocaleString(market.locale)}</Text>
              <Text style={styles.bodyText}>{card.description}</Text>
            </GlassPanel>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <WalletCards size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No wallet cards yet</Text>
              <Text style={styles.listSub}>Add wallet cards in Supabase to assign employer points.</Text>
            </View>
          </View>
        )}
      </Section>

      <Section title="Perks for points" meta="Catalog">
        {appData.benefits.length ? appData.benefits.map((benefit) => {
          const canAfford = employerPoints >= benefit.pointsPrice;
          return (
            <GlassPanel key={benefit.id} style={styles.offerCard} intensity={14}>
              <Image source={{ uri: benefit.imageUrl }} style={styles.offerImage} />
              <View style={styles.offerTop}>
                <View style={styles.listText}>
                  <Text style={styles.listTitle}>{benefit.title}</Text>
                  <Text style={styles.listSub}>{benefit.providerName} - {benefit.category}</Text>
                </View>
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>{benefit.pointsPrice} pts</Text>
                </View>
              </View>
              <Text style={styles.bodyText}>{benefit.description}</Text>
              <Text style={styles.listSub}>
                {canAfford ? "Available with current wallet balance" : "Needs more points"}
              </Text>
            </GlassPanel>
          );
        }) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <Store size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No perks yet</Text>
              <Text style={styles.listSub}>Provider offers will appear after they are added.</Text>
            </View>
          </View>
        )}
      </Section>

      <Section title="Approval queue" meta="Core loop">
        {selectionRequests.map((request) => {
          const requestBenefits = request.benefitIds
            .map((benefitId) => appData.benefits.find((benefit) => benefit.id === benefitId))
            .filter(Boolean) as Benefit[];
          const providers = Array.from(new Set(requestBenefits.map((benefit) => benefit.providerName)));
          const pointsNeeded =
            request.totalPoints || requestBenefits.reduce((sum, benefit) => sum + benefit.pointsPrice, 0);
          const canApprove = spendablePoints >= pointsNeeded;

          return (
            <GlassPanel key={request.id} style={styles.approvalCard} intensity={14}>
              <View style={styles.employeeBudgetHeader}>
                <View style={styles.listText}>
                  <Text style={styles.cardTitle}>{request.employeeName}</Text>
                  <Text style={styles.bodyText}>
                    {requestBenefits.map((benefit) => benefit.title).join(", ")}
                  </Text>
                  <Text style={styles.listSub}>
                    Routes to {providers.join(", ")}
                  </Text>
                </View>
                <Text style={styles.confidence}>{currency(request.total)}</Text>
              </View>
              <Text style={styles.listSub}>
                Points needed: {pointsNeeded.toLocaleString(market.locale)}
              </Text>
              <View style={styles.packageFooter}>
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>
                    {request.status === "approved" ? "Approved - paid" : "Pending approval"}
                  </Text>
                </View>
                {request.status === "pending" ? (
                  <CapsuleButton
                    label={canApprove ? "Approve" : "Need points"}
                    onPress={() => {
                      if (!canApprove) {
                        setApprovalNotice("Not enough points to approve this package.");
                        return;
                      }
                      setApprovalNotice("");
                      onApproveSelection(request.id);
                    }}
                    variant={canApprove ? "primary" : "soft"}
                    icon={<Check size={16} color={colors.background} />}
                  />
                ) : null}
              </View>
            </GlassPanel>
          );
        })}
      </Section>

      <Section title="Employee budgets" meta="Adjust">
        {employees.map((employee) => (
          <GlassPanel key={employee.id} style={styles.employeeBudgetCard} intensity={14}>
            <View style={styles.employeeBudgetHeader}>
              <View>
                <Text style={styles.listTitle}>{employee.name}</Text>
                <Text style={styles.listSub}>{employee.yearsEmployed} years employed</Text>
              </View>
              <Text style={styles.confidence}>{currency(budgets[employee.id])}</Text>
            </View>
            <AllocationSlider
              category="Health"
              value={budgets[employee.id]}
              max={15000}
              onChange={(value) => setBudgets((current) => ({ ...current, [employee.id]: value }))}
            />
          </GlassPanel>
        ))}
      </Section>

      <Section title="Analytics" meta="Trending">
        <GlassPanel style={styles.analyticsGrid} intensity={14}>
          <AnalyticsRow label="Employees" value={`${employees.length}`} />
          <AnalyticsRow label="Pending approvals" value={`${pendingCount}`} />
        </GlassPanel>
      </Section>

      <Section title="More controls" meta="Added">
        {[
          ["Policy templates", "Create department-specific allowance rules."],
          ["Budget forecasting", "Preview cost changes before bulk updates."],
          ["Engagement nudges", "Auto-remind employees with unused budget."],
          ["Approval queue", "Review exceptions and high-value redemptions."]
        ].map(([title, text]) => (
          <View key={title} style={styles.listRow}>
            <View style={styles.smallIcon}>
              <ShieldCheck size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>{title}</Text>
              <Text style={styles.listSub}>{text}</Text>
            </View>
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

function BusinessExperience({
  user,
  appData,
  selectionRequests,
  onUpdateProviderProfile,
  onAddOffer
}: {
  user: User;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onUpdateProviderProfile: (profile: ProviderProfile) => void;
  onAddOffer: (offer: Benefit) => void;
}) {
  const existingProfile =
    appData.providerProfiles.find((profile) => profile.userId === user.id) ??
    appData.providerProfiles.find((profile) => profile.businessName === user.name);
  const [profileDraft, setProfileDraft] = useState({
    businessName: existingProfile?.businessName ?? user.name,
    description: existingProfile?.description ?? "Local partner offering employee perks.",
    category: existingProfile?.category ?? "Wellness",
    logoUrl:
      existingProfile?.logoUrl ??
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=300&q=80",
    city: existingProfile?.city ?? market.city
  });
  const [offers, setOffers] = useState<Benefit[]>(
    appData.benefits.filter((item) => item.businessId === (user.businessId ?? user.id))
  );
  const allBenefits = [...appData.benefits.filter((item) => !offers.some((offer) => offer.id === item.id)), ...offers];

  useEffect(() => {
    setOffers(appData.benefits.filter((item) => item.businessId === (user.businessId ?? user.id)));
  }, [appData.benefits, user.businessId, user.id]);
  const [draft, setDraft] = useState<OfferDraft>({
    title: "",
    description: "",
    discount: "",
    price: "",
    pointsPrice: "",
    imageUrl: "",
    redemptionType: "QR",
    validUntil: "2026-12-31"
  });
  const routedPayments = selectionRequests.flatMap((request) =>
    request.benefitIds
      .map((benefitId) => allBenefits.find((benefit) => benefit.id === benefitId))
      .filter((benefit): benefit is Benefit => Boolean(benefit))
      .filter((benefit) => benefit.businessId === user.businessId)
      .map((benefit) => ({ request, benefit }))
  );
  const approvedPayoutTotal = routedPayments
    .filter(({ request }) => request.status === "approved")
    .reduce((sum, { benefit }) => sum + benefit.price, 0);
  const approvedRoutedPayments = routedPayments.filter(({ request }) => request.status === "approved");
  const reachedEmployees = new Set(approvedRoutedPayments.map(({ request }) => request.employeeId)).size;

  const saveProviderProfile = async () => {
    const localProfile: ProviderProfile = {
      id: existingProfile?.id ?? `provider_${Date.now()}`,
      userId: user.id,
      businessName: profileDraft.businessName.trim() || user.name,
      logoUrl: profileDraft.logoUrl.trim(),
      description: profileDraft.description.trim(),
      category: profileDraft.category as BenefitCategory,
      city: profileDraft.city.trim() || market.city,
      isApproved: true
    };

    const savedProfile = await upsertProviderProfile({
      providerUserId: user.id,
      businessName: localProfile.businessName,
      logoUrl: localProfile.logoUrl,
      description: localProfile.description,
      category: localProfile.category,
      city: localProfile.city
    });

    onUpdateProviderProfile(savedProfile ?? localProfile);
  };

  const addOffer = async () => {
    if (!draft.title.trim()) return;
    const nextOffer: Benefit = {
      id: `benefit_${Date.now()}`,
      businessId: user.businessId ?? user.id,
      providerId: existingProfile?.id,
      providerName: profileDraft.businessName.trim() || user.name,
      title: draft.title,
      description: draft.description || "Member-only partner offer.",
      discount: draft.discount || "10% off",
      price: Number(draft.price) || 1200,
      pointsPrice: Number(draft.pointsPrice) || 140,
      imageUrl:
        draft.imageUrl ||
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
      redemptionType: draft.redemptionType,
      category: profileDraft.category as BenefitCategory,
      validUntil: draft.validUntil,
      city: profileDraft.city.trim() || market.city
    };

    const savedOffer = await createProviderOffer({
      providerUserId: user.id,
      providerName: profileDraft.businessName.trim() || user.name,
      title: nextOffer.title,
      description: nextOffer.description,
      discount: nextOffer.discount,
      price: nextOffer.price,
      pointsPrice: nextOffer.pointsPrice,
      imageUrl: nextOffer.imageUrl,
      redemptionType: nextOffer.redemptionType,
      category: nextOffer.category,
      city: nextOffer.city
    });

    onAddOffer(savedOffer ?? nextOffer);
    setOffers((current) => [
      savedOffer ?? nextOffer,
      ...current
    ]);
    setDraft({
      title: "",
      description: "",
      discount: "",
      price: "",
      pointsPrice: "",
      imageUrl: "",
      redemptionType: "QR",
      validUntil: "2026-12-31"
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <GlassPanel style={styles.businessProfile}>
        <Image source={{ uri: profileDraft.logoUrl }} style={styles.businessLogoImage} />
        <Text style={styles.greetingText}>{profileDraft.businessName}</Text>
        <Text style={styles.greetingSub}>{profileDraft.description}</Text>
      </GlassPanel>

      <View style={styles.metricRow}>
        <MetricPill label="Redeemed" value={`${approvedRoutedPayments.length}`} />
        <MetricPill label="Reached" value={`${reachedEmployees}`} />
        <MetricPill label="Payouts" value={currency(approvedPayoutTotal)} />
      </View>

      <Section title="Provider profile" meta="Merchant">
        <GlassPanel style={styles.formPanel}>
          <TextInput
            value={profileDraft.businessName}
            onChangeText={(businessName) => setProfileDraft((current) => ({ ...current, businessName }))}
            placeholder="Business name"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <TextInput
            value={profileDraft.description}
            onChangeText={(description) => setProfileDraft((current) => ({ ...current, description }))}
            placeholder="Description"
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
          />
          <View style={styles.categoryWrap}>
            {benefitCategoryOptions.map((category) => {
              const selected = profileDraft.category === category;
              return (
                <Pressable
                  key={category}
                  onPress={() => setProfileDraft((current) => ({ ...current, category }))}
                  style={[styles.categoryChip, selected && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryChipText, selected && styles.categoryChipTextActive]}>
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={profileDraft.logoUrl}
            onChangeText={(logoUrl) => setProfileDraft((current) => ({ ...current, logoUrl }))}
            placeholder="Logo image URL"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <TextInput
            value={profileDraft.city}
            onChangeText={(city) => setProfileDraft((current) => ({ ...current, city }))}
            placeholder="City"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <CapsuleButton label="Save profile" onPress={() => void saveProviderProfile()} />
        </GlassPanel>
      </Section>

      <Section title="Add offer" meta="Provider">
        <GlassPanel style={styles.formPanel}>
          <TextInput
            value={draft.title}
            onChangeText={(title) => setDraft((current) => ({ ...current, title }))}
            placeholder="Offer title"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <TextInput
            value={draft.discount}
            onChangeText={(discount) => setDraft((current) => ({ ...current, discount }))}
            placeholder="Discount value"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <TextInput
            value={draft.price}
            onChangeText={(price) => setDraft((current) => ({ ...current, price }))}
            placeholder={`Price in ${market.currency}`}
            placeholderTextColor={colors.muted}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            value={draft.pointsPrice}
            onChangeText={(pointsPrice) => setDraft((current) => ({ ...current, pointsPrice }))}
            placeholder="Points price for employer"
            placeholderTextColor={colors.muted}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            value={draft.imageUrl}
            onChangeText={(imageUrl) => setDraft((current) => ({ ...current, imageUrl }))}
            placeholder="Product image URL"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <TextInput
            value={draft.description}
            onChangeText={(description) => setDraft((current) => ({ ...current, description }))}
            placeholder="Description"
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
          />
          <View style={styles.segmented}>
            {(["QR", "NFC"] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => setDraft((current) => ({ ...current, redemptionType: type }))}
                style={[styles.segment, draft.redemptionType === type && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, draft.redemptionType === type && styles.segmentTextActive]}>
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>
          <CapsuleButton label="Publish offer" onPress={() => void addOffer()} icon={<Plus size={16} color={colors.background} />} />
        </GlassPanel>
      </Section>

      <Section title="Live offers" meta={`${offers.length}`}>
        {offers.map((offer) => (
          <GlassPanel key={offer.id} style={styles.offerCard} intensity={14}>
            <Image source={{ uri: offer.imageUrl }} style={styles.offerImage} />
            <View style={styles.offerTop}>
              <View style={styles.smallIcon}>
                <Check size={18} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{offer.title}</Text>
                <Text style={styles.listSub}>
                  {offer.discount} - {currency(offer.price)} - {offer.pointsPrice} pts - {offer.redemptionType}
                </Text>
              </View>
              <Text style={styles.listSub}>{offer.validUntil}</Text>
            </View>
            <Text style={styles.bodyText}>{offer.description}</Text>
          </GlassPanel>
        ))}
      </Section>

      <Section title="Payment routing" meta="Simulated">
        {routedPayments.length ? (
          routedPayments.map(({ request, benefit }) => (
            <View key={`${request.id}-${benefit.id}`} style={styles.listRow}>
              <View style={styles.smallIcon}>
                <CircleDollarSign size={18} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{benefit.title}</Text>
                <Text style={styles.listSub}>
                  {request.employeeName} - {request.status === "approved" ? "paid to provider" : "awaiting employer"}
                </Text>
              </View>
              <Text style={styles.listAmount}>{currency(benefit.price)}</Text>
            </View>
          ))
        ) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <Store size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No routed payments yet</Text>
              <Text style={styles.listSub}>Approved employee packages will appear here.</Text>
            </View>
          </View>
        )}
      </Section>

      <Section title="Redemption stats" meta="Today">
        <GlassPanel style={styles.analyticsGrid} intensity={14}>
          <AnalyticsRow label="Employees used offers" value={`${reachedEmployees}`} />
          <AnalyticsRow label="Approved payouts" value={`${approvedRoutedPayments.length}`} />
          <AnalyticsRow label="Offer count" value={`${offers.length}`} />
        </GlassPanel>
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  meta,
  children
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function AnalyticsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.analyticsRow}>
      <View style={styles.analyticsLabel}>
        <LineChart size={17} color={colors.text} />
        <Text style={styles.listTitle}>{label}</Text>
      </View>
      <Text style={styles.confidence}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboard: {
    flex: 1
  },
  appChrome: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brand: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900"
  },
  headerSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    textTransform: "capitalize"
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  statusPill: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: radius.capsule,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.stroke,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  statusDot: {
    color: colors.accent,
    fontSize: 11
  },
  statusText: {
    color: colors.soft,
    fontSize: 12,
    fontWeight: "700"
  },
  iconButton: {
    width: 42,
    height: 34,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.stroke
  },
  logoutText: {
    color: colors.soft,
    fontSize: 12,
    fontWeight: "800"
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 16
  },
  employeeContent: {
    paddingBottom: 112
  },
  roleShell: {
    flex: 1
  },
  heroPanel: {
    padding: 22,
    minHeight: 260,
    justifyContent: "space-between"
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: colors.stroke,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panelStrong
  },
  heroTitle: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    marginTop: 18
  },
  heroText: {
    color: colors.soft,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12
  },
  heroMetrics: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18
  },
  roleCard: {
    padding: 16,
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: colors.stroke,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panelStrong
  },
  roleTextWrap: {
    flex: 1
  },
  roleTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  roleSub: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3
  },
  greeting: {
    marginTop: 2
  },
  greetingText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900"
  },
  greetingSub: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20
  },
  metricRow: {
    flexDirection: "row",
    gap: 8
  },
  section: {
    gap: 10
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  onboardingPanel: {
    padding: 18,
    gap: 14
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  aiIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.capsule,
    backgroundColor: colors.accentDeep,
    alignItems: "center",
    justifyContent: "center"
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  bodyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  },
  question: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "800"
  },
  input: {
    minHeight: 48,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.stroke,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: "rgba(255,255,255,0.06)",
    fontSize: 15
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  categoryChip: {
    minHeight: 38,
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: colors.stroke,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)"
  },
  categoryChipActive: {
    borderColor: "rgba(247,248,250,0.42)",
    backgroundColor: "rgba(255,255,255,0.12)"
  },
  categoryChipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  categoryChipTextActive: {
    color: colors.text
  },
  recommendationCard: {
    padding: 16
  },
  recHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6
  },
  confidence: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  listRow: {
    minHeight: 66,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  smallIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.panelStrong,
    borderWidth: 1,
    borderColor: colors.stroke
  },
  listText: {
    flex: 1
  },
  listTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  listSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3
  },
  listAmount: {
    color: colors.soft,
    fontSize: 14,
    fontWeight: "900"
  },
  qrPanel: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  qrBox: {
    width: 176,
    height: 176,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text
  },
  qrText: {
    flex: 1,
    gap: 8
  },
  nfcPanel: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  nfcCopy: {
    flex: 1,
    gap: 5
  },
  allocationSummary: {
    padding: 22
  },
  largeNumber: {
    color: colors.text,
    fontSize: 46,
    fontWeight: "900",
    marginTop: 10
  },
  offerCard: {
    padding: 16,
    gap: 12
  },
  offerImage: {
    width: "100%",
    height: 132,
    borderRadius: 20,
    backgroundColor: colors.panelStrong
  },
  providerCard: {
    width: 156,
    minHeight: 154,
    padding: 14,
    marginRight: 10,
    gap: 8
  },
  providerLogo: {
    width: 52,
    height: 52,
    borderRadius: radius.capsule,
    backgroundColor: colors.panelStrong
  },
  selectedOfferCard: {
    borderColor: "rgba(247,248,250,0.42)",
    backgroundColor: "rgba(255,255,255,0.11)"
  },
  pointsCard: {
    width: 244,
    minHeight: 168,
    padding: 18,
    marginRight: 12,
    gap: 8
  },
  pointsAccent: {
    width: 38,
    height: 6,
    borderRadius: radius.capsule,
    marginBottom: 8
  },
  pointsValue: {
    color: colors.text,
    fontSize: 38,
    fontWeight: "900"
  },
  packagePanel: {
    padding: 16,
    gap: 16
  },
  packageSummaryPanel: {
    padding: 16,
    gap: 12
  },
  packageSummaryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  packageSummaryTotals: {
    minHeight: 48,
    borderTopWidth: 1,
    borderTopColor: colors.stroke,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  packageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  selectedBadge: {
    minHeight: 34,
    borderRadius: radius.capsule,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  selectedBadgeText: {
    color: colors.soft,
    fontSize: 12,
    fontWeight: "800"
  },
  offerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  adminActionPanel: {
    padding: 16,
    gap: 14
  },
  adminAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  employeeBudgetCard: {
    padding: 14,
    gap: 12
  },
  approvalCard: {
    padding: 16,
    gap: 14
  },
  employeeBudgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  analyticsGrid: {
    padding: 12
  },
  analyticsRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)"
  },
  analyticsLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  businessProfile: {
    padding: 22,
    gap: 12
  },
  businessLogoImage: {
    width: 66,
    height: 66,
    borderRadius: radius.capsule,
    backgroundColor: colors.text
  },
  logoMark: {
    width: 58,
    height: 58,
    borderRadius: radius.capsule,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center"
  },
  formPanel: {
    padding: 16,
    gap: 10
  },
  formActions: {
    flexDirection: "row",
    gap: 10
  },
  errorText: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: "700"
  },
  segmented: {
    height: 48,
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 4,
    flexDirection: "row"
  },
  segment: {
    flex: 1,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center"
  },
  segmentActive: {
    backgroundColor: colors.text
  },
  segmentText: {
    color: colors.muted,
    fontWeight: "800"
  },
  segmentTextActive: {
    color: colors.background
  }
});

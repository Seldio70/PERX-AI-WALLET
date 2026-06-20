import { StatusBar } from "expo-status-bar";
import {
  Activity,
  Building2,
  Check,
  CircleDollarSign,
  LineChart,
  Plus,
  QrCode,
  Shield,
  ShieldCheck,
  Store,
  TrendingUp,
  UserPlus,
  UserRound,
  Users,
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
import { AppIcon } from "./src/components/AppIcon";
import { BentoMetricCard } from "./src/components/BentoMetricCard";
import { BottomNav, NavTab } from "./src/components/BottomNav";
import { CapsuleButton } from "./src/components/CapsuleButton";
import { ConfettiBurst } from "./src/components/ConfettiBurst";
import { GlassPanel } from "./src/components/GlassPanel";
import { MeshBackground } from "./src/components/MeshBackground";
import { MetricPill } from "./src/components/MetricPill";
import { UserProfileScreen } from "./src/components/UserProfileScreen";
import { WalletCard } from "./src/components/WalletCard";
import { currency, market } from "./src/lib/format";
import { getSupabaseClient } from "./src/lib/supabase";
import {
  approveSelectionRequest,
  createProviderOffer,
  createPlatformUser,
  fetchPerxLiveData,
  PerxLiveData,
  signInPlatformUser,
  signInOrSignUpPlatformAuth,
  upsertProviderProfile
} from "./src/lib/perxRepository";
import { colors, radius, shadow } from "./src/theme";
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

type EmployeeTab = "home" | "wallet" | "alerts" | "profile";
type EmployerTab = "home" | "approvals" | "team" | "profile";
type BusinessTab = "home" | "offers" | "payments" | "profile";

const profileTab: NavTab = {
  id: "profile",
  label: "You",
  icon: "account-circle-outline",
  iconActive: "account-circle"
};

const employeeTabs: NavTab<EmployeeTab>[] = [
  { id: "home", label: "Home", icon: "home-outline", iconActive: "home" },
  { id: "wallet", label: "Wallet", icon: "wallet-outline", iconActive: "wallet" },
  { id: "alerts", label: "Offers", icon: "tag-outline", iconActive: "tag" },
  profileTab as NavTab<EmployeeTab>
];

const employerTabs: NavTab<EmployerTab>[] = [
  { id: "home", label: "Home", icon: "view-dashboard-outline", iconActive: "view-dashboard" },
  { id: "approvals", label: "Approvals", icon: "check-decagram-outline", iconActive: "check-decagram" },
  { id: "team", label: "Team", icon: "account-group-outline", iconActive: "account-group" },
  profileTab as NavTab<EmployerTab>
];

const businessTabs: NavTab<BusinessTab>[] = [
  { id: "home", label: "Insights", icon: "chart-box-outline", iconActive: "chart-box" },
  { id: "offers", label: "Offers", icon: "tag-multiple-outline", iconActive: "tag-multiple" },
  { id: "payments", label: "Payments", icon: "cash-multiple", iconActive: "cash-multiple" },
  profileTab as NavTab<BusinessTab>
];

type AppData = PerxLiveData;

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

function createSessionToken(role: Role) {
  return `perx.session.${role}.${Date.now()}`;
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
      <StatusBar style="dark" />
      <MeshBackground />
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
              onLogout={() => setSession(null)}
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
      <View style={styles.headerBrand}>
        <AppIcon name="view-grid-outline" size={22} color={colors.primary} />
        <View>
          <Text style={styles.brand}>PerX</Text>
          <Text style={styles.headerSub}>
            {session ? `${session.user.role} access` : "AI wallet & perks"}
          </Text>
        </View>
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
    <ScrollView contentContainerStyle={styles.loginContent} showsVerticalScrollIndicator={false}>
      <View style={styles.loginBrand}>
        <View style={styles.loginLogo}>
          <AppIcon name="wallet-plus-outline" size={28} color={colors.onPrimary} />
        </View>
        <Text style={styles.loginTitle}>Log in or sign up</Text>
        <Text style={styles.loginSubtitle}>Choose your role and continue into PerX.</Text>
      </View>

      <GlassPanel style={styles.loginCard} intensity={40}>
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

        <View style={styles.inputWrap}>
          <AppIcon name="email-outline" size={18} color={colors.soft} />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor={colors.soft}
            style={styles.inputField}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputWrap}>
          <AppIcon name="lock-outline" size={18} color={colors.soft} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={supabaseReady ? "Password" : "Password optional"}
            placeholderTextColor={colors.soft}
            style={styles.inputField}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {authMode === "signup" ? (
          <>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={selectedRole === "business" ? "Business name" : "Full name"}
              placeholderTextColor={colors.soft}
              style={styles.input}
            />
            {selectedRole !== "business" ? (
              <TextInput
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Company"
                placeholderTextColor={colors.soft}
                style={styles.input}
              />
            ) : null}
          </>
        ) : null}

        {message ? <Text style={styles.errorText}>{message}</Text> : null}

        <CapsuleButton
          label={authMode === "login" ? "Continue" : "Create account"}
          onPress={() => void (authMode === "login" ? submitLogin() : submitSignup())}
          variant="dark"
          style={styles.loginContinue}
        />

        <View style={styles.rolePills}>
          {(["employee", "employer", "business"] as Role[]).map((role) => {
            const selected = selectedRole === role;
            return (
              <Pressable
                key={role}
                onPress={() => setSelectedRole(role)}
                style={[styles.rolePill, selected && styles.rolePillActive]}
              >
                <Text style={[styles.rolePillText, selected && styles.rolePillTextActive]}>
                  {roleCopy[role].title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassPanel>

      <View style={styles.heroMetrics}>
        <MetricPill label="Data" value={supabaseReady ? "Supabase" : "Connect DB"} />
        <MetricPill label="Market" value={market.city} />
      </View>
    </ScrollView>
  );
}

function RoleRouter({
  session,
  appData,
  selectionRequests,
  onLogout,
  onApproveSelection,
  onUpdateProviderProfile,
  onAddOffer
}: {
  session: Session;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onLogout: () => void;
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
        onLogout={onLogout}
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
        onLogout={onLogout}
      />
    );
  }
  return (
    <EmployeeExperience
      user={session.user}
      appData={appData}
      onLogout={onLogout}
    />
  );
}

function EmployeeExperience({
  user,
  appData,
  onLogout
}: {
  user: User;
  appData: AppData;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<EmployeeTab>("home");
  const [celebrateKey, setCelebrateKey] = useState(0);

  const company =
    appData.companies.find((item) => item.id === user.companyId) ??
    appData.companies[0] ?? {
      id: "",
      name: "No company connected",
      employerId: "",
      monthlyBudgetPerEmployee: 0
    };
  const monthlyBudget = company.monthlyBudgetPerEmployee + (user.yearsEmployed ?? 0) * 500;
  const spent = appData.selectionRequests
    .filter((request) => request.employeeId === user.id && request.status === "approved")
    .reduce((sum, request) => sum + request.total, 0);
  const balance = Math.max(0, monthlyBudget - spent);

  return (
    <View style={styles.roleShell}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, styles.navClearance]}
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
          <EmployeeWallet
            user={user}
            companyName={company.name}
            balance={balance}
            appData={appData}
            onCelebrate={() => setCelebrateKey((key) => key + 1)}
          />
        ) : null}
        {tab === "alerts" ? <EmployeeOffers appData={appData} /> : null}
        {tab === "profile" ? <UserProfileScreen user={user} onLogout={onLogout} /> : null}
      </ScrollView>
      <BottomNav tabs={employeeTabs} active={tab} onChange={setTab} />
      {celebrateKey > 0 ? <ConfettiBurst key={celebrateKey} /> : null}
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
  appData,
  onCelebrate
}: {
  user: User;
  companyName: string;
  balance: number;
  appData: AppData;
  onCelebrate: () => void;
}) {
  const walletBenefits = appData.benefits;
  const [chosenId, setChosenId] = useState<string | null>(walletBenefits[0]?.id ?? null);
  const [accepted, setAccepted] = useState(false);
  const chosenBenefit = walletBenefits.find((benefit) => benefit.id === chosenId) ?? walletBenefits[0];

  if (!chosenBenefit) {
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

  const qrValue = `PERX:${user.id}:${chosenBenefit.id}:${Date.now().toString().slice(-6)}`;

  const simulateTap = () => {
    setAccepted(true);
    onCelebrate();
  };

  return (
    <>
      <View style={styles.walletHero}>
        <Text style={styles.greetingText}>My Wallet</Text>
        <Text style={styles.greetingSub}>Tap a card to get it ready for the reader</Text>
      </View>

      <View style={styles.cardStack}>
        {walletBenefits.map((benefit, index) => {
          const chosen = benefit.id === chosenBenefit.id;
          return (
            <Pressable
              key={benefit.id}
              onPress={() => {
                setChosenId(benefit.id);
                setAccepted(false);
              }}
              style={[styles.stackItem, !chosen && index > 0 && styles.stackItemCollapsed]}
            >
              <WalletCard
                user={user}
                companyName={companyName}
                balance={balance}
                benefit={benefit}
                variant={index}
                compact
                selected={chosen}
              />
            </Pressable>
          );
        })}
      </View>

      <GlassPanel style={styles.tapPanel}>
        <View style={[styles.tapStatusDot, accepted && styles.tapStatusDotActive]}>
          <AppIcon name={accepted ? "check-bold" : "contactless-payment"} size={26} color={colors.onPrimary} />
        </View>
        <View style={styles.tapBody}>
          <Text style={styles.cardTitle}>{accepted ? "Payment accepted" : "Ready for NFC reader"}</Text>
          <Text style={styles.bodyText}>
            {accepted
              ? `${chosenBenefit.title} tapped successfully.`
              : `Hold your phone near the reader to pay with ${chosenBenefit.title}.`}
          </Text>
        </View>
      </GlassPanel>

      <GlassPanel style={styles.qrPanel}>
        <View style={styles.qrBox}>
          <QRCode value={qrValue} size={150} color={colors.text} backgroundColor={colors.surface} />
        </View>
        <View style={styles.qrText}>
          <Text style={styles.cardTitle}>Scan or tap</Text>
          <Text style={styles.bodyText}>Let the venue scan this code, or test the contactless reader below.</Text>
          <CapsuleButton
            label="Simulate NFC tap"
            onPress={simulateTap}
            icon={<AppIcon name="nfc" size={16} color={colors.onPrimary} />}
          />
        </View>
      </GlassPanel>
    </>
  );
}

function EmployeeOffers({ appData }: { appData: AppData }) {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeProviderNames, setActiveProviderNames] = useState<string[]>([]);
  const marketplaceBenefits = appData.benefits;
  const marketplaceProviders = appData.providerProfiles;
  const visibleBenefits = activeProviderNames.length
    ? marketplaceBenefits.filter((benefit) => activeProviderNames.includes(benefit.providerName))
    : marketplaceBenefits;

  const toggleSaved = (benefitId: string) => {
    setSavedIds((current) =>
      current.includes(benefitId)
        ? current.filter((id) => id !== benefitId)
        : [...current, benefitId]
    );
  };

  const toggleProvider = (providerName: string) => {
    setActiveProviderNames((current) =>
      current.includes(providerName)
        ? current.filter((name) => name !== providerName)
        : [...current, providerName]
    );
  };

  return (
    <>
      <View style={styles.walletHero}>
        <Text style={styles.greetingText}>Marketplace</Text>
        <Text style={styles.greetingSub}>Browse partner perks in {market.city}</Text>
      </View>

      <Section title="Providers" meta={market.city}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {marketplaceProviders.map((provider) => {
            const selected = activeProviderNames.includes(provider.businessName);
            return (
              <Pressable key={provider.id} onPress={() => toggleProvider(provider.businessName)}>
                <GlassPanel style={[styles.providerCard, selected && styles.selectedOfferCard]} intensity={12}>
                  <Image source={{ uri: provider.logoUrl }} style={styles.providerLogo} />
                  <Text style={styles.listTitle}>{provider.businessName}</Text>
                  <Text style={styles.listSub}>{provider.category} - {provider.city}</Text>
                  <Text style={styles.selectedBadgeText}>{selected ? "Filtering" : "Tap to filter"}</Text>
                </GlassPanel>
              </Pressable>
            );
          })}
        </ScrollView>

        {visibleBenefits.map((benefit) => {
          const saved = savedIds.includes(benefit.id);
          return (
            <Pressable key={benefit.id} onPress={() => toggleSaved(benefit.id)}>
              <GlassPanel
                style={[styles.offerCard, saved && styles.selectedOfferCard]}
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
                      {saved ? "Saved" : `${benefit.pointsPrice} pts`}
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
    </>
  );
}

function EmployerExperience({
  user,
  appData,
  selectionRequests,
  onApproveSelection,
  onLogout
}: {
  user: User;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onApproveSelection: (requestId: string) => void;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<EmployerTab>("home");
  const company =
    appData.companies.find((item) => item.employerId === user.id) ??
    appData.companies.find((item) => item.id === user.companyId) ?? {
      id: "",
      name: "No company connected",
      employerId: user.id,
      monthlyBudgetPerEmployee: 0
    };
  const employees = useMemo(
    () => appData.users.filter((item) => item.role === "employee" && item.companyId === company.id),
    [appData.users, company.id]
  );
  const [budgets, setBudgets] = useState<Record<string, number>>({});

  useEffect(() => {
    setBudgets((current) => {
      const next: Record<string, number> = {};
      for (const employee of employees) {
        next[employee.id] =
          current[employee.id] ??
          company.monthlyBudgetPerEmployee + (employee.yearsEmployed ?? 0) * 500;
      }
      return next;
    });
  }, [employees, company.monthlyBudgetPerEmployee]);

  const pendingCount = selectionRequests.filter((request) => request.status === "pending").length;
  const employerPoints = appData.employerWalletCards.reduce((sum, card) => sum + card.points, 0);
  const spendablePoints = appData.employerWalletCards[0]?.points ?? 999999;
  const [approvalNotice, setApprovalNotice] = useState("");

  return (
    <View style={styles.roleShell}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, styles.navClearance]}
        showsVerticalScrollIndicator={false}
      >
      {tab === "home" ? (
      <>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.greetingText}>Management</Text>
          <Text style={styles.greetingSub}>Monitor approvals, points, and employee access.</Text>
        </View>
        <View style={styles.searchPill}>
          <AppIcon name="magnify" size={18} color={colors.soft} />
        </View>
      </View>

      <View style={styles.bentoRow}>
        <BentoMetricCard
          title="System"
          value={`${employees.length}`}
          trend="Active"
          accent={colors.secondary}
          Icon={Shield}
        />
        <BentoMetricCard
          title="Pending"
          value={`${pendingCount}`}
          trend="+queue"
          accent={colors.primary}
          Icon={Users}
        />
      </View>

      <View style={styles.adminActionCard}>
        <View style={styles.adminActionIcon}>
          <UserPlus size={20} color={colors.onPrimary} />
        </View>
        <View style={styles.listText}>
          <Text style={styles.adminActionTitle}>Invite employee</Text>
          <Text style={styles.adminActionSub}>Provision new team access keys.</Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <MetricPill label="Employees" value={`${employees.length}`} />
        <MetricPill label="Points" value={`${employerPoints.toLocaleString(market.locale)}`} />
        <MetricPill label="Pending" value={`${pendingCount}`} />
      </View>

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
      </>
      ) : null}

      {tab === "approvals" ? (
      <>
      {approvalNotice ? <Text style={styles.errorText}>{approvalNotice}</Text> : null}

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
                    icon={<Check size={16} color={colors.onPrimary} />}
                  />
                ) : null}
              </View>
            </GlassPanel>
          );
        })}
      </Section>
      </>
      ) : null}

      {tab === "team" ? (
      <>
      <Section title="Recent records" meta={`${employees.length} team`}>
        {employees.map((employee) => (
          <GlassPanel key={employee.id} style={styles.recordRow} intensity={32}>
            <View style={styles.recordAvatar}>
              <AppIcon name="account-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>{employee.name}</Text>
              <Text style={styles.listSub}>
                Employee · {employee.yearsEmployed ?? 0} yrs · {currency(budgets[employee.id] ?? 0)}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Active</Text>
            </View>
          </GlassPanel>
        ))}
      </Section>

      <Section title="Employee budgets" meta="Adjust">
        {employees.map((employee) => (
          <GlassPanel key={`budget-${employee.id}`} style={styles.employeeBudgetCard} intensity={14}>
            <View style={styles.employeeBudgetHeader}>
              <View>
                <Text style={styles.listTitle}>{employee.name}</Text>
                <Text style={styles.listSub}>{employee.yearsEmployed} years employed</Text>
              </View>
              <Text style={styles.confidence}>{currency(budgets[employee.id] ?? 0)}</Text>
            </View>
            <AllocationSlider
              category="Health"
              value={budgets[employee.id] ?? 0}
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
      </>
      ) : null}

      {tab === "profile" ? <UserProfileScreen user={user} onLogout={onLogout} /> : null}
      </ScrollView>
      <BottomNav tabs={employerTabs} active={tab} onChange={setTab} />
    </View>
  );
}

function BusinessExperience({
  user,
  appData,
  selectionRequests,
  onUpdateProviderProfile,
  onAddOffer,
  onLogout
}: {
  user: User;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onUpdateProviderProfile: (profile: ProviderProfile) => void;
  onAddOffer: (offer: Benefit) => void;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<BusinessTab>("home");
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
    <View style={styles.roleShell}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, styles.navClearance]}
        showsVerticalScrollIndicator={false}
      >
      {tab === "home" ? (
      <>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.greetingText}>Insights</Text>
          <Text style={styles.greetingSub}>
            Your provider ecosystem at a glance. {profileDraft.businessName}
          </Text>
        </View>
        <View style={styles.searchPill}>
          <AppIcon name="magnify" size={18} color={colors.soft} />
        </View>
      </View>

      <View style={styles.bentoRow}>
        <BentoMetricCard
          title="Payouts"
          value={currency(approvedPayoutTotal)}
          trend="+live"
          accent={colors.primary}
          Icon={CircleDollarSign}
        />
        <BentoMetricCard
          title="Reached"
          value={`${reachedEmployees}`}
          trend="+team"
          accent={colors.tertiary}
          Icon={Users}
        />
      </View>

      <View style={styles.bentoRow}>
        <BentoMetricCard
          title="Offers"
          value={`${offers.length}`}
          trend="+catalog"
          accent={colors.secondary}
          Icon={Store}
        />
        <BentoMetricCard
          title="Growth"
          value={`${approvedRoutedPayments.length}`}
          trend="+12%"
          accent={colors.primary}
          Icon={TrendingUp}
        />
      </View>

      <GlassPanel style={styles.activityPanel} intensity={36}>
        <View style={styles.activityHeader}>
          <View>
            <Text style={styles.cardTitle}>Activity heatmap</Text>
            <Text style={styles.bodyText}>Live optimization across routed redemptions.</Text>
          </View>
          <CapsuleButton label="Export" onPress={() => undefined} />
        </View>
        <View style={styles.activityBody}>
          <Activity size={28} color={colors.primary} />
          <Text style={styles.activityValue}>Live Optimization</Text>
        </View>
      </GlassPanel>

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
      </>
      ) : null}

      {tab === "offers" ? (
      <>
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
          <CapsuleButton label="Publish offer" onPress={() => void addOffer()} icon={<Plus size={16} color={colors.onPrimary} />} />
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
      </>
      ) : null}

      {tab === "payments" ? (
      <>
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
      </>
      ) : null}

      {tab === "profile" ? <UserProfileScreen user={user} onLogout={onLogout} /> : null}
      </ScrollView>
      <BottomNav tabs={businessTabs} active={tab} onChange={setTab} />
    </View>
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
    backgroundColor: "transparent"
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
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
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle,
    backgroundColor: colors.panel
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: colors.stroke,
    backgroundColor: colors.surfaceContainerHigh
  },
  avatarButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900"
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
  navClearance: {
    paddingBottom: 120
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
  input: {
    minHeight: 48,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: "rgba(0,0,0,0.03)",
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
  confidence: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  listRow: {
    minHeight: 66,
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle,
    backgroundColor: colors.panel,
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
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle
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
    borderColor: colors.primary,
    backgroundColor: "rgba(0,88,188,0.08)"
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
    backgroundColor: colors.surfaceContainerHigh
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
    color: colors.error,
    fontSize: 13,
    fontWeight: "700"
  },
  segmented: {
    height: 48,
    borderRadius: radius.capsule,
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle,
    backgroundColor: "rgba(0,0,0,0.03)",
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
    backgroundColor: colors.primary
  },
  segmentText: {
    color: colors.muted,
    fontWeight: "800"
  },
  segmentTextActive: {
    color: colors.onPrimary
  },
  loginContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 18,
    paddingTop: 8
  },
  loginBrand: {
    alignItems: "center",
    gap: 8
  },
  loginLogo: {
    width: 64,
    height: 64,
    borderRadius: radius.capsule,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center"
  },
  loginTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900"
  },
  loginSubtitle: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center"
  },
  loginCard: {
    padding: 24,
    gap: 14
  },
  loginContinue: {
    marginTop: 4
  },
  inputWrap: {
    minHeight: 56,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(0,0,0,0.03)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10
  },
  inputField: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 12
  },
  rolePills: {
    gap: 10,
    marginTop: 4
  },
  rolePill: {
    minHeight: 48,
    borderRadius: radius.capsule,
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle,
    backgroundColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center"
  },
  rolePillActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(0,88,188,0.08)"
  },
  rolePillText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  rolePillTextActive: {
    color: colors.primary
  },
  adminHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  adminHeaderCopy: {
    flex: 1
  },
  searchPill: {
    width: 44,
    height: 44,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center"
  },
  bentoRow: {
    flexDirection: "row",
    gap: 10
  },
  adminActionCard: {
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.primary,
    borderRadius: radius.cardLg,
    ...shadow
  },
  adminActionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center"
  },
  adminActionTitle: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: "900"
  },
  adminActionSub: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    marginTop: 2
  },
  recordRow: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  recordAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.capsule,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center"
  },
  recordAvatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900"
  },
  statusBadge: {
    borderRadius: radius.capsule,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(111,251,133,0.25)",
    borderWidth: 0.5,
    borderColor: "rgba(111,251,133,0.4)"
  },
  statusBadgeText: {
    color: colors.onSecondaryContainer,
    fontSize: 11,
    fontWeight: "800"
  },
  activityPanel: {
    padding: 18,
    gap: 16
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  activityBody: {
    minHeight: 140,
    borderRadius: radius.compact,
    borderWidth: 0.5,
    borderColor: colors.stroke,
    backgroundColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  activityValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "800"
  },
  walletHero: {
    marginTop: 2,
    marginBottom: 4
  },
  cardStack: {
    gap: 0
  },
  stackItem: {
    marginBottom: 14
  },
  stackItemCollapsed: {
    marginTop: -126
  },
  tapPanel: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  tapStatusDot: {
    width: 52,
    height: 52,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  tapStatusDotActive: {
    backgroundColor: colors.secondary
  },
  tapBody: {
    flex: 1,
    gap: 4
  }
});

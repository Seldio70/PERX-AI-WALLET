import { StatusBar } from "expo-status-bar";
import {
  Activity,
  BadgeCheck,
  Building2,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  CircleDollarSign,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Home,
  LayoutGrid,
  LineChart,
  MapPin,
  Pencil,
  Plane,
  Plus,
  QrCode,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Trash2,
  TrendingUp,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
  Wallet,
  WalletCards,
  X
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import QRCode from "react-native-qrcode-svg";
import { AllocationSlider } from "./src/components/AllocationSlider";
import { AppIcon } from "./src/components/AppIcon";
import { BentoMetricCard } from "./src/components/BentoMetricCard";
import { BottomNav, EmployeeTab } from "./src/components/BottomNav";
import { CapsuleButton } from "./src/components/CapsuleButton";
import { GlassPanel } from "./src/components/GlassPanel";
import { MeshBackground } from "./src/components/MeshBackground";
import { MetricPill } from "./src/components/MetricPill";
import { UserProfileScreen } from "./src/components/UserProfileScreen";
import { WalletCard } from "./src/components/WalletCard";
import { currency, market } from "./src/lib/format";
import { getSupabaseClient } from "./src/lib/supabase";
import {
  createProviderOffer,
  createPlatformUser,
  createSelectionRequest,
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

const allocationCategories: BenefitCategory[] = ["Food", "Fitness", "Family", "Learning"];

const emptyAllocation: Record<BenefitCategory, number> = {
  Food: 0,
  Fitness: 0,
  Family: 0,
  Learning: 0,
  Health: 0,
  Mobility: 0,
  Wellness: 0
};

function createSessionToken(role: Role) {
  return `perx.session.${role}.${Date.now()}`;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [showProfile, setShowProfile] = useState(false);
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
            onLogout={() => {
              setShowProfile(false);
              setSession(null);
            }}
            onProfilePress={session ? () => setShowProfile(true) : undefined}
          />
          {session ? (
            <RoleRouter
              session={session}
              appData={appData}
              selectionRequests={selectionRequests}
              onOpenProfile={() => setShowProfile(true)}
              onSubmitSelection={(request) => {
                setSelectionRequests((current) => [request, ...current]);
                setWalletCardItems((current) =>
                  current.map((card, index) =>
                    index === 0 ? { ...card, points: Math.max(0, card.points - request.totalPoints) } : card
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
          {session && showProfile ? (
            <UserProfileScreen
              user={session.user}
              onClose={() => setShowProfile(false)}
              onLogout={() => {
                setShowProfile(false);
                setSession(null);
              }}
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function AppHeader({
  session,
  supabaseReady,
  onLogout,
  onProfilePress
}: {
  session: Session | null;
  supabaseReady: boolean;
  onLogout: () => void;
  onProfilePress?: () => void;
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
          <>
            <Pressable onPress={onProfilePress} style={styles.avatarButton}>
              <AppIcon name="account-circle" size={24} color={colors.primary} />
            </Pressable>
            <Pressable onPress={onLogout} style={styles.iconButton}>
              <Text style={styles.logoutText}>Out</Text>
            </Pressable>
          </>
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
  onOpenProfile,
  onSubmitSelection,
  onUpdateProviderProfile,
  onAddOffer
}: {
  session: Session;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onOpenProfile: () => void;
  onSubmitSelection: (request: SelectionRequest) => void;
  onUpdateProviderProfile: (profile: ProviderProfile) => void;
  onAddOffer: (offer: Benefit) => void;
}) {
  if (session.user.role === "employer") {
    return (
      <EmployerExperience
        user={session.user}
        appData={appData}
        selectionRequests={selectionRequests}
        onOpenProfile={onOpenProfile}
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
        onOpenProfile={onOpenProfile}
      />
    );
  }
  return (
    <EmployeeExperience
      user={session.user}
      appData={appData}
      onSubmitSelection={onSubmitSelection}
      onOpenProfile={onOpenProfile}
    />
  );
}

function EmployeeExperience({
  user,
  appData,
  onSubmitSelection,
  onOpenProfile
}: {
  user: User;
  appData: AppData;
  onSubmitSelection: (request: SelectionRequest) => void;
  onOpenProfile: () => void;
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
  const spent = appData.selectionRequests
    .filter((request) => request.employeeId === user.id)
    .reduce((sum, request) => sum + request.total, 0);
  const balance = Math.max(0, monthlyBudget - spent);

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
        {tab === "allocate" ? <BudgetAllocation monthlyBudget={monthlyBudget} /> : null}
        {tab === "alerts" ? <EmployeeOffers user={user} appData={appData} onSubmitSelection={onSubmitSelection} /> : null}
      </ScrollView>
      <BottomNav active={tab} onChange={setTab} onProfilePress={onOpenProfile} />
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
  const [expandedCardId, setExpandedCardId] = useState<string | null>(appData.benefits[0]?.id ?? null);
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
      <View style={styles.walletHero}>
        <Text style={styles.greetingText}>My Cards</Text>
        <Text style={styles.greetingSub}>Manage your digital perks and passes</Text>
      </View>

      <View style={styles.cardStack}>
        {walletBenefits.map((benefit, index) => {
          const expanded = expandedCardId === benefit.id;
          return (
            <Pressable
              key={benefit.id}
              onPress={() => {
                setActiveBenefit(benefit);
                setExpandedCardId(expanded ? null : benefit.id);
              }}
              style={[styles.stackItem, !expanded && index > 0 && styles.stackItemCollapsed]}
            >
              <WalletCard
                user={user}
                companyName={companyName}
                balance={balance}
                benefit={benefit}
                variant={index}
                compact
              />
            </Pressable>
          );
        })}
      </View>

      <GlassPanel style={styles.qrPanel}>
        <View style={styles.qrBox}>
          <QRCode value={qrValue} size={158} color={colors.text} backgroundColor={colors.surface} />
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

function BudgetAllocation({ monthlyBudget }: { monthlyBudget: number }) {
  const [values, setValues] = useState<Record<BenefitCategory, number>>(emptyAllocation);
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
            label={submitted ? "Redeemed" : "Redeem now"}
            onPress={submitSelection}
            variant={submitted ? "soft" : "primary"}
          />
        </View>
      </GlassPanel>

      <Section title="Selected package" meta={`${selectedBenefits.length} perks`}>
        <GlassPanel style={styles.packageSummaryPanel} intensity={12}>
          <View style={styles.packageSummaryHeader}>
            <View style={styles.listText}>
              <Text style={styles.cardTitle}>Ready to redeem</Text>
              <Text style={styles.bodyText}>
                Grouped by provider so payment routes correctly the moment you redeem.
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

      <Section title="How redemption works" meta="Live flow">
        <View style={styles.listRow}>
          <View style={styles.smallIcon}>
            <UsersRound size={18} color={colors.text} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>Instant routing to each provider</Text>
            <Text style={styles.listSub}>
              Tap redeem and the simulated payment is split across providers from your monthly budget. No employer approval step.
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
  onOpenProfile
}: {
  user: User;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onOpenProfile: () => void;
}) {
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

  const employerPoints = appData.employerWalletCards.reduce((sum, card) => sum + card.points, 0);
  const redemptionsCount = selectionRequests.length;

  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.greetingText}>Management</Text>
          <Text style={styles.greetingSub}>Fund points, watch redemptions, manage employee access.</Text>
        </View>
        <Pressable onPress={onOpenProfile} style={styles.searchPill}>
          <AppIcon name="magnify" size={18} color={colors.soft} />
        </Pressable>
      </View>

      <View style={styles.bentoRow}>
        <BentoMetricCard
          title="Employees"
          value={`${employees.length}`}
          trend="Active"
          accent={colors.secondary}
          Icon={Shield}
        />
        <BentoMetricCard
          title="Redemptions"
          value={`${redemptionsCount}`}
          trend="+live"
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
        <MetricPill label="Redemptions" value={`${redemptionsCount}`} />
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

      <Section title="Recent redemptions" meta="Live">
        {selectionRequests.length ? selectionRequests.map((request) => {
          const requestBenefits = request.benefitIds
            .map((benefitId) => appData.benefits.find((benefit) => benefit.id === benefitId))
            .filter(Boolean) as Benefit[];
          const providers = Array.from(new Set(requestBenefits.map((benefit) => benefit.providerName)));
          const pointsCharged =
            request.totalPoints || requestBenefits.reduce((sum, benefit) => sum + benefit.pointsPrice, 0);

          return (
            <GlassPanel key={request.id} style={styles.approvalCard} intensity={14}>
              <View style={styles.employeeBudgetHeader}>
                <View style={styles.listText}>
                  <Text style={styles.cardTitle}>{request.employeeName}</Text>
                  <Text style={styles.bodyText}>
                    {requestBenefits.map((benefit) => benefit.title).join(", ")}
                  </Text>
                  <Text style={styles.listSub}>
                    Routed to {providers.join(", ")}
                  </Text>
                </View>
                <Text style={styles.confidence}>{currency(request.total)}</Text>
              </View>
              <Text style={styles.listSub}>
                Points charged: {pointsCharged.toLocaleString(market.locale)}
              </Text>
              <View style={styles.packageFooter}>
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>Settled</Text>
                </View>
              </View>
            </GlassPanel>
          );
        }) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <CircleDollarSign size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No redemptions yet</Text>
              <Text style={styles.listSub}>Employee redemptions will land here automatically.</Text>
            </View>
          </View>
        )}
      </Section>

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
          <AnalyticsRow label="Redemptions" value={`${redemptionsCount}`} />
        </GlassPanel>
      </Section>

      <Section title="More controls" meta="Added">
        {[
          ["Policy templates", "Create department-specific allowance rules."],
          ["Budget forecasting", "Preview cost changes before bulk updates."],
          ["Engagement nudges", "Auto-remind employees with unused budget."]
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

const businessCategoryIcons: Record<BenefitCategory, typeof Store> = {
  Food: ShoppingBag,
  Fitness: Dumbbell,
  Health: HeartPulse,
  Learning: GraduationCap,
  Mobility: Plane,
  Wellness: Sparkles,
  Family: UsersRound
};

const businessCategoryAvatar: Record<BenefitCategory, { background: string; color: string }> = {
  Food: { background: "rgba(76,74,202,0.14)", color: colors.tertiary },
  Fitness: { background: "rgba(0,110,40,0.14)", color: colors.secondary },
  Health: { background: "rgba(0,88,188,0.14)", color: colors.primary },
  Learning: { background: "rgba(0,88,188,0.14)", color: colors.primary },
  Mobility: { background: "rgba(76,74,202,0.14)", color: colors.tertiary },
  Wellness: { background: "rgba(0,110,40,0.14)", color: colors.secondary },
  Family: { background: "rgba(0,88,188,0.14)", color: colors.primary }
};

async function pickImageFromDevice(): Promise<string | null> {
  try {
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Allow photo access to upload images.");
        return null;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85
    });
    if (result.canceled || !result.assets?.[0]) return null;
    return result.assets[0].uri;
  } catch (error) {
    Alert.alert("Image picker", "Could not open the picker. Make sure expo-image-picker is installed.");
    return null;
  }
}

type BusinessTab = "home" | "offers" | "profile" | "account";

function BusinessBottomNav({
  active,
  onChange,
  onAddOffer
}: {
  active: BusinessTab;
  onChange: (tab: BusinessTab) => void;
  onAddOffer: () => void;
}) {
  const items: Array<{ key: BusinessTab; Icon: typeof Home; label: string }> = [
    { key: "home", Icon: Home, label: "Home" },
    { key: "offers", Icon: LayoutGrid, label: "Offers" },
    { key: "profile", Icon: Store, label: "Profile" },
    { key: "account", Icon: Settings, label: "Account" }
  ];
  return (
    <View style={styles.businessNav} pointerEvents="box-none">
      <View style={styles.businessNavPill}>
        {items.map(({ key, Icon, label }) => {
          const isActive = active === key;
          return (
            <Pressable
              key={key}
              onPress={() => onChange(key)}
              style={[styles.businessNavItem, isActive && styles.businessNavItemActive]}
            >
              <Icon size={20} color={isActive ? colors.onPrimary : colors.muted} />
              <Text style={[styles.businessNavLabel, isActive && styles.businessNavLabelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable onPress={onAddOffer} style={styles.businessNavFab}>
          <Plus size={20} color={colors.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

function CategoryGrid({
  options,
  value,
  onChange
}: {
  options: readonly BenefitCategory[];
  value: BenefitCategory;
  onChange: (next: BenefitCategory) => void;
}) {
  return (
    <View style={styles.categoryGrid}>
      {options.map((category) => {
        const selected = value === category;
        const Icon = businessCategoryIcons[category] ?? Store;
        const tint = businessCategoryAvatar[category] ?? { background: "rgba(0,88,188,0.14)", color: colors.primary };
        return (
          <Pressable
            key={category}
            onPress={() => onChange(category)}
            style={[
              styles.categoryTile,
              selected && styles.categoryTileActive,
              selected && { borderColor: tint.color, backgroundColor: tint.background }
            ]}
          >
            <Icon size={18} color={selected ? tint.color : colors.muted} />
            <Text
              style={[
                styles.categoryTileText,
                selected && { color: tint.color, fontWeight: "900" }
              ]}
            >
              {category}
            </Text>
            {selected ? (
              <View style={[styles.categoryTileCheck, { backgroundColor: tint.color }]}>
                <Check size={11} color={colors.onPrimary} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

type OfferFormDraft = OfferDraft & { category: BenefitCategory };

function OfferFormModal({
  visible,
  initial,
  defaultCategory,
  defaultCity,
  mode,
  onClose,
  onSubmit,
  onDelete
}: {
  visible: boolean;
  initial?: Benefit;
  defaultCategory: BenefitCategory;
  defaultCity: string;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: (draft: OfferFormDraft) => Promise<void> | void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<OfferFormDraft>(() => ({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    discount: initial?.discount ?? "",
    price: initial ? String(initial.price) : "",
    pointsPrice: initial ? String(initial.pointsPrice) : "",
    imageUrl: initial?.imageUrl ?? "",
    redemptionType: initial?.redemptionType ?? "QR",
    validUntil: initial?.validUntil ?? "2026-12-31",
    category: initial?.category ?? defaultCategory
  }));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDraft({
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      discount: initial?.discount ?? "",
      price: initial ? String(initial.price) : "",
      pointsPrice: initial ? String(initial.pointsPrice) : "",
      imageUrl: initial?.imageUrl ?? "",
      redemptionType: initial?.redemptionType ?? "QR",
      validUntil: initial?.validUntil ?? "2026-12-31",
      category: initial?.category ?? defaultCategory
    });
  }, [visible, initial, defaultCategory]);

  const handlePickImage = async () => {
    const uri = await pickImageFromDevice();
    if (uri) setDraft((current) => ({ ...current, imageUrl: uri }));
  };

  const handleSubmit = async () => {
    if (!draft.title.trim()) {
      Alert.alert("Missing title", "Give the offer a name before publishing.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(draft);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{mode === "edit" ? "Edit offer" : "New offer"}</Text>
              <Text style={styles.modalSub}>
                {mode === "edit" ? "Update the details and republish." : "Fill in the basics, add a photo, and publish."}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Pressable onPress={handlePickImage} style={styles.imagePicker}>
              {draft.imageUrl ? (
                <Image source={{ uri: draft.imageUrl }} style={styles.imagePickerPreview} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Camera size={26} color={colors.muted} />
                  <Text style={styles.imagePickerLabel}>Tap to upload from your device</Text>
                  <Text style={styles.imagePickerHint}>JPG or PNG, 4:3 looks best</Text>
                </View>
              )}
              {draft.imageUrl ? (
                <View style={styles.imagePickerOverlay}>
                  <Camera size={16} color={colors.onPrimary} />
                  <Text style={styles.imagePickerOverlayText}>Replace</Text>
                </View>
              ) : null}
            </Pressable>

            <Text style={styles.modalFieldLabel}>Title</Text>
            <TextInput
              value={draft.title}
              onChangeText={(title) => setDraft((c) => ({ ...c, title }))}
              placeholder="e.g. Monthly gym membership"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <Text style={styles.modalFieldLabel}>Discount</Text>
            <TextInput
              value={draft.discount}
              onChangeText={(discount) => setDraft((c) => ({ ...c, discount }))}
              placeholder="e.g. 20% off, 1 month free"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <View style={styles.modalRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalFieldLabel}>Price ({market.currency})</Text>
                <TextInput
                  value={draft.price}
                  onChangeText={(price) => setDraft((c) => ({ ...c, price }))}
                  placeholder="1200"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalFieldLabel}>Employer points</Text>
                <TextInput
                  value={draft.pointsPrice}
                  onChangeText={(pointsPrice) => setDraft((c) => ({ ...c, pointsPrice }))}
                  placeholder="140"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.modalFieldLabel}>Category</Text>
            <CategoryGrid
              options={benefitCategoryOptions}
              value={draft.category}
              onChange={(category) => setDraft((c) => ({ ...c, category }))}
            />

            <Text style={styles.modalFieldLabel}>Description</Text>
            <TextInput
              value={draft.description}
              onChangeText={(description) => setDraft((c) => ({ ...c, description }))}
              placeholder="What does this perk include?"
              placeholderTextColor={colors.muted}
              style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
              multiline
            />

            <Text style={styles.modalFieldLabel}>Redemption</Text>
            <View style={styles.segmented}>
              {(["QR", "NFC"] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setDraft((c) => ({ ...c, redemptionType: type }))}
                  style={[styles.segment, draft.redemptionType === type && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, draft.redemptionType === type && styles.segmentTextActive]}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalFieldLabel}>Valid until</Text>
            <TextInput
              value={draft.validUntil}
              onChangeText={(validUntil) => setDraft((c) => ({ ...c, validUntil }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <View style={{ height: 8 }} />
            <CapsuleButton
              label={submitting ? "Publishing..." : mode === "edit" ? "Save changes" : "Publish offer"}
              onPress={() => void handleSubmit()}
              icon={<Plus size={16} color={colors.onPrimary} />}
            />
            {mode === "edit" && onDelete ? (
              <Pressable onPress={onDelete} style={styles.dangerButton}>
                <Trash2 size={16} color={colors.error} />
                <Text style={styles.dangerButtonText}>Archive offer</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function OfferDetailModal({
  visible,
  offer,
  stats,
  onClose,
  onEdit,
  onArchive
}: {
  visible: boolean;
  offer: Benefit | null;
  stats: { redemptions: number; revenue: number };
  onClose: () => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  if (!offer) return null;
  const Icon = businessCategoryIcons[offer.category] ?? Store;
  const tint = businessCategoryAvatar[offer.category] ?? { background: "rgba(0,88,188,0.14)", color: colors.primary };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{offer.title}</Text>
              <Text style={styles.modalSub}>{offer.providerName} · {offer.category}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Image source={{ uri: offer.imageUrl }} style={styles.detailHeroImage} />

            <View style={styles.detailMetaRow}>
              <View style={[styles.detailCategoryBadge, { backgroundColor: tint.background }]}>
                <Icon size={16} color={tint.color} />
                <Text style={[styles.detailCategoryText, { color: tint.color }]}>{offer.category}</Text>
              </View>
              <View style={styles.detailMetaPill}>
                <Tag size={14} color={colors.muted} />
                <Text style={styles.detailMetaText}>{offer.discount}</Text>
              </View>
              <View style={styles.detailMetaPill}>
                <Calendar size={14} color={colors.muted} />
                <Text style={styles.detailMetaText}>{offer.validUntil}</Text>
              </View>
              <View style={styles.detailMetaPill}>
                <MapPin size={14} color={colors.muted} />
                <Text style={styles.detailMetaText}>{offer.city}</Text>
              </View>
            </View>

            <View style={styles.detailStatsRow}>
              <GlassPanel style={styles.detailStatCard} intensity={28}>
                <Text style={styles.detailStatLabel}>Price</Text>
                <Text style={styles.detailStatValue}>{currency(offer.price)}</Text>
              </GlassPanel>
              <GlassPanel style={styles.detailStatCard} intensity={28}>
                <Text style={styles.detailStatLabel}>Employer pts</Text>
                <Text style={styles.detailStatValue}>{offer.pointsPrice.toLocaleString(market.locale)}</Text>
              </GlassPanel>
              <GlassPanel style={styles.detailStatCard} intensity={28}>
                <Text style={styles.detailStatLabel}>Redemptions</Text>
                <Text style={styles.detailStatValue}>{stats.redemptions}</Text>
              </GlassPanel>
            </View>

            <Text style={styles.modalFieldLabel}>Description</Text>
            <Text style={styles.detailBody}>{offer.description}</Text>

            <View style={styles.detailKeyValueRow}>
              <Text style={styles.detailKeyLabel}>Redemption method</Text>
              <Text style={styles.detailKeyValue}>{offer.redemptionType}</Text>
            </View>
            <View style={styles.detailKeyValueRow}>
              <Text style={styles.detailKeyLabel}>Total revenue</Text>
              <Text style={styles.detailKeyValue}>{currency(stats.revenue)}</Text>
            </View>
            <View style={styles.detailKeyValueRow}>
              <Text style={styles.detailKeyLabel}>Offer ID</Text>
              <Text style={styles.detailKeyValueMono}>{offer.id.slice(0, 14)}…</Text>
            </View>

            <View style={{ height: 16 }} />
            <CapsuleButton
              label="Edit offer"
              onPress={onEdit}
              icon={<Pencil size={16} color={colors.onPrimary} />}
            />
            <Pressable onPress={onArchive} style={styles.dangerButton}>
              <Trash2 size={16} color={colors.error} />
              <Text style={styles.dangerButtonText}>Archive offer</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function TransactionDetailModal({
  visible,
  data,
  onClose
}: {
  visible: boolean;
  data: { request: SelectionRequest; benefit: Benefit } | null;
  onClose: () => void;
}) {
  if (!data) return null;
  const { request, benefit } = data;
  const Icon = businessCategoryIcons[benefit.category] ?? Store;
  const tint = businessCategoryAvatar[benefit.category] ?? { background: "rgba(0,88,188,0.14)", color: colors.primary };
  const created = new Date(request.createdAt);
  const formattedDate = created.toLocaleString(market.locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Transaction</Text>
              <Text style={styles.modalSub}>{formattedDate}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.txDetailHero}>
              <View style={[styles.txDetailIcon, { backgroundColor: tint.background }]}>
                <Icon size={26} color={tint.color} />
              </View>
              <Text style={styles.txDetailAmount}>+{currency(benefit.price)}</Text>
              <View style={styles.txDetailBadge}>
                <BadgeCheck size={14} color={colors.secondary} />
                <Text style={styles.txDetailBadgeText}>Settled</Text>
              </View>
            </View>

            <GlassPanel style={styles.txDetailCard} intensity={32}>
              <View style={styles.detailKeyValueRow}>
                <Text style={styles.detailKeyLabel}>Customer</Text>
                <Text style={styles.detailKeyValue}>{request.employeeName}</Text>
              </View>
              <View style={styles.detailKeyValueRow}>
                <Text style={styles.detailKeyLabel}>Offer</Text>
                <Text style={styles.detailKeyValue}>{benefit.title}</Text>
              </View>
              <View style={styles.detailKeyValueRow}>
                <Text style={styles.detailKeyLabel}>Category</Text>
                <Text style={styles.detailKeyValue}>{benefit.category}</Text>
              </View>
              <View style={styles.detailKeyValueRow}>
                <Text style={styles.detailKeyLabel}>Points charged</Text>
                <Text style={styles.detailKeyValue}>
                  {benefit.pointsPrice.toLocaleString(market.locale)}
                </Text>
              </View>
              <View style={styles.detailKeyValueRow}>
                <Text style={styles.detailKeyLabel}>Routed to</Text>
                <Text style={styles.detailKeyValue}>{benefit.providerName}</Text>
              </View>
              <View style={styles.detailKeyValueRow}>
                <Text style={styles.detailKeyLabel}>Transaction ID</Text>
                <Text style={styles.detailKeyValueMono}>{request.id.slice(0, 18)}…</Text>
              </View>
            </GlassPanel>

            <View style={{ height: 16 }} />
            <CapsuleButton label="Download receipt" onPress={() => Alert.alert("Receipt", "Receipt export is coming soon.")} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PulseDot({ delay = 0 }: { delay?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    opacity.setValue(0.3);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: false })
      ]),
      { resetBeforeIteration: true }
    );
    animation.start();
    return () => {
      animation.stop();
      opacity.setValue(0.3);
    };
  }, [delay, opacity]);

  return <Animated.View style={[styles.activityPulseDot, { opacity }]} />;
}

function BusinessExperience({
  user,
  appData,
  selectionRequests,
  onUpdateProviderProfile,
  onAddOffer,
  onOpenProfile
}: {
  user: User;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onUpdateProviderProfile: (profile: ProviderProfile) => void;
  onAddOffer: (offer: Benefit) => void;
  onOpenProfile: () => void;
}) {
  const existingProfile =
    appData.providerProfiles.find((profile) => profile.userId === user.id) ??
    appData.providerProfiles.find((profile) => profile.businessName === user.name);

  const [tab, setTab] = useState<BusinessTab>("home");
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Benefit | null>(null);
  const [detailOffer, setDetailOffer] = useState<Benefit | null>(null);
  const [detailTransaction, setDetailTransaction] = useState<{ request: SelectionRequest; benefit: Benefit } | null>(null);

  const [profileDraft, setProfileDraft] = useState({
    businessName: existingProfile?.businessName ?? user.name,
    description: existingProfile?.description ?? "Local partner offering employee perks.",
    category: (existingProfile?.category ?? "Wellness") as BenefitCategory,
    logoUrl:
      existingProfile?.logoUrl ??
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=300&q=80",
    city: existingProfile?.city ?? market.city
  });

  useEffect(() => {
    if (!existingProfile) return;
    setProfileDraft({
      businessName: existingProfile.businessName,
      description: existingProfile.description,
      category: existingProfile.category,
      logoUrl: existingProfile.logoUrl,
      city: existingProfile.city
    });
  }, [existingProfile]);

  const [offers, setOffers] = useState<Benefit[]>(
    appData.benefits.filter((item) => item.businessId === (user.businessId ?? user.id))
  );
  const allBenefits = useMemo(
    () => [...appData.benefits.filter((item) => !offers.some((offer) => offer.id === item.id)), ...offers],
    [appData.benefits, offers]
  );

  useEffect(() => {
    setOffers(appData.benefits.filter((item) => item.businessId === (user.businessId ?? user.id)));
  }, [appData.benefits, user.businessId, user.id]);

  const routedPayments = useMemo(
    () =>
      selectionRequests.flatMap((request) =>
        request.benefitIds
          .map((benefitId) => allBenefits.find((benefit) => benefit.id === benefitId))
          .filter((benefit): benefit is Benefit => Boolean(benefit))
          .filter((benefit) => benefit.businessId === user.businessId)
          .map((benefit) => ({ request, benefit }))
      ),
    [selectionRequests, allBenefits, user.businessId]
  );
  const payoutTotal = routedPayments.reduce((sum, { benefit }) => sum + benefit.price, 0);
  const reachedEmployees = new Set(routedPayments.map(({ request }) => request.employeeId)).size;

  const statsForOffer = (offerId: string) => {
    const matches = routedPayments.filter(({ benefit }) => benefit.id === offerId);
    return {
      redemptions: matches.length,
      revenue: matches.reduce((sum, { benefit }) => sum + benefit.price, 0)
    };
  };

  const saveProviderProfile = async (next: typeof profileDraft) => {
    const localProfile: ProviderProfile = {
      id: existingProfile?.id ?? `provider_${Date.now()}`,
      userId: user.id,
      businessName: next.businessName.trim() || user.name,
      logoUrl: next.logoUrl.trim(),
      description: next.description.trim(),
      category: next.category,
      city: next.city.trim() || market.city,
      isApproved: true
    };

    setProfileDraft(next);

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

  const handleOfferSubmit = async (draft: OfferFormDraft) => {
    if (editingOffer) {
      const updated: Benefit = {
        ...editingOffer,
        title: draft.title,
        description: draft.description || editingOffer.description,
        discount: draft.discount || editingOffer.discount,
        price: Number(draft.price) || editingOffer.price,
        pointsPrice: Number(draft.pointsPrice) || editingOffer.pointsPrice,
        imageUrl: draft.imageUrl || editingOffer.imageUrl,
        redemptionType: draft.redemptionType,
        category: draft.category,
        validUntil: draft.validUntil
      };
      onAddOffer(updated);
      setOffers((current) => current.map((o) => (o.id === updated.id ? updated : o)));
      setEditingOffer(null);
      return;
    }

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
      category: draft.category,
      validUntil: draft.validUntil,
      city: profileDraft.city.trim() || market.city
    };

    const savedOffer = await createProviderOffer({
      providerUserId: user.id,
      providerName: nextOffer.providerName,
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
    setOffers((current) => [savedOffer ?? nextOffer, ...current]);
  };

  const handleArchiveOffer = (offer: Benefit) => {
    Alert.alert("Archive offer", `Hide "${offer.title}" from the marketplace?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        style: "destructive",
        onPress: () => {
          setOffers((current) => current.filter((o) => o.id !== offer.id));
          setDetailOffer(null);
          setEditingOffer(null);
          setOfferFormOpen(false);
        }
      }
    ]);
  };

  const handleOpenAdd = () => {
    setEditingOffer(null);
    setOfferFormOpen(true);
  };

  const handleOpenEditFromDetail = () => {
    if (!detailOffer) return;
    setEditingOffer(detailOffer);
    setDetailOffer(null);
    setOfferFormOpen(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, styles.businessContent]}
        showsVerticalScrollIndicator={false}
      >
        {tab === "home" ? (
          <BusinessHomeTab
            profileDraft={profileDraft}
            payoutTotal={payoutTotal}
            reachedEmployees={reachedEmployees}
            routedPayments={routedPayments}
            onOpenProfile={onOpenProfile}
            onSelectTransaction={(item) => setDetailTransaction(item)}
            onSeeAllTransactions={() => setTab("offers")}
          />
        ) : null}

        {tab === "offers" ? (
          <BusinessOffersTab
            offers={offers}
            statsForOffer={statsForOffer}
            onAdd={handleOpenAdd}
            onSelect={(offer) => setDetailOffer(offer)}
          />
        ) : null}

        {tab === "profile" ? (
          <BusinessProfileTab
            user={user}
            profile={profileDraft}
            offerCount={offers.length}
            customerCount={reachedEmployees}
            payoutTotal={payoutTotal}
            onEdit={() => setProfileEditOpen(true)}
          />
        ) : null}

        {tab === "account" ? (
          <BusinessAccountTab
            user={user}
            profile={profileDraft}
            onOpenProfile={onOpenProfile}
          />
        ) : null}
      </ScrollView>

      <BusinessBottomNav active={tab} onChange={setTab} onAddOffer={handleOpenAdd} />

      <OfferFormModal
        visible={offerFormOpen}
        initial={editingOffer ?? undefined}
        mode={editingOffer ? "edit" : "create"}
        defaultCategory={profileDraft.category}
        defaultCity={profileDraft.city}
        onClose={() => {
          setOfferFormOpen(false);
          setEditingOffer(null);
        }}
        onSubmit={handleOfferSubmit}
        onDelete={editingOffer ? () => handleArchiveOffer(editingOffer) : undefined}
      />

      <OfferDetailModal
        visible={!!detailOffer}
        offer={detailOffer}
        stats={detailOffer ? statsForOffer(detailOffer.id) : { redemptions: 0, revenue: 0 }}
        onClose={() => setDetailOffer(null)}
        onEdit={handleOpenEditFromDetail}
        onArchive={() => detailOffer && handleArchiveOffer(detailOffer)}
      />

      <TransactionDetailModal
        visible={!!detailTransaction}
        data={detailTransaction}
        onClose={() => setDetailTransaction(null)}
      />

      <ProfileEditModal
        visible={profileEditOpen}
        initial={profileDraft}
        onClose={() => setProfileEditOpen(false)}
        onSubmit={async (next) => {
          await saveProviderProfile(next);
        }}
      />
    </View>
  );
}

function BusinessHomeTab({
  profileDraft,
  payoutTotal,
  reachedEmployees,
  routedPayments,
  onOpenProfile,
  onSelectTransaction,
  onSeeAllTransactions
}: {
  profileDraft: { businessName: string };
  payoutTotal: number;
  reachedEmployees: number;
  routedPayments: Array<{ request: SelectionRequest; benefit: Benefit }>;
  onOpenProfile: () => void;
  onSelectTransaction: (data: { request: SelectionRequest; benefit: Benefit }) => void;
  onSeeAllTransactions: () => void;
}) {
  const heroTagline = routedPayments.length > 0
    ? `Your business ecosystem at a glance. ${reachedEmployees} ${reachedEmployees === 1 ? "person" : "people"} reached this period.`
    : `Your business ecosystem at a glance. Publish your first offer to start tracking redemptions, ${profileDraft.businessName.split(" ")[0]}.`;

  const growthTrend = routedPayments.length > 0
    ? `+${Math.min(48, routedPayments.length * 8)}%`
    : "+0%";

  const recentTransactions = routedPayments.slice(0, 6);

  return (
    <>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.greetingText}>Insights</Text>
          <Text style={styles.insightsTagline}>{heroTagline}</Text>
        </View>
        <Pressable onPress={onOpenProfile} style={styles.searchPill}>
          <AppIcon name="magnify" size={18} color={colors.soft} />
        </Pressable>
      </View>

      <View style={styles.bentoRow}>
        <BentoMetricCard
          title="Revenue"
          value={currency(payoutTotal)}
          trend={growthTrend}
          accent={colors.primary}
          Icon={Wallet}
        />
        <BentoMetricCard
          title="Customers"
          value={`${reachedEmployees}`}
          trend={reachedEmployees > 0 ? `+${reachedEmployees}` : "—"}
          accent={colors.tertiary}
          Icon={UsersRound}
        />
        <BentoMetricCard
          title="Growth"
          value={`${Math.min(99, routedPayments.length * 4)}%`}
          trend={growthTrend}
          accent={colors.secondary}
          Icon={TrendingUp}
        />
      </View>

      <GlassPanel style={styles.activityPanel} intensity={36}>
        <View style={styles.activityHeader}>
          <View>
            <Text style={styles.cardTitle}>Activity Heatmap</Text>
            <Text style={styles.bodyText}>Live redemption signal across your offers.</Text>
          </View>
          <Pressable style={styles.exportPill} onPress={() => undefined}>
            <Text style={styles.exportPillText}>Export</Text>
          </Pressable>
        </View>
        <View style={styles.activityStage}>
          <Text style={styles.activityStageLabel}>Live Optimization</Text>
          <View style={styles.activityPulseRow}>
            <PulseDot />
            <PulseDot delay={350} />
            <PulseDot delay={700} />
          </View>
        </View>
      </GlassPanel>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {recentTransactions.length ? (
          <Pressable onPress={onSeeAllTransactions}>
            <Text style={styles.sectionMeta}>{recentTransactions.length} · See all</Text>
          </Pressable>
        ) : null}
      </View>
      <GlassPanel style={styles.txList} intensity={32}>
        {recentTransactions.length ? recentTransactions.map(({ request, benefit }, index) => {
          const Icon = businessCategoryIcons[benefit.category] ?? Store;
          const avatar = businessCategoryAvatar[benefit.category] ?? { background: "rgba(0,88,188,0.14)", color: colors.primary };
          const last = index === recentTransactions.length - 1;
          return (
            <Pressable
              key={`${request.id}-${benefit.id}`}
              onPress={() => onSelectTransaction({ request, benefit })}
              style={[styles.txRow, last && styles.txRowLast]}
            >
              <View style={[styles.txAvatar, { backgroundColor: avatar.background }]}>
                <Icon size={20} color={avatar.color} />
              </View>
              <View style={styles.txBody}>
                <Text style={styles.txTitle}>{benefit.title}</Text>
                <Text style={styles.txMeta}>
                  {request.employeeName.split(" ")[0]} · Paid out
                </Text>
              </View>
              <View style={styles.txAmounts}>
                <Text style={styles.txAmount}>+{currency(benefit.price)}</Text>
                <Text style={styles.txStatus}>Settled</Text>
              </View>
            </Pressable>
          );
        }) : (
          <View style={styles.txEmpty}>
            <View style={styles.smallIcon}>
              <Store size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No routed payments yet</Text>
              <Text style={styles.listSub}>Employee redemptions will land here automatically.</Text>
            </View>
          </View>
        )}
      </GlassPanel>
    </>
  );
}

function BusinessOffersTab({
  offers,
  statsForOffer,
  onAdd,
  onSelect
}: {
  offers: Benefit[];
  statsForOffer: (offerId: string) => { redemptions: number; revenue: number };
  onAdd: () => void;
  onSelect: (offer: Benefit) => void;
}) {
  return (
    <>
      <View style={styles.offersHeader}>
        <View>
          <Text style={styles.greetingText}>Offers</Text>
          <Text style={styles.insightsTagline}>
            {offers.length ? `${offers.length} live offer${offers.length === 1 ? "" : "s"}` : "Publish your first offer to start earning."}
          </Text>
        </View>
        <Pressable style={styles.offersHeaderAction} onPress={onAdd}>
          <Plus size={16} color={colors.onPrimary} />
          <Text style={styles.offersHeaderActionText}>New</Text>
        </Pressable>
      </View>

      {offers.length ? offers.map((offer) => {
        const stats = statsForOffer(offer.id);
        return (
          <Pressable key={offer.id} onPress={() => onSelect(offer)}>
            <GlassPanel style={styles.offerListCard} intensity={20}>
              <Image source={{ uri: offer.imageUrl }} style={styles.offerListThumb} />
              <View style={styles.offerListBody}>
                <Text style={styles.offerListTitle}>{offer.title}</Text>
                <Text style={styles.offerListMeta}>
                  {offer.discount} · {offer.category}
                </Text>
                <View style={styles.offerListSubRow}>
                  <View style={styles.offerListPriceChip}>
                    <Text style={styles.offerListPriceText}>{currency(offer.price)}</Text>
                  </View>
                  <Text style={styles.offerListMeta}>{stats.redemptions} redemptions</Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </GlassPanel>
          </Pressable>
        );
      }) : (
        <GlassPanel style={styles.txList} intensity={32}>
          <View style={styles.txEmpty}>
            <View style={styles.smallIcon}>
              <LayoutGrid size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No offers yet</Text>
              <Text style={styles.listSub}>Tap "New" to publish your first offer.</Text>
            </View>
          </View>
        </GlassPanel>
      )}
    </>
  );
}

function BusinessProfileTab({
  user,
  profile,
  offerCount,
  customerCount,
  payoutTotal,
  onEdit
}: {
  user: User;
  profile: {
    businessName: string;
    description: string;
    category: BenefitCategory;
    logoUrl: string;
    city: string;
  };
  offerCount: number;
  customerCount: number;
  payoutTotal: number;
  onEdit: () => void;
}) {
  const Icon = businessCategoryIcons[profile.category] ?? Store;
  const tint = businessCategoryAvatar[profile.category] ?? { background: "rgba(0,88,188,0.14)", color: colors.primary };
  return (
    <>
      <GlassPanel style={styles.profileHeroCard} intensity={34}>
        <Pressable style={styles.profileHeroLogoWrap} onPress={onEdit}>
          <Image source={{ uri: profile.logoUrl }} style={styles.profileHeroLogo} />
          <View style={styles.profileHeroLogoEdit}>
            <Camera size={14} color={colors.onPrimary} />
          </View>
        </Pressable>
        <Text style={styles.profileHeroName}>{profile.businessName}</Text>
        <View style={styles.profileHeroMetaRow}>
          <View style={[styles.detailCategoryBadge, { backgroundColor: tint.background }]}>
            <Icon size={14} color={tint.color} />
            <Text style={[styles.detailCategoryText, { color: tint.color }]}>{profile.category}</Text>
          </View>
          <View style={styles.detailMetaPill}>
            <MapPin size={14} color={colors.muted} />
            <Text style={styles.detailMetaText}>{profile.city}</Text>
          </View>
          <View style={styles.profileVerifiedBadge}>
            <BadgeCheck size={14} color={colors.secondary} />
            <Text style={styles.profileVerifiedText}>Verified</Text>
          </View>
        </View>
        <Text style={styles.profileHeroDescription}>{profile.description}</Text>
        <CapsuleButton label="Edit profile" onPress={onEdit} icon={<Pencil size={16} color={colors.onPrimary} />} />
      </GlassPanel>

      <View style={styles.bentoRow}>
        <BentoMetricCard
          title="Offers"
          value={`${offerCount}`}
          accent={colors.secondary}
          Icon={Store}
        />
        <BentoMetricCard
          title="Customers"
          value={`${customerCount}`}
          accent={colors.tertiary}
          Icon={UsersRound}
        />
        <BentoMetricCard
          title="Revenue"
          value={currency(payoutTotal)}
          accent={colors.primary}
          Icon={Wallet}
        />
      </View>

      <GlassPanel style={styles.profileSection} intensity={32}>
        <Text style={styles.profileSectionTitle}>Account</Text>
        <View style={styles.profileRow}>
          <View style={styles.profileRowIcon}>
            <UserRound size={18} color={colors.primary} />
          </View>
          <View style={styles.profileRowBody}>
            <Text style={styles.profileRowLabel}>Owner</Text>
            <Text style={styles.profileRowValue}>{user.name}</Text>
          </View>
        </View>
        <View style={[styles.profileRow, styles.profileRowDivider]}>
          <View style={styles.profileRowIcon}>
            <Building2 size={18} color={colors.primary} />
          </View>
          <View style={styles.profileRowBody}>
            <Text style={styles.profileRowLabel}>Email</Text>
            <Text style={styles.profileRowValue}>{user.email}</Text>
          </View>
        </View>
        <View style={[styles.profileRow, styles.profileRowDivider]}>
          <View style={styles.profileRowIcon}>
            <MapPin size={18} color={colors.primary} />
          </View>
          <View style={styles.profileRowBody}>
            <Text style={styles.profileRowLabel}>City</Text>
            <Text style={styles.profileRowValue}>{profile.city}</Text>
          </View>
        </View>
      </GlassPanel>
    </>
  );
}

function BusinessAccountTab({
  user,
  profile,
  onOpenProfile
}: {
  user: User;
  profile: { businessName: string };
  onOpenProfile: () => void;
}) {
  const tiles: Array<{ label: string; sub: string; Icon: typeof Settings; onPress?: () => void }> = [
    { label: "Account", sub: "Personal details and password", Icon: UserRound, onPress: onOpenProfile },
    { label: "Notifications", sub: "Get pinged on every redemption", Icon: ShieldCheck },
    { label: "Payouts", sub: "Bank account, IBAN, settlement cycle", Icon: Wallet },
    { label: "Help & support", sub: "FAQs, contact a human", Icon: Settings }
  ];
  return (
    <>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.greetingText}>Account</Text>
          <Text style={styles.insightsTagline}>
            Signed in as {profile.businessName}. Manage how PERX works for you.
          </Text>
        </View>
      </View>
      {tiles.map((tile) => (
        <Pressable
          key={tile.label}
          style={styles.accountTile}
          onPress={tile.onPress ?? (() => Alert.alert(tile.label, "Coming soon."))}
        >
          <View style={styles.accountTileIcon}>
            <tile.Icon size={18} color={colors.primary} />
          </View>
          <View style={styles.accountTileBody}>
            <Text style={styles.accountTileTitle}>{tile.label}</Text>
            <Text style={styles.accountTileSub}>{tile.sub}</Text>
          </View>
          <ChevronRight size={18} color={colors.muted} />
        </Pressable>
      ))}
      <View style={{ height: 6 }} />
      <Text style={styles.accountTileSub}>Logged in as {user.email}</Text>
    </>
  );
}

function ProfileEditModal({
  visible,
  initial,
  onClose,
  onSubmit
}: {
  visible: boolean;
  initial: {
    businessName: string;
    description: string;
    category: BenefitCategory;
    logoUrl: string;
    city: string;
  };
  onClose: () => void;
  onSubmit: (next: typeof initial) => Promise<void> | void;
}) {
  const [draft, setDraft] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) setDraft(initial);
  }, [visible, initial]);

  const handlePickLogo = async () => {
    const uri = await pickImageFromDevice();
    if (uri) setDraft((c) => ({ ...c, logoUrl: uri }));
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await onSubmit(draft);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Edit profile</Text>
              <Text style={styles.modalSub}>How customers see your business.</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Pressable onPress={handlePickLogo} style={styles.imagePicker}>
              {draft.logoUrl ? (
                <Image source={{ uri: draft.logoUrl }} style={styles.imagePickerPreview} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Camera size={26} color={colors.muted} />
                  <Text style={styles.imagePickerLabel}>Upload a logo</Text>
                </View>
              )}
              {draft.logoUrl ? (
                <View style={styles.imagePickerOverlay}>
                  <Camera size={16} color={colors.onPrimary} />
                  <Text style={styles.imagePickerOverlayText}>Replace logo</Text>
                </View>
              ) : null}
            </Pressable>

            <Text style={styles.modalFieldLabel}>Business name</Text>
            <TextInput
              value={draft.businessName}
              onChangeText={(businessName) => setDraft((c) => ({ ...c, businessName }))}
              placeholder="Business name"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <Text style={styles.modalFieldLabel}>Description</Text>
            <TextInput
              value={draft.description}
              onChangeText={(description) => setDraft((c) => ({ ...c, description }))}
              placeholder="One-liner that sells your business."
              placeholderTextColor={colors.muted}
              style={[styles.input, { minHeight: 84, textAlignVertical: "top" }]}
              multiline
            />

            <Text style={styles.modalFieldLabel}>Category</Text>
            <CategoryGrid
              options={benefitCategoryOptions}
              value={draft.category}
              onChange={(category) => setDraft((c) => ({ ...c, category }))}
            />

            <Text style={styles.modalFieldLabel}>City</Text>
            <TextInput
              value={draft.city}
              onChangeText={(city) => setDraft((c) => ({ ...c, city }))}
              placeholder="Tirana"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <View style={{ height: 8 }} />
            <CapsuleButton
              label={submitting ? "Saving..." : "Save profile"}
              onPress={() => void handleSave()}
              icon={<Check size={16} color={colors.onPrimary} />}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  insightsTagline: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 380,
    marginTop: 6
  },
  activityStage: {
    minHeight: 132,
    borderRadius: radius.compact,
    borderWidth: 0.5,
    borderColor: colors.stroke,
    backgroundColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  activityStageLabel: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3
  },
  activityPulseRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  activityPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary
  },
  exportPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.capsule,
    backgroundColor: colors.primary
  },
  exportPillText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "800"
  },
  txList: {
    padding: 0,
    overflow: "hidden"
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.35)"
  },
  txRowLast: {
    borderBottomWidth: 0
  },
  txAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  txBody: {
    flex: 1
  },
  txTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  txMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  txAmounts: {
    alignItems: "flex-end"
  },
  txAmount: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: "900"
  },
  txStatus: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2
  },
  txEmpty: {
    paddingHorizontal: 16,
    paddingVertical: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  manageDivider: {
    marginTop: 8,
    marginBottom: 4,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)"
  },
  businessContent: {
    paddingBottom: 132
  },
  businessNav: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center"
  },
  businessNavPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: radius.capsule,
    borderWidth: 0.5,
    borderColor: colors.stroke,
    ...shadow
  },
  businessNavItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.capsule
  },
  businessNavItemActive: {
    backgroundColor: colors.primary
  },
  businessNavLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  businessNavLabelActive: {
    color: colors.onPrimary
  },
  businessNavFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginLeft: 4
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  categoryTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: colors.strokeSubtle,
    backgroundColor: "rgba(255,255,255,0.55)",
    position: "relative"
  },
  categoryTileActive: {
    borderWidth: 1.5
  },
  categoryTileText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  },
  categoryTileCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end"
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 24
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.12)",
    marginBottom: 12
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)"
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3
  },
  modalSub: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)"
  },
  modalContent: {
    gap: 10,
    paddingTop: 16,
    paddingBottom: 16
  },
  modalFieldLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 6
  },
  modalRow: {
    flexDirection: "row",
    gap: 10
  },
  imagePicker: {
    height: 168,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.strokeSubtle,
    borderStyle: "dashed",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.03)"
  },
  imagePickerPreview: {
    width: "100%",
    height: "100%"
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6
  },
  imagePickerLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  imagePickerHint: {
    color: colors.muted,
    fontSize: 12
  },
  imagePickerOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(15,23,42,0.7)"
  },
  imagePickerOverlayText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: "800"
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(186,26,26,0.08)",
    marginTop: 10
  },
  dangerButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "800"
  },
  detailHeroImage: {
    width: "100%",
    height: 180,
    borderRadius: radius.cardLg,
    backgroundColor: colors.surfaceContainerHigh
  },
  detailMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4
  },
  detailCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.capsule
  },
  detailCategoryText: {
    fontSize: 12,
    fontWeight: "800"
  },
  detailMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(0,0,0,0.04)"
  },
  detailMetaText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  detailStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4
  },
  detailStatCard: {
    flex: 1,
    padding: 14,
    gap: 4
  },
  detailStatLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  detailStatValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  detailBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21
  },
  detailKeyValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)"
  },
  detailKeyLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600"
  },
  detailKeyValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    maxWidth: "60%",
    textAlign: "right"
  },
  detailKeyValueMono: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" })
  },
  txDetailHero: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 8
  },
  txDetailIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center"
  },
  txDetailAmount: {
    color: colors.secondary,
    fontSize: 30,
    fontWeight: "900"
  },
  txDetailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(111,251,133,0.18)"
  },
  txDetailBadgeText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "800"
  },
  txDetailCard: {
    padding: 16,
    gap: 0
  },
  profileHeroCard: {
    padding: 22,
    gap: 14,
    alignItems: "center"
  },
  profileHeroLogo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceContainerHigh
  },
  profileHeroLogoWrap: {
    position: "relative"
  },
  profileHeroLogoEdit: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface
  },
  profileHeroName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center"
  },
  profileHeroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center"
  },
  profileVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(0,110,40,0.12)"
  },
  profileVerifiedText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "800"
  },
  profileHeroDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  profileSection: {
    padding: 18,
    gap: 12
  },
  profileSectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10
  },
  profileRowDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)"
  },
  profileRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,88,188,0.1)",
    alignItems: "center",
    justifyContent: "center"
  },
  profileRowBody: {
    flex: 1
  },
  profileRowLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  profileRowValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2
  },
  offerListCard: {
    padding: 14,
    gap: 12,
    flexDirection: "row",
    alignItems: "center"
  },
  offerListThumb: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHigh
  },
  offerListBody: {
    flex: 1,
    gap: 4
  },
  offerListTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  offerListMeta: {
    color: colors.muted,
    fontSize: 12
  },
  offerListSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2
  },
  offerListPriceChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(0,88,188,0.08)"
  },
  offerListPriceText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800"
  },
  offersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  offersHeaderAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.capsule,
    backgroundColor: colors.primary
  },
  offersHeaderActionText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "800"
  },
  accountTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: radius.cardLg,
    backgroundColor: colors.panel,
    borderWidth: 0.5,
    borderColor: colors.stroke
  },
  accountTileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,88,188,0.1)"
  },
  accountTileBody: {
    flex: 1
  },
  accountTileTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  accountTileSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  walletHero: {
    marginTop: 2,
    marginBottom: 4
  },
  cardStack: {
    gap: 0
  },
  stackItem: {
    marginBottom: 12
  },
  stackItemCollapsed: {
    marginTop: -148
  }
});

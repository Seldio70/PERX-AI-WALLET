import { StatusBar } from "expo-status-bar";
import { Building2, ChevronRight, Sparkles, Store, UserRound } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { CapsuleButton } from "./src/components/CapsuleButton";
import { GlassPanel } from "./src/components/GlassPanel";
import { MetricPill } from "./src/components/MetricPill";
import {
  approveSelectionRequest,
  createPlatformUser,
  fetchPerxLiveData,
  PerxLiveData,
  signInOrSignUpPlatformAuth,
  signInPlatformUser
} from "./src/lib/perxRepository";
import { getSupabaseClient } from "./src/lib/supabase";
import { BusinessExperience } from "./src/screens/BusinessScreen";
import { EmployeeExperience } from "./src/screens/EmployeeScreens";
import { EmployerExperience } from "./src/screens/EmployerScreen";
import { styles } from "./src/styles/appStyles";
import { colors } from "./src/theme";
import {
  Benefit,
  Challenge,
  EmployerInvite,
  EmployerWalletCard,
  ProviderProfile,
  Role,
  SelectionRequest,
  User
} from "./src/types";
import { currency, market } from "./src/utils/format";

type Session = { user: User; jwt: string };
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
    subtitle: "Browse providers and redeem perks funded by your employer.",
    icon: UserRound
  },
  employer: {
    title: "Employer",
    subtitle: "Fund a points wallet and track employee benefit spending.",
    icon: Building2
  },
  business: {
    title: "Provider",
    subtitle: "Create a merchant profile and publish image-backed offers.",
    icon: Store
  }
};

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
    return () => { active = false; };
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
      name: user.name, email: user.email, role: user.role,
      companyId: user.companyId, yearsEmployed: user.yearsEmployed,
      invitedByUserId: user.invitedByUserId
    });
    setSession({ user: savedUser ?? user, jwt: createSessionToken((savedUser ?? user).role) });
  };

  const handleSubmitSelection = (request: SelectionRequest) => {
    const requestBenefits = request.benefitIds
      .map((id) => appData.benefits.find((b) => b.id === id))
      .filter((b): b is Benefit => Boolean(b));
    const totalPoints = request.totalPoints || requestBenefits.reduce((sum, b) => sum + b.pointsPrice, 0);
    void approveSelectionRequest({ requestId: request.id, employerId: request.employerId, totalPoints, benefits: requestBenefits });
    setSelectionRequests((current) => [
      { ...request, status: "approved", approvedAt: new Date().toISOString() },
      ...current
    ]);
    setWalletCardItems((current) => {
      const base = current.length > 0
        ? current
        : [{ id: "wallet_default", title: "Welfare Budget", points: 999999, description: "Employee benefits fund", accent: colors.accent }];
      return base.map((card, i) =>
        i === 0 ? { ...card, points: Math.max(0, card.points - totalPoints) } : card
      );
    });
  };

  const handleAddPoints = (amount: number) => {
    setWalletCardItems((current) =>
      current.length === 0
        ? [{ id: `wallet_${Date.now()}`, title: "Welfare Budget", points: amount, description: "Employee benefits fund", accent: colors.accent }]
        : current.map((card, i) => i === 0 ? { ...card, points: card.points + amount } : card)
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <View style={styles.appChrome}>
          <AppHeader session={session} supabaseReady={supabaseReady} onLogout={() => setSession(null)} />
          {session ? (
            <RoleRouter
              session={session}
              appData={appData}
              selectionRequests={selectionRequests}
              onSubmitSelection={handleSubmitSelection}
              onAddPoints={handleAddPoints}
              onUpdateProviderProfile={(profile) =>
                setProviderProfileItems((current) => [
                  profile,
                  ...current.filter((item) => item.id !== profile.id && item.userId !== profile.userId)
                ])
              }
              onAddOffer={(offer) =>
                setBenefitItems((current) => [offer, ...current.filter((item) => item.id !== offer.id)])
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
  session, supabaseReady, onLogout
}: {
  session: Session | null; supabaseReady: boolean; onLogout: () => void;
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>PerX</Text>
        <Text style={styles.headerSub}>
          {session ? `${session.user.role} · ${session.user.name}` : "employee benefits marketplace"}
        </Text>
      </View>
      <View style={styles.headerActions}>
        <View style={styles.statusPill}>
          <Text style={styles.statusDot}>{supabaseReady ? "●" : "○"}</Text>
          <Text style={styles.statusText}>{supabaseReady ? "Live" : "Demo"}</Text>
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

function RoleRouter({
  session, appData, selectionRequests,
  onSubmitSelection, onAddPoints, onUpdateProviderProfile, onAddOffer
}: {
  session: Session;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onSubmitSelection: (request: SelectionRequest) => void;
  onAddPoints: (amount: number) => void;
  onUpdateProviderProfile: (profile: ProviderProfile) => void;
  onAddOffer: (offer: Benefit) => void;
}) {
  if (session.user.role === "employer") {
    return (
      <EmployerExperience
        user={session.user}
        appData={appData}
        selectionRequests={selectionRequests}
        onAddPoints={onAddPoints}
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

function LoginScreen({
  onLogin, onStartSession, supabaseReady, dataSource, appData
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
    if (!trimmedEmail || !trimmedPassword) { setMessage("Enter email and password."); return; }
    const ok = await onLogin(selectedRole, trimmedEmail, trimmedPassword);
    if (!ok) setMessage("Login failed. Check the role, email, and password.");
  };

  const submitSignup = async () => {
    setMessage("");
    const trimmedPassword = password.trim();
    if (trimmedPassword.length < 6) { setMessage("Password needs at least 6 characters."); return; }
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) { setMessage("Enter name, email, and password to sign up."); return; }
    const matchedCompany = appData.companies.find(
      (c) => c.name.toLowerCase() === companyName.trim().toLowerCase()
    );
    await onStartSession({
      id: `local_${selectedRole}_${Date.now()}`,
      name: trimmedName, email: trimmedEmail, role: selectedRole,
      companyId: selectedRole !== "business" ? matchedCompany?.id : undefined,
      yearsEmployed: selectedRole === "employee" ? 0 : undefined,
      businessId: selectedRole === "business" ? `business_${Date.now()}` : undefined
    }, trimmedPassword);
  };

  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <GlassPanel style={styles.heroPanel}>
        <View style={styles.heroIcon}>
          <Sparkles size={22} color={colors.text} />
        </View>
        <Text style={styles.heroTitle}>Benefits that work for real people.</Text>
        <Text style={styles.heroText}>
          Browse providers, redeem perks, and let employer budgets flow directly to the places
          your people actually use — built for Albania, ready for the world.
        </Text>
        <View style={styles.heroMetrics}>
          <MetricPill label="Data" value={supabaseReady ? "Supabase" : "Demo"} />
          <MetricPill label="Market" value={market.city} />
        </View>
      </GlassPanel>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.sectionMeta}>
          {dataSource === "supabase" ? "Supabase data" : supabaseReady ? "No live rows yet" : "Demo mode"}
        </Text>
      </View>

      <View style={styles.segmented}>
        {(["login", "signup"] as const).map((mode) => (
          <Pressable key={mode} onPress={() => setAuthMode(mode)} style={[styles.segment, authMode === mode && styles.segmentActive]}>
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
        <Text style={styles.cardTitle}>{authMode === "login" ? "Log in" : "Create account"}</Text>
        <Text style={styles.bodyText}>
          {selectedRole === "business"
            ? "Providers publish offers visible to employees across the marketplace."
            : selectedRole === "employee"
              ? "Browse providers and redeem perks using your employer's budget."
              : "Fund a points wallet for your team and track spending."}
        </Text>
        {authMode === "signup" ? (
          <TextInput value={name} onChangeText={setName} placeholder={selectedRole === "business" ? "Business name" : "Full name"} placeholderTextColor={colors.muted} style={styles.input} />
        ) : null}
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.muted} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
        <TextInput value={password} onChangeText={setPassword} placeholder={supabaseReady ? "Password" : "Password optional"} placeholderTextColor={colors.muted} style={styles.input} secureTextEntry autoCapitalize="none" />
        {authMode === "signup" && selectedRole !== "business" ? (
          <TextInput value={companyName} onChangeText={setCompanyName} placeholder="Company" placeholderTextColor={colors.muted} style={styles.input} />
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

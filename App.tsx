import { StatusBar } from "expo-status-bar";
import { Building2, Store, UserRound } from "lucide-react-native";
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
import { AppIcon } from "./src/components/AppIcon";
import { CapsuleButton } from "./src/components/CapsuleButton";
import { GlassPanel } from "./src/components/GlassPanel";
import { MeshBackground } from "./src/components/MeshBackground";
import { MetricPill } from "./src/components/MetricPill";
import { UserProfileScreen } from "./src/components/UserProfileScreen";
import { market } from "./src/lib/format";
import { getSupabaseClient } from "./src/lib/supabase";
import {
  createPlatformUser,
  fetchPerxLiveData,
  PerxLiveData,
  requestPasswordReset,
  signInPlatformUser,
  signInOrSignUpPlatformAuth
} from "./src/lib/perxRepository";
import { BusinessExperience } from "./src/screens/BusinessScreen";
import { EmployeeExperience } from "./src/screens/EmployeeScreens";
import { EmployerExperience } from "./src/screens/EmployerScreen";
import { styles } from "./src/styles/appStyles";
import { colors } from "./src/theme";
import {
  Benefit,
  Challenge,
  EmployeeInvite,
  EmployerWalletCard,
  EmployerInvite,
  ProviderProfile,
  RewardEvent,
  Role,
  SelectionRequest,
  User
} from "./src/types";
import {
  BUDGET_PER_REDEEM,
  createDemoChallenges,
  createDemoEmployeePoints,
  createDemoInvites,
  createDemoRewardEvents,
  defaultRewardAutomations,
  POINTS_REDEEM_RATE
} from "./src/lib/rewardsDemo";

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
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [employeePoints, setEmployeePoints] = useState<Record<string, number>>({});
  const [rewardEvents, setRewardEvents] = useState<RewardEvent[]>([]);
  const [employeeInvites, setEmployeeInvites] = useState<EmployeeInvite[]>([]);
  const [bonusBudgetByEmployee, setBonusBudgetByEmployee] = useState<Record<string, number>>({});
  const [demoSeeded, setDemoSeeded] = useState(false);
  const supabaseReady = Boolean(getSupabaseClient());
  const mergedUsers = [...(liveData?.users ?? emptyAppData.users), ...localUsers];
  const appData: AppData = {
    companies: liveData?.companies ?? emptyAppData.companies,
    users: mergedUsers,
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

  useEffect(() => {
    if (demoSeeded) return;
    const company = appData.companies[0];
    const employer = appData.users.find((user) => user.role === "employer");
    const employees = appData.users.filter((user) => user.role === "employee");

    const companyId = company?.id ?? "demo_company";
    const companyName = company?.name ?? "NovaWorks Tirana";
    const employerId = employer?.id ?? company?.employerId ?? "demo_employer";
    const employee = employees[0];

    if (employee) {
      setEmployeePoints(createDemoEmployeePoints(employees.map((item) => item.id)));
      setRewardEvents(createDemoRewardEvents(employee.id, employee.name));
      if (!challengeItems.length) {
        setChallengeItems(createDemoChallenges(employerId, employee.id, employee.name));
      }
    }
    if (!employeeInvites.length) {
      setEmployeeInvites(createDemoInvites(employerId, companyId, companyName));
    }
    setDemoSeeded(true);
  }, [appData.companies, appData.users, challengeItems.length, demoSeeded, employeeInvites.length]);

  const loginWithCredentials = async (email: string, password: string) => {
    const user = await signInPlatformUser({ email, password });
    if (!user) return false;
    setSession({ user, jwt: createSessionToken(user.role) });
    return true;
  };

  const forgotPassword = async (email: string) => {
    if (!email.trim()) return false;
    if (!supabaseReady) return true;
    return requestPasswordReset(email.trim());
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

    if (user.role === "employee" && !mergedUsers.some((item) => item.id === sessionUser.id)) {
      setLocalUsers((current) => [...current, sessionUser]);
      const welcomePoints = defaultRewardAutomations.find((item) => item.kind === "welcome")?.points ?? 100;
      setEmployeePoints((current) => ({ ...current, [sessionUser.id]: welcomePoints }));
      setRewardEvents((current) => [
        {
          id: `reward_welcome_${sessionUser.id}`,
          employeeId: sessionUser.id,
          employeeName: sessionUser.name,
          kind: "welcome",
          points: welcomePoints,
          note: "Welcome to PerX perks",
          createdAt: new Date().toISOString()
        },
        ...current
      ]);
    }

    setSession({ user: sessionUser, jwt: createSessionToken(sessionUser.role) });
  };

  const handleCreateChallenge = (input: Omit<Challenge, "id" | "status">) => {
    setChallengeItems((current) => [
      {
        ...input,
        id: `challenge_${Date.now()}`,
        status: "open"
      },
      ...current
    ]);
  };

  const handleCompleteChallenge = (challengeId: string) => {
    const challenge = challengeItems.find((item) => item.id === challengeId);
    if (!challenge || challenge.status === "completed") return;

    const targets =
      challenge.target === "everyone"
        ? mergedUsers.filter((user) => user.role === "employee")
        : mergedUsers.filter((user) => user.id === challenge.target || user.id === challenge.employeeId);

    setChallengeItems((current) =>
      current.map((item) => (item.id === challengeId ? { ...item, status: "completed" } : item))
    );

    targets.forEach((employee) => {
      setEmployeePoints((current) => ({
        ...current,
        [employee.id]: (current[employee.id] ?? 0) + challenge.rewardPoints
      }));
      setRewardEvents((current) => [
        {
          id: `reward_challenge_${challengeId}_${employee.id}`,
          employeeId: employee.id,
          employeeName: employee.name,
          kind: "challenge",
          points: challenge.rewardPoints,
          note: challenge.title,
          createdAt: new Date().toISOString()
        },
        ...current
      ]);
    });
  };

  const handleGrantReward = (input: {
    employeeId: string;
    employeeName: string;
    kind: RewardEvent["kind"];
    points: number;
    note: string;
  }) => {
    setEmployeePoints((current) => ({
      ...current,
      [input.employeeId]: (current[input.employeeId] ?? 0) + input.points
    }));
    setRewardEvents((current) => [
      {
        id: `reward_${input.kind}_${input.employeeId}_${Date.now()}`,
        employeeId: input.employeeId,
        employeeName: input.employeeName,
        kind: input.kind,
        points: input.points,
        note: input.note,
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
  };

  const handleSendEmployeeInvite = (invite: EmployeeInvite) => {
    setEmployeeInvites((current) => [invite, ...current]);
  };

  const handleJoinWithInvite = async (input: {
    name: string;
    email: string;
    password: string;
    birthDate: string;
    inviteCode: string;
  }) => {
    const invite = employeeInvites.find(
      (item) => item.code.toUpperCase() === input.inviteCode.trim().toUpperCase() && item.status === "sent"
    );
    if (!invite) return false;

    setEmployeeInvites((current) =>
      current.map((item) => (item.id === invite.id ? { ...item, status: "accepted" } : item))
    );

    await startSessionForUser(
      {
        id: `employee_${Date.now()}`,
        name: input.name.trim(),
        email: input.email.trim(),
        role: "employee",
        companyId: invite.companyId,
        invitedByUserId: invite.employerId,
        birthDate: input.birthDate.trim(),
        startDate: invite.startDate
      },
      input.password
    );
    return true;
  };

  const handleRedeemPoints = (employeeId: string, points: number) => {
    const balance = employeePoints[employeeId] ?? 0;
    if (balance < points) return false;
    setEmployeePoints((current) => ({
      ...current,
      [employeeId]: balance - points
    }));
    const budgetGain = Math.round((points / POINTS_REDEEM_RATE) * BUDGET_PER_REDEEM);
    setBonusBudgetByEmployee((current) => ({
      ...current,
      [employeeId]: (current[employeeId] ?? 0) + budgetGain
    }));
    return true;
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
              employeePoints={employeePoints}
              rewardEvents={rewardEvents}
              employeeInvites={employeeInvites}
              bonusBudgetByEmployee={bonusBudgetByEmployee}
              onOpenProfile={() => setShowProfile(true)}
              onLogout={() => {
                setShowProfile(false);
                setSession(null);
              }}
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
              onCreateChallenge={handleCreateChallenge}
              onCompleteChallenge={handleCompleteChallenge}
              onGrantReward={handleGrantReward}
              onSendEmployeeInvite={handleSendEmployeeInvite}
              onRedeemPoints={(points) =>
                session.user.role === "employee" ? handleRedeemPoints(session.user.id, points) : false
              }
            />
          ) : (
            <LoginScreen
              onLogin={loginWithCredentials}
              onStartSession={startSessionForUser}
              onJoinWithInvite={handleJoinWithInvite}
              onForgotPassword={forgotPassword}
              supabaseReady={supabaseReady}
              dataSource={dataSource}
              appData={appData}
              employeeInvites={employeeInvites}
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

type SignupRole = Extract<Role, "employer" | "business">;

function LoginScreen({
  onLogin,
  onStartSession,
  onJoinWithInvite,
  onForgotPassword,
  supabaseReady,
  appData,
  employeeInvites
}: {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onStartSession: (user: User, password?: string) => Promise<void>;
  onJoinWithInvite: (input: {
    name: string;
    email: string;
    password: string;
    birthDate: string;
    inviteCode: string;
  }) => Promise<boolean>;
  onForgotPassword: (email: string) => Promise<boolean>;
  supabaseReady: boolean;
  dataSource: "empty" | "supabase";
  appData: AppData;
  employeeInvites: EmployeeInvite[];
}) {
  const [authMode, setAuthMode] = useState<"login" | "signup" | "invite">("login");
  const [selectedRole, setSelectedRole] = useState<SignupRole>("employer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("NovaWorks Tirana");
  const [birthDate, setBirthDate] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  const submitLogin = async () => {
    setMessage("");
    setNotice("");
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setMessage("Enter email and password.");
      return;
    }

    const ok = await onLogin(trimmedEmail, trimmedPassword);
    if (!ok) setMessage("Login failed. Check your email and password.");
  };

  const submitForgotPassword = async () => {
    setMessage("");
    setNotice("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage("Enter your email first, then tap reset.");
      return;
    }
    const ok = await onForgotPassword(trimmedEmail);
    setNotice(
      ok
        ? `Password reset link sent to ${trimmedEmail}.`
        : "Could not start a reset. Try again."
    );
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
        companyId: selectedRole === "employer" ? matchedCompany?.id : undefined,
        businessId: selectedRole === "business" ? `business_${Date.now()}` : undefined
      },
      trimmedPassword
    );
  };

  const submitInviteJoin = async () => {
    setMessage("");
    setNotice("");
    const trimmedPassword = password.trim();
    if (trimmedPassword.length < 6) {
      setMessage("Password needs at least 6 characters.");
      return;
    }
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedBirthDate = birthDate.trim();
    const trimmedInviteCode = inviteCode.trim();
    if (!trimmedName || !trimmedEmail || !trimmedBirthDate || !trimmedInviteCode) {
      setMessage("Enter name, email, password, birthdate, and invite code.");
      return;
    }

    const ok = await onJoinWithInvite({
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPassword,
      birthDate: trimmedBirthDate,
      inviteCode: trimmedInviteCode
    });
    if (!ok) {
      setMessage("Invalid invite code. Try PERX-DEMO from a pending employer invite.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.loginContent} showsVerticalScrollIndicator={false}>
      <View style={styles.loginBrand}>
        <View style={styles.loginLogo}>
          <AppIcon name="wallet-plus-outline" size={28} color={colors.onPrimary} />
        </View>
        <Text style={styles.loginTitle}>Welcome to PerX</Text>
        <Text style={styles.loginSubtitle}>
          {authMode === "login"
            ? "Log in to your account."
            : authMode === "signup"
              ? "Create an employer or provider account."
              : "Join your company with an employer invite."}
        </Text>
      </View>

      <GlassPanel style={styles.loginCard} intensity={40}>
        <View style={styles.segmented}>
          {(["login", "signup", "invite"] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setAuthMode(mode)}
              style={[styles.segment, authMode === mode && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, authMode === mode && styles.segmentTextActive]}>
                {mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Invite"}
              </Text>
            </Pressable>
          ))}
        </View>

        {authMode === "signup" ? (
          <View style={styles.rolePills}>
            {(["employer", "business"] as SignupRole[]).map((role) => {
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
        ) : null}

        {authMode === "invite" ? (
          <>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={colors.soft}
              style={styles.input}
            />
            <TextInput
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="Birthdate (YYYY-MM-DD)"
              placeholderTextColor={colors.soft}
              style={styles.input}
            />
            <TextInput
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Invite code (e.g. PERX-DEMO)"
              placeholderTextColor={colors.soft}
              style={styles.input}
              autoCapitalize="characters"
            />
          </>
        ) : null}

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
            {selectedRole === "employer" ? (
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

        <CapsuleButton
          label={
            authMode === "login"
              ? "Continue"
              : authMode === "signup"
                ? "Create account"
                : "Join with invite"
          }
          onPress={() =>
            void (authMode === "login"
              ? submitLogin()
              : authMode === "signup"
                ? submitSignup()
                : submitInviteJoin())
          }
          variant="dark"
          style={styles.loginContinue}
        />

        {authMode === "login" ? (
          <Pressable onPress={() => void submitForgotPassword()} style={styles.forgotLink}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        ) : null}

        {message ? <Text style={styles.errorText}>{message}</Text> : null}
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

        <Text style={styles.authHint}>
          {authMode === "login"
            ? "Employees join with an invite from their employer."
            : authMode === "signup"
              ? "Only employers and providers can sign up. Employees are invited by their employer."
              : employeeInvites.find((invite) => invite.status === "sent")
                ? `Demo code available: ${employeeInvites.find((invite) => invite.status === "sent")?.code}`
                : "Ask your employer for an invite code."}
        </Text>
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
  employeePoints,
  rewardEvents,
  employeeInvites,
  bonusBudgetByEmployee,
  onOpenProfile,
  onLogout,
  onSubmitSelection,
  onUpdateProviderProfile,
  onAddOffer,
  onCreateChallenge,
  onCompleteChallenge,
  onGrantReward,
  onSendEmployeeInvite,
  onRedeemPoints
}: {
  session: Session;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  employeePoints: Record<string, number>;
  rewardEvents: RewardEvent[];
  employeeInvites: EmployeeInvite[];
  bonusBudgetByEmployee: Record<string, number>;
  onOpenProfile: () => void;
  onLogout: () => void;
  onSubmitSelection: (request: SelectionRequest) => void;
  onUpdateProviderProfile: (profile: ProviderProfile) => void;
  onAddOffer: (offer: Benefit) => void;
  onCreateChallenge: (challenge: Omit<Challenge, "id" | "status">) => void;
  onCompleteChallenge: (challengeId: string) => void;
  onGrantReward: (input: {
    employeeId: string;
    employeeName: string;
    kind: RewardEvent["kind"];
    points: number;
    note: string;
  }) => void;
  onSendEmployeeInvite: (invite: EmployeeInvite) => void;
  onRedeemPoints: (points: number) => boolean;
}) {
  if (session.user.role === "employer") {
    return (
      <EmployerExperience
        user={session.user}
        appData={appData}
        selectionRequests={selectionRequests}
        onLogout={onLogout}
        employeePoints={employeePoints}
        rewardEvents={rewardEvents}
        employeeInvites={employeeInvites}
        onCreateChallenge={onCreateChallenge}
        onCompleteChallenge={onCompleteChallenge}
        onGrantReward={onGrantReward}
        onSendEmployeeInvite={onSendEmployeeInvite}
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
      onLogout={onLogout}
      pointsBalance={employeePoints[session.user.id] ?? 0}
      rewardEvents={rewardEvents.filter((event) => event.employeeId === session.user.id)}
      openChallenges={appData.challenges.filter(
        (challenge) =>
          challenge.status === "open" &&
          (challenge.target === "everyone" ||
            challenge.target === session.user.id ||
            challenge.employeeId === session.user.id)
      )}
      bonusBudget={bonusBudgetByEmployee[session.user.id] ?? 0}
      onRedeemPoints={onRedeemPoints}
    />
  );
}

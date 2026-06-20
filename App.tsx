import { StatusBar } from "expo-status-bar";
import { Building2, Store, UserRound } from "lucide-react-native";
import { ComponentProps, ReactNode, useEffect, useState } from "react";
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
import { LogoutButton } from "./src/components/LogoutButton";
import { MeshBackground } from "./src/components/MeshBackground";
import { getSupabaseClient } from "./src/lib/supabase";
import {
  createPlatformUser,
  createSelectionRequest,
  fetchEmployerEnabledBenefits,
  fetchPerxLiveData,
  PerxLiveData,
  requestPasswordReset,
  setEmployerBenefitEnabled,
  setEmployerBenefitsEnabled,
  signInPlatformUser,
  signInOrSignUpPlatformAuth
} from "./src/lib/perxRepository";
import { BusinessExperience } from "./src/screens/BusinessScreen";
import { EmployeeExperience } from "./src/screens/EmployeeScreens";
import { EmployerExperience } from "./src/screens/EmployerScreen";
import { filterBenefitsForEmployee, setBenefitIds, toggleBenefitId } from "./src/lib/employerCatalog";
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
  createDemoChallenges,
  createDemoEmployeePoints,
  createDemoInvites,
  createDemoRewardEvents,
  defaultRewardAutomations
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
    subtitle: "Manage your team, provider catalog, and employee challenges.",
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
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [employeePoints, setEmployeePoints] = useState<Record<string, number>>({});
  const [rewardEvents, setRewardEvents] = useState<RewardEvent[]>([]);
  const [employeeInvites, setEmployeeInvites] = useState<EmployeeInvite[]>([]);
  const [bonusBudgetByEmployee, setBonusBudgetByEmployee] = useState<Record<string, number>>({});
  const [employerEnabledBenefits, setEmployerEnabledBenefits] = useState<Record<string, string[]>>({});
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

    fetchPerxLiveData().then(async (data) => {
      if (!active || !data) return;
      setLiveData(data);
      setSelectionRequests(data.selectionRequests);
      setChallengeItems(data.challenges);
      setInviteItems(data.employerInvites);
      setWalletCardItems(data.employerWalletCards);
      setProviderProfileItems(data.providerProfiles);
      setBenefitItems(data.benefits);

      const enabledMap = await fetchEmployerEnabledBenefits();
      if (active) setEmployerEnabledBenefits(enabledMap);
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

  const handleToggleEmployerBenefit = (employerId: string, benefitId: string) => {
    const current = employerEnabledBenefits[employerId] ?? [];
    const next = toggleBenefitId(current, benefitId);
    const enabled = next.includes(benefitId);
    setEmployerEnabledBenefits((state) => ({
      ...state,
      [employerId]: next
    }));
    void setEmployerBenefitEnabled(employerId, benefitId, enabled);
  };

  const handleToggleEmployerProvider = (employerId: string, benefitIds: string[], selected: boolean) => {
    const next = setBenefitIds(employerEnabledBenefits[employerId] ?? [], benefitIds, selected);
    setEmployerEnabledBenefits((state) => ({
      ...state,
      [employerId]: next
    }));
    void setEmployerBenefitsEnabled(employerId, benefitIds, selected);
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

  const handlePayForPerk = (input: {
    employee: User;
    companyId: string;
    employerId?: string;
    benefit: Benefit;
  }) => {
    return handlePayForPerks({
      ...input,
      benefits: [input.benefit]
    });
  };

  const handlePayForPerks = (input: {
    employee: User;
    companyId: string;
    employerId?: string;
    benefits: Benefit[];
  }) => {
    if (!input.benefits.length) return false;
    const balance = employeePoints[input.employee.id] ?? 0;
    const totalPoints = input.benefits.reduce((sum, benefit) => sum + benefit.pointsPrice, 0);
    if (balance < totalPoints) return false;

    setEmployeePoints((current) => ({
      ...current,
      [input.employee.id]: balance - totalPoints
    }));

    const now = new Date().toISOString();
    const request: SelectionRequest = {
      id: `request_${Date.now()}`,
      employeeId: input.employee.id,
      employeeName: input.employee.name,
      employerId: input.employerId,
      benefitIds: input.benefits.map((benefit) => benefit.id),
      total: input.benefits.reduce((sum, benefit) => sum + benefit.price, 0),
      totalPoints,
      status: "approved",
      createdAt: now,
      approvedAt: now
    };

    setSelectionRequests((current) => [request, ...current]);

    void createSelectionRequest({
      employeeId: input.employee.id,
      employerId: input.employerId,
      companyId: input.companyId || undefined,
      benefitIds: request.benefitIds,
      benefits: input.benefits
    });

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
          {session ? (
            <AppHeader
              session={session}
              onLogout={() => setSession(null)}
            />
          ) : null}
          {session ? (
            <RoleRouter
              session={session}
              appData={appData}
              selectionRequests={selectionRequests}
              employeePoints={employeePoints}
              rewardEvents={rewardEvents}
              employeeInvites={employeeInvites}
              bonusBudgetByEmployee={bonusBudgetByEmployee}
              onLogout={() => setSession(null)}
              onSubmitSelection={(request) => {
                setSelectionRequests((current) => [request, ...current]);
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
              employerEnabledBenefits={employerEnabledBenefits}
              enabledBenefitIds={employerEnabledBenefits[session.user.id] ?? []}
              onToggleBenefit={(benefitId) => handleToggleEmployerBenefit(session.user.id, benefitId)}
              onToggleProvider={(benefitIds, selected) =>
                handleToggleEmployerProvider(session.user.id, benefitIds, selected)
              }
              onPayForPerk={(benefit) => {
                if (session.user.role !== "employee") return false;
                const company = appData.companies.find((item) => item.id === session.user.companyId);
                const employerId =
                  company?.employerId ??
                  appData.users.find(
                    (user) => user.role === "employer" && user.companyId === session.user.companyId
                  )?.id;
                return handlePayForPerk({
                  employee: session.user,
                  companyId: session.user.companyId ?? company?.id ?? "",
                  employerId,
                  benefit
                });
              }}
              onPayForPerks={(benefits) => {
                if (session.user.role !== "employee") return false;
                const company = appData.companies.find((item) => item.id === session.user.companyId);
                const employerId =
                  company?.employerId ??
                  appData.users.find(
                    (user) => user.role === "employer" && user.companyId === session.user.companyId
                  )?.id;
                return handlePayForPerks({
                  employee: session.user,
                  companyId: session.user.companyId ?? company?.id ?? "",
                  employerId,
                  benefits
                });
              }}
            />
          ) : (
            <LoginScreen
              onLogin={loginWithCredentials}
              onStartSession={startSessionForUser}
              onJoinWithInvite={handleJoinWithInvite}
              onForgotPassword={forgotPassword}
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
  onLogout
}: {
  session: Session | null;
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
        {session ? <LogoutButton onPress={onLogout} /> : null}
      </View>
    </View>
  );
}

type SignupRole = Extract<Role, "employer" | "business">;

type SignupPath = "employee" | "employer" | "provider";

function LoginScreen({
  onLogin,
  onStartSession,
  onJoinWithInvite,
  onForgotPassword,
  appData
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
  appData: AppData;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [signupPath, setSignupPath] = useState<SignupPath>("employer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  const isLogin = mode === "login";

  const clearFeedback = () => {
    setMessage("");
    setNotice("");
  };

  const submitLogin = async () => {
    clearFeedback();
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
    clearFeedback();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage("Enter your email first.");
      return;
    }
    const ok = await onForgotPassword(trimmedEmail);
    setNotice(ok ? `Reset link sent to ${trimmedEmail}.` : "Could not send reset link.");
  };

  const submitSignup = async (role: SignupRole) => {
    clearFeedback();
    const trimmedPassword = password.trim();
    if (trimmedPassword.length < 6) {
      setMessage("Password needs at least 6 characters.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) {
      setMessage("Fill in all fields.");
      return;
    }

    const matchedCompany = appData.companies.find(
      (company) => company.name.toLowerCase() === companyName.trim().toLowerCase()
    );

    await onStartSession(
      {
        id: `local_${role}_${Date.now()}`,
        name: trimmedName,
        email: trimmedEmail,
        role,
        companyId: role === "employer" ? matchedCompany?.id : undefined,
        businessId: role === "business" ? `business_${Date.now()}` : undefined
      },
      trimmedPassword
    );
  };

  const submitInviteJoin = async () => {
    clearFeedback();
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
      setMessage("Fill in all fields.");
      return;
    }

    const ok = await onJoinWithInvite({
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPassword,
      birthDate: trimmedBirthDate,
      inviteCode: trimmedInviteCode
    });
    if (!ok) setMessage("Invalid invite code.");
  };

  const handleContinue = () => {
    if (isLogin) {
      void submitLogin();
      return;
    }
    if (signupPath === "employee") void submitInviteJoin();
    else if (signupPath === "employer") void submitSignup("employer");
    else void submitSignup("business");
  };

  const continueLabel = isLogin ? "Continue" : signupPath === "employee" ? "Join" : "Create account";

  const roleOptions: Array<{ id: SignupPath; label: string }> = [
    { id: "employee", label: "Employee" },
    { id: "employer", label: "Employer" },
    { id: "provider", label: "Provider" }
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.loginScreen}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.loginBrand}>
        <View style={styles.loginLogo}>
          <AppIcon name="bullseye" size={30} color={colors.onPrimary} />
        </View>
        <Text style={styles.loginTitle}>{isLogin ? "Log in" : "Sign up"}</Text>
      </View>

      <GlassPanel style={styles.loginCard} intensity={40}>
        {!isLogin ? (
          <View style={styles.loginRoleStack}>
            {roleOptions.map((option) => {
              const active = signupPath === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    clearFeedback();
                    setSignupPath(option.id);
                  }}
                  style={[styles.loginRoleButton, active && styles.loginRoleButtonActive]}
                >
                  <Text style={[styles.loginRoleButtonText, active && styles.loginRoleButtonTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {!isLogin && signupPath === "employee" ? (
          <>
            <LoginField
              icon="account-outline"
              value={name}
              onChangeText={setName}
              placeholder="Full name"
            />
            <LoginField
              icon="calendar-outline"
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="Birthdate (YYYY-MM-DD)"
            />
            <LoginField
              icon="ticket-outline"
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Invite code"
              autoCapitalize="characters"
            />
          </>
        ) : null}

        {!isLogin && (signupPath === "employer" || signupPath === "provider") ? (
          <>
            <LoginField
              icon={signupPath === "provider" ? "store-outline" : "account-outline"}
              value={name}
              onChangeText={setName}
              placeholder={signupPath === "provider" ? "Business name" : "Full name"}
            />
            {signupPath === "employer" ? (
              <LoginField
                icon="domain"
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Company"
              />
            ) : null}
          </>
        ) : null}

        <LoginField
          icon="email-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View>
          <LoginField
            icon="lock-outline"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            trailing={
              <Pressable onPress={() => setShowPassword((current) => !current)} hitSlop={8}>
                <AppIcon
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.soft}
                />
              </Pressable>
            }
          />
          {isLogin ? (
            <Pressable onPress={() => void submitForgotPassword()} style={styles.loginForgotLink}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          ) : null}
        </View>

        <CapsuleButton
          label={continueLabel}
          onPress={handleContinue}
          variant="dark"
          style={styles.loginContinue}
        />

        {message ? <Text style={styles.errorText}>{message}</Text> : null}
        {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}
      </GlassPanel>

      <Pressable
        onPress={() => {
          clearFeedback();
          if (isLogin) {
            setMode("signup");
            setSignupPath("employer");
          } else {
            setMode("login");
          }
        }}
        style={styles.loginFooterLink}
      >
        <Text style={styles.loginFooterText}>
          {isLogin ? (
            <>
              New here? <Text style={styles.loginFooterAction}>Create an account</Text>
            </>
          ) : (
            <>
              Already have an account? <Text style={styles.loginFooterAction}>Log in</Text>
            </>
          )}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function LoginField({
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  trailing
}: {
  icon: ComponentProps<typeof AppIcon>["name"];
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "characters" | "sentences" | "words";
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.loginFieldWrap}>
      <AppIcon name={icon} size={20} color={colors.soft} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.soft}
        style={styles.loginFieldInput}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
      />
      {trailing}
    </View>
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
  onLogout,
  onSubmitSelection,
  onUpdateProviderProfile,
  onAddOffer,
  onCreateChallenge,
  onCompleteChallenge,
  onGrantReward,
  onSendEmployeeInvite,
  employerEnabledBenefits,
  enabledBenefitIds,
  onToggleBenefit,
  onToggleProvider,
  onPayForPerk,
  onPayForPerks
}: {
  session: Session;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  employeePoints: Record<string, number>;
  rewardEvents: RewardEvent[];
  employeeInvites: EmployeeInvite[];
  bonusBudgetByEmployee: Record<string, number>;
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
  employerEnabledBenefits: Record<string, string[]>;
  enabledBenefitIds: string[];
  onToggleBenefit: (benefitId: string) => void;
  onToggleProvider: (benefitIds: string[], selected: boolean) => void;
  onPayForPerk: (benefit: Benefit) => boolean;
  onPayForPerks: (benefits: Benefit[]) => boolean;
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
        enabledBenefitIds={enabledBenefitIds}
        onToggleBenefit={onToggleBenefit}
        onToggleProvider={onToggleProvider}
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
      appData={{
        ...appData,
        benefits: filterBenefitsForEmployee(appData, session.user, employerEnabledBenefits)
      }}
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
      onPayForPerk={onPayForPerk}
      onPayForPerks={onPayForPerks}
    />
  );
}

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
  EmployerWalletCard,
  EmployerInvite,
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

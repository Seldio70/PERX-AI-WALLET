import { StatusBar } from "expo-status-bar";
import { Building2, Store, UserRound } from "lucide-react-native";
import { ComponentProps, ReactNode, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
  Alert
} from "react-native";
import { AppIcon } from "./src/components/AppIcon";
import { CapsuleButton } from "./src/components/CapsuleButton";
import { LogoutButton } from "./src/components/LogoutButton";
import { MeshBackground } from "./src/components/MeshBackground";
import { ScreenTransition } from "./src/components/ScreenTransition";
import { getSupabaseClient } from "./src/lib/supabase";
import {
  createPlatformUser,
  createSelectionRequest,
  createChallengeDefinition,
  archiveChallengeDefinition,
  submitChallengeProgress,
  grantSpotReward,
  fetchEmployerEnabledBenefits,
  fetchPerxLiveData,
  PerxLiveData,
  recordEmployeeLoginDay,
  requestPasswordReset,
  seedPlatformChallengeDefinitions,
  setEmployerBenefitEnabled,
  setEmployerBenefitsEnabled,
  setEmployerChallengeTemplateEnabled,
  signInPlatformUser,
  signInOrSignUpPlatformAuth,
  updateUserPointsBalance
} from "./src/lib/perxRepository";
import {
  employeesForEmployer,
  collectEmployerIds,
  canonicalEmployerId,
  employeesForEmployerUser,
  ensureProgressForDefinitions,
  isPersistedChallengeId,
  evaluateAndCompleteChallenges,
  resolveEmployerIdForUser,
  targetEmployeeIdsForDefinition
} from "./src/lib/challengeService";
import { defaultPlatformDefinitions } from "./src/lib/challengePlatformTemplates";
import {
  requestAppleHealthAccess,
  syncEmployeeHealthData,
  EmployeeHealthSnapshot
} from "./src/lib/healthDataService";
import { notify, registerForPushNotifications } from "./src/lib/notifications";
import { BusinessExperience } from "./src/screens/BusinessScreen";
import { EmployeeExperience } from "./src/screens/EmployeeScreens";
import { EmployerExperience } from "./src/screens/EmployerScreen";
import { filterBenefitsForEmployee, setBenefitIds, toggleBenefitId } from "./src/lib/employerCatalog";
import { styles } from "./src/styles/appStyles";
import { colors } from "./src/theme";
import {
  Benefit,
  ChallengeCriterion,
  ChallengeDefinition,
  ChallengeProgress,
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
  challengeDefinitions: [],
  challengeProgress: [],
  disabledChallengeTemplates: {},
  employeeLoginDays: {},
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
  const [challengeDefinitions, setChallengeDefinitions] = useState<ChallengeDefinition[]>([]);
  const [challengeProgress, setChallengeProgress] = useState<ChallengeProgress[]>([]);
  const [disabledChallengeTemplates, setDisabledChallengeTemplates] = useState<Record<string, string[]>>({});
  const [employeeLoginDays, setEmployeeLoginDays] = useState<Record<string, string[]>>({});
  const [employeeHealthMetrics, setEmployeeHealthMetrics] = useState<
    Record<string, EmployeeHealthSnapshot>
  >({});
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
    challengeDefinitions,
    challengeProgress,
    disabledChallengeTemplates,
    employeeLoginDays,
    challenges: []
  };

  useEffect(() => {
    let active = true;

    fetchPerxLiveData().then(async (data) => {
      if (!active || !data) return;
      setLiveData(data);
      setSelectionRequests(data.selectionRequests);
      let definitions = data.challengeDefinitions;
      const employerIds = collectEmployerIds(data.users, data.companies);
      for (const employerId of employerIds) {
        const seeded = await seedPlatformChallengeDefinitions(employerId);
        definitions = [
          ...definitions.filter(
            (item) => !(item.employerId === employerId && item.source === "platform")
          ),
          ...seeded
        ];
      }
      setChallengeDefinitions(definitions);
      setChallengeProgress(data.challengeProgress);
      setDisabledChallengeTemplates(data.disabledChallengeTemplates);
      setEmployeeLoginDays(data.employeeLoginDays);
      setInviteItems(data.employerInvites);
      setWalletCardItems(data.employerWalletCards);
      setProviderProfileItems(data.providerProfiles);
      setBenefitItems(data.benefits);

      const enabledMap = await fetchEmployerEnabledBenefits();
      if (active) setEmployerEnabledBenefits(enabledMap);

      // Seed employee points from DB so balances survive reload
      const dbPoints: Record<string, number> = {};
      for (const u of data.users) {
        if (u.role === "employee") dbPoints[u.id] = u.pointsBalance ?? 0;
      }
      if (active) setEmployeePoints(dbPoints);
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
      setRewardEvents(createDemoRewardEvents(employee.id, employee.name));
    }

    void (async () => {
      if (employerId && !challengeDefinitions.some((item) => item.employerId === employerId)) {
        const seeded = await seedPlatformChallengeDefinitions(employerId);
        setChallengeDefinitions((current) => {
          const withoutEmployer = current.filter((item) => item.employerId !== employerId);
          return [...seeded, ...withoutEmployer];
        });
      } else if (employerId && !challengeDefinitions.length) {
        setChallengeDefinitions(defaultPlatformDefinitions(employerId));
      }
    })();

    if (!employeeInvites.length) {
      setEmployeeInvites(createDemoInvites(employerId, companyId, companyName));
    }
    setDemoSeeded(true);
  }, [
    appData.companies,
    appData.users,
    challengeDefinitions,
    demoSeeded,
    employeeInvites.length
  ]);

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

    if (sessionUser.role === "employee") {
      const employerId = resolveEmployerIdForUser(
        [...mergedUsers, sessionUser],
        appData.companies,
        sessionUser
      );
      if (employerId) {
        const companyId = sessionUser.companyId ?? appData.companies[0]?.id ?? "";
        const employees = employeesForEmployer([...mergedUsers, sessionUser], companyId, employerId);
        const definitions = challengeDefinitions.filter(
          (definition) =>
            definition.active &&
            (definition.source === "platform" || definition.employerId === employerId)
        );
        const progress = await ensureProgressForDefinitions({
          definitions,
          employees: [sessionUser],
          existingProgress: challengeProgress
        });
        setChallengeProgress((current) => {
          const merged = [...current];
          for (const row of progress) {
            const idx = merged.findIndex(
              (item) => item.definitionId === row.definitionId && item.employeeId === row.employeeId
            );
            if (idx >= 0) merged[idx] = row;
            else merged.push(row);
          }
          return merged;
        });
      }
    }
  };

  const challengeDefinitionFingerprint = useMemo(
    () =>
      challengeDefinitions
        .map((definition) => definition.id)
        .sort()
        .join(","),
    [challengeDefinitions]
  );

  useEffect(() => {
    if (!session?.user || session.user.role !== "employee") return;

    void recordEmployeeLoginDay(session.user.id).then((dates) => {
      setEmployeeLoginDays((current) => ({ ...current, [session.user.id]: dates }));
    });

    void syncEmployeeHealthData().then(async (snapshot) => {
      setEmployeeHealthMetrics((current) => ({ ...current, [session.user.id]: snapshot }));
      await runChallengeEvaluation({ employee: session.user });
    });

    void registerForPushNotifications();
  }, [session?.user?.id, session?.user?.role]);

  useEffect(() => {
    if (!session?.user || session.user.role !== "employee") return;
    if (!challengeDefinitions.length) return;

    const employerId = resolveEmployerIdForUser(mergedUsers, appData.companies, session.user);
    if (!employerId) return;

    const hasRelevantDefinitions = challengeDefinitions.some(
      (definition) =>
        definition.active &&
        (definition.source === "platform" || definition.employerId === employerId)
    );
    if (!hasRelevantDefinitions) return;

    void runChallengeEvaluation({ employee: session.user });
  }, [session?.user?.id, session?.user?.role, challengeDefinitionFingerprint]);

  const runChallengeEvaluation = async (input: {
    employee: User;
    completedBy?: "auto" | "employer_override";
    forceDefinitionId?: string;
  }) => {
    const employerId = resolveEmployerIdForUser(mergedUsers, appData.companies, input.employee);
    if (!employerId || input.employee.role !== "employee") return;

    const companyId = input.employee.companyId ?? appData.companies[0]?.id ?? "";
    const employees = employeesForEmployer(mergedUsers, companyId, employerId);
    const definitions = challengeDefinitions.filter(
      (definition) =>
        definition.active &&
        (definition.source === "platform" || definition.employerId === employerId)
    );

    const progress = await ensureProgressForDefinitions({
      definitions,
      employees: [input.employee],
      existingProgress: challengeProgress
    });
    setChallengeProgress(progress);

    const loginDates =
      employeeLoginDays[input.employee.id] ??
      (await recordEmployeeLoginDay(input.employee.id));

    const healthMetrics = employeeHealthMetrics[input.employee.id];

    const result = await evaluateAndCompleteChallenges({
      definitions,
      progressRows: progress,
      employee: input.employee,
      employerId,
      employees,
      disabledTemplateKeys: disabledChallengeTemplates[employerId] ?? [],
      selectionRequests,
      benefits: benefitItems,
      loginDates,
      healthMetrics,
      employeePoints,
      completedBy: input.completedBy,
      forceDefinitionId: input.forceDefinitionId
    });

    setChallengeProgress(result.progressRows);

    if (result.expiredDefinitionIds.length) {
      setChallengeDefinitions((current) =>
        current.map((definition) =>
          result.expiredDefinitionIds.includes(definition.id)
            ? { ...definition, active: false }
            : definition
        )
      );
    }

    const employeeId = input.employee.id;
    const delta = result.employeePointsDelta[employeeId];
    if (delta !== undefined) {
      setEmployeePoints((current) => {
        const next = { ...current, [employeeId]: (current[employeeId] ?? 0) + delta };
        return next;
      });
    }

    if (result.rewardEvents.length) {
      setRewardEvents((current) => [...result.rewardEvents, ...current]);
      if (input.employee.id === session?.user?.id) {
        for (const event of result.rewardEvents) {
          void notify.challengeCompleted(event.note, event.points);
        }
      }
    }
  };

  const handleCreateChallenge = async (input: {
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
  }): Promise<boolean> => {
    const employerId = canonicalEmployerId(appData.companies, mergedUsers, input.employerId);
    const definition = await createChallengeDefinition({ ...input, employerId });
    if (!definition) return false;

    setChallengeDefinitions((current) => [definition, ...current]);

    const employees = employeesForEmployerUser(mergedUsers, appData.companies, input.employerId);
    const employeeIds = targetEmployeeIdsForDefinition(definition, employees);
    const nextProgress = await ensureProgressForDefinitions({
      definitions: [definition],
      employees: employees.filter((employee) => employeeIds.includes(employee.id)),
      existingProgress: challengeProgress
    });
    setChallengeProgress(nextProgress);

    for (const employee of employees) {
      void notify.challengeCreated(definition.title);
    }

    if (!isPersistedChallengeId(definition.id)) {
      Alert.alert(
        "Challenge created (this session)",
        "Challenge database tables are not set up in Supabase yet. Run npm run setup:challenges, then reload the app so challenges persist and sync to all employees."
      );
    }

    return true;
  };

  const handleArchiveChallenge = async (definitionId: string) => {
    const ok = await archiveChallengeDefinition(definitionId);
    if (!ok) return;
    setChallengeDefinitions((current) =>
      current.map((definition) =>
        definition.id === definitionId ? { ...definition, active: false } : definition
      )
    );
  };

  const handleSubmitChallenge = async (definitionId: string, employee: User) => {
    const progressRow = challengeProgress.find(
      (row) => row.definitionId === definitionId && row.employeeId === employee.id && row.status === "open"
    );
    if (!progressRow) return;

    const updated = await submitChallengeProgress({ progressId: progressRow.id });
    if (!updated) return;

    setChallengeProgress((current) =>
      current.map((row) => (row.id === updated.id ? updated : row))
    );
  };

  const handleCompleteChallenge = async (definitionId: string, employerId: string) => {
    const definition = challengeDefinitions.find((item) => item.id === definitionId);
    if (!definition) return;

    const company = appData.companies.find((item) => item.employerId === employerId);
    const allEmployees = employeesForEmployer(mergedUsers, company?.id ?? "", employerId);

    const progress = await ensureProgressForDefinitions({
      definitions: [definition],
      employees: allEmployees,
      existingProgress: challengeProgress
    });
    setChallengeProgress((current) => {
      const merged = [...current];
      for (const row of progress) {
        const idx = merged.findIndex(
          (item) => item.definitionId === row.definitionId && item.employeeId === row.employeeId
        );
        if (idx >= 0) merged[idx] = row;
        else merged.push(row);
      }
      return merged;
    });

    for (const employee of allEmployees) {
      await runChallengeEvaluation({
        employee,
        completedBy: "employer_override",
        forceDefinitionId: definitionId
      });
    }
  };

  const handleCompleteChallengeForEmployee = async (
    definitionId: string,
    employerId: string,
    employeeId: string
  ) => {
    const definition = challengeDefinitions.find((item) => item.id === definitionId);
    const employee = mergedUsers.find((user) => user.id === employeeId);
    if (!definition || !employee) return;

    const progress = await ensureProgressForDefinitions({
      definitions: [definition],
      employees: [employee],
      existingProgress: challengeProgress
    });
    setChallengeProgress((current) => {
      const merged = [...current];
      for (const row of progress) {
        const idx = merged.findIndex(
          (item) => item.definitionId === row.definitionId && item.employeeId === row.employeeId
        );
        if (idx >= 0) merged[idx] = row;
        else merged.push(row);
      }
      return merged;
    });

    await runChallengeEvaluation({
      employee,
      completedBy: "employer_override",
      forceDefinitionId: definitionId
    });
  };

  const handleConnectAppleHealth = async (employeeId: string) => {
    const snapshot = await requestAppleHealthAccess();
    setEmployeeHealthMetrics((current) => ({ ...current, [employeeId]: snapshot }));
    const employee = mergedUsers.find((user) => user.id === employeeId);
    if (employee) {
      await runChallengeEvaluation({ employee });
    }
  };

  const handleToggleChallengeTemplate = (employerId: string, templateKey: string, enabled: boolean) => {
    setDisabledChallengeTemplates((current) => {
      const existing = current[employerId] ?? [];
      const next = enabled
        ? existing.filter((key) => key !== templateKey)
        : Array.from(new Set([...existing, templateKey]));
      return { ...current, [employerId]: next };
    });
    void setEmployerChallengeTemplateEnabled(employerId, templateKey, enabled);
  };

  const handleGrantReward = async (input: {
    employeeId: string;
    employeeName: string;
    kind: RewardEvent["kind"];
    points: number;
    note: string;
  }) => {
    const currentBalance = employeePoints[input.employeeId] ?? 0;
    const newBalance = currentBalance + input.points;
    setEmployeePoints((current) => ({ ...current, [input.employeeId]: newBalance }));
    await grantSpotReward({
      employeeId: input.employeeId,
      rewardPoints: input.points,
      note: input.note,
      newBalance
    });
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

    const newBalance = balance - totalPoints;
    setEmployeePoints((current) => ({
      ...current,
      [input.employee.id]: newBalance
    }));
    updateUserPointsBalance(input.employee.id, newBalance);

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

    void runChallengeEvaluation({ employee: input.employee });

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
              appData={appData}
              onLogout={() => setSession(null)}
            />
          ) : null}
          <ScreenTransition
            transitionKey={session ? `session-${session.user.id}-${session.user.role}` : "login"}
            style={{ flex: 1 }}
            distance={12}
            duration={260}
          >
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
                onArchiveChallenge={handleArchiveChallenge}
                onCompleteChallenge={handleCompleteChallenge}
                onCompleteChallengeForEmployee={handleCompleteChallengeForEmployee}
                onToggleChallengeTemplate={handleToggleChallengeTemplate}
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
                employeeHealthMetrics={employeeHealthMetrics}
                onConnectAppleHealth={handleConnectAppleHealth}
                onSubmitChallenge={handleSubmitChallenge}
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
          </ScreenTransition>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function headerDisplayName(session: Session, appData: AppData): string {
  const { user } = session;
  if (user.role === "business") {
    const profile = appData.providerProfiles.find((item) => item.userId === user.id);
    return profile?.businessName ?? user.name;
  }
  return user.name;
}

function AppHeader({
  session,
  appData,
  onLogout
}: {
  session: Session;
  appData: AppData;
  onLogout: () => void;
}) {
  const displayName = headerDisplayName(session, appData);

  return (
    <View style={styles.header}>
      <View style={styles.headerBrand}>
        <Text style={styles.brand}>PerX</Text>
        <Text style={styles.headerUserName} numberOfLines={1}>
          {displayName}
        </Text>
      </View>
      <View style={styles.headerActions}>
        <LogoutButton onPress={onLogout} />
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

      <View style={styles.loginCard}>
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
      </View>

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
        style={[styles.loginFieldInput, Platform.OS === "web" && styles.loginFieldInputWeb]}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
        underlineColorAndroid="transparent"
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
  onArchiveChallenge,
  onCompleteChallenge,
  onCompleteChallengeForEmployee,
  onToggleChallengeTemplate,
  onGrantReward,
  onSendEmployeeInvite,
  employerEnabledBenefits,
  enabledBenefitIds,
  onToggleBenefit,
  onToggleProvider,
  onPayForPerk,
  onPayForPerks,
  employeeHealthMetrics = {},
  onConnectAppleHealth,
  onSubmitChallenge
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
  onCreateChallenge: (input: {
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
  }) => void | Promise<boolean>;
  onArchiveChallenge?: (definitionId: string) => void | Promise<void>;
  onCompleteChallenge: (definitionId: string, employerId: string) => void | Promise<void>;
  onCompleteChallengeForEmployee?: (
    definitionId: string,
    employerId: string,
    employeeId: string
  ) => void | Promise<void>;
  onToggleChallengeTemplate: (employerId: string, templateKey: string, enabled: boolean) => void;
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
  employeeHealthMetrics?: Record<string, EmployeeHealthSnapshot>;
  onConnectAppleHealth?: (employeeId: string) => void | Promise<void>;
  onSubmitChallenge?: (definitionId: string, employee: User) => void | Promise<void>;
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
        onArchiveChallenge={onArchiveChallenge}
        onCompleteChallenge={onCompleteChallenge}
        onCompleteChallengeForEmployee={onCompleteChallengeForEmployee}
        onToggleChallengeTemplate={onToggleChallengeTemplate}
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
      challengeDefinitions={appData.challengeDefinitions}
      challengeProgress={appData.challengeProgress}
      disabledChallengeTemplates={appData.disabledChallengeTemplates}
      employeeLoginDays={appData.employeeLoginDays}
      employeeHealthMetrics={employeeHealthMetrics[session.user.id]}
      onConnectAppleHealth={
        onConnectAppleHealth ? () => onConnectAppleHealth(session.user.id) : undefined
      }
      onSubmitChallenge={
        onSubmitChallenge ? (definitionId) => onSubmitChallenge(definitionId, session.user) : undefined
      }
      onPayForPerk={onPayForPerk}
      onPayForPerks={onPayForPerks}
    />
  );
}

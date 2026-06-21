import {
  Calendar,
  Check,
  ChevronRight,
  CircleDollarSign,
  Gift,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  X
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { AppIcon } from "../components/AppIcon";
import { BottomNav, NavTab } from "../components/BottomNav";
import { CapsuleButton } from "../components/CapsuleButton";
import { GlassPanel } from "../components/GlassPanel";
import { Section } from "../components/Section";
import { UserProfileScreen } from "../components/UserProfileScreen";
import { currency, market } from "../lib/format";
import { groupProvidersWithOffers } from "../lib/employerCatalog";
import { employerSettlementStats } from "../lib/perkPayment";
import {
  defaultRewardAutomations,
  formatDateLabel,
  generateInviteCode,
  rewardKindLabel
} from "../lib/rewardsDemo";
import { buildEmployerChallengeStats, employerDefinitionSummary } from "../lib/challengeEvaluator";
import {
  awardsUsedForDefinition,
  canAwardMore,
  computeChallengeAnalytics
} from "../lib/challengeService";
import {
  PlatformTemplateKey
} from "../lib/challengePlatformTemplates";
import { PerxLiveData } from "../lib/perxRepository";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import {
  Benefit,
  ChallengeCriterion,
  ChallengeDefinition,
  ChallengeProgress,
  EmployeeInvite,
  ProviderProfile,
  RewardAutomation,
  RewardEvent,
  SelectionRequest,
  User
} from "../types";

type AppData = PerxLiveData;

type EmployerTab = "home" | "employees" | "catalog" | "activity" | "profile";

const employerTabs: Array<NavTab<EmployerTab>> = [
  { id: "home", label: "Home", icon: "home-outline", iconActive: "home" },
  { id: "employees", label: "Team", icon: "account-group-outline", iconActive: "account-group" },
  { id: "catalog", label: "Providers", icon: "store-outline", iconActive: "store" },
  { id: "activity", label: "Activity", icon: "chart-box-outline", iconActive: "chart-box" },
  { id: "profile", label: "Profile", icon: "account-circle-outline", iconActive: "account-circle" }
];

export function EmployerExperience({
  user,
  appData,
  selectionRequests,
  onLogout,
  employeePoints = {},
  rewardEvents = [],
  employeeInvites = [],
  onCreateChallenge,
  onArchiveChallenge,
  onCompleteChallenge,
  onCompleteChallengeForEmployee,
  onToggleChallengeTemplate,
  onGrantReward,
  onSendEmployeeInvite,
  enabledBenefitIds = [],
  onToggleBenefit,
  onToggleProvider
}: {
  user: User;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onLogout: () => void;
  employeePoints?: Record<string, number>;
  rewardEvents?: RewardEvent[];
  employeeInvites?: EmployeeInvite[];
  onCreateChallenge?: (input: {
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
  onCompleteChallenge?: (definitionId: string, employerId: string) => void | Promise<void>;
  onCompleteChallengeForEmployee?: (
    definitionId: string,
    employerId: string,
    employeeId: string
  ) => void | Promise<void>;
  onToggleChallengeTemplate?: (employerId: string, templateKey: string, enabled: boolean) => void;
  onGrantReward?: (input: {
    employeeId: string;
    employeeName: string;
    kind: RewardEvent["kind"];
    points: number;
    note: string;
  }) => void;
  onSendEmployeeInvite?: (invite: EmployeeInvite) => void;
  enabledBenefitIds?: string[];
  onToggleBenefit?: (benefitId: string) => void;
  onToggleProvider?: (benefitIds: string[], selected: boolean) => void;
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
  const employerScopeId = company.employerId ?? user.id;
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

  const redemptionsCount = selectionRequests.filter((request) => request.status === "approved").length;
  const settlement = useMemo(
    () => employerSettlementStats(user.id, selectionRequests),
    [user.id, selectionRequests]
  );

  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const detailEmployee = employees.find((employee) => employee.id === detailEmployeeId) ?? null;
  const companyInvites = employeeInvites.filter((invite) => invite.companyId === company.id);
  const enabledPerksCount = enabledBenefitIds.length;
  const employerDefinitions = useMemo(
    () =>
      appData.challengeDefinitions.filter(
        (definition) =>
          definition.active &&
          (definition.employerId === employerScopeId || definition.employerId === user.id)
      ),
    [appData.challengeDefinitions, employerScopeId, user.id]
  );
  const openChallengeCount = useMemo(() => {
    const openIds = new Set(
      appData.challengeProgress
        .filter((row) => row.status === "open")
        .map((row) => row.definitionId)
    );
    return employerDefinitions.filter((definition) => openIds.has(definition.id)).length;
  }, [appData.challengeProgress, employerDefinitions]);
  const providerGroups = useMemo(
    () => groupProvidersWithOffers(appData.providerProfiles, appData.benefits),
    [appData.providerProfiles, appData.benefits]
  );
  const recentRedemptions = useMemo(
    () => selectionRequests.slice(0, 3),
    [selectionRequests]
  );

  const statsFor = (employeeId: string): EmployeeStats => {
    const reqs = selectionRequests.filter((request) => request.employeeId === employeeId);
    const used = reqs
      .filter((request) => request.status === "approved")
      .reduce((sum, request) => sum + request.total, 0);
    const pending = reqs
      .filter((request) => request.status === "pending" || request.status === "draft")
      .reduce((sum, request) => sum + request.total, 0);
    const budget = budgets[employeeId] ?? 0;
    return {
      reqs,
      used,
      pending,
      budget,
      available: Math.max(0, budget - used - pending),
      redemptions: reqs.length
    };
  };

  return (
    <View style={styles.roleShell}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, styles.employeeContent]}
        showsVerticalScrollIndicator={false}
      >
        {tab === "home" ? (
          <>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.greetingText}>Hi, {user.name.split(" ")[0]}</Text>
          <Text style={styles.greetingSub}>{company.name} · Team overview and activity.</Text>
        </View>
      </View>

      <View style={styles.employerStatGrid}>
        <View style={styles.employerStatCapsule}>
          <Users size={14} color={colors.primary} />
          <Text style={styles.employerStatValue}>{employees.length}</Text>
          <Text style={styles.employerStatLabel}>Team</Text>
        </View>
        <View style={styles.employerStatCapsule}>
          <CircleDollarSign size={14} color={colors.secondary} />
          <Text style={styles.employerStatValue}>{redemptionsCount}</Text>
          <Text style={styles.employerStatLabel}>Redeemed</Text>
        </View>
        <View style={styles.employerStatCapsule}>
          <Store size={14} color={colors.tertiary} />
          <Text style={styles.employerStatValue}>{enabledPerksCount}</Text>
          <Text style={styles.employerStatLabel}>Perks</Text>
        </View>
        <View style={styles.employerStatCapsule}>
          <Pressable onPress={() => setTab("activity")} style={styles.employerStatPressable}>
            <Trophy size={14} color={colors.accent} />
            <Text style={styles.employerStatValue}>{openChallengeCount}</Text>
            <Text style={styles.employerStatLabel}>Challenges</Text>
          </Pressable>
        </View>
        <View style={styles.employerStatCapsule}>
          <Sparkles size={14} color={colors.primary} />
          <Text style={styles.employerStatValue}>{settlement.pointsRedeemed}</Text>
          <Text style={styles.employerStatLabel}>Pts used</Text>
        </View>
        <View style={styles.employerStatCapsule}>
          <Wallet size={14} color={colors.secondary} />
          <Text style={styles.employerStatValue} numberOfLines={1}>
            {settlement.paidToProviders >= 1000
              ? `${Math.round(settlement.paidToProviders / 1000)}k`
              : settlement.paidToProviders}
          </Text>
          <Text style={styles.employerStatLabel}>Paid ALL</Text>
        </View>
      </View>

      {!enabledPerksCount ? (
        <GlassPanel style={styles.employerAlertCard} intensity={20}>
          <View style={styles.employerAlertIcon}>
            <Store size={18} color="#E65100" />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>No perks visible yet</Text>
            <Text style={styles.listSub}>
              Select providers in the catalog so employees can browse perks.
            </Text>
          </View>
          <Pressable onPress={() => setTab("catalog")}>
            <ChevronRight size={18} color={colors.primary} />
          </Pressable>
        </GlassPanel>
      ) : null}

      <Section title="Quick actions">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.employerActionRow}>
          <Pressable onPress={() => setTab("catalog")} style={styles.employerActionCapsule}>
            <Store size={15} color={colors.primary} />
            <Text style={styles.employerActionCapsuleText}>Providers</Text>
          </Pressable>
          <Pressable onPress={() => setTab("employees")} style={styles.employerActionCapsule}>
            <Users size={15} color={colors.secondary} />
            <Text style={styles.employerActionCapsuleText}>Team</Text>
          </Pressable>
          <Pressable onPress={() => setTab("activity")} style={styles.employerActionCapsule}>
            <Trophy size={15} color={colors.accent} />
            <Text style={styles.employerActionCapsuleText}>Challenges</Text>
          </Pressable>
          <Pressable onPress={() => { setTab("activity"); setChallengeModalOpen(true); }} style={styles.employerActionCapsule}>
            <Sparkles size={15} color={colors.primary} />
            <Text style={styles.employerActionCapsuleText}>New challenge</Text>
          </Pressable>
          <Pressable onPress={() => setInviteOpen(true)} style={styles.employerActionCapsule}>
            <UserPlus size={15} color={colors.tertiary} />
            <Text style={styles.employerActionCapsuleText}>Invite</Text>
          </Pressable>
        </ScrollView>
      </Section>

      <Section title="Recent activity" meta={recentRedemptions.length ? "Latest" : undefined}>
        {recentRedemptions.length ? (
          recentRedemptions.map((request) => {
            const requestBenefits = request.benefitIds
              .map((benefitId) => appData.benefits.find((benefit) => benefit.id === benefitId))
              .filter(Boolean) as Benefit[];
            const title =
              requestBenefits.map((benefit) => benefit.title).join(", ") || "Perk selection";

            return (
              <View key={request.id} style={styles.employerActivityRow}>
                <View style={styles.employerActivityDot} />
                <View style={styles.listText}>
                  <Text style={styles.employerActivityTitle} numberOfLines={1}>
                    {request.employeeName}
                  </Text>
                  <Text style={styles.employerActivitySub} numberOfLines={1}>
                    {title}
                  </Text>
                </View>
                <View style={styles.employerActivityMeta}>
                  <Text style={styles.employerActivityAmount}>{currency(request.total)}</Text>
                  <Text style={styles.employerActivityStatus}>
                    {request.status === "approved" ? "Settled" : "Pending"}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <CircleDollarSign size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No activity yet</Text>
              <Text style={styles.listSub}>Employee redemptions will appear here.</Text>
            </View>
          </View>
        )}
      </Section>
          </>
        ) : null}

        {tab === "activity" ? (
          <>
      <View style={[styles.adminHeader, styles.activityPageHeader]}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.greetingText}>Activity</Text>
          <Text style={styles.greetingSub}>Redemptions, challenges, and recognition settings.</Text>
        </View>
      </View>

      <ChallengesPage
        employerId={employerScopeId}
        definitions={employerDefinitions}
        progressRows={appData.challengeProgress}
        disabledTemplateKeys={appData.disabledChallengeTemplates[employerScopeId] ?? []}
        employees={employees}
        rewardEvents={rewardEvents}
        employeePoints={employeePoints}
        selectionRequests={selectionRequests}
        benefits={appData.benefits}
        onOpenCreate={() => setChallengeModalOpen(true)}
        onArchiveChallenge={onArchiveChallenge}
        onCompleteChallenge={onCompleteChallenge}
        onCompleteChallengeForEmployee={onCompleteChallengeForEmployee}
        onToggleChallengeTemplate={onToggleChallengeTemplate}
        onGrantReward={onGrantReward}
        onSelectEmployee={(id) => setDetailEmployeeId(id)}
      />
          </>
        ) : null}

        {tab === "employees" ? (
          <EmployeesPage
            employees={employees}
            budgets={budgets}
            employeeInvites={companyInvites}
            employeePoints={employeePoints}
            statsFor={statsFor}
            onOpenInvite={() => setInviteOpen(true)}
            onSelectEmployee={(id) => setDetailEmployeeId(id)}
          />
        ) : null}

        {tab === "catalog" ? (
          <ProviderCatalogPage
            providerProfiles={appData.providerProfiles}
            benefits={appData.benefits}
            enabledBenefitIds={enabledBenefitIds}
            onToggleBenefit={onToggleBenefit}
            onToggleProvider={onToggleProvider}
          />
        ) : null}

        {tab === "profile" ? <UserProfileScreen user={user} onLogout={onLogout} /> : null}
      </ScrollView>

      <BottomNav tabs={employerTabs} active={tab} onChange={setTab} />

      <InviteEmployeeModal
        visible={inviteOpen}
        companyName={company.name}
        companyId={company.id}
        employerId={user.id}
        onClose={() => setInviteOpen(false)}
        onSend={onSendEmployeeInvite}
      />

      <CreateChallengeModal
        visible={challengeModalOpen}
        employerId={employerScopeId}
        onClose={() => setChallengeModalOpen(false)}
        onCreate={async (input) => {
          if (!onCreateChallenge) {
            Alert.alert("Unavailable", "Challenge creation is not available right now.");
            return false;
          }
          return (await onCreateChallenge(input)) ?? false;
        }}
      />

      <EmployeeDetailModal
        visible={!!detailEmployee}
        employee={detailEmployee}
        stats={detailEmployee ? statsFor(detailEmployee.id) : null}
        benefits={appData.benefits}
        pointsBalance={detailEmployee ? employeePoints[detailEmployee.id] ?? 0 : 0}
        challengeDefinitions={employerDefinitions}
        challengeProgress={appData.challengeProgress}
        onClose={() => setDetailEmployeeId(null)}
      />
    </View>
  );
}

type EmployeeStats = {
  reqs: SelectionRequest[];
  used: number;
  pending: number;
  budget: number;
  available: number;
  redemptions: number;
};

function EmployeesPage({
  employees,
  budgets,
  employeeInvites,
  employeePoints,
  statsFor,
  onOpenInvite,
  onSelectEmployee
}: {
  employees: User[];
  budgets: Record<string, number>;
  employeeInvites: EmployeeInvite[];
  employeePoints: Record<string, number>;
  statsFor: (employeeId: string) => EmployeeStats;
  onOpenInvite: () => void;
  onSelectEmployee: (employeeId: string) => void;
}) {
  const pendingInvites = employeeInvites.filter((invite) => invite.status === "sent");

  return (
    <>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.greetingText}>Employees</Text>
          <Text style={styles.greetingSub}>
            {employees.length} on your team · tap anyone to see their usage.
          </Text>
        </View>
        <Pressable onPress={onOpenInvite} style={styles.inviteButton}>
          <UserPlus size={16} color={colors.onPrimary} />
          <Text style={styles.inviteButtonText}>Invite</Text>
        </Pressable>
      </View>

      {pendingInvites.length ? (
        <Section title="Pending invites" meta={`${pendingInvites.length} sent`}>
          {pendingInvites.map((invite) => (
            <View key={invite.id} style={styles.listRow}>
              <View style={styles.smallIcon}>
                <Mail size={18} color={colors.primary} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{invite.email}</Text>
                <Text style={styles.listSub}>
                  Code {invite.code} · starts {formatDateLabel(invite.startDate)}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Sent</Text>
              </View>
            </View>
          ))}
        </Section>
      ) : null}

      <Section title="Team" meta={`${employees.length}`}>
        {employees.length ? (
          employees.map((employee) => {
            const stats = statsFor(employee.id);
            const points = employeePoints[employee.id] ?? 0;
            return (
              <Pressable key={employee.id} onPress={() => onSelectEmployee(employee.id)}>
                <GlassPanel style={styles.employeeRow} intensity={32}>
                  <View style={styles.recordAvatar}>
                    <AppIcon name="account-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.listText}>
                    <Text style={styles.listTitle}>{employee.name}</Text>
                    <Text style={styles.listSub}>
                      {points} pts · {currency(stats.available)} available of {currency(budgets[employee.id] ?? 0)}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.muted} />
                </GlassPanel>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <Users size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No employees yet</Text>
              <Text style={styles.listSub}>Invite your first teammate to get started.</Text>
            </View>
          </View>
        )}
      </Section>
    </>
  );
}

function InviteEmployeeModal({
  visible,
  companyName,
  companyId,
  employerId,
  onClose,
  onSend
}: {
  visible: boolean;
  companyName: string;
  companyId: string;
  employerId: string;
  onClose: () => void;
  onSend?: (invite: EmployeeInvite) => void;
}) {
  const [email, setEmail] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [sentInvite, setSentInvite] = useState<EmployeeInvite | null>(null);

  useEffect(() => {
    if (visible) {
      setEmail("");
      setStartDate(new Date().toISOString().slice(0, 10));
      setSentInvite(null);
    }
  }, [visible]);

  const handleSend = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert("Add an email", "Enter the employee's email to send an invite.");
      return;
    }
    const invite: EmployeeInvite = {
      id: `invite_${Date.now()}`,
      email: trimmed,
      code: generateInviteCode(),
      companyId,
      companyName,
      employerId,
      startDate: startDate.trim() || new Date().toISOString().slice(0, 10),
      status: "sent",
      createdAt: new Date().toISOString()
    };
    onSend?.(invite);
    setSentInvite(invite);
    setEmail("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Invite employee</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.modalContent}>
            {sentInvite ? (
              <View style={styles.inviteSuccess}>
                <View style={styles.inviteSuccessIcon}>
                  <Mail size={22} color={colors.onPrimary} />
                </View>
                <Text style={styles.cardTitle}>Invite sent</Text>
                <View style={styles.inviteCodeBox}>
                  <Text style={styles.inviteCodeText}>{sentInvite.code}</Text>
                  <Text style={styles.listSub}>Work start: {formatDateLabel(sentInvite.startDate)}</Text>
                </View>
                <CapsuleButton label="Done" onPress={onClose} />
              </View>
            ) : (
              <>
                <Text style={styles.modalFieldLabel}>Employee email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@company.com"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={styles.modalFieldLabel}>Work start date</Text>
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
                <View style={{ height: 6 }} />
                <CapsuleButton
                  label="Send invite"
                  onPress={handleSend}
                  icon={<Send size={16} color={colors.onPrimary} />}
                />
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EmployeeDetailModal({
  visible,
  employee,
  stats,
  benefits,
  pointsBalance,
  challengeDefinitions = [],
  challengeProgress = [],
  onClose
}: {
  visible: boolean;
  employee: User | null;
  stats: EmployeeStats | null;
  benefits: Benefit[];
  pointsBalance: number;
  challengeDefinitions?: ChallengeDefinition[];
  challengeProgress?: ChallengeProgress[];
  onClose: () => void;
}) {
  if (!employee || !stats) return null;

  const recent = stats.reqs.slice(0, 5);
  const employeeChallenges = challengeDefinitions
    .map((definition) => {
      const row = challengeProgress.find(
        (item) => item.definitionId === definition.id && item.employeeId === employee.id
      );
      return { definition, row };
    })
    .filter(({ row }) => row);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{employee.name}</Text>
              <View style={styles.employeeMetaRow}>
                <View style={styles.employeeMetaPill}>
                  <Text style={styles.employeeMetaPillText}>Birthday {formatDateLabel(employee.birthDate)}</Text>
                </View>
                <View style={styles.employeeMetaPill}>
                  <Text style={styles.employeeMetaPillText}>Started {formatDateLabel(employee.startDate)}</Text>
                </View>
                <View style={styles.employeeMetaPill}>
                  <Text style={styles.employeeMetaPillText}>{pointsBalance} PerX Points</Text>
                </View>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.detailStatsRow}>
              <GlassPanel style={styles.detailStatCard} intensity={28}>
                <Text style={styles.detailStatLabel}>Available</Text>
                <Text style={styles.detailStatValue}>{currency(stats.available)}</Text>
              </GlassPanel>
              <GlassPanel style={styles.detailStatCard} intensity={28}>
                <Text style={styles.detailStatLabel}>Used</Text>
                <Text style={styles.detailStatValue}>{currency(stats.used)}</Text>
              </GlassPanel>
              <GlassPanel style={styles.detailStatCard} intensity={28}>
                <Text style={styles.detailStatLabel}>Pending</Text>
                <Text style={styles.detailStatValue}>{currency(stats.pending)}</Text>
              </GlassPanel>
            </View>

            {employeeChallenges.length ? (
              <>
                <Text style={styles.modalFieldLabel}>Challenges</Text>
                {employeeChallenges.map(({ definition, row }) => (
                  <View key={definition.id} style={styles.listRow}>
                    <View style={styles.smallIcon}>
                      <Trophy size={18} color={colors.accent} />
                    </View>
                    <View style={styles.listText}>
                      <Text style={styles.listTitle}>{definition.title}</Text>
                      <Text style={styles.listSub}>
                        {row?.status === "completed"
                          ? "Points awarded"
                          : row?.submittedAt
                            ? "Ready for review"
                            : "In progress"}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            <Text style={styles.modalFieldLabel}>Recent activity</Text>
            {recent.length ? (
              recent.map((request) => {
                const titles = request.benefitIds
                  .map((id) => benefits.find((benefit) => benefit.id === id)?.title)
                  .filter(Boolean)
                  .join(", ");
                return (
                  <View key={request.id} style={styles.listRow}>
                    <View style={styles.smallIcon}>
                      <Wallet size={18} color={colors.primary} />
                    </View>
                    <View style={styles.listText}>
                      <Text style={styles.listTitle}>{titles || "Benefit package"}</Text>
                      <Text style={styles.listSub}>{request.status} · {currency(request.total)}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.listRow}>
                <View style={styles.smallIcon}>
                  <Calendar size={18} color={colors.text} />
                </View>
                <View style={styles.listText}>
                  <Text style={styles.listTitle}>No activity yet</Text>
                  <Text style={styles.listSub}>Redemptions will show up here as they happen.</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ProviderCatalogPage({
  providerProfiles,
  benefits,
  enabledBenefitIds,
  onToggleBenefit,
  onToggleProvider
}: {
  providerProfiles: ProviderProfile[];
  benefits: Benefit[];
  enabledBenefitIds: string[];
  onToggleBenefit?: (benefitId: string) => void;
  onToggleProvider?: (benefitIds: string[], selected: boolean) => void;
}) {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const groups = useMemo(
    () => groupProvidersWithOffers(providerProfiles, benefits),
    [providerProfiles, benefits]
  );
  const selectedCount = enabledBenefitIds.length;
  const allBenefitIds = useMemo(() => benefits.map((b) => b.id), [benefits]);
  const allSelected = allBenefitIds.length > 0 && allBenefitIds.every((id) => enabledBenefitIds.includes(id));

  const toggleExpanded = (key: string) => {
    setExpandedKeys((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.greetingText}>Providers</Text>
          <Text style={styles.greetingSub}>
            Choose which partners and perks your employees can browse.
          </Text>
        </View>
      </View>

      <GlassPanel style={styles.catalogSummary} intensity={24}>
        <View style={styles.catalogSummaryIcon}>
          <Store size={20} color={colors.primary} />
        </View>
        <View style={styles.listText}>
          <Text style={styles.listTitle}>{selectedCount} perks enabled</Text>
          <Text style={styles.listSub}>
            {selectedCount ? "Visible in the employee marketplace." : "Nothing visible until you select perks."}
          </Text>
        </View>
        <Pressable
          onPress={() => onToggleProvider?.(allBenefitIds, !allSelected)}
          style={[styles.catalogSelectBtn, allSelected && styles.catalogSelectBtnActive]}
        >
          {allSelected ? <Check size={16} color={colors.onPrimary} /> : null}
          <Text style={[styles.catalogSelectText, allSelected && styles.catalogSelectTextActive]}>
            {allSelected ? "All selected" : "Select all"}
          </Text>
        </Pressable>
      </GlassPanel>

      {groups.length ? (
        groups.map((group) => {
          const providerName = group.profile?.businessName ?? group.offers[0]?.providerName ?? "Provider";
          const logoUrl = group.profile?.logoUrl ?? group.offers[0]?.imageUrl;
          const offerIds = group.offers.map((offer) => offer.id);
          const allSelected = offerIds.length > 0 && offerIds.every((id) => enabledBenefitIds.includes(id));
          const expanded = expandedKeys[group.key] ?? false;

          return (
            <GlassPanel key={group.key} style={styles.catalogProviderCard} intensity={20}>
              <View style={styles.catalogProviderHead}>
                {logoUrl ? (
                  <Image source={{ uri: logoUrl }} style={styles.catalogProviderLogo} />
                ) : (
                  <View style={[styles.catalogProviderLogo, styles.catalogProviderLogoFallback]}>
                    <Store size={18} color={colors.primary} />
                  </View>
                )}
                <View style={styles.listText}>
                  <Text style={styles.listTitle}>{providerName}</Text>
                  <Text style={styles.listSub}>
                    {group.profile?.category ?? group.offers[0]?.category ?? "Partner"} · {group.offers.length}{" "}
                    {group.offers.length === 1 ? "perk" : "perks"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => onToggleProvider?.(offerIds, !allSelected)}
                  style={[styles.catalogSelectBtn, allSelected && styles.catalogSelectBtnActive]}
                >
                  {allSelected ? <Check size={16} color={colors.onPrimary} /> : null}
                  <Text style={[styles.catalogSelectText, allSelected && styles.catalogSelectTextActive]}>
                    {allSelected ? "Selected" : "Select"}
                  </Text>
                </Pressable>
              </View>

              {group.offers.length ? (
                <>
                  <Pressable onPress={() => toggleExpanded(group.key)} style={styles.catalogExpandRow}>
                    <Text style={styles.catalogExpandText}>{expanded ? "Hide perks" : "View perks"}</Text>
                    <ChevronRight
                      size={16}
                      color={colors.muted}
                      style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}
                    />
                  </Pressable>

                  {expanded
                    ? group.offers.map((offer) => {
                        const selected = enabledBenefitIds.includes(offer.id);
                        return (
                          <Pressable
                            key={offer.id}
                            onPress={() => onToggleBenefit?.(offer.id)}
                            style={styles.catalogOfferRow}
                          >
                            <Image source={{ uri: offer.imageUrl }} style={styles.catalogOfferThumb} />
                            <View style={styles.listText}>
                              <Text style={styles.listTitle}>{offer.title}</Text>
                              <Text style={styles.listSub}>
                                {offer.discount} · {currency(offer.price)}
                              </Text>
                            </View>
                            <View style={[styles.catalogOfferCheck, selected && styles.catalogOfferCheckActive]}>
                              {selected ? <Check size={14} color={colors.onPrimary} /> : null}
                            </View>
                          </Pressable>
                        );
                      })
                    : null}
                </>
              ) : (
                <Text style={styles.listSub}>No published perks yet.</Text>
              )}
            </GlassPanel>
          );
        })
      ) : (
        <View style={styles.listRow}>
          <View style={styles.smallIcon}>
            <Store size={18} color={colors.text} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>No providers yet</Text>
            <Text style={styles.listSub}>Registered partners will appear here for you to curate.</Text>
          </View>
        </View>
      )}
    </>
  );
}

const REDEMPTIONS_PREVIEW_LIMIT = 3;

function RecentRedemptionsPreview({
  selectionRequests,
  benefits
}: {
  selectionRequests: SelectionRequest[];
  benefits: Benefit[];
}) {
  const recent = useMemo(
    () =>
      [...selectionRequests]
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .slice(0, REDEMPTIONS_PREVIEW_LIMIT),
    [selectionRequests]
  );

  if (!recent.length) {
    return (
      <Section title="Recent redemptions">
        <View style={styles.listRow}>
          <View style={styles.smallIcon}>
            <CircleDollarSign size={18} color={colors.text} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>No redemptions yet</Text>
            <Text style={styles.listSub}>The last three will show here.</Text>
          </View>
        </View>
      </Section>
    );
  }

  return (
    <Section title="Recent redemptions" meta="Last 3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.redemptionPreviewRow}>
        {recent.map((request) => {
          const requestBenefits = request.benefitIds
            .map((benefitId) => benefits.find((benefit) => benefit.id === benefitId))
            .filter(Boolean) as Benefit[];
          const settled = request.status === "approved";
          const initial = request.employeeName?.charAt(0)?.toUpperCase() ?? "?";

          return (
            <GlassPanel key={request.id} style={styles.redemptionPreviewCard} intensity={22}>
              <View style={styles.redemptionPreviewTop}>
                <View style={styles.redemptionPreviewAvatar}>
                  <Text style={styles.redemptionPreviewAvatarText}>{initial}</Text>
                </View>
                <View style={[styles.redemptionPreviewDot, settled && styles.redemptionPreviewDotSettled]} />
              </View>
              <Text style={styles.redemptionPreviewName} numberOfLines={1}>
                {request.employeeName}
              </Text>
              <Text style={styles.redemptionPreviewPerk} numberOfLines={2}>
                {requestBenefits.map((benefit) => benefit.title).join(", ") || "Perk selection"}
              </Text>
              <Text style={styles.redemptionPreviewAmount}>{currency(request.total)}</Text>
              <Text style={styles.redemptionPreviewMeta}>
                {request.totalPoints} pts · {settled ? "Settled" : "Pending"}
              </Text>
            </GlassPanel>
          );
        })}
      </ScrollView>
    </Section>
  );
}

function ChallengesPage({
  employerId,
  definitions,
  progressRows = [],
  disabledTemplateKeys = [],
  employees = [],
  rewardEvents = [],
  employeePoints = {},
  selectionRequests = [],
  benefits = [],
  onOpenCreate,
  onArchiveChallenge,
  onCompleteChallenge,
  onCompleteChallengeForEmployee,
  onToggleChallengeTemplate,
  onGrantReward,
  onSelectEmployee
}: {
  employerId: string;
  definitions: ChallengeDefinition[];
  progressRows?: ChallengeProgress[];
  disabledTemplateKeys?: string[];
  employees?: User[];
  rewardEvents?: RewardEvent[];
  employeePoints?: Record<string, number>;
  selectionRequests?: SelectionRequest[];
  benefits?: Benefit[];
  onOpenCreate: () => void;
  onArchiveChallenge?: (definitionId: string) => void | Promise<void>;
  onCompleteChallenge?: (definitionId: string, employerId: string) => void | Promise<void>;
  onCompleteChallengeForEmployee?: (
    definitionId: string,
    employerId: string,
    employeeId: string
  ) => void | Promise<void>;
  onToggleChallengeTemplate?: (employerId: string, templateKey: string, enabled: boolean) => void;
  onGrantReward?: (input: {
    employeeId: string;
    employeeName: string;
    kind: RewardEvent["kind"];
    points: number;
    note: string;
  }) => void;
  onSelectEmployee?: (employeeId: string) => void;
}) {
  const [automations, setAutomations] = useState<RewardAutomation[]>(defaultRewardAutomations);
  const [spotEmployeeId, setSpotEmployeeId] = useState<"all" | string>(employees[0]?.id ?? "all");
  const [spotPoints, setSpotPoints] = useState("50");
  const [spotNote, setSpotNote] = useState("Great work this week");
  const [employerFilter, setEmployerFilter] = useState<"active" | "completed">("active");
  const [expandedPlatformId, setExpandedPlatformId] = useState<string | null>(null);

  const employerCreated = definitions.filter((definition) => definition.source === "employer");
  const platformDefinitions = definitions.filter((definition) => definition.source === "platform");
  const analytics = computeChallengeAnalytics({
    definitions,
    progressRows,
    rewardEvents,
    employees
  });

  const filteredEmployerChallenges = employerCreated.filter((definition) => {
    const rows = progressRows.filter((row) => row.definitionId === definition.id);
    const hasOpen = rows.some((row) => row.status === "open");
    const allCompleted = rows.length > 0 && rows.every((row) => row.status === "completed");
    if (employerFilter === "active") {
      return definition.active && (hasOpen || rows.length === 0);
    }
    return !definition.active || allCompleted;
  });

  const openEmployerChallenges = employerCreated.filter((definition) => {
    const rows = progressRows.filter((row) => row.definitionId === definition.id);
    return definition.active && (rows.some((row) => row.status === "open") || rows.length === 0);
  });

  const confirmAwardAll = (definition: ChallengeDefinition) => {
    if (!onCompleteChallenge) return;
    const pendingCount = employees.filter((employee) => {
      const row = progressRows.find(
        (item) => item.definitionId === definition.id && item.employeeId === employee.id
      );
      return row?.status !== "completed";
    }).length;

    Alert.alert(
      "Award all employees?",
      `Grant ${definition.rewardPoints} points to ${pendingCount} employee${pendingCount === 1 ? "" : "s"} for "${definition.title}".`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Award all",
          onPress: () => void onCompleteChallenge(definition.id, employerId)
        }
      ]
    );
  };

  const toggleAutomation = (kind: RewardAutomation["kind"]) => {
    setAutomations((current) =>
      current.map((item) => (item.kind === kind ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const updateAutomationPoints = (kind: RewardAutomation["kind"], points: string) => {
    const parsed = Number(points.replace(/\D/g, ""));
    setAutomations((current) =>
      current.map((item) =>
        item.kind === kind ? { ...item, points: Number.isFinite(parsed) ? parsed : item.points } : item
      )
    );
  };

  const grantSpotBonus = () => {
    const points = Number(spotPoints.replace(/\D/g, ""));
    if (!onGrantReward || !points) {
      Alert.alert("Enter points", "Choose a valid points amount.");
      return;
    }
    if (spotEmployeeId === "all") {
      if (!employees.length) {
        Alert.alert("No employees", "Add employees first.");
        return;
      }
      employees.forEach((employee) =>
        onGrantReward({
          employeeId: employee.id,
          employeeName: employee.name,
          kind: "spot",
          points,
          note: spotNote.trim() || "Spot bonus"
        })
      );
      Alert.alert("Spot bonus sent", `${points} points added to all ${employees.length} employees.`);
    } else {
      const employee = employees.find((item) => item.id === spotEmployeeId);
      if (!employee) {
        Alert.alert("Pick employee", "Select an employee first.");
        return;
      }
      onGrantReward({
        employeeId: employee.id,
        employeeName: employee.name,
        kind: "spot",
        points,
        note: spotNote.trim() || "Spot bonus"
      });
      Alert.alert("Spot bonus sent", `${points} points added to ${employee.name}.`);
    }
  };

  return (
    <>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.greetingText}>Challenges</Text>
          <Text style={styles.greetingSub}>
            {openEmployerChallenges.length} employer · {platformDefinitions.length} platform templates
          </Text>
        </View>
        <Pressable onPress={onOpenCreate} style={styles.inviteButton}>
          <Trophy size={16} color={colors.onPrimary} />
          <Text style={styles.inviteButtonText}>Create</Text>
        </Pressable>
      </View>

      <Section title="Challenge analytics" meta="This period">
        <GlassPanel style={styles.compactPanel} intensity={18}>
          <Text style={styles.listSub}>
            Platform completion: {analytics.platformCompletionRate}% · Employer awards: {analytics.employerAwardsGiven}
          </Text>
          <Text style={styles.listSub}>
            Challenge points: {analytics.challengePointsGranted.toLocaleString()} · Spot bonuses:{" "}
            {analytics.spotPointsGranted.toLocaleString()}
          </Text>
        </GlassPanel>
      </Section>

      <Section title="PerX platform challenges" meta={`${platformDefinitions.length}`}>
        {platformDefinitions.map((definition) => {
          const templateKey = definition.templateKey as PlatformTemplateKey | undefined;
          const enabled = templateKey ? !disabledTemplateKeys.includes(templateKey) : definition.active;
          const stats = buildEmployerChallengeStats({ definition, progressRows, employees });
          const expanded = expandedPlatformId === definition.id;
          const employeeRows = employees.map((employee) => {
            const row = progressRows.find(
              (item) => item.definitionId === definition.id && item.employeeId === employee.id
            );
            return { employee, row };
          });

          return (
            <GlassPanel key={definition.id} style={styles.challengeCard} intensity={20}>
              <View style={styles.challengeMeta}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{definition.title}</Text>
                  <Text style={styles.listSub}>{definition.description}</Text>
                  <Text style={styles.listSub}>
                    Auto-tracked · +{definition.rewardPoints} pts
                    {definition.pointCap ? ` · cap ${definition.pointCap}` : ""}
                  </Text>
                  <Text style={styles.listSub}>
                    {stats.completedCount}/{stats.totalEmployees} completed
                    {stats.inProgressCount ? ` · ${stats.inProgressCount} in progress` : ""}
                  </Text>
                </View>
                {templateKey && onToggleChallengeTemplate ? (
                  <Pressable
                    onPress={() => onToggleChallengeTemplate(employerId, templateKey, !enabled)}
                    style={[styles.automationToggle, enabled && styles.automationToggleOn]}
                  >
                    <View style={[styles.automationKnob, enabled && styles.automationKnobOn]} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable onPress={() => setExpandedPlatformId(expanded ? null : definition.id)}>
                <Text style={styles.challengeLinkText}>
                  {expanded ? "Hide team progress" : "View team progress"}
                </Text>
              </Pressable>
              {expanded ? (
                <View style={styles.challengeEmployeeList}>
                  {employeeRows.map(({ employee, row }) => (
                    <View key={employee.id} style={styles.challengeEmployeeRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listTitle}>{employee.name}</Text>
                        <Text style={styles.listSub}>
                          {row?.status === "completed"
                            ? "Completed"
                            : row
                              ? `${row.current} / ${row.target} progress`
                              : "Not started"}
                        </Text>
                      </View>
                      {row?.status === "completed" ? (
                        <Check size={18} color={colors.secondary} />
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </GlassPanel>
          );
        })}
      </Section>

      <Section title="Employer challenges" meta={`${openEmployerChallenges.length} active`}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(["active", "completed"] as const).map((filter) => {
            const selected = employerFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => setEmployerFilter(filter)}
                style={[styles.filterChip, selected && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                  {filter === "active" ? "Active" : "Completed"}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {filteredEmployerChallenges.length ? (
          filteredEmployerChallenges.map((definition) => {
            const stats = buildEmployerChallengeStats({ definition, progressRows, employees });
            const awardsUsed = awardsUsedForDefinition(definition.id, progressRows);
            const budgetLeft = definition.maxAwards ? definition.maxAwards - awardsUsed : null;
            const employeeProgress = employees.map((employee) => {
              const row = progressRows.find(
                (item) => item.definitionId === definition.id && item.employeeId === employee.id
              );
              return { employee, row };
            });
            const hasOpen = employeeProgress.some(({ row }) => row?.status === "open" || !row);
            const canAward = canAwardMore(definition, progressRows);

            return (
              <GlassPanel key={definition.id} style={styles.challengeCard} intensity={24}>
                <View style={styles.challengeMeta}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listTitle}>{definition.title}</Text>
                    <Text style={styles.listSub}>{definition.description}</Text>
                    <Text style={styles.listSub}>
                      {employerDefinitionSummary(definition)} · +{definition.rewardPoints} pts · all employees
                    </Text>
                    <Text style={styles.listSub}>
                      {stats.completedCount}/{stats.totalEmployees} awarded
                      {budgetLeft != null ? ` · ${awardsUsed}/${definition.maxAwards} budget used` : ""}
                    </Text>
                  </View>
                  <View style={{ gap: 8, alignItems: "flex-end" }}>
                    {hasOpen && onCompleteChallenge && canAward ? (
                      <CapsuleButton
                        label="Award all"
                        onPress={() => confirmAwardAll(definition)}
                        variant="soft"
                      />
                    ) : hasOpen && !canAward ? (
                      <Text style={styles.listSub}>Budget full</Text>
                    ) : (
                      <Text style={[styles.challengePoints, { color: colors.secondary }]}>Done</Text>
                    )}
                    {definition.active && onArchiveChallenge ? (
                      <Pressable onPress={() => void onArchiveChallenge(definition.id)}>
                        <Text style={styles.challengeLinkText}>Archive</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
                <View style={styles.challengeEmployeeList}>
                  {employeeProgress.map(({ employee, row }) => {
                    const completed = row?.status === "completed";
                    const readyForReview = Boolean(row?.submittedAt) && !completed;
                    return (
                      <View key={employee.id} style={styles.challengeEmployeeRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.listTitle}>{employee.name}</Text>
                          <Text style={styles.listSub}>
                            {completed
                              ? "Points awarded"
                              : readyForReview
                                ? "Ready for review"
                                : "Not awarded yet"}
                          </Text>
                        </View>
                        {!completed && onCompleteChallengeForEmployee && canAward ? (
                          <CapsuleButton
                            label="Award"
                            variant="soft"
                            onPress={() =>
                              onCompleteChallengeForEmployee(definition.id, employerId, employee.id)
                            }
                          />
                        ) : completed ? (
                          <Check size={18} color={colors.secondary} />
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </GlassPanel>
            );
          })
        ) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <Trophy size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No employer challenges</Text>
              <Text style={styles.listSub}>Create a goal and award points when employees complete it.</Text>
            </View>
          </View>
        )}
      </Section>

      <Section title="Spot bonus" meta="One-off">
        <GlassPanel style={styles.compactPanel} intensity={18}>
          <Text style={styles.modalFieldLabel}>Employee</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <Pressable
              onPress={() => setSpotEmployeeId("all")}
              style={[styles.filterChip, spotEmployeeId === "all" && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, spotEmployeeId === "all" && styles.filterChipTextActive]}>
                All
              </Text>
            </Pressable>
            {employees.map((employee) => {
              const selected = spotEmployeeId === employee.id;
              return (
                <Pressable
                  key={employee.id}
                  onPress={() => setSpotEmployeeId(employee.id)}
                  style={[styles.filterChip, selected && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                    {employee.name.split(" ")[0]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.compactInputRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalFieldLabel}>Points</Text>
              <TextInput
                value={spotPoints}
                onChangeText={setSpotPoints}
                style={styles.input}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1.4 }}>
              <Text style={styles.modalFieldLabel}>Note</Text>
              <TextInput value={spotNote} onChangeText={setSpotNote} style={styles.input} />
            </View>
          </View>
          <CapsuleButton
            label="Send spot bonus"
            onPress={grantSpotBonus}
            icon={<Gift size={16} color={colors.onPrimary} />}
          />
        </GlassPanel>
      </Section>

      <Section title="Recognition automations">
        <Text style={styles.automationNote}>
          Enable rules for future scheduled recognition. Toggles no longer grant points immediately.
        </Text>
        {automations.map((automation) => (
          <GlassPanel key={automation.kind} style={styles.automationRowCompact} intensity={18}>
            <Pressable
              onPress={() => toggleAutomation(automation.kind)}
              style={[styles.automationToggle, automation.enabled && styles.automationToggleOn]}
            >
              <View style={[styles.automationKnob, automation.enabled && styles.automationKnobOn]} />
            </Pressable>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>{automation.label}</Text>
              <Text style={styles.listSub} numberOfLines={1}>
                {automation.description}
              </Text>
            </View>
            <TextInput
              value={String(automation.points)}
              onChangeText={(value) => updateAutomationPoints(automation.kind, value)}
              style={styles.automationPointsInput}
              keyboardType="number-pad"
            />
          </GlassPanel>
        ))}
      </Section>

      <Section title="Points feed" meta={`${rewardEvents.length}`}>
        {rewardEvents.length ? (
          rewardEvents.slice(0, 5).map((event) => (
            <View key={event.id} style={styles.employerActivityRow}>
              <View style={styles.pointsFeedIcon}>
                <Star size={14} color={colors.primary} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.employerActivityTitle} numberOfLines={1}>
                  {event.employeeName ?? "Employee"}
                </Text>
                <Text style={styles.employerActivitySub} numberOfLines={1}>
                  {rewardKindLabel(event.kind)} · {event.note}
                </Text>
              </View>
              <Text style={styles.challengePoints}>+{event.points}</Text>
            </View>
          ))
        ) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <Sparkles size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No rewards yet</Text>
              <Text style={styles.listSub}>Complete challenges or grant recognition to populate the feed.</Text>
            </View>
          </View>
        )}
      </Section>

      {employees.length ? (
        <Section title="Team balances" meta="Tap to view">
          <View style={styles.teamBalanceGrid}>
            {employees.map((employee) => (
              <Pressable
                key={employee.id}
                onPress={() => onSelectEmployee?.(employee.id)}
                style={styles.teamBalanceChip}
              >
                <Text style={styles.teamBalanceName} numberOfLines={1}>
                  {employee.name.split(" ")[0]}
                </Text>
                <Text style={styles.teamBalancePoints}>{employeePoints[employee.id] ?? 0} pts</Text>
              </Pressable>
            ))}
          </View>
        </Section>
      ) : null}

      <RecentRedemptionsPreview selectionRequests={selectionRequests} benefits={benefits} />
    </>
  );
}

function CreateChallengeModal({
  visible,
  employerId,
  onClose,
  onCreate
}: {
  visible: boolean;
  employerId: string;
  onClose: () => void;
  onCreate: (input: {
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
  }) => Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardPoints, setRewardPoints] = useState("75");
  const [dueDate, setDueDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maxAwards, setMaxAwards] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle("");
      setDescription("");
      setRewardPoints("75");
      setDueDate("");
      setStartDate("");
      setMaxAwards("");
      setSaving(false);
    }
  }, [visible]);

  const parseDate = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : trimmed;
  };

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    const points = Number(rewardPoints.replace(/\D/g, ""));
    if (!trimmedTitle || !points) {
      Alert.alert("Add details", "Enter a title and reward points.");
      return;
    }

    const parsedDue = parseDate(dueDate);
    if (dueDate.trim() && parsedDue === null) {
      Alert.alert("Invalid due date", "Use YYYY-MM-DD format.");
      return;
    }
    const parsedStart = parseDate(startDate);
    if (startDate.trim() && parsedStart === null) {
      Alert.alert("Invalid start date", "Use YYYY-MM-DD format.");
      return;
    }

    const parsedMaxAwards = maxAwards.trim()
      ? Number(maxAwards.replace(/\D/g, ""))
      : undefined;
    if (maxAwards.trim() && (!parsedMaxAwards || parsedMaxAwards < 1)) {
      Alert.alert("Invalid budget", "Max awards must be at least 1.");
      return;
    }

    setSaving(true);
    const ok = await onCreate({
      employerId,
      title: trimmedTitle,
      description: description.trim(),
      rewardPoints: points,
      criterion: { kind: "manual" },
      target: "everyone",
      dueDate: parsedDue ?? undefined,
      startDate: parsedStart ?? undefined,
      maxAwards: parsedMaxAwards,
      pointCap: points
    });
    setSaving(false);

    if (!ok) {
      Alert.alert("Could not save", "Try again in a moment.");
      return;
    }

    onClose();
    Alert.alert(
      "Challenge created",
      "All employees can see this goal. Award points individually when someone completes it."
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>New challenge</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalFieldLabel}>Goal</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder="Complete the Q2 wellness survey"
            />
            <Text style={styles.modalFieldLabel}>Instructions (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              placeholder="What should employees do to complete this?"
              multiline
            />
            <Text style={styles.modalFieldLabel}>Reward points</Text>
            <TextInput value={rewardPoints} onChangeText={setRewardPoints} style={styles.input} keyboardType="number-pad" />
            <Text style={styles.modalFieldLabel}>Start date (optional)</Text>
            <TextInput value={startDate} onChangeText={setStartDate} style={styles.input} placeholder="YYYY-MM-DD" />
            <Text style={styles.modalFieldLabel}>Due date (optional)</Text>
            <TextInput value={dueDate} onChangeText={setDueDate} style={styles.input} placeholder="YYYY-MM-DD" />
            <Text style={styles.modalFieldLabel}>Max awards (optional)</Text>
            <TextInput
              value={maxAwards}
              onChangeText={setMaxAwards}
              style={styles.input}
              placeholder="e.g. 20"
              keyboardType="number-pad"
            />
            <CapsuleButton
              label={saving ? "Creating..." : "Create challenge"}
              onPress={() => void handleCreate()}
              icon={<Trophy size={16} color={colors.onPrimary} />}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

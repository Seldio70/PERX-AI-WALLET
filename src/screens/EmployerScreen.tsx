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
import { AllocationSlider } from "../components/AllocationSlider";
import { AppIcon } from "../components/AppIcon";
import { BentoMetricCard } from "../components/BentoMetricCard";
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
  rewardKindLabel,
  yearsSince
} from "../lib/rewardsDemo";
import { PerxLiveData } from "../lib/perxRepository";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import {
  Benefit,
  Challenge,
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
  onCompleteChallenge,
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
  onCreateChallenge?: (challenge: Omit<Challenge, "id" | "status">) => void;
  onCompleteChallenge?: (challengeId: string) => void;
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
  const pendingInvites = companyInvites.filter((invite) => invite.status === "sent").length;
  const enabledPerksCount = enabledBenefitIds.length;
  const openChallenges = appData.challenges.filter(
    (challenge) => challenge.employerId === user.id && challenge.status === "open"
  ).length;
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

      <View style={styles.bentoRow}>
        <BentoMetricCard
          title="Employees"
          value={`${employees.length}`}
          trend="On your team"
          accent={colors.primary}
          Icon={Users}
        />
        <BentoMetricCard
          title="Redemptions"
          value={`${redemptionsCount}`}
          trend="Approved"
          accent={colors.secondary}
          Icon={CircleDollarSign}
        />
      </View>

      <View style={styles.bentoRow}>
        <BentoMetricCard
          title="Enabled perks"
          value={`${enabledPerksCount}`}
          trend={`${providerGroups.length} providers`}
          accent={colors.tertiary}
          Icon={Store}
        />
        <BentoMetricCard
          title="Challenges"
          value={`${openChallenges}`}
          trend="Open now"
          accent={colors.accent}
          Icon={Trophy}
        />
      </View>

      <View style={styles.bentoRow}>
        <BentoMetricCard
          title="Pts redeemed"
          value={`${settlement.pointsRedeemed}`}
          trend="By your team"
          accent={colors.accent}
          Icon={CircleDollarSign}
        />
        <BentoMetricCard
          title="Paid out"
          value={`${Math.round(settlement.paidToProviders).toLocaleString()} ALL`}
          trend="To providers"
          accent={colors.secondary}
          Icon={Wallet}
        />
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
        <View style={styles.employerQuickRow}>
          <Pressable onPress={() => setTab("catalog")} style={{ flex: 1, minWidth: 140 }}>
            <GlassPanel style={styles.employerQuickCard} intensity={18}>
              <Store size={18} color={colors.primary} />
              <Text style={styles.listTitle}>Providers</Text>
              <Text style={styles.listSub}>Manage perk catalog</Text>
            </GlassPanel>
          </Pressable>
          <Pressable onPress={() => setTab("employees")} style={{ flex: 1, minWidth: 140 }}>
            <GlassPanel style={styles.employerQuickCard} intensity={18}>
              <Users size={18} color={colors.secondary} />
              <Text style={styles.listTitle}>Team</Text>
              <Text style={styles.listSub}>
                {pendingInvites ? `${pendingInvites} pending invites` : "View employees"}
              </Text>
            </GlassPanel>
          </Pressable>
          <Pressable onPress={() => setTab("activity")} style={{ flex: 1, minWidth: 140 }}>
            <GlassPanel style={styles.employerQuickCard} intensity={18}>
              <Trophy size={18} color={colors.accent} />
              <Text style={styles.listTitle}>Activity</Text>
              <Text style={styles.listSub}>Redemptions & challenges</Text>
            </GlassPanel>
          </Pressable>
        </View>
      </Section>

      <Section title="Recent activity">
        {recentRedemptions.length ? (
          recentRedemptions.map((request) => {
            const requestBenefits = request.benefitIds
              .map((benefitId) => appData.benefits.find((benefit) => benefit.id === benefitId))
              .filter(Boolean) as Benefit[];

            return (
              <GlassPanel key={request.id} style={styles.approvalCard} intensity={14}>
                <View style={styles.employeeBudgetHeader}>
                  <View style={styles.listText}>
                    <Text style={styles.cardTitle}>{request.employeeName}</Text>
                    <Text style={styles.bodyText}>
                      {requestBenefits.map((benefit) => benefit.title).join(", ") || "Perk selection"}
                    </Text>
                  </View>
                  <Text style={styles.confidence}>{currency(request.total)}</Text>
                </View>
                <Text style={styles.listSub}>{request.status === "approved" ? "Settled" : "Pending"}</Text>
              </GlassPanel>
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

      <RecentRedemptionsSection selectionRequests={selectionRequests} benefits={appData.benefits} />

      <ChallengesPage
        challenges={appData.challenges.filter((challenge) => challenge.employerId === user.id)}
        employees={employees}
        rewardEvents={rewardEvents}
        employeePoints={employeePoints}
        onOpenCreate={() => setChallengeModalOpen(true)}
        onCompleteChallenge={onCompleteChallenge}
        onGrantReward={onGrantReward}
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
        employees={employees}
        employerId={user.id}
        onClose={() => setChallengeModalOpen(false)}
        onCreate={(challenge) => {
          if (!onCreateChallenge) {
            Alert.alert("Unavailable", "Challenge creation is not available right now.");
            return;
          }
          onCreateChallenge(challenge);
        }}
      />

      <EmployeeDetailModal
        visible={!!detailEmployee}
        employee={detailEmployee}
        stats={detailEmployee ? statsFor(detailEmployee.id) : null}
        benefits={appData.benefits}
        pointsBalance={detailEmployee ? employeePoints[detailEmployee.id] ?? 0 : 0}
        onChangeBudget={(value) =>
          detailEmployee && setBudgets((current) => ({ ...current, [detailEmployee.id]: value }))
        }
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
              <Text style={styles.modalSub}>They'll get access to {companyName}'s wallet and perks.</Text>
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
                <Text style={styles.bodyText}>
                  Share this code with {sentInvite.email}. They enter it when joining PerX.
                </Text>
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
  onChangeBudget,
  onClose
}: {
  visible: boolean;
  employee: User | null;
  stats: EmployeeStats | null;
  benefits: Benefit[];
  pointsBalance: number;
  onChangeBudget: (value: number) => void;
  onClose: () => void;
}) {
  if (!employee || !stats) return null;

  const recent = stats.reqs.slice(0, 5);
  const tenureYears = yearsSince(employee.startDate) || employee.yearsEmployed || 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{employee.name}</Text>
              <Text style={styles.modalSub}>
                Employee · {tenureYears} years · {employee.email}
              </Text>
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

            <GlassPanel style={styles.employeeBudgetCard} intensity={14}>
              <View style={styles.employeeBudgetHeader}>
                <View>
                  <Text style={styles.listTitle}>Monthly budget</Text>
                  <Text style={styles.listSub}>{stats.redemptions} redemptions so far</Text>
                </View>
                <Text style={styles.confidence}>{currency(stats.budget)}</Text>
              </View>
              <AllocationSlider
                category="Health"
                value={stats.budget}
                max={15000}
                onChange={onChangeBudget}
              />
            </GlassPanel>

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

const REDEMPTIONS_PAGE_SIZE = 10;

function RecentRedemptionsSection({
  selectionRequests,
  benefits
}: {
  selectionRequests: SelectionRequest[];
  benefits: Benefit[];
}) {
  const [visibleCount, setVisibleCount] = useState(REDEMPTIONS_PAGE_SIZE);
  const sorted = useMemo(
    () => [...selectionRequests].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
    [selectionRequests]
  );
  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  useEffect(() => {
    setVisibleCount(REDEMPTIONS_PAGE_SIZE);
  }, [selectionRequests.length]);

  return (
    <Section title="Recent redemptions" meta={sorted.length ? `${sorted.length}` : undefined}>
      {visible.length ? (
        <>
          {visible.map((request) => {
            const requestBenefits = request.benefitIds
              .map((benefitId) => benefits.find((benefit) => benefit.id === benefitId))
              .filter(Boolean) as Benefit[];
            const providers = Array.from(new Set(requestBenefits.map((benefit) => benefit.providerName)));
            const settled = request.status === "approved";

            return (
              <GlassPanel key={request.id} style={styles.approvalCard} intensity={14}>
                <View style={styles.employeeBudgetHeader}>
                  <View style={styles.listText}>
                    <Text style={styles.cardTitle}>{request.employeeName}</Text>
                    <Text style={styles.bodyText}>
                      {requestBenefits.map((benefit) => benefit.title).join(", ") || "Perk selection"}
                    </Text>
                    <Text style={styles.listSub}>Routed to {providers.join(", ") || "Provider"}</Text>
                  </View>
                  <Text style={styles.confidence}>{currency(request.total)}</Text>
                </View>
                <Text style={styles.listSub}>
                  {request.totalPoints} pts · employer paid {currency(request.total)}
                </Text>
                <View style={styles.packageFooter}>
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>{settled ? "Settled" : "Pending"}</Text>
                  </View>
                </View>
              </GlassPanel>
            );
          })}

          {hasMore ? (
            <Pressable
              onPress={() => setVisibleCount((current) => current + REDEMPTIONS_PAGE_SIZE)}
              style={styles.redemptionPagerRow}
            >
              <Text style={styles.redemptionPagerText}>
                Show next {Math.min(REDEMPTIONS_PAGE_SIZE, sorted.length - visibleCount)}
              </Text>
              <ChevronRight size={16} color={colors.primary} style={{ transform: [{ rotate: "90deg" }] }} />
            </Pressable>
          ) : visibleCount > REDEMPTIONS_PAGE_SIZE ? (
            <Pressable
              onPress={() => setVisibleCount(REDEMPTIONS_PAGE_SIZE)}
              style={styles.redemptionPagerRow}
            >
              <Text style={styles.redemptionPagerText}>Show less</Text>
              <ChevronRight size={16} color={colors.primary} style={{ transform: [{ rotate: "-90deg" }] }} />
            </Pressable>
          ) : null}
        </>
      ) : (
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
  );
}

function ChallengesPage({
  challenges,
  employees = [],
  rewardEvents = [],
  employeePoints = {},
  onOpenCreate,
  onCompleteChallenge,
  onGrantReward
}: {
  challenges: Challenge[];
  employees?: User[];
  rewardEvents?: RewardEvent[];
  employeePoints?: Record<string, number>;
  onOpenCreate: () => void;
  onCompleteChallenge?: (challengeId: string) => void;
  onGrantReward?: (input: {
    employeeId: string;
    employeeName: string;
    kind: RewardEvent["kind"];
    points: number;
    note: string;
  }) => void;
}) {
  const [automations, setAutomations] = useState<RewardAutomation[]>(defaultRewardAutomations);
  const [spotEmployeeId, setSpotEmployeeId] = useState<"all" | string>(employees[0]?.id ?? "all");
  const [spotPoints, setSpotPoints] = useState("50");
  const [spotNote, setSpotNote] = useState("Great work this week");

  const openChallenges = challenges.filter((challenge) => challenge.status === "open");
  const fireAutomation = (automation: RewardAutomation) => {
    if (!onGrantReward || !employees.length) return;
    employees.forEach((employee) => {
      const points =
        automation.kind === "anniversary"
          ? automation.points * Math.max(1, yearsSince(employee.startDate) || employee.yearsEmployed || 1)
          : automation.points;
      onGrantReward({
        employeeId: employee.id,
        employeeName: employee.name,
        kind: automation.kind === "seasonal" ? "seasonal" : automation.kind,
        points,
        note: automation.label
      });
    });
  };

  const toggleAutomation = (kind: RewardAutomation["kind"]) => {
    setAutomations((current) => {
      const next = current.map((item) => (item.kind === kind ? { ...item, enabled: !item.enabled } : item));
      const toggled = next.find((item) => item.kind === kind);
      if (toggled?.enabled) {
        fireAutomation(toggled);
        Alert.alert("Auto-granted", `${toggled.label} applied to ${employees.length} employee(s).`);
      }
      return next;
    });
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
            {openChallenges.length} active · visible to all employees
          </Text>
        </View>
        <Pressable onPress={onOpenCreate} style={styles.inviteButton}>
          <Trophy size={16} color={colors.onPrimary} />
          <Text style={styles.inviteButtonText}>Create</Text>
        </Pressable>
      </View>

      <Section title="Active challenges" meta={`${openChallenges.length}`}>
        {openChallenges.length ? (
          openChallenges.map((challenge) => (
            <GlassPanel key={challenge.id} style={styles.challengeCard} intensity={24}>
              <View style={styles.challengeMeta}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{challenge.title}</Text>
                  <Text style={styles.listSub}>{challenge.description}</Text>
                  <Text style={styles.listSub}>
                    All employees · +{challenge.rewardPoints} pts
                    {challenge.dueDate ? ` · due ${formatDateLabel(challenge.dueDate)}` : ""}
                  </Text>
                </View>
                <CapsuleButton
                  label="Complete"
                  onPress={() => onCompleteChallenge?.(challenge.id)}
                  variant="soft"
                />
              </View>
            </GlassPanel>
          ))
        ) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <Trophy size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No open challenges</Text>
              <Text style={styles.listSub}>Create one to motivate your team.</Text>
            </View>
          </View>
        )}
      </Section>

      <Section title="Recognition automations">
        <Text style={styles.automationNote}>
          Points are granted automatically when each rule triggers. Toggle rules on or off and set the reward amount.
        </Text>
        {automations.map((automation) => (
          <GlassPanel key={automation.kind} style={styles.automationRow} intensity={18}>
            <Pressable
              onPress={() => toggleAutomation(automation.kind)}
              style={[styles.automationToggle, automation.enabled && styles.automationToggleOn]}
            >
              <View style={[styles.automationKnob, automation.enabled && styles.automationKnobOn]} />
            </Pressable>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>{automation.label}</Text>
              <Text style={styles.listSub}>{automation.description}</Text>
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

      <Section title="Spot bonus" meta="One-off">
        <GlassPanel style={styles.challengeCard} intensity={18}>
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
          <Text style={styles.modalFieldLabel}>Points</Text>
          <TextInput
            value={spotPoints}
            onChangeText={setSpotPoints}
            style={styles.input}
            keyboardType="number-pad"
          />
          <Text style={styles.modalFieldLabel}>Note</Text>
          <TextInput value={spotNote} onChangeText={setSpotNote} style={styles.input} />
          <CapsuleButton label="Send spot bonus" onPress={grantSpotBonus} icon={<Gift size={16} color={colors.onPrimary} />} />
        </GlassPanel>
      </Section>

      <Section title="Points feed" meta={`${rewardEvents.length}`}>
        {rewardEvents.length ? (
          rewardEvents.slice(0, 8).map((event) => (
            <View key={event.id} style={styles.pointsFeedRow}>
              <View style={styles.pointsFeedIcon}>
                <Star size={16} color={colors.primary} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{event.employeeName ?? "Employee"}</Text>
                <Text style={styles.listSub}>
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
        <Section title="Team balances" meta="Points">
          {employees.map((employee) => (
            <View key={employee.id} style={styles.listRow}>
              <View style={styles.smallIcon}>
                <Gift size={18} color={colors.primary} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{employee.name}</Text>
                <Text style={styles.listSub}>{employeePoints[employee.id] ?? 0} PerX Points</Text>
              </View>
            </View>
          ))}
        </Section>
      ) : null}
    </>
  );
}

function CreateChallengeModal({
  visible,
  employees,
  employerId,
  onClose,
  onCreate
}: {
  visible: boolean;
  employees: User[];
  employerId: string;
  onClose: () => void;
  onCreate: (challenge: Omit<Challenge, "id" | "status">) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardPoints, setRewardPoints] = useState("75");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (visible) {
      setTitle("");
      setDescription("");
      setRewardPoints("75");
      setDueDate("");
    }
  }, [visible]);

  const handleCreate = () => {
    const trimmedTitle = title.trim();
    const points = Number(rewardPoints.replace(/\D/g, ""));
    if (!trimmedTitle || !points) {
      Alert.alert("Add details", "Enter a title and reward points.");
      return;
    }

    onCreate({
      employeeId: employees[0]?.id ?? "all",
      employeeName: "All employees",
      employerId,
      title: trimmedTitle,
      description: description.trim(),
      rewardPoints: points,
      target: "everyone",
      dueDate: dueDate.trim() || undefined
    });
    onClose();
    Alert.alert("Challenge created", "All employees can see this challenge in their app.");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>New challenge</Text>
              <Text style={styles.modalSub}>Employees earn PerX Points when you mark it complete.</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalFieldLabel}>Title</Text>
            <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Friday wellness walk" />
            <Text style={styles.modalFieldLabel}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              placeholder="What should employees do?"
            />
            <Text style={styles.modalFieldLabel}>Reward points</Text>
            <TextInput value={rewardPoints} onChangeText={setRewardPoints} style={styles.input} keyboardType="number-pad" />
            <Text style={styles.listSub}>This challenge is visible to all employees on your team.</Text>
            <Text style={styles.modalFieldLabel}>Due date (optional)</Text>
            <TextInput value={dueDate} onChangeText={setDueDate} style={styles.input} placeholder="YYYY-MM-DD" />
            <CapsuleButton label="Create challenge" onPress={handleCreate} icon={<Trophy size={16} color={colors.onPrimary} />} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

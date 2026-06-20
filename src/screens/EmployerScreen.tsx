import {
  Calendar,
  ChevronRight,
  CircleDollarSign,
  Gift,
  Mail,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  WalletCards,
  X
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { AllocationSlider } from "../components/AllocationSlider";
import { AnalyticsRow } from "../components/AnalyticsRow";
import { AppIcon } from "../components/AppIcon";
import { BentoMetricCard } from "../components/BentoMetricCard";
import { BottomNav, NavTab } from "../components/BottomNav";
import { CapsuleButton } from "../components/CapsuleButton";
import { GlassPanel } from "../components/GlassPanel";
import { MetricPill } from "../components/MetricPill";
import { Section } from "../components/Section";
import { UserProfileScreen } from "../components/UserProfileScreen";
import { currency, market } from "../lib/format";
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
  RewardAutomation,
  RewardEvent,
  SelectionRequest,
  User
} from "../types";

type AppData = PerxLiveData;

type EmployerTab = "home" | "employees" | "challenges" | "activity" | "profile";

const employerTabs: Array<NavTab<EmployerTab>> = [
  { id: "home", label: "Home", icon: "home-outline", iconActive: "home" },
  { id: "employees", label: "Team", icon: "account-group-outline", iconActive: "account-group" },
  { id: "challenges", label: "Perks", icon: "trophy-outline", iconActive: "trophy" },
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
  onSendEmployeeInvite
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

  const employerPoints = appData.employerWalletCards.reduce((sum, card) => sum + card.points, 0);
  const redemptionsCount = selectionRequests.length;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const detailEmployee = employees.find((employee) => employee.id === detailEmployeeId) ?? null;
  const companyInvites = employeeInvites.filter((invite) => invite.companyId === company.id);

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
          <Text style={styles.greetingText}>Management</Text>
          <Text style={styles.greetingSub}>Fund points, watch redemptions, manage employee access.</Text>
        </View>
        <View style={styles.searchPill}>
          <AppIcon name="magnify" size={18} color={colors.soft} />
        </View>
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
          </>
        ) : null}

        {tab === "activity" ? (
          <>
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

        {tab === "challenges" ? (
          <ChallengesPage
            employees={employees}
            challenges={appData.challenges.filter((challenge) => challenge.employerId === user.id)}
            rewardEvents={rewardEvents}
            employeePoints={employeePoints}
            onOpenCreate={() => setChallengeModalOpen(true)}
            onCompleteChallenge={onCompleteChallenge}
            onGrantReward={onGrantReward}
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
        onCreate={onCreateChallenge}
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
                <Text style={styles.cardTitle}>Invite sent (demo)</Text>
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
                <Text style={styles.bodyText}>
                  Demo only — no real email is sent. The invite appears under pending invites with a join code.
                </Text>
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

function ChallengesPage({
  employees,
  challenges,
  rewardEvents,
  employeePoints,
  onOpenCreate,
  onCompleteChallenge,
  onGrantReward
}: {
  employees: User[];
  challenges: Challenge[];
  rewardEvents: RewardEvent[];
  employeePoints: Record<string, number>;
  onOpenCreate?: () => void;
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
  const [spotEmployeeId, setSpotEmployeeId] = useState(employees[0]?.id ?? "");
  const [spotPoints, setSpotPoints] = useState("50");
  const [spotNote, setSpotNote] = useState("Great work this week");

  const openChallenges = challenges.filter((challenge) => challenge.status === "open");
  const totalPointsGranted = rewardEvents.reduce((sum, event) => sum + event.points, 0);

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

  const grantAutomation = (automation: RewardAutomation) => {
    if (!automation.enabled || !onGrantReward || !employees.length) return;
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
    Alert.alert("Granted (demo)", `${automation.label} applied to ${employees.length} employee(s).`);
  };

  const grantSpotBonus = () => {
    const employee = employees.find((item) => item.id === spotEmployeeId);
    const points = Number(spotPoints.replace(/\D/g, ""));
    if (!employee || !onGrantReward || !points) {
      Alert.alert("Pick employee and points", "Choose an employee and a valid points amount.");
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
  };

  return (
    <>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.greetingText}>Challenges & rewards</Text>
          <Text style={styles.greetingSub}>
            {openChallenges.length} active challenges · {totalPointsGranted.toLocaleString()} pts granted
          </Text>
        </View>
        <Pressable onPress={onOpenCreate} style={styles.inviteButton}>
          <Trophy size={16} color={colors.onPrimary} />
          <Text style={styles.inviteButtonText}>New</Text>
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
                    {challenge.target === "everyone" ? "Everyone" : challenge.employeeName} · +{challenge.rewardPoints} pts
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

      <Section title="Recognition automations" meta="Demo">
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
            <CapsuleButton label="Grant" onPress={() => grantAutomation(automation)} variant="ghost" />
          </GlassPanel>
        ))}
      </Section>

      <Section title="Spot bonus" meta="One-off">
        <GlassPanel style={styles.challengeCard} intensity={18}>
          <Text style={styles.modalFieldLabel}>Employee</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
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
  onCreate?: (challenge: Omit<Challenge, "id" | "status">) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardPoints, setRewardPoints] = useState("75");
  const [target, setTarget] = useState<"everyone" | string>("everyone");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (visible) {
      setTitle("");
      setDescription("");
      setRewardPoints("75");
      setTarget("everyone");
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
    const employee = employees.find((item) => item.id === target);
    onCreate?.({
      employeeId: target === "everyone" ? employees[0]?.id ?? "everyone" : target,
      employeeName: target === "everyone" ? "Everyone" : employee?.name ?? "Employee",
      employerId,
      title: trimmedTitle,
      description: description.trim(),
      rewardPoints: points,
      target,
      dueDate: dueDate.trim() || undefined
    });
    onClose();
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
            <Text style={styles.modalFieldLabel}>Target</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              <Pressable
                onPress={() => setTarget("everyone")}
                style={[styles.filterChip, target === "everyone" && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, target === "everyone" && styles.filterChipTextActive]}>Everyone</Text>
              </Pressable>
              {employees.map((employee) => {
                const selected = target === employee.id;
                return (
                  <Pressable
                    key={employee.id}
                    onPress={() => setTarget(employee.id)}
                    style={[styles.filterChip, selected && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                      {employee.name.split(" ")[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={styles.modalFieldLabel}>Due date (optional)</Text>
            <TextInput value={dueDate} onChangeText={setDueDate} style={styles.input} placeholder="YYYY-MM-DD" />
            <CapsuleButton label="Create challenge" onPress={handleCreate} icon={<Trophy size={16} color={colors.onPrimary} />} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

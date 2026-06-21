import { File, Paths } from "expo-file-system";
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Gift,
  Mail,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Trophy,
  Upload,
  UserMinus,
  UserPlus,
  Users,
  Wallet,
  X
} from "lucide-react-native";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { BottomNav, NavTab } from "../components/BottomNav";
import { CapsuleButton } from "../components/CapsuleButton";
import { GlassPanel } from "../components/GlassPanel";
import { Section } from "../components/Section";
import { UserProfileScreen } from "../components/UserProfileScreen";
import { currency, escapeCsvField, formatActivityTimestamp } from "../lib/format";
import { formatPointsWithAllHint, pointsToAll } from "../lib/pointsConversion";
import { ProviderOfferGroup, groupProvidersWithOffers } from "../lib/employerCatalog";
import {
  formatDateLabel,
  generateInviteCode,
  rewardKindLabel
} from "../lib/rewardsDemo";
import { PerxLiveData } from "../lib/perxRepository";
import { ChallengesPage, CreateChallengeModal } from "./EmployerChallenges";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import {
  Benefit,
  BenefitCategory,
  ChallengeCriterion,
  ChallengeDefinition,
  ChallengeProgress,
  EmployeeInvite,
  ProviderProfile,
  RewardEvent,
  SelectionRequest,
  User
} from "../types";

type AppData = PerxLiveData;

type EmployerTab = "home" | "employees" | "catalog" | "activity" | "challenges" | "profile";

async function exportEmployerActivityCsv(
  selectionRequests: SelectionRequest[],
  benefits: Benefit[],
  onViewActivity: () => void
) {
  try {
    const header = ["Employee", "Perk", "Points", "Amount ALL", "Status", "Date"];
    const rows = selectionRequests.map((request) => {
      const requestBenefits = request.benefitIds
        .map((benefitId) => benefits.find((benefit) => benefit.id === benefitId))
        .filter(Boolean) as Benefit[];
      const title = requestBenefits.map((benefit) => benefit.title).join("; ") || "Perk selection";
      const when = request.approvedAt ?? request.createdAt;
      return [
        request.employeeName,
        title,
        request.totalPoints,
        pointsToAll(request.totalPoints),
        request.status,
        when.slice(0, 10)
      ].map(escapeCsvField);
    });
    const csv = [header.map(escapeCsvField).join(","), ...rows.map((row) => row.join(","))].join("\n");
    const filename = `perx-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    const file = new File(Paths.document, filename);
    file.create({ overwrite: true });
    file.write(csv);
    Alert.alert(
      "Export complete",
      `${selectionRequests.length} records saved as ${filename}.`,
      [
        { text: "View activity", onPress: onViewActivity },
        { text: "OK", style: "cancel" }
      ]
    );
  } catch {
    Alert.alert("Export failed", "Could not save the report. Try again.");
  }
}

type EmployerStatCarouselItem = {
  label: string;
  value: string;
  icon: ReactNode;
  onPress?: () => void;
};

function EmployerStatCarousel({ items }: { items: EmployerStatCarouselItem[] }) {
  const { width } = useWindowDimensions();
  const slideWidth = Math.round((width - 40) * 0.34);
  const gap = 8;
  const stride = slideWidth + gap;
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View style={styles.providerMetricCarouselWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={stride}
        snapToAlignment="start"
        disableIntervalMomentum
        scrollEventThrottle={16}
        contentContainerStyle={styles.providerMetricCarouselContent}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / stride);
          setActiveIndex(Math.max(0, Math.min(items.length - 1, next)));
        }}
      >
        {items.map((item) => {
          const capsule = (
            <View style={[styles.employerStatCapsule, styles.employerStatCapsuleCarousel, { width: slideWidth }]}>
              {item.icon}
              <Text style={styles.employerStatValue}>{item.value}</Text>
              <Text style={styles.employerStatLabel}>{item.label}</Text>
            </View>
          );

          return (
            <View key={item.label} style={{ width: slideWidth }}>
              {item.onPress ? <Pressable onPress={item.onPress}>{capsule}</Pressable> : capsule}
            </View>
          );
        })}
      </ScrollView>
      {items.length > 1 ? (
        <View style={styles.providerMetricCarouselFooter}>
          <View style={styles.providerMetricCarouselDots}>
            {items.map((item, index) => (
              <View
                key={item.label}
                style={[
                  styles.providerMetricCarouselDot,
                  index === activeIndex && styles.providerMetricCarouselDotActive
                ]}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const employerTabs: Array<NavTab<EmployerTab>> = [
  { id: "home", label: "Home", icon: "home-outline", iconActive: "home" },
  { id: "employees", label: "Team", icon: "account-group-outline", iconActive: "account-group" },
  { id: "catalog", label: "Providers", icon: "store-outline", iconActive: "store" },
  { id: "activity", label: "Activity", icon: "chart-box-outline", iconActive: "chart-box" },
  { id: "challenges", label: "Challenges", icon: "trophy-outline", iconActive: "trophy" },
  { id: "profile", label: "Profile", icon: "account-circle-outline", iconActive: "account-circle" }
];

export function EmployerExperience({
  user,
  appData,
  selectionRequests,
  onLogout,
  employeePoints = {},
  employeeBudgets = {},
  rewardEvents = [],
  employeeInvites = [],
  onUpdateEmployeeBudget,
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
  employeeBudgets?: Record<string, number>;
  rewardEvents?: RewardEvent[];
  employeeInvites?: EmployeeInvite[];
  onUpdateEmployeeBudget?: (input: { employeeIds: string[]; amountAll: number }) => void | Promise<void>;
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
  const budgets = employeeBudgets;
  const [suspendedEmployeeIds, setSuspendedEmployeeIds] = useState<Record<string, boolean>>({});
  const [removedEmployeeIds, setRemovedEmployeeIds] = useState<Record<string, boolean>>({});
  const [assignBudgetOpen, setAssignBudgetOpen] = useState(false);
  const [assignBudgetTargetIds, setAssignBudgetTargetIds] = useState<string[]>([]);
  const [importEmployeesOpen, setImportEmployeesOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailEmployeeId, setDetailEmployeeId] = useState<string | null>(null);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const employees = useMemo(
    () =>
      appData.users.filter(
        (item) =>
          item.role === "employee" &&
          item.companyId === company.id &&
          !removedEmployeeIds[item.id]
      ),
    [appData.users, company.id, removedEmployeeIds]
  );

  const redemptionsCount = selectionRequests.filter((request) => request.status === "approved").length;

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
    () =>
      [...selectionRequests]
        .sort((a, b) =>
          (b.approvedAt ?? b.createdAt ?? "").localeCompare(a.approvedAt ?? a.createdAt ?? "")
        )
        .slice(0, 5),
    [selectionRequests]
  );
  const budgetOverview = useMemo(() => {
    let monthlyBudget = 0;
    let spent = 0;
    let pending = 0;
    for (const employee of employees) {
      const budget = budgets[employee.id] ?? 0;
      monthlyBudget += budget;
      const reqs = selectionRequests.filter((request) => request.employeeId === employee.id);
      spent += reqs
        .filter((request) => request.status === "approved")
        .reduce((sum, request) => sum + pointsToAll(request.totalPoints), 0);
      pending += reqs
        .filter((request) => request.status === "pending" || request.status === "draft")
        .reduce((sum, request) => sum + pointsToAll(request.totalPoints), 0);
    }
    return {
      monthlyBudget,
      spent,
      remaining: Math.max(0, monthlyBudget - spent - pending)
    };
  }, [employees, budgets, selectionRequests]);
  const employeesWithoutBudget = useMemo(
    () => employees.filter((employee) => (budgets[employee.id] ?? 0) <= 0).length,
    [employees, budgets]
  );
  const disabledProviderCount = useMemo(
    () =>
      providerGroups.filter((group) => {
        const offerIds = group.offers.map((offer) => offer.id);
        return offerIds.length > 0 && !offerIds.some((id) => enabledBenefitIds.includes(id));
      }).length,
    [providerGroups, enabledBenefitIds]
  );
  const pendingRedemptionCount = useMemo(
    () =>
      selectionRequests.filter(
        (request) => request.status === "pending" || request.status === "draft"
      ).length,
    [selectionRequests]
  );
  const budgetUsedRatio =
    budgetOverview.monthlyBudget > 0
      ? Math.min(1, (budgetOverview.monthlyBudget - budgetOverview.remaining) / budgetOverview.monthlyBudget)
      : 0;

  const statsFor = (employeeId: string): EmployeeStats => {
    const reqs = selectionRequests.filter((request) => request.employeeId === employeeId);
    const used = reqs
      .filter((request) => request.status === "approved")
      .reduce((sum, request) => sum + pointsToAll(request.totalPoints), 0);
    const pending = reqs
      .filter((request) => request.status === "pending" || request.status === "draft")
      .reduce((sum, request) => sum + pointsToAll(request.totalPoints), 0);
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

  const openAssignBudget = (employeeIds: string[]) => {
    let targets = employeeIds;
    if (!targets.length) {
      targets = employees.filter((employee) => (budgets[employee.id] ?? 0) <= 0).map((employee) => employee.id);
    }
    if (!targets.length) {
      Alert.alert("Select employees", "Choose employees to assign a monthly budget.");
      return;
    }
    setAssignBudgetTargetIds(targets);
    setAssignBudgetOpen(true);
  };

  const saveAssignedBudget = (amount: number) => {
    void onUpdateEmployeeBudget?.({
      employeeIds: assignBudgetTargetIds,
      amountAll: amount
    });
    Alert.alert(
      "Budget updated",
      `${assignBudgetTargetIds.length} employee${assignBudgetTargetIds.length === 1 ? "" : "s"} set to ${currency(amount)} per month.`
    );
    setAssignBudgetTargetIds([]);
  };

  const assignBudgetDefaultAmount =
    assignBudgetTargetIds.length === 1
      ? budgets[assignBudgetTargetIds[0]] ||
        company.monthlyBudgetPerEmployee ||
        1500
      : company.monthlyBudgetPerEmployee || 1500;

  const assignBudgetIsEdit =
    assignBudgetTargetIds.length === 1 && (budgets[assignBudgetTargetIds[0]] ?? 0) > 0;

  const handleImportEmployees = (emails: string[]) => {
    if (!emails.length) {
      setImportEmployeesOpen(true);
      return;
    }
    Alert.alert(
      "Import queued",
      `${emails.length} invite${emails.length === 1 ? "" : "s"} ready to send from the import list.`
    );
  };

  const handleRemoveEmployees = (employeeIds: string[]) => {
    if (!employeeIds.length) {
      return;
    }
    Alert.alert(
      "Remove employees",
      `Remove ${employeeIds.length} selected employee${employeeIds.length === 1 ? "" : "s"} from your team view?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setRemovedEmployeeIds((current) => {
              const next = { ...current };
              for (const id of employeeIds) {
                next[id] = true;
              }
              return next;
            });
          }
        }
      ]
    );
  };

  const assignBudgetLabel =
    assignBudgetTargetIds.length === 1
      ? (employees.find((employee) => employee.id === assignBudgetTargetIds[0])?.name ?? "Employee")
      : `${assignBudgetTargetIds.length} employees`;

  return (
    <View style={styles.roleShell}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, styles.adminContent]}
        showsVerticalScrollIndicator={false}
      >
        {tab === "home" ? (
          <>
            <View style={styles.adminPageTitle}>
              <View style={styles.adminHeader}>
                <View style={styles.adminHeaderCopy}>
                  <Text style={styles.adminTitle}>Hi, {user.name.split(" ")[0]}</Text>
                </View>
                <Pressable
                  onPress={() =>
                    exportEmployerActivityCsv(selectionRequests, appData.benefits, () => setTab("activity"))
                  }
                  style={styles.employerHeaderAction}
                >
                  <FileText size={14} color={colors.primary} />
                  <Text style={styles.employerHeaderActionText}>Export CSV</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.adminPageSummary}>
              <EmployerStatCarousel
                items={[
                  {
                    label: "Redemptions",
                    value: String(redemptionsCount),
                    icon: <CircleDollarSign size={14} color={colors.secondary} />
                  },
                  {
                    label: "Challenges",
                    value: String(openChallengeCount),
                    icon: <Trophy size={14} color={colors.accent} />,
                    onPress: () => setTab("challenges")
                  },
                  {
                    label: "Perks enabled",
                    value: String(enabledPerksCount),
                    icon: <Store size={14} color={colors.tertiary} />
                  }
                ]}
              />

              <GlassPanel style={styles.employerBudgetCard} intensity={24}>
                <Text style={styles.adminCardTitle}>Monthly budget</Text>
                <View style={styles.employerBudgetRow}>
                  <View style={styles.employerBudgetCell}>
                    <Text style={styles.employerBudgetValue}>{currency(budgetOverview.monthlyBudget)}</Text>
                    <Text style={styles.employerBudgetLabel}>Budget</Text>
                  </View>
                  <View style={styles.employerBudgetCell}>
                    <Text style={styles.employerBudgetValue}>{currency(budgetOverview.spent)}</Text>
                    <Text style={styles.employerBudgetLabel}>Spent</Text>
                  </View>
                  <View style={styles.employerBudgetCell}>
                    <Text style={styles.employerBudgetValue}>{currency(budgetOverview.remaining)}</Text>
                    <Text style={styles.employerBudgetLabel}>Remaining</Text>
                  </View>
                </View>
                <View style={styles.employerBudgetBarTrack}>
                  <View
                    style={[
                      styles.employerBudgetBarFill,
                      { width: `${Math.round(budgetUsedRatio * 100)}%` as `${number}%` }
                    ]}
                  />
                </View>
              </GlassPanel>

              {employeesWithoutBudget || disabledProviderCount || pendingRedemptionCount || !enabledPerksCount ? (
                <View style={styles.employerAlertStack}>
                {!enabledPerksCount ? (
                  <Pressable onPress={() => setTab("catalog")}>
                    <GlassPanel style={styles.employerAlertCard} intensity={20}>
                      <View style={styles.employerAlertIcon}>
                        <Store size={18} color="#E65100" />
                      </View>
                      <View style={styles.listText}>
                        <Text style={styles.listTitle}>No perks visible yet</Text>
                        <Text style={styles.listSub}>Select providers so employees can browse perks.</Text>
                      </View>
                      <ChevronRight size={18} color={colors.primary} />
                    </GlassPanel>
                  </Pressable>
                ) : null}
                {employeesWithoutBudget ? (
                  <Pressable onPress={() => setTab("employees")}>
                    <GlassPanel style={styles.employerAlertCard} intensity={20}>
                      <View style={[styles.employerAlertIcon, styles.employerAlertIconWarn]}>
                        <AlertTriangle size={18} color="#C62828" />
                      </View>
                      <View style={styles.listText}>
                        <Text style={styles.listTitle}>
                          {employeesWithoutBudget} employee{employeesWithoutBudget === 1 ? "" : "s"} have no budget
                        </Text>
                        <Text style={styles.listSub}>Assign monthly budgets on the Team tab.</Text>
                      </View>
                      <ChevronRight size={18} color={colors.primary} />
                    </GlassPanel>
                  </Pressable>
                ) : null}
                {disabledProviderCount ? (
                  <Pressable onPress={() => setTab("catalog")}>
                    <GlassPanel style={styles.employerAlertCard} intensity={20}>
                      <View style={[styles.employerAlertIcon, styles.employerAlertIconInfo]}>
                        <Store size={18} color="#1565C0" />
                      </View>
                      <View style={styles.listText}>
                        <Text style={styles.listTitle}>
                          {disabledProviderCount} provider{disabledProviderCount === 1 ? "" : "s"} disabled
                        </Text>
                        <Text style={styles.listSub}>Enable partners to show perks in the marketplace.</Text>
                      </View>
                      <ChevronRight size={18} color={colors.primary} />
                    </GlassPanel>
                  </Pressable>
                ) : null}
                {pendingRedemptionCount ? (
                  <Pressable onPress={() => setTab("activity")}>
                    <GlassPanel style={styles.employerAlertCard} intensity={20}>
                      <View style={styles.employerAlertIcon}>
                        <CircleDollarSign size={18} color="#E65100" />
                      </View>
                      <View style={styles.listText}>
                        <Text style={styles.listTitle}>
                          {pendingRedemptionCount} pending redemption{pendingRedemptionCount === 1 ? "" : "s"}
                        </Text>
                        <Text style={styles.listSub}>Review recent activity for open requests.</Text>
                      </View>
                      <ChevronRight size={18} color={colors.primary} />
                    </GlassPanel>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            </View>

            <View style={styles.adminPageActions}>
            <Section dense title="Quick actions">
              <View style={styles.employerQuickActionGrid}>
                <Pressable onPress={() => setTab("catalog")} style={styles.employerQuickActionTile}>
                  <Store size={16} color={colors.primary} />
                  <Text style={styles.employerQuickActionTileText}>Providers</Text>
                </Pressable>
                <Pressable onPress={() => setTab("employees")} style={styles.employerQuickActionTile}>
                  <Users size={16} color={colors.secondary} />
                  <Text style={styles.employerQuickActionTileText}>Team</Text>
                </Pressable>
                <Pressable onPress={() => setTab("challenges")} style={styles.employerQuickActionTile}>
                  <Trophy size={16} color={colors.accent} />
                  <Text style={styles.employerQuickActionTileText}>Challenges</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setTab("challenges");
                    setChallengeModalOpen(true);
                  }}
                  style={styles.employerQuickActionTile}
                >
                  <Sparkles size={16} color={colors.primary} />
                  <Text style={styles.employerQuickActionTileText}>New challenge</Text>
                </Pressable>
                <Pressable onPress={() => setInviteOpen(true)} style={styles.employerQuickActionTile}>
                  <UserPlus size={16} color={colors.tertiary} />
                  <Text style={styles.employerQuickActionTileText}>Invite employee</Text>
                </Pressable>
                <Pressable
                  onPress={() => setTab("activity")}
                  style={styles.employerQuickActionTile}
                >
                  <FileText size={16} color={colors.secondary} />
                  <Text style={styles.employerQuickActionTileText}>View reports</Text>
                </Pressable>
              </View>
            </Section>
            </View>

            <View style={styles.adminPageMain}>
            <Section dense title="Recent activity" meta={recentRedemptions.length ? "Latest" : undefined}>
              {recentRedemptions.length ? (
                recentRedemptions.map((request) => {
                  const requestBenefits = request.benefitIds
                    .map((benefitId) => appData.benefits.find((benefit) => benefit.id === benefitId))
                    .filter(Boolean) as Benefit[];
                  const title =
                    requestBenefits.map((benefit) => benefit.title).join(", ") || "Perk selection";
                  const when = request.approvedAt ?? request.createdAt;

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
                        <Text style={styles.employerActivityTime}>
                          {formatActivityTimestamp(when)}
                        </Text>
                      </View>
                      <View style={styles.employerActivityMeta}>
                        <Text style={styles.employerActivityAmount}>{request.totalPoints} pts</Text>
                        <Text style={styles.employerActivityStatus}>
                          ≈ {currency(pointsToAll(request.totalPoints))} ·{" "}
                          {request.status === "approved" ? "Settled" : "Pending"}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.adminListRow}>
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
            </View>
          </>
        ) : null}

        {tab === "activity" ? (
          <ActivityPage
            selectionRequests={selectionRequests}
            benefits={appData.benefits}
            rewardEvents={rewardEvents}
            onExportCsv={() =>
              exportEmployerActivityCsv(selectionRequests, appData.benefits, () => setTab("activity"))
            }
          />
        ) : null}

        {tab === "challenges" ? (
          <ChallengesPage
            employerId={employerScopeId}
            definitions={employerDefinitions}
            progressRows={appData.challengeProgress}
            disabledTemplateKeys={appData.disabledChallengeTemplates[employerScopeId] ?? []}
            employees={employees}
            rewardEvents={rewardEvents}
            onOpenCreate={() => setChallengeModalOpen(true)}
            onArchiveChallenge={onArchiveChallenge}
            onCompleteChallenge={onCompleteChallenge}
            onCompleteChallengeForEmployee={onCompleteChallengeForEmployee}
            onToggleChallengeTemplate={onToggleChallengeTemplate}
            onGrantReward={onGrantReward}
          />
        ) : null}

        {tab === "employees" ? (
          <EmployeesPage
            employees={employees}
            budgets={budgets}
            employeeInvites={companyInvites}
            employeePoints={employeePoints}
            statsFor={statsFor}
            suspendedEmployeeIds={suspendedEmployeeIds}
            onOpenInvite={() => setInviteOpen(true)}
            onSelectEmployee={(id) => setDetailEmployeeId(id)}
            onAssignBudget={openAssignBudget}
            onImportEmployees={handleImportEmployees}
            onRemoveEmployees={handleRemoveEmployees}
          />
        ) : null}

        {tab === "catalog" ? (
          <ProviderCatalogPage
            providerProfiles={appData.providerProfiles}
            benefits={appData.benefits}
            enabledBenefitIds={enabledBenefitIds}
            selectionRequests={selectionRequests}
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
        enabledBenefitIds={enabledBenefitIds}
        pointsBalance={detailEmployee ? employeePoints[detailEmployee.id] ?? 0 : 0}
        suspended={detailEmployee ? !!suspendedEmployeeIds[detailEmployee.id] : false}
        challengeDefinitions={employerDefinitions}
        challengeProgress={appData.challengeProgress}
        onClose={() => setDetailEmployeeId(null)}
        onAssignBudget={() => detailEmployee && openAssignBudget([detailEmployee.id])}
        onToggleSuspend={() => {
          if (!detailEmployee) {
            return;
          }
          setSuspendedEmployeeIds((current) => ({
            ...current,
            [detailEmployee.id]: !current[detailEmployee.id]
          }));
        }}
        onRemove={() => {
          if (!detailEmployee) {
            return;
          }
          handleRemoveEmployees([detailEmployee.id]);
          setDetailEmployeeId(null);
        }}
      />

      <AssignBudgetModal
        visible={assignBudgetOpen}
        employeeLabel={assignBudgetLabel}
        defaultAmount={assignBudgetDefaultAmount}
        isEdit={assignBudgetIsEdit}
        onClose={() => {
          setAssignBudgetOpen(false);
          setAssignBudgetTargetIds([]);
        }}
        onSave={saveAssignedBudget}
      />

      <ImportEmployeesModal
        visible={importEmployeesOpen}
        onClose={() => setImportEmployeesOpen(false)}
        onImport={handleImportEmployees}
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

type EmployeeListFilter = "all" | "active" | "no_budget" | "high_usage" | "invited";

const HIGH_USAGE_RATIO = 0.7;

const PROVIDER_CATEGORY_FILTERS: Array<{ id: BenefitCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "Food", label: "Food" },
  { id: "Fitness", label: "Fitness" },
  { id: "Learning", label: "Learning" },
  { id: "Health", label: "Health" },
  { id: "Mobility", label: "Transport" }
];

type ActivityFeedFilter = "all" | "redemptions" | "rewards";
type ActivityStatusFilter = "all" | "settled" | "pending" | "failed" | "refunded";

function providerCategory(group: ProviderOfferGroup): BenefitCategory | undefined {
  return group.profile?.category ?? group.offers[0]?.category;
}

function redemptionStatusLabel(status: SelectionRequest["status"]): string {
  if (status === "approved") {
    return "Settled";
  }
  if (status === "rejected") {
    return "Failed";
  }
  if (status === "pending" || status === "draft") {
    return "Pending";
  }
  return status;
}

function redemptionStatusKey(status: SelectionRequest["status"]): ActivityStatusFilter {
  if (status === "approved") {
    return "settled";
  }
  if (status === "rejected") {
    return "failed";
  }
  return "pending";
}

function providerNameForRequest(request: SelectionRequest, benefits: Benefit[]): string {
  const benefit = benefits.find((item) => request.benefitIds.includes(item.id));
  return benefit?.providerName ?? "Provider";
}

const EMPLOYEE_AVATAR_TINTS = [
  { background: "rgba(0,88,188,0.14)", color: "#0058BC" },
  { background: "rgba(76,175,80,0.14)", color: "#2E7D32" },
  { background: "rgba(156,39,176,0.14)", color: "#7B1FA2" },
  { background: "rgba(230,81,0,0.14)", color: "#E65100" },
  { background: "rgba(0,172,193,0.14)", color: "#00838F" }
];

function employeeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function employeeAvatarTint(name: string) {
  let hash = 0;
  for (const char of name) {
    hash = (hash + char.charCodeAt(0)) % EMPLOYEE_AVATAR_TINTS.length;
  }
  return EMPLOYEE_AVATAR_TINTS[hash];
}

function employeeUsageRatio(stats: EmployeeStats): number {
  if (stats.budget <= 0) {
    return 0;
  }
  return Math.min(1, (stats.used + stats.pending) / stats.budget);
}

function AssignBudgetModal({
  visible,
  employeeLabel,
  defaultAmount,
  isEdit = false,
  onClose,
  onSave
}: {
  visible: boolean;
  employeeLabel: string;
  defaultAmount: number;
  isEdit?: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(String(defaultAmount));

  useEffect(() => {
    if (visible) {
      setAmount(String(defaultAmount));
    }
  }, [visible, defaultAmount]);

  const handleSave = () => {
    const parsed = Number(amount.replace(/[^\d.]/g, ""));
    if (!parsed || parsed <= 0) {
      Alert.alert("Enter a budget", "Add a monthly budget amount in ALL.");
      return;
    }
    onSave(parsed);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{isEdit ? "Change budget" : "Assign budget"}</Text>
                <Text style={styles.listSub}>{employeeLabel}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.modalClose}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.modalFieldLabel}>Monthly budget (ALL)</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="1500"
                placeholderTextColor={colors.muted}
                style={styles.input}
                keyboardType="numeric"
              />
              <CapsuleButton label={isEdit ? "Save budget" : "Assign budget"} onPress={handleSave} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ImportEmployeesModal({
  visible,
  onClose,
  onImport
}: {
  visible: boolean;
  onClose: () => void;
  onImport: (emails: string[]) => void;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (visible) {
      setText("");
    }
  }, [visible]);

  const handleImport = () => {
    const emails = text
      .split(/[\n,;]+/)
      .map((line) => line.trim())
      .filter((line) => line.includes("@"));
    if (!emails.length) {
      Alert.alert("Add emails", "Paste one or more employee emails to import.");
      return;
    }
    onImport(emails);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Import employees</Text>
              <Text style={styles.listSub}>One email per line</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.modalContent}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={"name@company.com\nother@company.com"}
              placeholderTextColor={colors.muted}
              style={[styles.input, { minHeight: 120, textAlignVertical: "top" }]}
              multiline
              autoCapitalize="none"
            />
            <CapsuleButton label="Import list" onPress={handleImport} icon={<Upload size={16} color={colors.onPrimary} />} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EmployeesPage({
  employees,
  budgets,
  employeeInvites,
  employeePoints,
  statsFor,
  suspendedEmployeeIds,
  onOpenInvite,
  onSelectEmployee,
  onAssignBudget,
  onImportEmployees,
  onRemoveEmployees
}: {
  employees: User[];
  budgets: Record<string, number>;
  employeeInvites: EmployeeInvite[];
  employeePoints: Record<string, number>;
  statsFor: (employeeId: string) => EmployeeStats;
  suspendedEmployeeIds: Record<string, boolean>;
  onOpenInvite: () => void;
  onSelectEmployee: (employeeId: string) => void;
  onAssignBudget: (employeeIds: string[]) => void;
  onImportEmployees: (emails: string[]) => void;
  onRemoveEmployees: (employeeIds: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<EmployeeListFilter>("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const pendingInvites = employeeInvites.filter((invite) => invite.status === "sent");

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const stats = statsFor(employee.id);
      const budget = budgets[employee.id] ?? 0;
      const usage = employeeUsageRatio(stats);
      const suspended = !!suspendedEmployeeIds[employee.id];

      if (query && !employee.name.toLowerCase().includes(query) && !employee.email.toLowerCase().includes(query)) {
        return false;
      }
      if (filter === "active") {
        return !suspended && budget > 0;
      }
      if (filter === "no_budget") {
        return budget <= 0;
      }
      if (filter === "high_usage") {
        return budget > 0 && usage >= HIGH_USAGE_RATIO;
      }
      if (filter === "invited") {
        return false;
      }
      return true;
    });
  }, [employees, search, filter, budgets, statsFor, suspendedEmployeeIds]);

  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  const toggleSelected = (employeeId: string) => {
    setSelectedIds((current) => ({ ...current, [employeeId]: !current[employeeId] }));
  };

  const clearSelection = () => {
    setSelectedIds({});
    setSelectMode(false);
  };

  const filterOptions: Array<{ id: EmployeeListFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "no_budget", label: "No budget" },
    { id: "high_usage", label: "High usage" },
    { id: "invited", label: "Invited" }
  ];

  return (
    <>
      <View style={styles.adminPageTitle}>
        <View style={styles.adminHeader}>
          <View style={styles.adminHeaderCopy}>
            <Text style={styles.adminTitle}>Employees</Text>
          </View>
          <Pressable onPress={onOpenInvite} style={styles.inviteButton}>
            <UserPlus size={16} color={colors.onPrimary} />
            <Text style={styles.inviteButtonText}>Invite</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.adminPageSummary}>
        <View style={styles.employeeSearchRow}>
          <Search size={16} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search employees"
            placeholderTextColor={colors.muted}
            style={styles.employeeSearchInput}
            autoCapitalize="none"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filterOptions.map((option) => {
            const active = filter === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setFilter(option.id)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.adminPageMain}>
      {filter !== "invited" && pendingInvites.length ? (
        <Section dense title="Pending invites" meta={`${pendingInvites.length} sent`}>
          {pendingInvites.map((invite) => (
            <View key={invite.id} style={styles.adminListRow}>
              <View style={[styles.recordAvatar, { backgroundColor: "rgba(0,88,188,0.12)" }]}>
                <Text style={styles.recordAvatarText}>{invite.email.charAt(0).toUpperCase()}</Text>
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

      {filter === "invited" ? (
        <Section dense title="Invited">
          {pendingInvites.length ? (
            pendingInvites.map((invite) => (
              <View key={invite.id} style={styles.adminListRow}>
                <View style={[styles.recordAvatar, { backgroundColor: "rgba(0,88,188,0.12)" }]}>
                  <Text style={styles.recordAvatarText}>{invite.email.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.listText}>
                  <Text style={styles.listTitle}>{invite.email}</Text>
                  <Text style={styles.listSub}>
                    Code {invite.code} · starts {formatDateLabel(invite.startDate)}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>Pending</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.adminListRow}>
              <View style={styles.smallIcon}>
                <Mail size={18} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>No pending invites</Text>
                <Text style={styles.listSub}>Send an invite to add someone to your team.</Text>
              </View>
            </View>
          )}
        </Section>
      ) : (
        <Section dense title="Team">
          <View style={styles.employeeBulkBar}>
            <Pressable
              onPress={() => {
                if (selectMode) {
                  clearSelection();
                } else {
                  setSelectMode(true);
                }
              }}
              style={styles.employeeBulkBtn}
            >
              <Text style={styles.employeeBulkBtnText}>{selectMode ? "Cancel" : "Select"}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (selectMode && selectedCount) {
                  onAssignBudget(Object.keys(selectedIds).filter((id) => selectedIds[id]));
                } else {
                  onAssignBudget([]);
                }
              }}
              style={styles.employeeBulkBtn}
            >
              <Wallet size={14} color={colors.primary} />
              <Text style={styles.employeeBulkBtnText}>Set budget</Text>
            </Pressable>
            <Pressable onPress={() => onImportEmployees([])} style={styles.employeeBulkBtn}>
              <Upload size={14} color={colors.primary} />
              <Text style={styles.employeeBulkBtnText}>Import</Text>
            </Pressable>
            {selectMode && selectedCount ? (
              <Pressable
                onPress={() => onRemoveEmployees(Object.keys(selectedIds).filter((id) => selectedIds[id]))}
                style={[styles.employeeBulkBtn, styles.employeeBulkBtnDanger]}
              >
                <UserMinus size={14} color="#C62828" />
                <Text style={[styles.employeeBulkBtnText, styles.employeeBulkBtnTextDanger]}>
                  Remove ({selectedCount})
                </Text>
              </Pressable>
            ) : null}
          </View>

          {filteredEmployees.length ? (
            filteredEmployees.map((employee) => {
              const stats = statsFor(employee.id);
              const points = employeePoints[employee.id] ?? 0;
              const budget = budgets[employee.id] ?? 0;
              const usage = employeeUsageRatio(stats);
              const highUsage = budget > 0 && usage >= HIGH_USAGE_RATIO;
              const tint = employeeAvatarTint(employee.name);
              const selected = !!selectedIds[employee.id];
              const suspended = !!suspendedEmployeeIds[employee.id];

              return (
                <Pressable
                  key={employee.id}
                  onPress={() => {
                    if (selectMode) {
                      toggleSelected(employee.id);
                      return;
                    }
                    onSelectEmployee(employee.id);
                  }}
                  onLongPress={() => {
                    setSelectMode(true);
                    toggleSelected(employee.id);
                  }}
                >
                  <GlassPanel
                    style={[styles.employeeRow, selected && styles.employeeRowSelected]}
                    intensity={32}
                  >
                    <View style={styles.employeeRowTop}>
                      {selectMode ? (
                        <View style={[styles.employeeSelectMark, selected && styles.employeeSelectMarkActive]}>
                          {selected ? <Check size={12} color={colors.onPrimary} /> : null}
                        </View>
                      ) : null}
                      <View style={[styles.recordAvatar, { backgroundColor: tint.background }]}>
                        <Text style={[styles.recordAvatarText, { color: tint.color }]}>
                          {employeeInitials(employee.name)}
                        </Text>
                      </View>
                      <View style={styles.listText}>
                        <Text style={styles.listTitle}>{employee.name}</Text>
                        <Text style={styles.listSub}>{points} pts</Text>
                        {suspended ? (
                          <View style={styles.employeeSuspendedBadge}>
                            <Text style={styles.employeeSuspendedBadgeText}>Suspended</Text>
                          </View>
                        ) : null}
                      </View>
                      {!selectMode ? <ChevronRight size={18} color={colors.muted} /> : null}
                    </View>

                    {budget > 0 ? (
                      <>
                        <View style={styles.employeeUsageTrack}>
                          <View
                            style={[
                              styles.employeeUsageFill,
                              highUsage && styles.employeeUsageFillHigh,
                              { width: `${Math.round(usage * 100)}%` as `${number}%` }
                            ]}
                          />
                        </View>
                        <View style={styles.employeeUsageMeta}>
                          <Text style={styles.employeeUsageSub}>
                            {currency(stats.available)} available of {currency(budget)}
                          </Text>
                          <View style={styles.employeeUsageMetaActions}>
                            <Pressable
                              onPress={(event) => {
                                event.stopPropagation?.();
                                onAssignBudget([employee.id]);
                              }}
                              style={styles.employeeAssignBtn}
                            >
                              <Text style={styles.employeeAssignBtnText}>Change budget</Text>
                            </Pressable>
                            <View style={[styles.employeeUsageChip, highUsage && styles.employeeUsageChipHigh]}>
                              <Text
                                style={[
                                  styles.employeeUsageChipText,
                                  highUsage && styles.employeeUsageChipTextHigh
                                ]}
                              >
                                {Math.round(usage * 100)}% used
                              </Text>
                            </View>
                          </View>
                        </View>
                      </>
                    ) : (
                      <View style={styles.employeeNoBudgetRow}>
                        <Text style={styles.listSub}>No budget assigned</Text>
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation?.();
                            onAssignBudget([employee.id]);
                          }}
                          style={styles.employeeAssignBtn}
                        >
                          <Text style={styles.employeeAssignBtnText}>Assign budget</Text>
                        </Pressable>
                      </View>
                    )}
                  </GlassPanel>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.adminListRow}>
              <View style={styles.smallIcon}>
                <Users size={18} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>
                  {search || filter !== "all" ? "No matches" : "No employees yet"}
                </Text>
                <Text style={styles.listSub}>
                  {search || filter !== "all"
                    ? "Try another search or filter."
                    : "Invite your first teammate to get started."}
                </Text>
              </View>
            </View>
          )}
        </Section>
      )}
      </View>
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
  enabledBenefitIds = [],
  pointsBalance,
  suspended = false,
  challengeDefinitions = [],
  challengeProgress = [],
  onClose,
  onAssignBudget,
  onToggleSuspend,
  onRemove
}: {
  visible: boolean;
  employee: User | null;
  stats: EmployeeStats | null;
  benefits: Benefit[];
  enabledBenefitIds?: string[];
  pointsBalance: number;
  suspended?: boolean;
  challengeDefinitions?: ChallengeDefinition[];
  challengeProgress?: ChallengeProgress[];
  onClose: () => void;
  onAssignBudget?: () => void;
  onToggleSuspend?: () => void;
  onRemove?: () => void;
}) {
  if (!employee || !stats) return null;

  const tint = employeeAvatarTint(employee.name);
  const redemptionHistory = [...stats.reqs].sort((a, b) =>
    (b.approvedAt ?? b.createdAt ?? "").localeCompare(a.approvedAt ?? a.createdAt ?? "")
  );
  const assignedBenefitIds = new Set(stats.reqs.flatMap((request) => request.benefitIds));
  const assignedBenefits = benefits.filter((benefit) => assignedBenefitIds.has(benefit.id));
  const availablePerks = benefits.filter((benefit) => enabledBenefitIds.includes(benefit.id));
  const usage = employeeUsageRatio(stats);
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
            <View style={{ flex: 1, flexDirection: "row", gap: 12, alignItems: "center" }}>
              <View style={[styles.recordAvatar, { backgroundColor: tint.background }]}>
                <Text style={[styles.recordAvatarText, { color: tint.color }]}>
                  {employeeInitials(employee.name)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{employee.name}</Text>
                <Text style={styles.listSub}>{employee.email}</Text>
                {suspended ? (
                  <View style={[styles.employeeSuspendedBadge, { marginTop: 6 }]}>
                    <Text style={styles.employeeSuspendedBadgeText}>Suspended</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.detailStatsRow}>
              <GlassPanel style={styles.detailStatCard} intensity={28}>
                <Text style={styles.detailStatLabel}>Current balance</Text>
                <Text style={styles.detailStatValue}>{pointsBalance} pts</Text>
              </GlassPanel>
              <GlassPanel style={styles.detailStatCard} intensity={28}>
                <Text style={styles.detailStatLabel}>Budget limit</Text>
                <Text style={styles.detailStatValue}>
                  {stats.budget > 0 ? currency(stats.budget) : "—"}
                </Text>
              </GlassPanel>
              <GlassPanel style={styles.detailStatCard} intensity={28}>
                <Text style={styles.detailStatLabel}>Available</Text>
                <Text style={styles.detailStatValue}>
                  {stats.budget > 0 ? currency(stats.available) : "—"}
                </Text>
              </GlassPanel>
            </View>

            {stats.budget > 0 ? (
              <>
                <View style={styles.employeeUsageTrack}>
                  <View
                    style={[
                      styles.employeeUsageFill,
                      usage >= HIGH_USAGE_RATIO && styles.employeeUsageFillHigh,
                      { width: `${Math.round(usage * 100)}%` as `${number}%` }
                    ]}
                  />
                </View>
                <Text style={styles.listSub}>
                  {currency(stats.used)} spent · {currency(stats.pending)} pending · {Math.round(usage * 100)}% used
                </Text>
                {onAssignBudget ? (
                  <Pressable onPress={onAssignBudget} style={styles.employeeAssignBtn}>
                    <Text style={styles.employeeAssignBtnText}>Change budget</Text>
                  </Pressable>
                ) : null}
              </>
            ) : (
              <View style={styles.employeeNoBudgetRow}>
                <Text style={styles.listSub}>No budget assigned</Text>
                {onAssignBudget ? (
                  <Pressable onPress={onAssignBudget} style={styles.employeeAssignBtn}>
                    <Text style={styles.employeeAssignBtnText}>Assign budget</Text>
                  </Pressable>
                ) : null}
              </View>
            )}

            <Text style={styles.modalFieldLabel}>Redemption history</Text>
            {redemptionHistory.length ? (
              redemptionHistory.map((request) => {
                const titles = request.benefitIds
                  .map((id) => benefits.find((benefit) => benefit.id === id)?.title)
                  .filter(Boolean)
                  .join(", ");
                const when = request.approvedAt ?? request.createdAt;
                return (
                  <View key={request.id} style={styles.adminListRow}>
                    <View style={styles.smallIcon}>
                      <Wallet size={18} color={colors.primary} />
                    </View>
                    <View style={styles.listText}>
                      <Text style={styles.listTitle}>{titles || "Benefit package"}</Text>
                      <Text style={styles.listSub}>
                        {formatPointsWithAllHint(request.totalPoints)} · {request.status}
                      </Text>
                      <Text style={styles.employerActivityTime}>{formatActivityTimestamp(when)}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.adminListRow}>
                <View style={styles.smallIcon}>
                  <Calendar size={18} color={colors.text} />
                </View>
                <View style={styles.listText}>
                  <Text style={styles.listTitle}>No redemptions yet</Text>
                  <Text style={styles.listSub}>Activity will show up here as perks are used.</Text>
                </View>
              </View>
            )}

            <Text style={styles.modalFieldLabel}>Assigned benefits</Text>
            {assignedBenefits.length ? (
              assignedBenefits.map((benefit) => (
                <View key={benefit.id} style={styles.adminListRow}>
                  <Image source={{ uri: benefit.imageUrl }} style={styles.catalogOfferThumb} />
                  <View style={styles.listText}>
                    <Text style={styles.listTitle}>{benefit.title}</Text>
                    <Text style={styles.listSub}>
                      {benefit.providerName} · {formatPointsWithAllHint(benefit.pointsPrice)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.adminListRow}>
                <View style={styles.smallIcon}>
                  <Gift size={18} color={colors.text} />
                </View>
                <View style={styles.listText}>
                  <Text style={styles.listTitle}>No assigned perks yet</Text>
                  <Text style={styles.listSub}>
                    {availablePerks.length
                      ? `${availablePerks.length} perks are available in your catalog.`
                      : "Enable providers to offer perks to this employee."}
                  </Text>
                </View>
              </View>
            )}

            {employeeChallenges.length ? (
              <>
                <Text style={styles.modalFieldLabel}>Challenges</Text>
                {employeeChallenges.map(({ definition, row }) => (
                  <View key={definition.id} style={styles.adminListRow}>
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

            <View style={styles.employeeDetailActions}>
              {onAssignBudget ? (
                <Pressable onPress={onAssignBudget} style={styles.employeeDetailActionBtn}>
                  <Wallet size={14} color={colors.primary} />
                  <Text style={styles.employeeDetailActionText}>
                    {stats.budget > 0 ? "Change budget" : "Assign budget"}
                  </Text>
                </Pressable>
              ) : null}
              {onToggleSuspend ? (
                <Pressable onPress={onToggleSuspend} style={styles.employeeDetailActionBtn}>
                  <ShieldCheck size={14} color={colors.primary} />
                  <Text style={styles.employeeDetailActionText}>
                    {suspended ? "Reactivate employee" : "Suspend employee"}
                  </Text>
                </Pressable>
              ) : null}
              {onRemove ? (
                <Pressable onPress={onRemove} style={[styles.employeeDetailActionBtn, styles.employeeDetailActionBtnDanger]}>
                  <UserMinus size={14} color="#C62828" />
                  <Text style={[styles.employeeDetailActionText, styles.employeeDetailActionTextDanger]}>
                    Remove employee
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ProviderDetailModal({
  visible,
  group,
  enabledBenefitIds,
  selectionRequests,
  onClose,
  onToggleBenefit,
  onToggleProvider
}: {
  visible: boolean;
  group: ProviderOfferGroup | null;
  enabledBenefitIds: string[];
  selectionRequests: SelectionRequest[];
  onClose: () => void;
  onToggleBenefit?: (benefitId: string) => void;
  onToggleProvider?: (benefitIds: string[], selected: boolean) => void;
}) {
  if (!group) {
    return null;
  }

  const providerName = group.profile?.businessName ?? group.offers[0]?.providerName ?? "Provider";
  const logoUrl = group.profile?.logoUrl ?? group.offers[0]?.imageUrl;
  const category = providerCategory(group) ?? "Partner";
  const offerIds = group.offers.map((offer) => offer.id);
  const allSelected = offerIds.length > 0 && offerIds.every((id) => enabledBenefitIds.includes(id));
  const pointsPrices = group.offers.map((offer) => offer.pointsPrice);
  const minPoints = pointsPrices.length ? Math.min(...pointsPrices) : 0;
  const maxPoints = pointsPrices.length ? Math.max(...pointsPrices) : 0;
  const usageCount = selectionRequests.filter((request) =>
    request.benefitIds.some((id) => offerIds.includes(id))
  ).length;
  const employeeUsage = new Set(
    selectionRequests
      .filter((request) => request.benefitIds.some((id) => offerIds.includes(id)))
      .map((request) => request.employeeId)
  ).size;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, flexDirection: "row", gap: 10, alignItems: "center" }}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.catalogProviderLogo} />
              ) : (
                <View style={[styles.catalogProviderLogo, styles.catalogProviderLogoFallback]}>
                  <Store size={16} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{providerName}</Text>
                <Text style={styles.listSub}>{category}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.detailStatsRow}>
              <GlassPanel style={styles.detailStatCard} intensity={24}>
                <Text style={styles.detailStatLabel}>Perks</Text>
                <Text style={styles.detailStatValue}>{group.offers.length}</Text>
              </GlassPanel>
              <GlassPanel style={styles.detailStatCard} intensity={24}>
                <Text style={styles.detailStatLabel}>Cost range</Text>
                <Text style={styles.detailStatValue} numberOfLines={1}>
                  {pointsPrices.length ? `${minPoints}–${maxPoints} pts` : "—"}
                </Text>
              </GlassPanel>
              <GlassPanel style={styles.detailStatCard} intensity={24}>
                <Text style={styles.detailStatLabel}>Usage</Text>
                <Text style={styles.detailStatValue}>{employeeUsage} emp</Text>
              </GlassPanel>
            </View>
            <Text style={styles.listSub}>
              {usageCount} redemption{usageCount === 1 ? "" : "s"} ·{" "}
              {formatPointsWithAllHint(minPoints)}
              {maxPoints !== minPoints ? ` – ${formatPointsWithAllHint(maxPoints)}` : ""}
            </Text>
            <Pressable
              onPress={() => onToggleProvider?.(offerIds, !allSelected)}
              style={[styles.catalogSelectBtn, allSelected && styles.catalogSelectBtnActive, { alignSelf: "flex-start" }]}
            >
              {allSelected ? <Check size={14} color={colors.onPrimary} /> : null}
              <Text style={[styles.catalogSelectText, allSelected && styles.catalogSelectTextActive]}>
                {allSelected ? "Disable all perks" : "Enable all perks"}
              </Text>
            </Pressable>
            <Text style={styles.modalFieldLabel}>Perks offered</Text>
            {group.offers.length ? (
              group.offers.map((offer) => {
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
                      <Text style={styles.listSub}>{formatPointsWithAllHint(offer.pointsPrice)}</Text>
                    </View>
                    <View style={[styles.catalogOfferCheck, selected && styles.catalogOfferCheckActive]}>
                      {selected ? <Check size={14} color={colors.onPrimary} /> : null}
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <Text style={styles.listSub}>No published perks yet.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function RedemptionDetailModal({
  visible,
  request,
  benefits,
  onClose
}: {
  visible: boolean;
  request: SelectionRequest | null;
  benefits: Benefit[];
  onClose: () => void;
}) {
  if (!request) {
    return null;
  }

  const requestBenefits = request.benefitIds
    .map((id) => benefits.find((benefit) => benefit.id === id))
    .filter(Boolean) as Benefit[];
  const when = request.approvedAt ?? request.createdAt;
  const provider = providerNameForRequest(request, benefits);
  const status = redemptionStatusLabel(request.status);
  const statusKey = redemptionStatusKey(request.status);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Redemption receipt</Text>
              <Text style={styles.listSub}>{request.employeeName}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.txDetailHero}>
              <Text style={styles.txDetailAmount}>{request.totalPoints} pts</Text>
              <Text style={styles.listSub}>≈ {currency(pointsToAll(request.totalPoints))}</Text>
              <View
                style={[
                  styles.activityStatusPill,
                  statusKey === "settled" && styles.activityStatusSettled,
                  statusKey === "pending" && styles.activityStatusPending,
                  statusKey === "failed" && styles.activityStatusFailed
                ]}
              >
                <Text
                  style={[
                    styles.activityStatusText,
                    { color: statusKey === "settled" ? "#2E7D32" : statusKey === "failed" ? "#C62828" : "#E65100" }
                  ]}
                >
                  {status}
                </Text>
              </View>
            </View>
            <View style={styles.detailKeyValueRow}>
              <Text style={styles.detailKeyLabel}>Provider</Text>
              <Text style={styles.detailKeyValue}>{provider}</Text>
            </View>
            <View style={styles.detailKeyValueRow}>
              <Text style={styles.detailKeyLabel}>Date</Text>
              <Text style={styles.detailKeyValue}>{formatActivityTimestamp(when)}</Text>
            </View>
            <View style={styles.detailKeyValueRow}>
              <Text style={styles.detailKeyLabel}>Perks</Text>
              <Text style={styles.detailKeyValue}>
                {requestBenefits.map((b) => b.title).join(", ") || "Perk selection"}
              </Text>
            </View>
            <View style={[styles.detailKeyValueRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailKeyLabel}>Reference</Text>
              <Text style={styles.detailKeyValueMono}>{request.id}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ActivityStatusBadge({ status }: { status: ActivityStatusFilter }) {
  const style =
    status === "settled"
      ? styles.activityStatusSettled
      : status === "pending"
        ? styles.activityStatusPending
        : status === "failed"
          ? styles.activityStatusFailed
          : styles.activityStatusRefunded;
  const textColor =
    status === "settled" ? "#2E7D32" : status === "failed" ? "#C62828" : status === "refunded" ? colors.muted : "#E65100";
  const label =
    status === "settled"
      ? "Settled"
      : status === "pending"
        ? "Pending"
        : status === "failed"
          ? "Failed"
          : "Refunded";

  return (
    <View style={[styles.activityStatusPill, style]}>
      <Text style={[styles.activityStatusText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function ProviderCatalogPage({
  providerProfiles,
  benefits,
  enabledBenefitIds,
  selectionRequests,
  onToggleBenefit,
  onToggleProvider
}: {
  providerProfiles: ProviderProfile[];
  benefits: Benefit[];
  enabledBenefitIds: string[];
  selectionRequests: SelectionRequest[];
  onToggleBenefit?: (benefitId: string) => void;
  onToggleProvider?: (benefitIds: string[], selected: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<BenefitCategory | "all">("all");
  const [detailGroup, setDetailGroup] = useState<ProviderOfferGroup | null>(null);
  const groups = useMemo(
    () => groupProvidersWithOffers(providerProfiles, benefits),
    [providerProfiles, benefits]
  );
  const selectedCount = enabledBenefitIds.length;
  const allBenefitIds = useMemo(() => benefits.map((b) => b.id), [benefits]);
  const allSelected = allBenefitIds.length > 0 && allBenefitIds.every((id) => enabledBenefitIds.includes(id));

  const providerUsage = useMemo(() => {
    const usage = new Map<string, number>();
    for (const request of selectionRequests) {
      for (const benefitId of request.benefitIds) {
        const benefit = benefits.find((item) => item.id === benefitId);
        if (!benefit) {
          continue;
        }
        const group = groups.find(
          (item) =>
            item.offers.some((offer) => offer.id === benefitId) ||
            item.profile?.businessName === benefit.providerName
        );
        if (group) {
          usage.set(group.key, (usage.get(group.key) ?? 0) + 1);
        }
      }
    }
    return usage;
  }, [selectionRequests, benefits, groups]);

  const recommendedGroups = useMemo(
    () =>
      [...groups]
        .filter((group) => (providerUsage.get(group.key) ?? 0) > 0)
        .sort((a, b) => (providerUsage.get(b.key) ?? 0) - (providerUsage.get(a.key) ?? 0))
        .slice(0, 3),
    [groups, providerUsage]
  );

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    return groups.filter((group) => {
      const name = group.profile?.businessName ?? group.offers[0]?.providerName ?? "";
      const cat = providerCategory(group);
      if (categoryFilter !== "all" && cat !== categoryFilter) {
        return false;
      }
      if (query && !name.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [groups, search, categoryFilter]);

  const renderCompactProvider = (group: ProviderOfferGroup) => {
    const providerName = group.profile?.businessName ?? group.offers[0]?.providerName ?? "Provider";
    const logoUrl = group.profile?.logoUrl ?? group.offers[0]?.imageUrl;
    const offerIds = group.offers.map((offer) => offer.id);
    const enabledCount = offerIds.filter((id) => enabledBenefitIds.includes(id)).length;
    const providerEnabled = enabledCount > 0;
    const cat = providerCategory(group);

    return (
      <Pressable key={group.key} onPress={() => setDetailGroup(group)}>
        <View style={styles.catalogProviderRow}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.catalogProviderLogo} />
          ) : (
            <View style={[styles.catalogProviderLogo, styles.catalogProviderLogoFallback]}>
              <Store size={16} color={colors.primary} />
            </View>
          )}
          <View style={styles.listText}>
            <Text style={styles.listTitle} numberOfLines={1}>
              {providerName}
            </Text>
            <Text style={styles.listSub} numberOfLines={1}>
              {cat ?? "Partner"} · {group.offers.length} perks · {enabledCount} enabled
            </Text>
          </View>
          <View
            style={[
              styles.providerStatusPill,
              providerEnabled ? styles.providerStatusEnabled : styles.providerStatusDisabled
            ]}
          >
            <Text
              style={[
                styles.providerStatusPillText,
                providerEnabled ? styles.providerStatusEnabledText : styles.providerStatusDisabledText
              ]}
            >
              {providerEnabled ? "On" : "Off"}
            </Text>
          </View>
          <Pressable
            onPress={(event) => {
              event.stopPropagation?.();
              setDetailGroup(group);
            }}
            style={styles.catalogManageBtn}
          >
            <Text style={styles.catalogManageBtnText}>Manage</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <View style={styles.adminPageTitle}>
        <View style={styles.adminHeader}>
          <View style={styles.adminHeaderCopy}>
            <Text style={styles.adminTitle}>Providers</Text>
          </View>
        </View>
      </View>

      <View style={styles.adminPageSummary}>
        <View style={styles.employeeSearchRow}>
          <Search size={16} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search providers"
            placeholderTextColor={colors.muted}
            style={styles.employeeSearchInput}
            autoCapitalize="none"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {PROVIDER_CATEGORY_FILTERS.map((option) => {
            const active = categoryFilter === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setCategoryFilter(option.id)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <GlassPanel style={styles.catalogSummary} intensity={24}>
          <View style={styles.catalogSummaryIcon}>
            <Store size={18} color={colors.primary} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.adminCardTitle}>{selectedCount} perks enabled</Text>
          </View>
          <Pressable
            onPress={() => onToggleProvider?.(allBenefitIds, !allSelected)}
            style={[styles.catalogSelectBtn, allSelected && styles.catalogSelectBtnActive]}
          >
            {allSelected ? <Check size={14} color={colors.onPrimary} /> : null}
            <Text style={[styles.catalogSelectText, allSelected && styles.catalogSelectTextActive]}>
              {allSelected ? "Disable all" : "Enable all"}
            </Text>
          </Pressable>
        </GlassPanel>
      </View>

      <View style={styles.adminPageMain}>
        {recommendedGroups.length ? (
          <Section dense title="Recommended" meta="By employee usage">
            {recommendedGroups.map((group) => renderCompactProvider(group))}
          </Section>
        ) : null}

        <Section dense title="All providers" meta={`${filteredGroups.length}`}>
          {filteredGroups.length ? (
            filteredGroups.map((group) => renderCompactProvider(group))
          ) : (
            <View style={styles.adminListRow}>
              <View style={styles.smallIcon}>
                <Store size={18} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>No providers found</Text>
                <Text style={styles.listSub}>Try another search or category filter.</Text>
              </View>
            </View>
          )}
        </Section>
      </View>

      <ProviderDetailModal
        visible={!!detailGroup}
        group={detailGroup}
        enabledBenefitIds={enabledBenefitIds}
        selectionRequests={selectionRequests}
        onClose={() => setDetailGroup(null)}
        onToggleBenefit={onToggleBenefit}
        onToggleProvider={onToggleProvider}
      />
    </>
  );
}

function ActivityPage({
  selectionRequests,
  benefits,
  rewardEvents,
  onExportCsv
}: {
  selectionRequests: SelectionRequest[];
  benefits: Benefit[];
  rewardEvents: RewardEvent[];
  onExportCsv?: () => void;
}) {
  const [feedFilter, setFeedFilter] = useState<ActivityFeedFilter>("all");
  const [detailRequest, setDetailRequest] = useState<SelectionRequest | null>(null);

  const activityItems = useMemo(() => {
    const items: Array<
      | { kind: "redemption"; id: string; at: string; request: SelectionRequest }
      | { kind: "reward"; id: string; at: string; event: RewardEvent }
    > = [
      ...selectionRequests.map((request) => ({
        kind: "redemption" as const,
        id: request.id,
        at: request.approvedAt ?? request.createdAt,
        request
      })),
      ...rewardEvents.map((event) => ({
        kind: "reward" as const,
        id: event.id,
        at: event.createdAt,
        event
      }))
    ];
    return items.sort((a, b) => b.at.localeCompare(a.at));
  }, [selectionRequests, rewardEvents]);

  const filteredItems = useMemo(() => {
    if (feedFilter === "all") {
      return activityItems;
    }
    if (feedFilter === "redemptions") {
      return activityItems.filter((item) => item.kind === "redemption");
    }
    return activityItems.filter((item) => item.kind === "reward");
  }, [activityItems, feedFilter]);

  const feedFilters: Array<{ id: ActivityFeedFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "redemptions", label: "Redemptions" },
    { id: "rewards", label: "Rewards" }
  ];

  return (
    <>
      <View style={styles.adminPageTitle}>
        <View style={[styles.adminHeader, styles.activityPageHeader]}>
          <View style={styles.adminHeaderCopy}>
            <Text style={styles.adminTitle}>Activity</Text>
          </View>
          {onExportCsv ? (
            <Pressable onPress={onExportCsv} style={styles.employerHeaderAction}>
              <FileText size={14} color={colors.primary} />
              <Text style={styles.employerHeaderActionText}>Export</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.adminPageMain}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {feedFilters.map((option) => {
            const active = feedFilter === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setFeedFilter(option.id)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filteredItems.length ? (
          filteredItems.slice(0, 30).map((item) => {
            if (item.kind === "redemption") {
              const request = item.request;
              const provider = providerNameForRequest(request, benefits);
              const when = request.approvedAt ?? request.createdAt;
              const statusKey = redemptionStatusKey(request.status);
              const pending = statusKey === "pending";

              return (
                <Pressable key={item.id} onPress={() => setDetailRequest(request)}>
                  <View style={styles.employerActivityRow}>
                    <View style={styles.employerActivityDot} />
                    <View style={styles.listText}>
                      <Text style={styles.employerActivityTitle} numberOfLines={1}>
                        {request.employeeName}
                      </Text>
                      <Text style={styles.employerActivitySub} numberOfLines={1}>
                        {provider} · {formatActivityTimestamp(when)}
                      </Text>
                    </View>
                    <View style={styles.employerActivityMeta}>
                      <Text style={styles.employerActivityAmount}>{request.totalPoints} pts</Text>
                      {pending ? (
                        <Text style={styles.employerActivityStatus}>Pending</Text>
                      ) : statusKey === "failed" ? (
                        <Text style={[styles.employerActivityStatus, { color: "#C62828" }]}>Failed</Text>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            }

            const event = item.event;
            return (
              <View key={item.id} style={styles.employerActivityRow}>
                <View style={[styles.employerActivityDot, { backgroundColor: colors.secondary }]} />
                <View style={styles.listText}>
                  <Text style={styles.employerActivityTitle} numberOfLines={1}>
                    {event.employeeName ?? "Employee"}
                  </Text>
                  <Text style={styles.employerActivitySub} numberOfLines={1}>
                    {rewardKindLabel(event.kind)} · {formatActivityTimestamp(event.createdAt ?? "")}
                  </Text>
                </View>
                <View style={styles.employerActivityMeta}>
                  <Text style={[styles.employerActivityAmount, { color: colors.secondary }]}>
                    +{event.points} pts
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.adminListRow}>
            <View style={styles.smallIcon}>
              <CircleDollarSign size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No activity yet</Text>
              <Text style={styles.listSub}>Redemptions and rewards will show up here.</Text>
            </View>
          </View>
        )}
      </View>

      <RedemptionDetailModal
        visible={!!detailRequest}
        request={detailRequest}
        benefits={benefits}
        onClose={() => setDetailRequest(null)}
      />
    </>
  );
}

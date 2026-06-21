import { Check, ChevronDown, ChevronUp, Gift, Trophy, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { CapsuleButton } from "../components/CapsuleButton";
import { ProviderProgressBar } from "../components/ProviderAnalyticsWidgets";
import { Section } from "../components/Section";
import { buildEmployerChallengeStats } from "../lib/challengeEvaluator";
import { PlatformTemplateKey } from "../lib/challengePlatformTemplates";
import {
  awardsUsedForDefinition,
  canAwardMore
} from "../lib/challengeService";
import { defaultRewardAutomations, formatDateLabel } from "../lib/rewardsDemo";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import {
  ChallengeCriterion,
  ChallengeDefinition,
  ChallengeProgress,
  RewardAutomation,
  RewardEvent,
  User
} from "../types";

type ChallengeSubTab = "platform" | "employer" | "recognition";
type ChallengeCategoryFilter = "all" | "wellness" | "engagement" | "perks" | "attendance" | "custom";

const CHALLENGE_SUB_TABS: Array<{ id: ChallengeSubTab; label: string }> = [
  { id: "platform", label: "Platform" },
  { id: "employer", label: "Employer" },
  { id: "recognition", label: "Recognition" }
];

const CATEGORY_FILTERS: Array<{ id: ChallengeCategoryFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "wellness", label: "Wellness" },
  { id: "engagement", label: "Engagement" },
  { id: "perks", label: "Perks usage" },
  { id: "attendance", label: "Attendance" },
  { id: "custom", label: "Custom" }
];

const INPUT_PLACEHOLDER = "#6B7280";

function guessChallengeCategory(definition: ChallengeDefinition): ChallengeCategoryFilter {
  const text = `${definition.title} ${definition.description}`.toLowerCase();
  if (/wellness|health|step|sleep|walk/.test(text)) {
    return "wellness";
  }
  if (/engage|login|streak|survey/.test(text)) {
    return "engagement";
  }
  if (/perk|redeem|offer|provider/.test(text)) {
    return "perks";
  }
  if (/attend|office|visit|check-in/.test(text)) {
    return "attendance";
  }
  return "custom";
}

function employeeReadyForAward(
  row: ChallengeProgress | undefined,
  definition: ChallengeDefinition
): boolean {
  if (!row || row.status === "completed") {
    return false;
  }
  if (definition.criterion.kind === "manual") {
    return Boolean(row.submittedAt);
  }
  return row.current >= row.target;
}

function ChallengeDetailModal({
  visible,
  definition,
  progressRows,
  employees,
  rewardEvents,
  onClose
}: {
  visible: boolean;
  definition: ChallengeDefinition | null;
  progressRows: ChallengeProgress[];
  employees: User[];
  rewardEvents: RewardEvent[];
  onClose: () => void;
}) {
  if (!definition) {
    return null;
  }

  const stats = buildEmployerChallengeStats({ definition, progressRows, employees });
  const rows = employees.map((employee) => {
    const row = progressRows.find(
      (item) => item.definitionId === definition.id && item.employeeId === employee.id
    );
    return { employee, row };
  });
  const pointsAwarded = rewardEvents
    .filter((event) => event.kind === "challenge")
    .reduce((sum, event) => sum + event.points, 0);
  const waitingReview = rows.filter(
    ({ row }) => row?.submittedAt && row.status !== "completed"
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{definition.title}</Text>
              <Text style={styles.listSub}>{definition.description}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.challengeStatRow}>
              <View style={styles.challengeStatItem}>
                <Text style={styles.challengeStatValue}>{stats.totalEmployees}</Text>
                <Text style={styles.challengeStatLabel}>Participants</Text>
              </View>
              <View style={styles.challengeStatItem}>
                <Text style={styles.challengeStatValue}>{stats.completedCount}</Text>
                <Text style={styles.challengeStatLabel}>Completed</Text>
              </View>
              <View style={styles.challengeStatItem}>
                <Text style={styles.challengeStatValue}>{stats.inProgressCount}</Text>
                <Text style={styles.challengeStatLabel}>In progress</Text>
              </View>
              <View style={styles.challengeStatItem}>
                <Text style={styles.challengeStatValue}>{pointsAwarded}</Text>
                <Text style={styles.challengeStatLabel}>Points awarded</Text>
              </View>
            </View>
            {waitingReview.length ? (
              <>
                <Text style={styles.modalFieldLabel}>Waiting for approval ({waitingReview.length})</Text>
                {waitingReview.map(({ employee, row }) => (
                  <View key={employee.id} style={styles.challengeEmployeeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listTitle}>{employee.name}</Text>
                      <Text style={styles.listSub}>
                        {row?.submittedAt ? "Submitted for review" : "Ready for review"}
                      </Text>
                    </View>
                    <View style={styles.challengeReviewBadge}>
                      <Text style={styles.challengeReviewBadgeText}>Review</Text>
                    </View>
                  </View>
                ))}
              </>
            ) : null}
            <Text style={styles.modalFieldLabel}>All participants</Text>
            {rows.map(({ employee, row }) => (
              <View key={employee.id} style={styles.challengeEmployeeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{employee.name}</Text>
                  <Text style={styles.listSub}>
                    {row?.status === "completed"
                      ? "Awarded"
                      : row?.submittedAt
                        ? "Ready for review"
                        : row
                          ? `${row.current}/${row.target} progress`
                          : "Not started"}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function AutomationDetailModal({
  visible,
  automation,
  onClose,
  onSave
}: {
  visible: boolean;
  automation: RewardAutomation | null;
  onClose: () => void;
  onSave: (updated: RewardAutomation) => void;
}) {
  const [points, setPoints] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (automation) {
      setPoints(String(automation.points));
      setEnabled(automation.enabled);
    }
  }, [automation]);

  if (!automation) {
    return null;
  }

  const nextRun =
    automation.kind === "birthday"
      ? "Runs on employee birthday"
      : automation.kind === "anniversary"
        ? "Runs on work anniversary"
        : automation.kind === "seasonal"
          ? "Next: Jun 30 (seasonal window)"
          : "Runs when invite is accepted";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{automation.label}</Text>
              <Text style={styles.listSub}>{nextRun}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.modalFieldLabel}>Points amount</Text>
            <TextInput
              value={points}
              onChangeText={setPoints}
              style={styles.input}
              keyboardType="number-pad"
            />
            <Text style={styles.modalFieldLabel}>Monthly max spend</Text>
            <TextInput defaultValue="5000" style={styles.input} keyboardType="number-pad" />
            <Text style={styles.modalFieldLabel}>Per-employee max</Text>
            <TextInput defaultValue={String(automation.points)} style={styles.input} keyboardType="number-pad" />
            <Text style={styles.modalFieldLabel}>Require approval above</Text>
            <TextInput defaultValue="250" style={styles.input} keyboardType="number-pad" />
            <Pressable
              onPress={() => setEnabled((current) => !current)}
              style={[styles.automationToggle, enabled && styles.automationToggleOn]}
            >
              <View style={[styles.automationKnob, enabled && styles.automationKnobOn]} />
            </Pressable>
            <Text style={enabled ? styles.automationStatusOn : styles.automationStatusOff}>
              {enabled ? "Enabled" : "Paused"}
            </Text>
            <CapsuleButton
              label="Save automation"
              onPress={() => {
                const parsed = Number(points.replace(/\D/g, ""));
                onSave({
                  ...automation,
                  enabled,
                  points: parsed > 0 ? parsed : automation.points
                });
                onClose();
              }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function ChallengesPage({
  employerId,
  definitions,
  progressRows = [],
  disabledTemplateKeys = [],
  employees = [],
  rewardEvents = [],
  onOpenCreate,
  onArchiveChallenge,
  onCompleteChallenge,
  onCompleteChallengeForEmployee,
  onToggleChallengeTemplate,
  onGrantReward
}: {
  employerId: string;
  definitions: ChallengeDefinition[];
  progressRows?: ChallengeProgress[];
  disabledTemplateKeys?: string[];
  employees?: User[];
  rewardEvents?: RewardEvent[];
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
}) {
  const [subTab, setSubTab] = useState<ChallengeSubTab>("platform");
  const [challengeSearch, setChallengeSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ChallengeCategoryFilter>("all");
  const [automations, setAutomations] = useState<RewardAutomation[]>(defaultRewardAutomations);
  const [spotEmployeeId, setSpotEmployeeId] = useState<"all" | string>(employees[0]?.id ?? "all");
  const [spotPoints, setSpotPoints] = useState("50");
  const [spotNote, setSpotNote] = useState("Great work this week");
  const [employerFilter, setEmployerFilter] = useState<"active" | "completed">("active");
  const [expandedPlatformId, setExpandedPlatformId] = useState<string | null>(null);
  const [expandedEmployerIds, setExpandedEmployerIds] = useState<Record<string, boolean>>({});
  const [detailDefinition, setDetailDefinition] = useState<ChallengeDefinition | null>(null);
  const [automationDetail, setAutomationDetail] = useState<RewardAutomation | null>(null);
  const [awardBlockHint, setAwardBlockHint] = useState<Record<string, boolean>>({});

  const employerCreated = definitions.filter((definition) => definition.source === "employer");
  const platformDefinitions = definitions.filter((definition) => definition.source === "platform");

  const matchesSearch = (definition: ChallengeDefinition) => {
    const query = challengeSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return (
      definition.title.toLowerCase().includes(query) ||
      definition.description.toLowerCase().includes(query)
    );
  };

  const matchesCategory = (definition: ChallengeDefinition) => {
    if (categoryFilter === "all") {
      return true;
    }
    return guessChallengeCategory(definition) === categoryFilter;
  };

  const filteredPlatform = platformDefinitions.filter(
    (definition) => matchesSearch(definition) && matchesCategory(definition)
  );

  const filteredEmployerChallenges = employerCreated.filter((definition) => {
    if (!matchesSearch(definition) || !matchesCategory(definition)) {
      return false;
    }
    const rows = progressRows.filter((row) => row.definitionId === definition.id);
    const hasOpen = rows.some((row) => row.status === "open");
    const allCompleted = rows.length > 0 && rows.every((row) => row.status === "completed");
    if (employerFilter === "active") {
      return definition.active && (hasOpen || rows.length === 0);
    }
    return !definition.active || allCompleted;
  });

  const recentSpotBonuses = useMemo(
    () =>
      rewardEvents
        .filter((event) => event.kind === "spot")
        .slice(0, 5),
    [rewardEvents]
  );

  const spotCostPreview = useMemo(() => {
    const points = Number(spotPoints.replace(/\D/g, "")) || 0;
    const count = spotEmployeeId === "all" ? employees.length : 1;
    return points * count;
  }, [spotPoints, spotEmployeeId, employees.length]);

  const confirmAwardAll = (definition: ChallengeDefinition) => {
    if (!onCompleteChallenge) {
      return;
    }
    const employeeProgress = employees.map((employee) => {
      const row = progressRows.find(
        (item) => item.definitionId === definition.id && item.employeeId === employee.id
      );
      return { employee, row };
    });
    const needsReview = employeeProgress.some(
      ({ row }) => Boolean(row?.submittedAt) && row?.status !== "completed"
    );
    const pendingCount = employeeProgress.filter(({ row }) => row?.status !== "completed").length;

    Alert.alert(
      needsReview ? "Review all employees?" : "Award all employees?",
      needsReview
        ? `${pendingCount} employee${pendingCount === 1 ? "" : "s"} submitted work for "${definition.title}". Review before awarding ${definition.rewardPoints} pts each.`
        : `Grant ${definition.rewardPoints} points to ${pendingCount} employee${pendingCount === 1 ? "" : "s"} for "${definition.title}".`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: needsReview ? "Review all" : "Award all",
          onPress: () => void onCompleteChallenge(definition.id, employerId)
        }
      ]
    );
  };

  const grantSpotBonus = () => {
    const points = Number(spotPoints.replace(/\D/g, ""));
    if (!onGrantReward || !points) {
      Alert.alert("Enter points", "Choose a valid points amount.");
      return;
    }
    const note = spotNote.trim() || "Spot bonus";

    const send = (employee: User) => {
      onGrantReward({
        employeeId: employee.id,
        employeeName: employee.name,
        kind: "spot",
        points,
        note
      });
    };

    if (spotEmployeeId === "all") {
      if (!employees.length) {
        Alert.alert("No employees", "Add employees first.");
        return;
      }
      Alert.alert(
        "Send to all employees?",
        `This will cost ${spotCostPreview} pts across ${employees.length} employees.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Send to all",
            onPress: () => {
              employees.forEach(send);
              Alert.alert("Spot bonus sent", `${points} points sent to all employees.`);
            }
          }
        ]
      );
      return;
    }

    const employee = employees.find((item) => item.id === spotEmployeeId);
    if (!employee) {
      Alert.alert("Pick employee", "Select an employee first.");
      return;
    }
    send(employee);
    Alert.alert("Spot bonus sent", `${points} points added to ${employee.name}.`);
  };

  const toggleEmployerChallenge = (definitionId: string) => {
    setExpandedEmployerIds((current) => ({ ...current, [definitionId]: !current[definitionId] }));
  };

  const handleAwardEmployee = (
    definition: ChallengeDefinition,
    employee: User,
    row: ChallengeProgress | undefined
  ) => {
    const hintKey = `${definition.id}:${employee.id}`;
    if (!employeeReadyForAward(row, definition)) {
      setAwardBlockHint((current) => ({ ...current, [hintKey]: true }));
      return;
    }
    setAwardBlockHint((current) => {
      const next = { ...current };
      delete next[hintKey];
      return next;
    });
    onCompleteChallengeForEmployee?.(definition.id, employerId, employee.id);
  };

  const renderPlatform = () => (
    <>
      <View style={styles.employeeSearchRow}>
        <TextInput
          value={challengeSearch}
          onChangeText={setChallengeSearch}
          placeholder="Search challenges"
          placeholderTextColor={INPUT_PLACEHOLDER}
          style={styles.employeeSearchInput}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {CATEGORY_FILTERS.map((option) => {
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
      {filteredPlatform.map((definition) => {
        const templateKey = definition.templateKey as PlatformTemplateKey | undefined;
        const enabled = templateKey ? !disabledTemplateKeys.includes(templateKey) : definition.active;
        const stats = buildEmployerChallengeStats({ definition, progressRows, employees });
        const ratio = stats.totalEmployees > 0 ? stats.completedCount / stats.totalEmployees : 0;
        const expanded = expandedPlatformId === definition.id;
        const employeeRows = employees.map((employee) => {
          const row = progressRows.find(
            (item) => item.definitionId === definition.id && item.employeeId === employee.id
          );
          return { employee, row };
        });

        return (
          <View key={definition.id} style={styles.challengeCardFlat}>
            <View style={styles.challengeCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{definition.title}</Text>
                <Text style={styles.listSub} numberOfLines={1}>
                  Auto-tracked · +{definition.rewardPoints} pts
                </Text>
                <Text style={styles.listSub}>
                  {stats.completedCount}/{stats.totalEmployees} completed
                </Text>
              </View>
              {templateKey && onToggleChallengeTemplate ? (
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Pressable
                    onPress={() => onToggleChallengeTemplate(employerId, templateKey, !enabled)}
                    style={[styles.automationToggle, enabled && styles.automationToggleOn]}
                  >
                    <View style={[styles.automationKnob, enabled && styles.automationKnobOn]} />
                  </Pressable>
                  <Text style={enabled ? styles.automationStatusOn : styles.automationStatusOff}>
                    {enabled ? "Enabled" : "Paused"}
                  </Text>
                  <Text style={styles.challengeEnabledLabel}>For employees</Text>
                </View>
              ) : null}
            </View>
            <ProviderProgressBar ratio={ratio} />
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
                            ? `${row.current}/${row.target}`
                            : "Not started"}
                      </Text>
                    </View>
                    {row?.status === "completed" ? <Check size={16} color={colors.secondary} /> : null}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </>
  );

  const renderEmployer = () => (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {(["active", "completed"] as const).map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setEmployerFilter(filter)}
            style={[styles.filterChip, employerFilter === filter && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, employerFilter === filter && styles.filterChipTextActive]}>
              {filter === "active" ? "Active" : "Completed"}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.challengeEmployerCapsuleList}>
      {filteredEmployerChallenges.length ? (
        filteredEmployerChallenges.map((definition) => {
          const stats = buildEmployerChallengeStats({ definition, progressRows, employees });
          const awardsUsed = awardsUsedForDefinition(definition.id, progressRows);
          const canAward = canAwardMore(definition, progressRows);
          const expanded = Boolean(expandedEmployerIds[definition.id]);
          const employeeProgress = employees.map((employee) => {
            const row = progressRows.find(
              (item) => item.definitionId === definition.id && item.employeeId === employee.id
            );
            return { employee, row };
          });
          const needsReview = employeeProgress.some(({ row }) => employeeReadyForAward(row, definition));

          return (
            <View
              key={definition.id}
              style={[
                styles.challengeEmployerCapsule,
                expanded ? styles.challengeEmployerCapsuleExpanded : styles.challengeEmployerCapsuleCollapsed
              ]}
            >
              <Pressable
                onPress={() => toggleEmployerChallenge(definition.id)}
                style={styles.challengeEmployerCapsuleHead}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.listTitle}>{definition.title}</Text>
                  <Text style={styles.listSub} numberOfLines={1}>
                    Awarded {stats.completedCount} of {stats.totalEmployees}
                    {definition.maxAwards ? ` · Budget ${awardsUsed} of ${definition.maxAwards}` : ""}
                  </Text>
                </View>
                {expanded ? (
                  <ChevronUp size={18} color={colors.muted} />
                ) : (
                  <ChevronDown size={18} color={colors.muted} />
                )}
              </Pressable>
              {expanded ? (
                <View style={styles.challengeEmployerCapsuleBody}>
                  <View style={styles.challengeStatRow}>
                    <View style={styles.challengeStatItem}>
                      <Text style={styles.challengeStatValue}>+{definition.rewardPoints} pts</Text>
                      <Text style={styles.challengeStatLabel}>Per employee</Text>
                    </View>
                    <View style={styles.challengeStatItem}>
                      <Text style={styles.challengeStatValue}>
                        {stats.completedCount} of {stats.totalEmployees}
                      </Text>
                      <Text style={styles.challengeStatLabel}>Awarded</Text>
                    </View>
                    {definition.maxAwards ? (
                      <View style={styles.challengeStatItem}>
                        <Text style={styles.challengeStatValue}>
                          {awardsUsed} of {definition.maxAwards}
                        </Text>
                        <Text style={styles.challengeStatLabel}>Budget used</Text>
                      </View>
                    ) : null}
                  </View>
                  <ProviderProgressBar
                    ratio={stats.totalEmployees > 0 ? stats.completedCount / stats.totalEmployees : 0}
                  />
                  <View style={styles.challengeEmployerCapsuleActions}>
                    {needsReview && onCompleteChallenge && canAward ? (
                      <CapsuleButton
                        label="Review all"
                        onPress={() => confirmAwardAll(definition)}
                        variant="soft"
                      />
                    ) : onCompleteChallenge && canAward ? (
                      <CapsuleButton
                        label="Award all"
                        onPress={() => confirmAwardAll(definition)}
                        variant="soft"
                      />
                    ) : null}
                    {definition.active && onArchiveChallenge ? (
                      <Pressable onPress={() => void onArchiveChallenge(definition.id)}>
                        <Text style={styles.challengeLinkText}>Archive</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <View style={styles.challengeEmployeeList}>
                    {employeeProgress.map(({ employee, row }) => {
                      const completed = row?.status === "completed";
                      const readyForReview = employeeReadyForAward(row, definition);
                      const hintKey = `${definition.id}:${employee.id}`;
                      const showHint = awardBlockHint[hintKey];
                      return (
                        <View key={employee.id} style={styles.challengeEmployeeRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.listTitle}>{employee.name}</Text>
                            <Text style={styles.listSub}>
                              {completed
                                ? "Awarded"
                                : readyForReview
                                  ? "Ready for review"
                                  : row?.submittedAt
                                    ? "Submitted"
                                    : "Not completed yet"}
                            </Text>
                            {showHint ? (
                              <Text style={styles.challengeAwardHint}>
                                Complete the challenge first
                              </Text>
                            ) : null}
                          </View>
                          {readyForReview && !completed ? (
                            <View style={styles.challengeReviewBadge}>
                              <Text style={styles.challengeReviewBadgeText}>Review</Text>
                            </View>
                          ) : null}
                          {!completed && onCompleteChallengeForEmployee && canAward ? (
                            <CapsuleButton
                              label="Award"
                              variant="soft"
                              onPress={() => handleAwardEmployee(definition, employee, row)}
                            />
                          ) : completed ? (
                            <Check size={16} color={colors.secondary} />
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </View>
          );
        })
      ) : (
        <View style={styles.adminListRow}>
          <View style={styles.smallIcon}>
            <Trophy size={18} color={colors.text} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>No employer challenges</Text>
            <Text style={styles.listSub}>Create a goal and award points when employees complete it.</Text>
          </View>
        </View>
      )}
      </View>
    </>
  );

  const renderRecognition = () => (
    <>
      <Section dense title="Spot bonus" meta="One-off">
        <View style={styles.challengeCardFlat}>
          <View style={styles.spotStackField}>
            <Text style={styles.modalFieldLabel}>Employee</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              <Pressable
                onPress={() => setSpotEmployeeId("all")}
                style={[
                  styles.filterChip,
                  spotEmployeeId === "all" && styles.filterChipActive,
                  styles.spotAllChip
                ]}
              >
                <Text style={[styles.filterChipText, spotEmployeeId === "all" && styles.filterChipTextActive]}>
                  All employees
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
          </View>
          <View style={styles.spotStackField}>
            <Text style={styles.modalFieldLabel}>Points</Text>
            <TextInput
              value={spotPoints}
              onChangeText={setSpotPoints}
              style={styles.input}
              keyboardType="number-pad"
              placeholder="Custom amount"
              placeholderTextColor={INPUT_PLACEHOLDER}
            />
          </View>
          <View style={styles.spotStackField}>
            <Text style={styles.modalFieldLabel}>Note</Text>
            <TextInput
              value={spotNote}
              onChangeText={setSpotNote}
              style={styles.input}
              placeholder="Add a personal note"
              placeholderTextColor={INPUT_PLACEHOLDER}
            />
          </View>
          <CapsuleButton
            label="Send spot bonus"
            onPress={grantSpotBonus}
            icon={<Gift size={16} color={colors.onPrimary} />}
          />
        </View>
      </Section>
      {recentSpotBonuses.length ? (
        <Section dense title="Recent spot bonuses" meta={`${recentSpotBonuses.length}`}>
          {recentSpotBonuses.map((event) => (
            <View key={event.id} style={styles.employerActivityRow}>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{event.employeeName ?? "Employee"}</Text>
                <Text style={styles.listSub}>{event.note}</Text>
              </View>
              <Text style={styles.challengePoints}>+{event.points}</Text>
            </View>
          ))}
        </Section>
      ) : null}
      <Section dense title="Recognition automations" meta="Settings">
        {automations.map((automation) => (
          <Pressable key={automation.kind} onPress={() => setAutomationDetail(automation)}>
            <View style={styles.challengeCardFlat}>
              <View style={styles.challengeCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{automation.label}</Text>
                  <Text style={styles.listSub} numberOfLines={1}>
                    {automation.description}
                  </Text>
                  <Text style={styles.listSub}>
                    Next:{" "}
                    {automation.kind === "birthday"
                      ? "Employee birthday"
                      : automation.kind === "seasonal"
                        ? "Jun 30"
                        : automation.kind === "anniversary"
                          ? "Work anniversary"
                          : "On invite accept"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={automation.enabled ? styles.automationStatusOn : styles.automationStatusOff}>
                    {automation.enabled ? "Enabled" : "Paused"}
                  </Text>
                  <Text style={styles.challengePoints}>{automation.points} pts</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </Section>
    </>
  );

  return (
    <>
      <View style={styles.adminPageTitle}>
        <View style={styles.adminHeader}>
          <View style={styles.adminHeaderCopy}>
            <Text style={styles.adminTitle}>Challenges</Text>
          </View>
          <Pressable onPress={onOpenCreate} style={styles.inviteButton}>
            <Trophy size={16} color={colors.onPrimary} />
            <Text style={styles.inviteButtonText}>Create</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.adminPageSummary}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.challengeSubTabRow}>
          {CHALLENGE_SUB_TABS.map((tab) => {
            const active = subTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setSubTab(tab.id)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.adminPageMain}>
        {subTab === "platform" ? renderPlatform() : null}
        {subTab === "employer" ? renderEmployer() : null}
        {subTab === "recognition" ? renderRecognition() : null}
      </View>

      <ChallengeDetailModal
        visible={!!detailDefinition}
        definition={detailDefinition}
        progressRows={progressRows}
        employees={employees}
        rewardEvents={rewardEvents}
        onClose={() => setDetailDefinition(null)}
      />

      <AutomationDetailModal
        visible={!!automationDetail}
        automation={automationDetail}
        onClose={() => setAutomationDetail(null)}
        onSave={(updated) =>
          setAutomations((current) =>
            current.map((item) => (item.kind === updated.kind ? updated : item))
          )
        }
      />
    </>
  );
}

export function CreateChallengeModal({
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle("");
      setDescription("");
      setRewardPoints("75");
      setDueDate("");
      setStartDate("");
      setMaxAwards("");
      setShowAdvanced(false);
      setSaving(false);
    }
  }, [visible]);

  const parseDate = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return null;
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : trimmed;
  };

  const points = Number(rewardPoints.replace(/\D/g, "")) || 0;
  const maxParsed = maxAwards.trim() ? Number(maxAwards.replace(/\D/g, "")) : employeesFallbackMax();
  const maxPossibleCost = points * (maxParsed || employeesFallbackMax());

  function employeesFallbackMax() {
    return 15;
  }

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !points) {
      Alert.alert("Add details", "Enter a challenge title and reward points.");
      return;
    }

    const parsedDue = parseDate(dueDate);
    if (dueDate.trim() && parsedDue === null) {
      Alert.alert("Invalid end date", "Use YYYY-MM-DD format.");
      return;
    }
    const parsedStart = parseDate(startDate);
    if (startDate.trim() && parsedStart === null) {
      Alert.alert("Invalid start date", "Use YYYY-MM-DD format.");
      return;
    }

    const parsedMaxAwards = maxAwards.trim() ? Number(maxAwards.replace(/\D/g, "")) : undefined;
    if (maxAwards.trim() && (!parsedMaxAwards || parsedMaxAwards < 1)) {
      Alert.alert("Invalid budget", "Maximum awards must be at least 1.");
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
    Alert.alert("Challenge published", "Employees can now see this challenge in their app.");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalFieldLabel}>Challenge title</Text>
              <Text style={styles.challengeFieldHint}>Short name employees will see in the app.</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                placeholder="Complete the Q2 wellness survey"
                placeholderTextColor={INPUT_PLACEHOLDER}
              />
              <Text style={styles.modalFieldLabel}>What should employees do?</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[styles.input, { minHeight: 72, textAlignVertical: "top" }]}
                placeholder="Describe the goal and how to complete it."
                placeholderTextColor={INPUT_PLACEHOLDER}
                multiline
              />
              <Text style={styles.modalFieldLabel}>Reward per employee</Text>
              <View style={styles.challengePresetRow}>
                {[25, 50, 75, 100, 150].map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => setRewardPoints(String(preset))}
                    style={[styles.filterChip, rewardPoints === String(preset) && styles.filterChipActive]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        rewardPoints === String(preset) && styles.filterChipTextActive
                      ]}
                    >
                      {preset} pts
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={rewardPoints}
                onChangeText={setRewardPoints}
                style={styles.input}
                keyboardType="number-pad"
                placeholder="Custom points"
                placeholderTextColor={INPUT_PLACEHOLDER}
              />
              <Text style={styles.modalFieldLabel}>Start date</Text>
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={INPUT_PLACEHOLDER}
              />
              <Text style={styles.modalFieldLabel}>End date</Text>
              <TextInput
                value={dueDate}
                onChangeText={setDueDate}
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={INPUT_PLACEHOLDER}
              />
              <View style={styles.spotBudgetPreview}>
                <Text style={styles.listSub}>Max possible cost: {maxPossibleCost} pts</Text>
                <Text style={styles.listSub}>
                  Employees will see: &quot;{title.trim() || "New challenge"}&quot; · +{points || 0} pts
                </Text>
              </View>
              <Pressable onPress={() => setShowAdvanced((current) => !current)} style={styles.challengeAdvancedToggle}>
                <Text style={styles.challengeAdvancedToggleText}>
                  {showAdvanced ? "Hide advanced settings" : "Advanced settings"}
                </Text>
              </Pressable>
              {showAdvanced ? (
                <>
                  <Text style={styles.modalFieldLabel}>Maximum awards</Text>
                  <Text style={styles.challengeFieldHint}>Caps how many employees can be rewarded.</Text>
                  <TextInput
                    value={maxAwards}
                    onChangeText={setMaxAwards}
                    style={styles.input}
                    placeholder="e.g. 20"
                    placeholderTextColor={INPUT_PLACEHOLDER}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.modalFieldLabel}>Challenge type</Text>
                  <Text style={styles.listSub}>Employer approval · All employees eligible</Text>
                </>
              ) : null}
              <CapsuleButton
                label={saving ? "Publishing..." : "Publish challenge"}
                onPress={() => void handleCreate()}
                icon={<Trophy size={16} color={colors.onPrimary} />}
              />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

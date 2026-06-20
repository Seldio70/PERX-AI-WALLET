import { Activity, BadgeCheck, Calendar, Footprints, Trophy } from "lucide-react-native";
import { ReactNode, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import { ChallengeView } from "../types";
import { CapsuleButton } from "./CapsuleButton";
import { GlassPanel } from "./GlassPanel";
import { Section } from "./Section";

const RING_SIZE = 64;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function challengeSourceLabel(challenge: ChallengeView): string {
  return challenge.source === "platform" ? "PerX" : "Employer";
}

function iconForChallenge(challenge: ChallengeView): ReactNode {
  switch (challenge.criterion.kind) {
    case "redeem_count":
    case "redeem_category":
    case "redeem_new_category":
      return <BadgeCheck size={18} color={colors.secondary} />;
    case "login_streak":
      return <Calendar size={18} color={colors.tertiary} />;
    case "health_steps":
    case "health_sleep":
      return <Footprints size={18} color={colors.secondary} />;
    case "manual":
      return <Trophy size={18} color={colors.primary} />;
    default:
      return <Activity size={18} color={colors.primary} />;
  }
}

function ChallengeSourceBadge({ challenge }: { challenge: ChallengeView }) {
  return (
    <View
      style={[
        styles.challengeSourceBadge,
        challenge.source === "employer" && { backgroundColor: "rgba(255,152,0,0.12)" }
      ]}
    >
      <Text
        style={[
          styles.challengeSourceBadgeText,
          challenge.source === "employer" && { color: "#E65100" }
        ]}
      >
        {challengeSourceLabel(challenge)}
      </Text>
    </View>
  );
}

function ChallengeProgressRing({
  progress,
  completed,
  icon
}: {
  progress: number;
  completed?: boolean;
  icon: ReactNode;
}) {
  const fillColor = completed ? colors.secondary : colors.primary;
  const dash = Math.min(1, progress) * RING_CIRCUMFERENCE;

  return (
    <View style={styles.challengeRingWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke="rgba(0,88,188,0.1)"
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={fillColor}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${RING_CIRCUMFERENCE}`}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      <View style={styles.challengeRingCenter}>{icon}</View>
    </View>
  );
}

function ChallengeCapsule({
  challenge,
  selected,
  onPress
}: {
  challenge: ChallengeView;
  selected: boolean;
  onPress: () => void;
}) {
  const completed = challenge.status === "completed";
  const ratio = challenge.progressTarget > 0 ? challenge.current / challenge.progressTarget : 0;
  const pct = Math.round(Math.min(1, ratio) * 100);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.challengeCapsule, selected && styles.challengeCapsuleSelected]}
    >
      <ChallengeProgressRing
        progress={ratio}
        completed={completed}
        icon={iconForChallenge(challenge)}
      />
      <ChallengeSourceBadge challenge={challenge} />
      <Text style={styles.challengeCapsuleTitle} numberOfLines={2}>
        {challenge.title}
      </Text>
      <Text style={styles.challengeCapsuleMeta}>
        {completed ? "Done" : `${pct}% · +${challenge.rewardPoints}`}
      </Text>
    </Pressable>
  );
}

function ChallengeProgressCard({
  challenge,
  healthConnected,
  onConnectAppleHealth,
  onSubmitChallenge
}: {
  challenge: ChallengeView;
  healthConnected?: boolean;
  onConnectAppleHealth?: () => void | Promise<void>;
  onSubmitChallenge?: (definitionId: string) => void | Promise<void>;
}) {
  const completed = challenge.status === "completed";
  const fillColor = completed ? colors.secondary : colors.primary;
  const ratio = challenge.progressTarget > 0 ? challenge.current / challenge.progressTarget : 0;
  const pct = Math.round(Math.min(1, ratio) * 100);
  const needsHealth =
    (challenge.criterion.kind === "health_steps" || challenge.criterion.kind === "health_sleep") &&
    !completed &&
    !healthConnected;
  const canSubmitManual =
    challenge.source === "employer" &&
    challenge.criterion.kind === "manual" &&
    !completed &&
    !challenge.submittedAt &&
    onSubmitChallenge;

  const healthLabel =
    Platform.OS === "ios" ? "Connect Apple Health" : Platform.OS === "android" ? "Connect Health" : "";

  return (
    <GlassPanel style={styles.pointChallengeCard} intensity={22}>
      <ChallengeSourceBadge challenge={challenge} />
      <View style={styles.pointChallengeHead}>
        <View style={styles.pointChallengeIcon}>{iconForChallenge(challenge)}</View>
        <View style={styles.pointChallengeCopy}>
          <Text style={styles.listTitle}>{challenge.title}</Text>
          <Text style={styles.listSub} numberOfLines={2}>
            {challenge.description}
          </Text>
          {challenge.dueDate ? (
            <Text style={styles.listSub}>Due {challenge.dueDate}</Text>
          ) : null}
        </View>
        <Text style={styles.challengePoints}>+{challenge.rewardPoints}</Text>
      </View>

      {needsHealth && healthLabel && onConnectAppleHealth ? (
        <CapsuleButton label={healthLabel} onPress={onConnectAppleHealth} variant="soft" />
      ) : null}

      {canSubmitManual ? (
        <CapsuleButton
          label="I'm done"
          onPress={() => void onSubmitChallenge(challenge.id)}
          variant="soft"
        />
      ) : null}

      <View style={styles.pointChallengeProgressTrack}>
        <View
          style={[
            styles.pointChallengeProgressFill,
            { width: `${pct}%`, backgroundColor: fillColor }
          ]}
        />
      </View>

      <View style={styles.pointChallengeProgressMeta}>
        <Text style={styles.pointChallengeProgressLabel}>{challenge.progressLabel}</Text>
        {completed ? (
          <Text style={styles.pointChallengeComplete}>Completed</Text>
        ) : (
          <Text style={styles.pointChallengePct}>{pct}%</Text>
        )}
      </View>
    </GlassPanel>
  );
}

export function EmployeePointChallenges({
  challenges,
  limit,
  title = "Point challenges",
  healthConnected,
  onConnectAppleHealth,
  onSubmitChallenge,
  footerAction
}: {
  challenges: ChallengeView[];
  limit?: number;
  title?: string;
  healthConnected?: boolean;
  onConnectAppleHealth?: () => void | Promise<void>;
  onSubmitChallenge?: (definitionId: string) => void | Promise<void>;
  footerAction?: ReactNode;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const visible = (limit ? challenges.slice(0, limit) : challenges).filter(Boolean);
  const availablePoints = visible
    .filter((challenge) => challenge.status === "open")
    .reduce((sum, challenge) => sum + challenge.rewardPoints, 0);
  const expanded = visible.find((challenge) => challenge.id === expandedId) ?? null;

  if (!visible.length) return null;

  return (
    <Section title={title} meta={`${availablePoints.toLocaleString()} pts left`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.challengeCapsuleRow}
      >
        {visible.map((challenge) => (
          <ChallengeCapsule
            key={challenge.id}
            challenge={challenge}
            selected={expandedId === challenge.id}
            onPress={() =>
              setExpandedId((current) => (current === challenge.id ? null : challenge.id))
            }
          />
        ))}
      </ScrollView>

      {expanded ? (
        <ChallengeProgressCard
          challenge={expanded}
          healthConnected={healthConnected}
          onConnectAppleHealth={onConnectAppleHealth}
          onSubmitChallenge={onSubmitChallenge}
        />
      ) : null}

      {footerAction}
    </Section>
  );
}

export function ChallengeListCard({ challenge }: { challenge: ChallengeView }) {
  const completed = challenge.status === "completed";
  return (
    <GlassPanel style={styles.challengeCard} intensity={completed ? 18 : 24}>
      <ChallengeSourceBadge challenge={challenge} />
      <View style={styles.challengeMeta}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle}>{challenge.title}</Text>
          <Text style={styles.listSub}>{challenge.description}</Text>
          <Text style={styles.listSub}>
            {challenge.progressLabel}
            {challenge.dueDate ? ` · due ${challenge.dueDate}` : ""}
          </Text>
        </View>
        <Text style={[styles.challengePoints, completed && { color: colors.secondary }]}>
          +{challenge.rewardPoints}
        </Text>
      </View>
    </GlassPanel>
  );
}

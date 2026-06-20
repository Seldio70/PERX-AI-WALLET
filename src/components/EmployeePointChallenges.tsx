import { Activity, BadgeCheck, Calendar } from "lucide-react-native";
import { ReactNode, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import { GlassPanel } from "./GlassPanel";
import { Section } from "./Section";

type ChallengeItem = {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  progress: number;
  progressLabel: string;
  completed?: boolean;
  icon: ReactNode;
};

const homeChallenges: ChallengeItem[] = [
  {
    id: "steps",
    title: "10,000 steps",
    description: "Complete 10,000 steps today",
    rewardPoints: 500,
    progress: 0.6,
    progressLabel: "6,000 / 10,000 steps",
    icon: <Activity size={18} color={colors.primary} />
  },
  {
    id: "daily-login",
    title: "Daily login streak",
    description: "Log in 7 days in a row",
    rewardPoints: 400,
    progress: 3 / 7,
    progressLabel: "Day 3 of 7",
    icon: <Calendar size={18} color={colors.tertiary} />
  },
  {
    id: "use-perks",
    title: "Use your perks",
    description: "Utilize two perks this month",
    rewardPoints: 500,
    progress: 1,
    progressLabel: "2 / 2 perks used",
    completed: true,
    icon: <BadgeCheck size={18} color={colors.secondary} />
  }
];

const RING_SIZE = 64;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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
  challenge: ChallengeItem;
  selected: boolean;
  onPress: () => void;
}) {
  const pct = Math.round(challenge.progress * 100);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.challengeCapsule, selected && styles.challengeCapsuleSelected]}
    >
      <ChallengeProgressRing
        progress={challenge.progress}
        completed={challenge.completed}
        icon={challenge.icon}
      />
      <Text style={styles.challengeCapsuleTitle} numberOfLines={2}>
        {challenge.title}
      </Text>
      <Text style={styles.challengeCapsuleMeta}>
        {challenge.completed ? "Done" : `${pct}% · +${challenge.rewardPoints}`}
      </Text>
    </Pressable>
  );
}

function ChallengeProgressCard({ challenge }: { challenge: ChallengeItem }) {
  const fillColor = challenge.completed ? colors.secondary : colors.primary;
  const pct = Math.round(challenge.progress * 100);

  return (
    <GlassPanel style={styles.pointChallengeCard} intensity={22}>
      <View style={styles.pointChallengeHead}>
        <View style={styles.pointChallengeIcon}>{challenge.icon}</View>
        <View style={styles.pointChallengeCopy}>
          <Text style={styles.listTitle}>{challenge.title}</Text>
          <Text style={styles.listSub} numberOfLines={2}>
            {challenge.description}
          </Text>
        </View>
        <Text style={styles.challengePoints}>+{challenge.rewardPoints}</Text>
      </View>

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
        {challenge.completed ? (
          <Text style={styles.pointChallengeComplete}>Completed</Text>
        ) : (
          <Text style={styles.pointChallengePct}>{pct}%</Text>
        )}
      </View>
    </GlassPanel>
  );
}

export function EmployeePointChallenges() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const availablePoints = homeChallenges
    .filter((challenge) => !challenge.completed)
    .reduce((sum, challenge) => sum + challenge.rewardPoints, 0);
  const expanded = homeChallenges.find((challenge) => challenge.id === expandedId) ?? null;

  return (
    <Section title="Point challenges" meta={`${availablePoints.toLocaleString()} pts left`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.challengeCapsuleRow}
      >
        {homeChallenges.map((challenge) => (
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

      {expanded ? <ChallengeProgressCard challenge={expanded} /> : null}
    </Section>
  );
}

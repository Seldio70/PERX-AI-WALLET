import { Activity, BadgeCheck, Calendar } from "lucide-react-native";
import { ReactNode } from "react";
import { Text, View } from "react-native";
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
  const availablePoints = homeChallenges
    .filter((challenge) => !challenge.completed)
    .reduce((sum, challenge) => sum + challenge.rewardPoints, 0);

  return (
    <Section title="Point challenges" meta={`${availablePoints.toLocaleString()} pts left`}>
      {homeChallenges.map((challenge) => (
        <ChallengeProgressCard key={challenge.id} challenge={challenge} />
      ))}
    </Section>
  );
}

import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { PointsHealth } from "../lib/perkPayment";
import { colors, liquidShadow, radius } from "../theme";

type Props = {
  health: PointsHealth;
};

const SIZE = 132;
const STROKE = 13;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function PointsHealthRing({ health }: Props) {
  const spentFrac =
    health.balance + health.spentThisMonth > 0
      ? health.spentThisMonth / (health.balance + health.spentThisMonth)
      : 0;
  const spentDash = Math.min(1, spentFrac) * CIRCUMFERENCE;

  return (
    <View style={styles.panel}>
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="rgba(0,88,188,0.12)"
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.primary}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${spentDash} ${CIRCUMFERENCE}`}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={styles.ringValue} numberOfLines={1}>
            {health.balance.toLocaleString()}
          </Text>
          <Text style={styles.ringLabel}>pts available</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <StatRow color={colors.primary} label="Spent this month" value={`${health.spentThisMonth} pts`} />
        <StatRow color={colors.secondary} label="Redemptions" value={`${health.redemptions}`} />
        <StatRow
          color={colors.tertiary}
          label="Days left in cycle"
          value={`${health.daysLeft} of ${health.cycleDays}`}
        />
      </View>
    </View>
  );
}

function StatRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    padding: 18,
    borderRadius: radius.cardLg,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glassStrong,
    ...liquidShadow
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center"
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  ringValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  ringLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "700"
  },
  stats: {
    flex: 1,
    gap: 10
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5
  },
  statLabel: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  statValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800"
  }
});

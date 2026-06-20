import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { WalletHealth } from "../lib/benefitAutopilot";
import { currency } from "../lib/format";
import { colors, liquidShadow, radius } from "../theme";

type Props = {
  health: WalletHealth;
};

const SIZE = 132;
const STROKE = 13;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function BudgetHealthRing({ health }: Props) {
  const usedFrac = Math.max(0, Math.min(1, health.usedPct));
  const reservedFrac = Math.max(0, Math.min(1, health.reservedPct));
  // Reserved arc starts where used ends, so the gap visualises what's still free.
  const usedDash = usedFrac * CIRCUMFERENCE;
  const reservedDash = reservedFrac * CIRCUMFERENCE;
  const reservedOffset = -usedDash;

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
          {reservedFrac > 0 ? (
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={colors.tertiary}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${reservedDash} ${CIRCUMFERENCE}`}
              strokeDashoffset={reservedOffset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          ) : null}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.primary}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${usedDash} ${CIRCUMFERENCE}`}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={styles.ringValue} numberOfLines={1}>
            {currency(health.available)}
          </Text>
          <Text style={styles.ringLabel}>available</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <StatRow color={colors.primary} label="Used this month" value={currency(health.used)} />
        <StatRow color={colors.tertiary} label="Reserved / pending" value={currency(health.reserved)} />
        <StatRow color="rgba(0,88,188,0.18)" label="Still available" value={currency(health.available)} />
        <StatRow
          color={colors.secondary}
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

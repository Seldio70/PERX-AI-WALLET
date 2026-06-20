import { LucideIcon } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { GlassPanel } from "./GlassPanel";
import { colors, radius } from "../theme";

type Props = {
  title: string;
  value: string;
  trend?: string;
  accent: string;
  Icon: LucideIcon;
};

export function BentoMetricCard({ title, value, trend, accent, Icon }: Props) {
  return (
    <GlassPanel style={styles.card} intensity={40}>
      <Icon size={22} color={accent} />
      <Text style={styles.title}>{title}</Text>
      <View style={styles.footer}>
        <Text style={[styles.value, { color: accent }]}>{value}</Text>
        {trend ? (
          <View style={styles.trend}>
            <Text style={styles.trendText}>{trend}</Text>
          </View>
        ) : null}
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    minHeight: 148,
    padding: 18,
    justifyContent: "space-between"
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8
  },
  footer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8
  },
  value: {
    fontSize: 24,
    fontWeight: "900",
    flexShrink: 1
  },
  trend: {
    borderRadius: radius.capsule,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(111,251,133,0.25)"
  },
  trendText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "800"
  }
});

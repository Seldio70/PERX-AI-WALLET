import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";

type Props = {
  label: string;
  value: string;
};

export function MetricPill({ label, value }: Props) {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: colors.panel,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 106
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600"
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2
  }
});

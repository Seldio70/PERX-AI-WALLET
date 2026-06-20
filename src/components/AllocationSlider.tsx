import Slider from "@react-native-community/slider";
import { StyleSheet, Text, View } from "react-native";
import { currency } from "../lib/format";
import { colors, radius } from "../theme";
import { BenefitCategory } from "../types";

type Props = {
  category: BenefitCategory;
  value: number;
  max: number;
  onChange: (value: number) => void;
};

export function AllocationSlider({ category, value, max, onChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.category}>{category}</Text>
        <Text style={styles.amount}>{currency(value)}</Text>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={max}
        step={1}
        value={value}
        minimumTrackTintColor={colors.text}
        maximumTrackTintColor="rgba(255,255,255,0.16)"
        thumbTintColor={colors.text}
        onValueChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: radius.compact,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.stroke,
    padding: 14,
    marginBottom: 10
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  category: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  amount: {
    color: colors.soft,
    fontSize: 15,
    fontWeight: "800"
  }
});

import { Bell, ChartPie, Home, SlidersHorizontal, WalletCards } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";

export type EmployeeTab = "home" | "wallet" | "allocate" | "alerts";

const tabs: Array<{ id: EmployeeTab; label: string; Icon: typeof Home }> = [
  { id: "home", label: "Home", Icon: Home },
  { id: "wallet", label: "Wallet", Icon: WalletCards },
  { id: "allocate", label: "Split", Icon: SlidersHorizontal },
  { id: "alerts", label: "Offers", Icon: Bell }
];

type Props = {
  active: EmployeeTab;
  onChange: (tab: EmployeeTab) => void;
};

export function BottomNav({ active, onChange }: Props) {
  return (
    <View style={styles.nav}>
      {tabs.map(({ id, label, Icon }) => {
        const selected = active === id;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            style={[styles.item, selected && styles.active]}
          >
            <Icon size={18} color={selected ? colors.background : colors.muted} />
            {selected ? <Text style={styles.activeLabel}>{label}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    minHeight: 64,
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: "rgba(11,15,32,0.92)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    padding: 8
  },
  item: {
    height: 46,
    minWidth: 46,
    paddingHorizontal: 13,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7
  },
  active: {
    backgroundColor: colors.text
  },
  activeLabel: {
    color: colors.background,
    fontSize: 13,
    fontWeight: "800"
  }
});

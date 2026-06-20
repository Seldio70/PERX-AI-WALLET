import { BlurView } from "expo-blur";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppIcon, AppIconName } from "./AppIcon";
import { colors, radius, shadow } from "../theme";

export type NavTab<T extends string = string> = {
  id: T;
  label: string;
  icon: AppIconName;
  iconActive: AppIconName;
};

export type EmployeeTab = "home" | "wallet" | "allocate" | "alerts";

const defaultEmployeeTabs: Array<NavTab<EmployeeTab>> = [
  { id: "home", label: "Home", icon: "home-outline", iconActive: "home" },
  { id: "wallet", label: "Wallet", icon: "wallet-outline", iconActive: "wallet" },
  { id: "allocate", label: "Split", icon: "tune-variant", iconActive: "tune" },
  { id: "alerts", label: "Offers", icon: "tag-outline", iconActive: "tag" }
];

type Props<T extends string> = {
  tabs?: ReadonlyArray<NavTab<T>>;
  active: T;
  onChange: (tab: T) => void;
  onProfilePress?: () => void;
};

export function BottomNav<T extends string = EmployeeTab>({
  tabs,
  active,
  onChange,
  onProfilePress
}: Props<T>) {
  const navTabs = tabs ?? (defaultEmployeeTabs as unknown as ReadonlyArray<NavTab<T>>);

  return (
    <View style={styles.shell}>
      <BlurView intensity={72} tint="light" style={styles.nav}>
        <View style={styles.navOverlay} />
        <View style={styles.navContent}>
          {navTabs.map(({ id, label, icon, iconActive }) => {
            const selected = active === id;
            return (
              <Pressable
                key={id}
                onPress={() => onChange(id)}
                style={[styles.item, selected && styles.active]}
              >
                <AppIcon
                  name={selected ? iconActive : icon}
                  size={20}
                  color={selected ? colors.onPrimary : colors.muted}
                />
                {selected ? <Text style={styles.activeLabel}>{label}</Text> : null}
              </Pressable>
            );
          })}
          {onProfilePress ? (
            <Pressable onPress={onProfilePress} style={styles.item}>
              <AppIcon name="account-circle-outline" size={22} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    borderRadius: radius.capsule,
    overflow: "hidden",
    ...shadow
  },
  nav: {
    minHeight: 68,
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    overflow: "hidden"
  },
  navOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.42)"
  },
  navContent: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  item: {
    height: 48,
    minWidth: 48,
    paddingHorizontal: 14,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7
  },
  active: {
    backgroundColor: colors.primary,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.35)"
  },
  activeLabel: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "800"
  }
});

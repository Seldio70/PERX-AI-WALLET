import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { AppIcon, AppIconName } from "./AppIcon";
import { colors, liquidShadow, radius } from "../theme";

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
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0.72)", "rgba(255,255,255,0.2)", "rgba(255,255,255,0.44)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.navSheen}
        />
        <View style={styles.navContent}>
          {navTabs.map(({ id, label, icon, iconActive }) => (
            <BottomNavItem
              key={id}
              label={label}
              icon={icon}
              iconActive={iconActive}
              selected={active === id}
              onPress={() => onChange(id)}
            />
          ))}
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

function BottomNavItem({
  label,
  icon,
  iconActive,
  selected,
  onPress
}: {
  label: string;
  icon: AppIconName;
  iconActive: AppIconName;
  selected: boolean;
  onPress: () => void;
}) {
  const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: selected ? 1 : 0,
      duration: 190,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [progress, selected]);

  const activeScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1]
  });
  const iconScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08]
  });
  const labelTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 0]
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.activeLayer, { opacity: progress, transform: [{ scale: activeScale }] }]}
      />
      <Animated.View style={{ transform: [{ scale: iconScale }] }}>
        <AppIcon
          name={selected ? iconActive : icon}
          size={20}
          color={selected ? colors.onPrimary : colors.muted}
        />
      </Animated.View>
      {selected ? (
        <Animated.Text
          style={[
            styles.activeLabel,
            { opacity: progress, transform: [{ translateX: labelTranslate }] }
          ]}
        >
          {label}
        </Animated.Text>
      ) : null}
    </Pressable>
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
    ...liquidShadow
  },
  nav: {
    minHeight: 68,
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: colors.glassEdge,
    overflow: "hidden"
  },
  navOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.34)"
  },
  navSheen: {
    ...StyleSheet.absoluteFillObject
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
    gap: 7,
    overflow: "hidden"
  },
  itemPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }]
  },
  activeLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.capsule,
    backgroundColor: colors.primary,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  activeLabel: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "800"
  }
});

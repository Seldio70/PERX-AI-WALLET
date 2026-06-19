import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, radius } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: "primary" | "ghost" | "soft";
  style?: ViewStyle;
};

export function CapsuleButton({ label, onPress, icon, variant = "primary", style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        style
      ]}
    >
      {icon}
      <Text style={[styles.label, variant === "ghost" && styles.ghostLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.capsule,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8
  },
  primary: {
    backgroundColor: colors.text
  },
  soft: {
    backgroundColor: colors.panelStrong,
    borderWidth: 1,
    borderColor: colors.stroke
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.stroke
  },
  label: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "700"
  },
  ghostLabel: {
    color: colors.text
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }]
  }
});

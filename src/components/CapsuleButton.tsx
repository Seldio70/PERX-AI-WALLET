import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, radius } from "../theme";

type Props = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: "primary" | "ghost" | "soft" | "dark";
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
      <Text
        style={[
          styles.label,
          variant === "ghost" && styles.ghostLabel,
          variant === "soft" && styles.softLabel
        ]}
      >
        {label}
      </Text>
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
    backgroundColor: colors.primary
  },
  dark: {
    backgroundColor: colors.text
  },
  soft: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 0.5,
    borderColor: colors.strokeSubtle
  },
  label: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: "700"
  },
  ghostLabel: {
    color: colors.text
  },
  softLabel: {
    color: colors.text
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }]
  }
});

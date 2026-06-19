import { BlurView } from "expo-blur";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { colors, radius, shadow } from "../theme";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
};

export function GlassPanel({ children, style, intensity = 24 }: Props) {
  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.panel, style]}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  panel: {
    overflow: "hidden",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.stroke,
    backgroundColor: colors.panel,
    ...shadow
  }
});

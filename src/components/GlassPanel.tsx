import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { colors, liquidShadow, radius } from "../theme";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
};

export function GlassPanel({ children, style, intensity = 36 }: Props) {
  return (
    <BlurView intensity={intensity} tint="light" style={[styles.panel, style]}>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.58)", "rgba(255,255,255,0.14)", "rgba(255,255,255,0.26)"]}
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.liquidSheen}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.76)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.65, y: 0.65 }}
        style={styles.edgeLight}
      />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  panel: {
    overflow: "hidden",
    borderRadius: radius.cardLg,
    borderWidth: 0.8,
    borderColor: colors.glassEdge,
    backgroundColor: colors.glass,
    ...liquidShadow
  },
  liquidSheen: {
    ...StyleSheet.absoluteFillObject
  },
  edgeLight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 64
  }
});

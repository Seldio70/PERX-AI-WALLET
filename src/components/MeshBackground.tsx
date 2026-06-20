import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme";

export function MeshBackground() {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <LinearGradient
        colors={[colors.background, "#F4F3F8", colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, styles.orbPrimary]} />
      <View style={[styles.orb, styles.orbTertiary]} />
      <View style={[styles.orb, styles.orbSecondary]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden"
  },
  orb: {
    position: "absolute",
    borderRadius: 999
  },
  orbPrimary: {
    top: "-8%",
    left: "-12%",
    width: "58%",
    height: "38%",
    backgroundColor: "rgba(0,88,188,0.12)"
  },
  orbTertiary: {
    bottom: "-10%",
    right: "-8%",
    width: "48%",
    height: "34%",
    backgroundColor: "rgba(76,74,202,0.1)"
  },
  orbSecondary: {
    top: "18%",
    right: "-6%",
    width: "32%",
    height: "24%",
    backgroundColor: "rgba(111,251,133,0.14)"
  }
});

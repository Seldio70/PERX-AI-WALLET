import ConfettiCannon from "react-native-confetti-cannon";
import { Dimensions, StyleSheet, View } from "react-native";
import { colors } from "../theme";

const { width } = Dimensions.get("window");

const confettiColors = [
  colors.primary,
  colors.secondary,
  colors.tertiary,
  colors.primaryContainer,
  "#FFD166",
  "#FF7AA2"
];

export function ConfettiBurst() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ConfettiCannon
        count={130}
        origin={{ x: width / 2, y: -24 }}
        autoStart
        fadeOut
        explosionSpeed={360}
        fallSpeed={2800}
        colors={confettiColors}
      />
    </View>
  );
}

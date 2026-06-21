import { Image, ImageStyle, StyleProp } from "react-native";

const perxRoundLogo = require("../../assets/perx-round-logo.png");

type Props = {
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function BrandLogo({ size = 32, style }: Props) {
  return (
    <Image
      source={perxRoundLogo}
      resizeMode="contain"
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
    />
  );
}

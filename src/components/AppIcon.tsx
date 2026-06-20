import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ComponentProps } from "react";

export type AppIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type Props = {
  name: AppIconName;
  size?: number;
  color?: string;
};

export function AppIcon({ name, size = 22, color = "#1A1B1F" }: Props) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

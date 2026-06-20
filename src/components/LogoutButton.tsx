import { LogOut } from "lucide-react-native";
import { Pressable, Text } from "react-native";
import { colors } from "../theme";
import { styles } from "../styles/appStyles";

export function LogoutButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.logoutButton}
      accessibilityLabel="Log out"
      accessibilityRole="button"
    >
      <LogOut size={15} color={colors.soft} />
      <Text style={styles.logoutText}>Log Out</Text>
    </Pressable>
  );
}

import { LineChart } from "lucide-react-native";
import { Text, View } from "react-native";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";

export function AnalyticsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.analyticsRow}>
      <View style={styles.analyticsLabel}>
        <LineChart size={17} color={colors.text} />
        <Text style={styles.listTitle}>{label}</Text>
      </View>
      <Text style={styles.confidence}>{value}</Text>
    </View>
  );
}

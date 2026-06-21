import { Text, View } from "react-native";
import { styles } from "../styles/appStyles";

export function Section({
  title,
  meta,
  children,
  dense = false
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  dense?: boolean;
}) {
  return (
    <View style={dense ? styles.adminSection : styles.section}>
      <View style={dense ? styles.adminSectionHeader : styles.sectionHeader}>
        <Text style={dense ? styles.adminSectionTitle : styles.sectionTitle}>{title}</Text>
        {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
      </View>
      {children}
    </View>
  );
}

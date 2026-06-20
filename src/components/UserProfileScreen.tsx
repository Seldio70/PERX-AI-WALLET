import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppIcon, AppIconName } from "./AppIcon";
import { CapsuleButton } from "./CapsuleButton";
import { GlassPanel } from "./GlassPanel";
import { colors, radius } from "../theme";
import { Role, User } from "../types";

const roleLabels: Record<Role, string> = {
  employee: "Employee",
  employer: "Employer",
  business: "Provider"
};

type Props = {
  user: User;
  onClose: () => void;
  onLogout: () => void;
};

export function UserProfileScreen({ user, onClose, onLogout }: Props) {
  const memberSince = "2024";

  return (
    <View style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <AppIcon name="account" size={42} color={colors.primary} />
            </View>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.meta}>
            {roleLabels[user.role]} · Member since {memberSince}
          </Text>
        </View>

        <ProfileRow
          icon="account-outline"
          title="Personal Info"
          subtitle="Update your details and contact information"
          tint={colors.primary}
        />
        <ProfileRow
          icon="shield-account-outline"
          title="Security"
          subtitle="Manage passwords and account access"
          tint={colors.secondary}
        />
        <ProfileRow
          icon="bell-outline"
          title="Notifications"
          subtitle="Perks, approvals, and wallet alerts"
          tint={colors.tertiary}
        />

        <GlassPanel style={styles.infoPanel} intensity={36}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
          <Text style={[styles.infoLabel, styles.infoGap]}>Role</Text>
          <Text style={styles.infoValue}>{roleLabels[user.role]}</Text>
        </GlassPanel>

        <View style={styles.actions}>
          <CapsuleButton label="Back to app" onPress={onClose} variant="soft" />
          <CapsuleButton
            label="Log out"
            onPress={onLogout}
            icon={<AppIcon name="logout" size={16} color={colors.onPrimary} />}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function ProfileRow({
  icon,
  title,
  subtitle,
  tint
}: {
  icon: AppIconName;
  title: string;
  subtitle: string;
  tint: string;
}) {
  return (
    <Pressable>
      <GlassPanel style={styles.row} intensity={36}>
        <View style={[styles.rowIcon, { backgroundColor: `${tint}18` }]}>
          <AppIcon name={icon} size={22} color={tint} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSub}>{subtitle}</Text>
        </View>
        <AppIcon name="chevron-right" size={20} color={colors.soft} />
      </GlassPanel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(250,249,254,0.96)",
    zIndex: 20
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12
  },
  hero: {
    alignItems: "center",
    marginBottom: 8
  },
  avatarRing: {
    borderRadius: radius.capsule,
    padding: 4,
    backgroundColor: colors.primary
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radius.capsule,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.surface
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 14
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4
  },
  row: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.capsule,
    alignItems: "center",
    justifyContent: "center"
  },
  rowText: {
    flex: 1
  },
  rowTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600"
  },
  rowSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16
  },
  infoPanel: {
    padding: 18,
    gap: 4,
    marginTop: 4
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  infoValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  infoGap: {
    marginTop: 10
  },
  actions: {
    gap: 10,
    marginTop: 8
  }
});

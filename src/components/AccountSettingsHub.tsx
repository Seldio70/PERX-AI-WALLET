import { ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Switch, Text, TextInput, View } from "react-native";
import { AppIcon, AppIconName } from "./AppIcon";
import { CapsuleButton } from "./CapsuleButton";
import { GlassPanel } from "./GlassPanel";
import { colors, radius } from "../theme";
import { Role, User } from "../types";
import { styles as appStyles } from "../styles/appStyles";

const roleLabels: Record<Role, string> = {
  employee: "Employee",
  employer: "Employer",
  business: "Provider"
};

type AccountPage = "hub" | "personal" | "security" | "notifications" | "payouts";

type Props = {
  user: User;
  onLogout: () => void;
  subtitle?: string;
  showHero?: boolean;
};

export function AccountSettingsHub({ user, onLogout, subtitle, showHero = true }: Props) {
  const [page, setPage] = useState<AccountPage>("hub");
  const [notifyPerks, setNotifyPerks] = useState(true);
  const [notifyApprovals, setNotifyApprovals] = useState(true);
  const [notifyWallet, setNotifyWallet] = useState(user.role !== "employer");
  const [payoutIban, setPayoutIban] = useState("");
  const [payoutBank, setPayoutBank] = useState("");
  const [payoutCycle, setPayoutCycle] = useState("Weekly");

  if (page !== "hub") {
    return (
      <View style={appStyles.accountSubpage}>
        <Pressable onPress={() => setPage("hub")} style={appStyles.accountBackRow}>
          <AppIcon name="chevron-left" size={20} color={colors.primary} />
          <Text style={appStyles.accountBackText}>Back</Text>
        </Pressable>

        {page === "personal" ? (
          <>
            <Text style={appStyles.accountSubpageTitle}>Personal info</Text>
            <Text style={appStyles.accountSubpageSub}>Your account details on PerX.</Text>
            <GlassPanel style={appStyles.accountFieldPanel} intensity={32}>
              <Text style={appStyles.accountFieldLabel}>Full name</Text>
              <Text style={appStyles.accountFieldValue}>{user.name}</Text>
              <Text style={[appStyles.accountFieldLabel, appStyles.accountFieldGap]}>Email</Text>
              <Text style={appStyles.accountFieldValue}>{user.email}</Text>
              <Text style={[appStyles.accountFieldLabel, appStyles.accountFieldGap]}>Role</Text>
              <Text style={appStyles.accountFieldValue}>{roleLabels[user.role]}</Text>
            </GlassPanel>
          </>
        ) : null}

        {page === "security" ? (
          <>
            <Text style={appStyles.accountSubpageTitle}>Security</Text>
            <Text style={appStyles.accountSubpageSub}>Manage passwords and account access.</Text>
            <GlassPanel style={appStyles.accountFieldPanel} intensity={32}>
              <Text style={appStyles.accountFieldLabel}>Sign-in email</Text>
              <Text style={appStyles.accountFieldValue}>{user.email}</Text>
              <Text style={[appStyles.accountFieldLabel, appStyles.accountFieldGap]}>Password</Text>
              <Text style={appStyles.bodyText}>
                Use “Forgot password” on the sign-in screen to reset your password securely.
              </Text>
            </GlassPanel>
          </>
        ) : null}

        {page === "notifications" ? (
          <>
            <Text style={appStyles.accountSubpageTitle}>Notifications</Text>
            <Text style={appStyles.accountSubpageSub}>{notificationCopy(user.role)}</Text>
            <NotificationToggle
              label="Perk updates"
              sub="New offers and catalog changes"
              value={notifyPerks}
              onChange={setNotifyPerks}
            />
            <NotificationToggle
              label="Approvals"
              sub={user.role === "business" ? "Redemption and payout alerts" : "Selection and redemption updates"}
              value={notifyApprovals}
              onChange={setNotifyApprovals}
            />
            {user.role !== "employer" ? (
              <NotificationToggle
                label="Wallet alerts"
                sub={user.role === "employee" ? "Points earned and budget changes" : "Settlement and payout notices"}
                value={notifyWallet}
                onChange={setNotifyWallet}
              />
            ) : null}
          </>
        ) : null}

        {page === "payouts" ? (
          <>
            <Text style={appStyles.accountSubpageTitle}>Payouts</Text>
            <Text style={appStyles.accountSubpageSub}>{payoutCopy(user.role)}</Text>
            {user.role === "business" ? (
              <GlassPanel style={appStyles.accountFieldPanel} intensity={32}>
                <Text style={appStyles.accountFieldLabel}>Bank name</Text>
                <TextInput
                  value={payoutBank}
                  onChangeText={setPayoutBank}
                  placeholder="e.g. Raiffeisen Bank"
                  placeholderTextColor={colors.muted}
                  style={appStyles.accountInput}
                />
                <Text style={[appStyles.accountFieldLabel, appStyles.accountFieldGap]}>IBAN</Text>
                <TextInput
                  value={payoutIban}
                  onChangeText={setPayoutIban}
                  placeholder="AL47 2121 1009 0000 0002 3569 8741"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  style={appStyles.accountInput}
                />
                <Text style={[appStyles.accountFieldLabel, appStyles.accountFieldGap]}>Settlement cycle</Text>
                <View style={appStyles.accountCycleRow}>
                  {["Weekly", "Bi-weekly", "Monthly"].map((cycle) => (
                    <Pressable
                      key={cycle}
                      onPress={() => setPayoutCycle(cycle)}
                      style={[appStyles.accountCycleChip, payoutCycle === cycle && appStyles.accountCycleChipActive]}
                    >
                      <Text
                        style={[
                          appStyles.accountCycleChipText,
                          payoutCycle === cycle && appStyles.accountCycleChipTextActive
                        ]}
                      >
                        {cycle}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </GlassPanel>
            ) : (
              <GlassPanel style={appStyles.accountFieldPanel} intensity={32}>
                <Text style={appStyles.bodyText}>{payoutStaticCopy(user.role)}</Text>
              </GlassPanel>
            )}
          </>
        ) : null}
      </View>
    );
  }

  const tiles: Array<{ id: AccountPage; title: string; subtitle: string; icon: AppIconName; tint: string }> = [
    {
      id: "personal",
      title: "Personal info",
      subtitle: "Update your details and contact information",
      icon: "account-outline",
      tint: colors.primary
    },
    {
      id: "security",
      title: "Security",
      subtitle: "Manage passwords and account access",
      icon: "shield-account-outline",
      tint: colors.secondary
    },
    {
      id: "notifications",
      title: "Notifications",
      subtitle: notificationTileSub(user.role),
      icon: "bell-outline",
      tint: colors.tertiary
    },
    {
      id: "payouts",
      title: "Payouts",
      subtitle: payoutTileSub(user.role),
      icon: "wallet-outline",
      tint: colors.accent
    }
  ];

  return (
    <>
      {showHero ? (
        <View style={appStyles.accountHero}>
          <View style={appStyles.accountAvatarRing}>
            <View style={appStyles.accountAvatar}>
              <AppIcon name="account" size={42} color={colors.primary} />
            </View>
          </View>
          <Text style={appStyles.accountHeroName}>{user.name}</Text>
          <Text style={appStyles.accountHeroMeta}>
            {roleLabels[user.role]} · Member since 2024
          </Text>
          {subtitle ? <Text style={appStyles.accountHeroSub}>{subtitle}</Text> : null}
        </View>
      ) : null}

      {tiles.map((tile) => (
        <Pressable key={tile.id} onPress={() => setPage(tile.id)}>
          <GlassPanel style={appStyles.accountSettingsRow} intensity={36}>
            <View style={[appStyles.accountSettingsIcon, { backgroundColor: `${tile.tint}18` }]}>
              <AppIcon name={tile.icon} size={22} color={tile.tint} />
            </View>
            <View style={appStyles.accountSettingsCopy}>
              <Text style={appStyles.accountSettingsTitle}>{tile.title}</Text>
              <Text style={appStyles.accountSettingsSub}>{tile.subtitle}</Text>
            </View>
            <ChevronRight size={20} color={colors.soft} />
          </GlassPanel>
        </Pressable>
      ))}

      <GlassPanel style={appStyles.accountFieldPanel} intensity={32}>
        <Text style={appStyles.accountFieldLabel}>Email</Text>
        <Text style={appStyles.accountFieldValue}>{user.email}</Text>
      </GlassPanel>

      <CapsuleButton
        label="Log out"
        onPress={onLogout}
        icon={<AppIcon name="logout" size={16} color={colors.onPrimary} />}
      />
    </>
  );
}

function NotificationToggle({
  label,
  sub,
  value,
  onChange
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <GlassPanel style={appStyles.accountToggleRow} intensity={32}>
      <View style={appStyles.accountSettingsCopy}>
        <Text style={appStyles.accountSettingsTitle}>{label}</Text>
        <Text style={appStyles.accountSettingsSub}>{sub}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.stroke }} />
    </GlassPanel>
  );
}

function notificationCopy(role: Role) {
  if (role === "employer") return "Approvals and team activity alerts.";
  if (role === "business") return "Redemptions, payouts, and offer performance.";
  return "Perks, approvals, and wallet alerts.";
}

function notificationTileSub(role: Role) {
  if (role === "employer") return "Team redemptions and challenge updates";
  if (role === "business") return "Redemptions and payout alerts";
  return "Perks, approvals, and wallet alerts";
}

function payoutCopy(role: Role) {
  if (role === "business") return "Bank account, IBAN, and settlement cycle.";
  if (role === "employer") return "Company billing and perk settlement overview.";
  return "Perk budget and redemption settlement.";
}

function payoutTileSub(role: Role) {
  if (role === "business") return "Bank account, IBAN, settlement cycle";
  if (role === "employer") return "Company billing and settlements";
  return "Budget and redemption history";
}

function payoutStaticCopy(role: Role) {
  if (role === "employer") {
    return "Employer accounts settle employee redemptions through company billing. Contact support to update billing details.";
  }
  return "Employee perk budgets are managed by your employer. Redemption history appears in your wallet and activity tabs.";
}

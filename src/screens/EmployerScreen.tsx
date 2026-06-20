import { Check, ShieldCheck, Store, UsersRound, WalletCards } from "lucide-react-native";
import { Image, ScrollView, Text, View } from "react-native";
import { AnalyticsRow } from "../components/AnalyticsRow";
import { CapsuleButton } from "../components/CapsuleButton";
import { GlassPanel } from "../components/GlassPanel";
import { MetricPill } from "../components/MetricPill";
import { Section } from "../components/Section";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import { Benefit, EmployerWalletCard, SelectionRequest, User } from "../types";
import { currency, market } from "../utils/format";

type AppData = {
  companies: { id: string; name: string; employerId: string; monthlyBudgetPerEmployee: number }[];
  users: User[];
  benefits: Benefit[];
  employerWalletCards: EmployerWalletCard[];
  selectionRequests: SelectionRequest[];
  [key: string]: unknown;
};

export function EmployerExperience({
  user,
  appData,
  selectionRequests,
  onAddPoints
}: {
  user: User;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onAddPoints: (amount: number) => void;
}) {
  const company =
    appData.companies.find((item) => item.employerId === user.id) ??
    appData.companies.find((item) => item.id === user.companyId) ?? {
      id: "",
      name: "No company connected",
      employerId: user.id,
      monthlyBudgetPerEmployee: 0
    };
  const employees = appData.users.filter((item) => item.role === "employee" && item.companyId === company.id);
  const employerPoints = appData.employerWalletCards.reduce((sum, card) => sum + card.points, 0);
  const spendablePoints = appData.employerWalletCards[0]?.points ?? 999999;
  const recentRedemptions = selectionRequests;

  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>{company.name}</Text>
        <Text style={styles.greetingSub}>Employer operations dashboard</Text>
      </View>

      <View style={styles.metricRow}>
        <MetricPill label="Employees" value={`${employees.length}`} />
        <MetricPill label="Points" value={`${spendablePoints.toLocaleString(market.locale)}`} />
        <MetricPill label="Redeemed" value={`${recentRedemptions.length}`} />
      </View>

      <Section title="Points wallet" meta="Top up">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {appData.employerWalletCards.length ? (
            appData.employerWalletCards.map((card) => (
              <GlassPanel key={card.id} style={styles.pointsCard} intensity={16}>
                <View style={[styles.pointsAccent, { backgroundColor: card.accent }]} />
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.pointsValue}>{card.points.toLocaleString(market.locale)}</Text>
                <Text style={styles.bodyText}>{card.description}</Text>
              </GlassPanel>
            ))
          ) : (
            <GlassPanel style={styles.pointsCard} intensity={16}>
              <View style={[styles.pointsAccent, { backgroundColor: colors.accent }]} />
              <Text style={styles.cardTitle}>Welfare Budget</Text>
              <Text style={styles.pointsValue}>{spendablePoints.toLocaleString(market.locale)}</Text>
              <Text style={styles.bodyText}>Employee benefits fund</Text>
            </GlassPanel>
          )}
        </ScrollView>
        <View style={styles.metricRow}>
          <CapsuleButton label="+5,000 pts" onPress={() => onAddPoints(5000)} variant="soft" />
          <CapsuleButton label="+10,000 pts" onPress={() => onAddPoints(10000)} variant="soft" />
          <CapsuleButton label="+50,000 pts" onPress={() => onAddPoints(50000)} variant="soft" />
        </View>
      </Section>

      <Section title="Perks for points" meta="Catalog">
        {appData.benefits.length ? appData.benefits.map((benefit) => {
          const canAfford = employerPoints >= benefit.pointsPrice;
          return (
            <GlassPanel key={benefit.id} style={styles.offerCard} intensity={14}>
              <Image source={{ uri: benefit.imageUrl }} style={styles.offerImage} />
              <View style={styles.offerTop}>
                <View style={styles.listText}>
                  <Text style={styles.listTitle}>{benefit.title}</Text>
                  <Text style={styles.listSub}>{benefit.providerName} - {benefit.category}</Text>
                </View>
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>{benefit.pointsPrice} pts</Text>
                </View>
              </View>
              <Text style={styles.bodyText}>{benefit.description}</Text>
              <Text style={styles.listSub}>
                {canAfford ? "Available with current wallet balance" : "Needs more points"}
              </Text>
            </GlassPanel>
          );
        }) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <Store size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No perks yet</Text>
              <Text style={styles.listSub}>Provider offers will appear after they are added.</Text>
            </View>
          </View>
        )}
      </Section>

      <Section title="Recent redemptions" meta={`${recentRedemptions.length} total`}>
        {recentRedemptions.length ? recentRedemptions.map((request) => {
          const requestBenefits = request.benefitIds
            .map((id) => appData.benefits.find((b) => b.id === id))
            .filter(Boolean) as Benefit[];
          const providers = Array.from(new Set(requestBenefits.map((b) => b.providerName)));
          return (
            <GlassPanel key={request.id} style={styles.approvalCard} intensity={14}>
              <View style={styles.employeeBudgetHeader}>
                <View style={styles.listText}>
                  <Text style={styles.cardTitle}>{request.employeeName}</Text>
                  <Text style={styles.bodyText}>{requestBenefits.map((b) => b.title).join(", ")}</Text>
                  <Text style={styles.listSub}>Paid to {providers.join(", ")}</Text>
                </View>
                <Text style={styles.confidence}>{currency(request.total)}</Text>
              </View>
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>Redeemed — payment routed</Text>
              </View>
            </GlassPanel>
          );
        }) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <Check size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No redemptions yet</Text>
              <Text style={styles.listSub}>Employee redemptions will appear here after they select offers.</Text>
            </View>
          </View>
        )}
      </Section>

      <Section title="Employee budgets" meta={`${employees.length} employees`}>
        {employees.length ? employees.map((employee) => (
          <GlassPanel key={employee.id} style={styles.approvalCard} intensity={14}>
            <View style={styles.employeeBudgetHeader}>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{employee.name}</Text>
                <Text style={styles.listSub}>{employee.yearsEmployed ?? 0} years employed</Text>
              </View>
              <Text style={styles.confidence}>
                {currency((company.monthlyBudgetPerEmployee || 15000) + (employee.yearsEmployed ?? 0) * 500)}
              </Text>
            </View>
          </GlassPanel>
        )) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <UsersRound size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No employees yet</Text>
              <Text style={styles.listSub}>Employees linked to your company will appear here.</Text>
            </View>
          </View>
        )}
      </Section>

      <Section title="Analytics" meta="Trending">
        <GlassPanel style={styles.analyticsGrid} intensity={14}>
          <AnalyticsRow label="Employees" value={`${employees.length}`} />
          <AnalyticsRow label="Redemptions" value={`${recentRedemptions.length}`} />
          <AnalyticsRow label="Points balance" value={`${spendablePoints.toLocaleString(market.locale)}`} />
        </GlassPanel>
      </Section>

      <Section title="More controls" meta="Coming soon">
        {[
          ["Policy templates", "Create department-specific allowance rules."],
          ["Budget forecasting", "Preview cost changes before bulk updates."],
          ["Engagement nudges", "Auto-remind employees with unused budget."]
        ].map(([title, text]) => (
          <View key={title} style={styles.listRow}>
            <View style={styles.smallIcon}>
              <ShieldCheck size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>{title}</Text>
              <Text style={styles.listSub}>{text}</Text>
            </View>
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

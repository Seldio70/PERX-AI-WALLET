import { CircleDollarSign, Shield, ShieldCheck, Store, UserPlus, Users, WalletCards } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { AllocationSlider } from "../components/AllocationSlider";
import { AnalyticsRow } from "../components/AnalyticsRow";
import { AppIcon } from "../components/AppIcon";
import { BentoMetricCard } from "../components/BentoMetricCard";
import { GlassPanel } from "../components/GlassPanel";
import { MetricPill } from "../components/MetricPill";
import { Section } from "../components/Section";
import { currency, market } from "../lib/format";
import { PerxLiveData } from "../lib/perxRepository";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import { Benefit, SelectionRequest, User } from "../types";

type AppData = PerxLiveData;

export function EmployerExperience({
  user,
  appData,
  selectionRequests,
  onOpenProfile
}: {
  user: User;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onOpenProfile: () => void;
}) {
  const company =
    appData.companies.find((item) => item.employerId === user.id) ??
    appData.companies.find((item) => item.id === user.companyId) ?? {
      id: "",
      name: "No company connected",
      employerId: user.id,
      monthlyBudgetPerEmployee: 0
    };
  const employees = useMemo(
    () => appData.users.filter((item) => item.role === "employee" && item.companyId === company.id),
    [appData.users, company.id]
  );
  const [budgets, setBudgets] = useState<Record<string, number>>({});

  useEffect(() => {
    setBudgets((current) => {
      const next: Record<string, number> = {};
      for (const employee of employees) {
        next[employee.id] =
          current[employee.id] ??
          company.monthlyBudgetPerEmployee + (employee.yearsEmployed ?? 0) * 500;
      }
      return next;
    });
  }, [employees, company.monthlyBudgetPerEmployee]);

  const employerPoints = appData.employerWalletCards.reduce((sum, card) => sum + card.points, 0);
  const redemptionsCount = selectionRequests.length;

  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.greetingText}>Management</Text>
          <Text style={styles.greetingSub}>Fund points, watch redemptions, manage employee access.</Text>
        </View>
        <Pressable onPress={onOpenProfile} style={styles.searchPill}>
          <AppIcon name="magnify" size={18} color={colors.soft} />
        </Pressable>
      </View>

      <View style={styles.bentoRow}>
        <BentoMetricCard
          title="Employees"
          value={`${employees.length}`}
          trend="Active"
          accent={colors.secondary}
          Icon={Shield}
        />
        <BentoMetricCard
          title="Redemptions"
          value={`${redemptionsCount}`}
          trend="+live"
          accent={colors.primary}
          Icon={Users}
        />
      </View>

      <View style={styles.adminActionCard}>
        <View style={styles.adminActionIcon}>
          <UserPlus size={20} color={colors.onPrimary} />
        </View>
        <View style={styles.listText}>
          <Text style={styles.adminActionTitle}>Invite employee</Text>
          <Text style={styles.adminActionSub}>Provision new team access keys.</Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <MetricPill label="Employees" value={`${employees.length}`} />
        <MetricPill label="Points" value={`${employerPoints.toLocaleString(market.locale)}`} />
        <MetricPill label="Redemptions" value={`${redemptionsCount}`} />
      </View>

      <Section title="Points wallet" meta="Cards">
        {appData.employerWalletCards.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {appData.employerWalletCards.map((card) => (
            <GlassPanel key={card.id} style={styles.pointsCard} intensity={16}>
              <View style={[styles.pointsAccent, { backgroundColor: card.accent }]} />
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.pointsValue}>{card.points.toLocaleString(market.locale)}</Text>
              <Text style={styles.bodyText}>{card.description}</Text>
            </GlassPanel>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <WalletCards size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No wallet cards yet</Text>
              <Text style={styles.listSub}>Add wallet cards in Supabase to assign employer points.</Text>
            </View>
          </View>
        )}
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

      <Section title="Recent redemptions" meta="Live">
        {selectionRequests.length ? selectionRequests.map((request) => {
          const requestBenefits = request.benefitIds
            .map((benefitId) => appData.benefits.find((benefit) => benefit.id === benefitId))
            .filter(Boolean) as Benefit[];
          const providers = Array.from(new Set(requestBenefits.map((benefit) => benefit.providerName)));
          const pointsCharged =
            request.totalPoints || requestBenefits.reduce((sum, benefit) => sum + benefit.pointsPrice, 0);

          return (
            <GlassPanel key={request.id} style={styles.approvalCard} intensity={14}>
              <View style={styles.employeeBudgetHeader}>
                <View style={styles.listText}>
                  <Text style={styles.cardTitle}>{request.employeeName}</Text>
                  <Text style={styles.bodyText}>
                    {requestBenefits.map((benefit) => benefit.title).join(", ")}
                  </Text>
                  <Text style={styles.listSub}>
                    Routed to {providers.join(", ")}
                  </Text>
                </View>
                <Text style={styles.confidence}>{currency(request.total)}</Text>
              </View>
              <Text style={styles.listSub}>
                Points charged: {pointsCharged.toLocaleString(market.locale)}
              </Text>
              <View style={styles.packageFooter}>
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>Settled</Text>
                </View>
              </View>
            </GlassPanel>
          );
        }) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <CircleDollarSign size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No redemptions yet</Text>
              <Text style={styles.listSub}>Employee redemptions will land here automatically.</Text>
            </View>
          </View>
        )}
      </Section>

      <Section title="Recent records" meta={`${employees.length} team`}>
        {employees.map((employee) => (
          <GlassPanel key={employee.id} style={styles.recordRow} intensity={32}>
            <View style={styles.recordAvatar}>
              <AppIcon name="account-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>{employee.name}</Text>
              <Text style={styles.listSub}>
                Employee · {employee.yearsEmployed ?? 0} yrs · {currency(budgets[employee.id] ?? 0)}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Active</Text>
            </View>
          </GlassPanel>
        ))}
      </Section>

      <Section title="Employee budgets" meta="Adjust">
        {employees.map((employee) => (
          <GlassPanel key={`budget-${employee.id}`} style={styles.employeeBudgetCard} intensity={14}>
            <View style={styles.employeeBudgetHeader}>
              <View>
                <Text style={styles.listTitle}>{employee.name}</Text>
                <Text style={styles.listSub}>{employee.yearsEmployed} years employed</Text>
              </View>
              <Text style={styles.confidence}>{currency(budgets[employee.id] ?? 0)}</Text>
            </View>
            <AllocationSlider
              category="Health"
              value={budgets[employee.id] ?? 0}
              max={15000}
              onChange={(value) => setBudgets((current) => ({ ...current, [employee.id]: value }))}
            />
          </GlassPanel>
        ))}
      </Section>

      <Section title="Analytics" meta="Trending">
        <GlassPanel style={styles.analyticsGrid} intensity={14}>
          <AnalyticsRow label="Employees" value={`${employees.length}`} />
          <AnalyticsRow label="Redemptions" value={`${redemptionsCount}`} />
        </GlassPanel>
      </Section>

      <Section title="More controls" meta="Added">
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

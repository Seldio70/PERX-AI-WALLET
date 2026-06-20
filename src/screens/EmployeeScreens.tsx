import { CircleDollarSign, Plus, QrCode, Store, UsersRound, WalletCards } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { AllocationSlider } from "../components/AllocationSlider";
import { BottomNav, EmployeeTab } from "../components/BottomNav";
import { CapsuleButton } from "../components/CapsuleButton";
import { GlassPanel } from "../components/GlassPanel";
import { MetricPill } from "../components/MetricPill";
import { Section } from "../components/Section";
import { WalletCard } from "../components/WalletCard";
import { currency, market } from "../lib/format";
import { createSelectionRequest, PerxLiveData } from "../lib/perxRepository";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import { Benefit, BenefitCategory, SelectionRequest, User } from "../types";

type AppData = PerxLiveData;

const allocationCategories: BenefitCategory[] = ["Food", "Fitness", "Family", "Learning"];

const emptyAllocation: Record<BenefitCategory, number> = {
  Food: 0,
  Fitness: 0,
  Family: 0,
  Learning: 0,
  Health: 0,
  Mobility: 0,
  Wellness: 0
};

export function EmployeeExperience({
  user,
  appData,
  onSubmitSelection,
  onOpenProfile
}: {
  user: User;
  appData: AppData;
  onSubmitSelection: (request: SelectionRequest) => void;
  onOpenProfile: () => void;
}) {
  const [tab, setTab] = useState<EmployeeTab>("home");

  const company =
    appData.companies.find((item) => item.id === user.companyId) ??
    appData.companies[0] ?? {
      id: "",
      name: "No company connected",
      employerId: "",
      monthlyBudgetPerEmployee: 0
    };
  const monthlyBudget = company.monthlyBudgetPerEmployee + (user.yearsEmployed ?? 0) * 500;
  const spent = appData.selectionRequests
    .filter((request) => request.employeeId === user.id)
    .reduce((sum, request) => sum + request.total, 0);
  const balance = Math.max(0, monthlyBudget - spent);

  return (
    <View style={styles.roleShell}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, styles.employeeContent]}
        showsVerticalScrollIndicator={false}
      >
        {tab === "home" ? (
          <EmployeeHome
            user={user}
            companyName={company.name}
            monthlyBudget={monthlyBudget}
            balance={balance}
            appData={appData}
          />
        ) : null}
        {tab === "wallet" ? (
          <EmployeeWallet user={user} companyName={company.name} balance={balance} appData={appData} />
        ) : null}
        {tab === "allocate" ? <BudgetAllocation monthlyBudget={monthlyBudget} /> : null}
        {tab === "alerts" ? <EmployeeOffers user={user} appData={appData} onSubmitSelection={onSubmitSelection} /> : null}
      </ScrollView>
      <BottomNav active={tab} onChange={setTab} onProfilePress={onOpenProfile} />
    </View>
  );
}

function EmployeeHome({
  user,
  companyName,
  monthlyBudget,
  balance,
  appData
}: {
  user: User;
  companyName: string;
  monthlyBudget: number;
  balance: number;
  appData: AppData;
}) {
  return (
    <>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Hi, {user.name.split(" ")[0]}</Text>
        <Text style={styles.greetingSub}>Your monthly wallet is ready.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={332}>
        {appData.benefits.slice(0, 3).map((benefit) => (
          <WalletCard
            key={benefit.id}
            user={user}
            companyName={companyName}
            balance={balance}
            benefit={benefit}
          />
        ))}
      </ScrollView>

      <View style={styles.metricRow}>
        <MetricPill label="Available" value={currency(balance)} />
        <MetricPill label="Monthly" value={currency(monthlyBudget)} />
        <MetricPill label="Used" value={currency(monthlyBudget - balance)} />
      </View>

      <Section title="Spending" meta="June">
        <View style={styles.listRow}>
          <View style={styles.smallIcon}>
            <CircleDollarSign size={18} color={colors.text} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>No spending yet</Text>
            <Text style={styles.listSub}>Approved redemptions will appear after providers and offers are added.</Text>
          </View>
        </View>
      </Section>
    </>
  );
}

function EmployeeWallet({
  user,
  companyName,
  balance,
  appData
}: {
  user: User;
  companyName: string;
  balance: number;
  appData: AppData;
}) {
  const [activeBenefit, setActiveBenefit] = useState(appData.benefits[0]);
  const [nfcActive, setNfcActive] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(appData.benefits[0]?.id ?? null);
  const walletBenefits = appData.benefits;
  const currentBenefit = activeBenefit ?? walletBenefits[0];
  if (!currentBenefit) {
    return (
      <Section title="Wallet" meta="No offers">
        <View style={styles.listRow}>
          <View style={styles.smallIcon}>
            <WalletCards size={18} color={colors.text} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>No wallet benefits yet</Text>
            <Text style={styles.listSub}>Provider offers will appear here after you add them.</Text>
          </View>
        </View>
      </Section>
    );
  }
  const qrValue = `PERX:${user.id}:${currentBenefit.id}:${Date.now().toString().slice(-6)}`;

  return (
    <>
      <View style={styles.walletHero}>
        <Text style={styles.greetingText}>My Cards</Text>
        <Text style={styles.greetingSub}>Manage your digital perks and passes</Text>
      </View>

      <View style={styles.cardStack}>
        {walletBenefits.map((benefit, index) => {
          const expanded = expandedCardId === benefit.id;
          return (
            <Pressable
              key={benefit.id}
              onPress={() => {
                setActiveBenefit(benefit);
                setExpandedCardId(expanded ? null : benefit.id);
              }}
              style={[styles.stackItem, !expanded && index > 0 && styles.stackItemCollapsed]}
            >
              <WalletCard
                user={user}
                companyName={companyName}
                balance={balance}
                benefit={benefit}
                variant={index}
                compact
              />
            </Pressable>
          );
        })}
      </View>

      <GlassPanel style={styles.qrPanel}>
        <View style={styles.qrBox}>
          <QRCode value={qrValue} size={158} color={colors.text} backgroundColor={colors.surface} />
        </View>
        <View style={styles.qrText}>
          <Text style={styles.cardTitle}>{currentBenefit.title}</Text>
          <Text style={styles.bodyText}>{currentBenefit.description}</Text>
          <Text style={styles.listSub}>Session code {qrValue.slice(-6)}</Text>
        </View>
      </GlassPanel>

      <GlassPanel style={styles.nfcPanel}>
        <View style={styles.nfcCopy}>
          <Text style={styles.cardTitle}>NFC simulation</Text>
          <Text style={styles.bodyText}>
            {nfcActive ? "Hold near terminal. Awaiting provider confirmation." : "Tap to arm a wallet payment session."}
          </Text>
        </View>
        <CapsuleButton
          label={nfcActive ? "Armed" : "Tap NFC"}
          onPress={() => setNfcActive((value) => !value)}
          variant={nfcActive ? "soft" : "primary"}
        />
      </GlassPanel>
    </>
  );
}

function BudgetAllocation({ monthlyBudget }: { monthlyBudget: number }) {
  const [values, setValues] = useState<Record<BenefitCategory, number>>(emptyAllocation);
  const total = allocationCategories.reduce((sum, category) => sum + values[category], 0);
  const remaining = Math.max(0, monthlyBudget - total);

  const updateCategory = (category: BenefitCategory, nextValue: number) => {
    const otherTotal = allocationCategories.reduce(
      (sum, item) => sum + (item === category ? 0 : values[item]),
      0
    );
    const capped = Math.min(nextValue, Math.max(0, monthlyBudget - otherTotal));
    setValues((current) => ({ ...current, [category]: capped }));
  };

  return (
    <>
      <GlassPanel style={styles.allocationSummary}>
        <Text style={styles.cardTitle}>Monthly split</Text>
        <Text style={styles.largeNumber}>{currency(remaining)}</Text>
        <Text style={styles.bodyText}>left unallocated from {currency(monthlyBudget)}</Text>
      </GlassPanel>

      <Section title="Allocate" meta="Drag sliders">
        {allocationCategories.map((category) => (
          <AllocationSlider
            key={category}
            category={category}
            value={values[category]}
            max={monthlyBudget}
            onChange={(value) => updateCategory(category, value)}
          />
        ))}
      </Section>
    </>
  );
}

function EmployeeOffers({
  user,
  appData,
  onSubmitSelection
}: {
  user: User;
  appData: AppData;
  onSubmitSelection: (request: SelectionRequest) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedProviderNames, setSelectedProviderNames] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const marketplaceBenefits = appData.benefits;
  const marketplaceProviders = appData.providerProfiles;
  const visibleBenefits = selectedProviderNames.length
    ? marketplaceBenefits.filter((benefit) => selectedProviderNames.includes(benefit.providerName))
    : marketplaceBenefits;
  const selectedBenefits = marketplaceBenefits.filter((benefit) => selectedIds.includes(benefit.id));
  const selectedTotal = selectedBenefits.reduce((sum, benefit) => sum + benefit.price, 0);
  const selectedPoints = selectedBenefits.reduce((sum, benefit) => sum + benefit.pointsPrice, 0);
  const selectedByProvider = useMemo(
    () =>
      selectedBenefits.reduce<Record<string, Benefit[]>>((grouped, benefit) => {
        grouped[benefit.providerName] = [...(grouped[benefit.providerName] ?? []), benefit];
        return grouped;
      }, {}),
    [selectedBenefits]
  );
  const selectedProviderGroups = Object.entries(selectedByProvider);
  const company = appData.companies.find((item) => item.id === user.companyId);
  const connectedEmployerId =
    company?.employerId ||
    appData.users.find((candidate) => candidate.role === "employer" && candidate.companyId === user.companyId)?.id ||
    appData.users.find((candidate) => candidate.role === "employer")?.id;

  const toggleBenefit = (benefitId: string) => {
    setSubmitted(false);
    setSelectedIds((current) =>
      current.includes(benefitId)
        ? current.filter((id) => id !== benefitId)
        : [...current, benefitId]
    );
  };

  const toggleProvider = (providerName: string) => {
    setSubmitted(false);
    const providerBenefitIds = marketplaceBenefits
      .filter((benefit) => benefit.providerName === providerName)
      .map((benefit) => benefit.id);

    setSelectedProviderNames((current) => {
      const selected = current.includes(providerName);
      return selected ? current.filter((name) => name !== providerName) : [...current, providerName];
    });

    setSelectedIds((current) => {
      const selected = selectedProviderNames.includes(providerName);
      if (selected) {
        return current.filter((id) => !providerBenefitIds.includes(id));
      }

      return Array.from(new Set([...current, ...providerBenefitIds]));
    });
  };

  const submitSelection = () => {
    if (!selectedIds.length) return;

    const localRequest = {
      id: `request_${Date.now()}`,
      employeeId: user.id,
      employeeName: user.name,
      employerId: connectedEmployerId,
      benefitIds: selectedIds,
      total: selectedTotal,
      totalPoints: selectedPoints,
      status: "pending",
      createdAt: new Date().toISOString()
    } satisfies SelectionRequest;

    void createSelectionRequest({
      employeeId: user.id,
      employerId: connectedEmployerId,
      companyId: user.companyId,
      benefitIds: selectedIds,
      benefits: selectedBenefits
    });

    onSubmitSelection(localRequest);
    setSubmitted(true);
  };

  return (
    <>
      <GlassPanel style={styles.packagePanel}>
        <View style={styles.packageFooter}>
          <Text style={styles.confidence}>{currency(selectedTotal)}</Text>
          <CapsuleButton
            label={submitted ? "Redeemed" : "Redeem now"}
            onPress={submitSelection}
            variant={submitted ? "soft" : "primary"}
          />
        </View>
      </GlassPanel>

      <Section title="Selected package" meta={`${selectedBenefits.length} perks`}>
        <GlassPanel style={styles.packageSummaryPanel} intensity={12}>
          <View style={styles.packageSummaryHeader}>
            <View style={styles.listText}>
              <Text style={styles.cardTitle}>Ready to redeem</Text>
              <Text style={styles.bodyText}>
                Grouped by provider so payment routes correctly the moment you redeem.
              </Text>
            </View>
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>{selectedPoints} pts</Text>
            </View>
          </View>

          {selectedProviderGroups.length ? (
            selectedProviderGroups.map(([providerName, providerBenefits]) => (
              <View key={providerName} style={styles.listRow}>
                <View style={styles.smallIcon}>
                  <Store size={18} color={colors.text} />
                </View>
                <View style={styles.listText}>
                  <Text style={styles.listTitle}>{providerName}</Text>
                  <Text style={styles.listSub}>
                    {providerBenefits.map((benefit) => benefit.title).join(", ")}
                  </Text>
                </View>
                <Text style={styles.listAmount}>
                  {providerBenefits.reduce((sum, benefit) => sum + benefit.pointsPrice, 0)} pts
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.listRow}>
              <View style={styles.smallIcon}>
                <Plus size={18} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>No perks selected</Text>
                <Text style={styles.listSub}>Choose offers or tap a provider to include their full package.</Text>
              </View>
            </View>
          )}

          <View style={styles.packageSummaryTotals}>
            <Text style={styles.bodyText}>Cash equivalent</Text>
            <Text style={styles.confidence}>{currency(selectedTotal)}</Text>
          </View>
        </GlassPanel>
      </Section>

      <Section title="Marketplace" meta={market.city}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {marketplaceProviders.map((provider) => {
            const selected = selectedProviderNames.includes(provider.businessName);
            return (
              <Pressable key={provider.id} onPress={() => toggleProvider(provider.businessName)}>
                <GlassPanel style={[styles.providerCard, selected && styles.selectedOfferCard]} intensity={12}>
                  <Image source={{ uri: provider.logoUrl }} style={styles.providerLogo} />
                  <Text style={styles.listTitle}>{provider.businessName}</Text>
                  <Text style={styles.listSub}>{provider.category} - {provider.city}</Text>
                  <Text style={styles.selectedBadgeText}>{selected ? "Included" : "Tap to include"}</Text>
                </GlassPanel>
              </Pressable>
            );
          })}
        </ScrollView>

        {visibleBenefits.map((benefit) => {
          const selected = selectedIds.includes(benefit.id);
          return (
            <Pressable key={benefit.id} onPress={() => toggleBenefit(benefit.id)}>
              <GlassPanel
                style={[styles.offerCard, selected && styles.selectedOfferCard]}
                intensity={14}
              >
                <Image source={{ uri: benefit.imageUrl }} style={styles.offerImage} />
                <View style={styles.offerTop}>
                  <View style={styles.smallIcon}>
                    {benefit.redemptionType === "QR" ? (
                      <QrCode size={18} color={colors.text} />
                    ) : (
                      <WalletCards size={18} color={colors.text} />
                    )}
                  </View>
                  <View style={styles.listText}>
                    <Text style={styles.listTitle}>{benefit.title}</Text>
                    <Text style={styles.listSub}>
                      {benefit.providerName} - {benefit.discount} - {benefit.category}
                    </Text>
                  </View>
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>
                      {selected ? "Added" : `${benefit.pointsPrice} pts`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bodyText}>{benefit.description}</Text>
                <Text style={styles.listSub}>{currency(benefit.price)} cash equivalent</Text>
              </GlassPanel>
            </Pressable>
          );
        })}
      </Section>

      <Section title="How redemption works" meta="Live flow">
        <View style={styles.listRow}>
          <View style={styles.smallIcon}>
            <UsersRound size={18} color={colors.text} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>Instant routing to each provider</Text>
            <Text style={styles.listSub}>
              Tap redeem and the simulated payment is split across providers from your monthly budget. No employer approval step.
            </Text>
          </View>
        </View>
      </Section>
    </>
  );
}

import { Check, CircleDollarSign, Plus, QrCode, Store, UsersRound, WalletCards } from "lucide-react-native";
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
import { createSelectionRequest } from "../lib/perxRepository";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import { Benefit, BenefitCategory, SelectionRequest, User } from "../types";
import { allocationCategories, benefitCategoryOptions, currency, market } from "../utils/format";

type AppData = {
  companies: { id: string; name: string; employerId: string; monthlyBudgetPerEmployee: number }[];
  users: User[];
  providerProfiles: { id: string; userId: string; businessName: string; logoUrl: string; description: string; category: BenefitCategory; city: string; isApproved: boolean }[];
  benefits: Benefit[];
  selectionRequests: SelectionRequest[];
  [key: string]: unknown;
};

export function EmployeeExperience({
  user,
  appData,
  onSubmitSelection
}: {
  user: User;
  appData: AppData;
  onSubmitSelection: (request: SelectionRequest) => void;
}) {
  const [tab, setTab] = useState<EmployeeTab>("home");
  const [spent, setSpent] = useState(0);
  const [redeemedItems, setRedeemedItems] = useState<Benefit[]>([]);

  const company =
    appData.companies.find((item) => item.id === user.companyId) ??
    appData.companies[0] ?? {
      id: "",
      name: "No company connected",
      employerId: "",
      monthlyBudgetPerEmployee: 15000
    };
  const monthlyBudget = (company.monthlyBudgetPerEmployee || 15000) + (user.yearsEmployed ?? 0) * 500;
  const balance = monthlyBudget - spent;

  const handleRedeem = (request: SelectionRequest) => {
    const benefits = request.benefitIds
      .map((id) => appData.benefits.find((b) => b.id === id))
      .filter((b): b is Benefit => Boolean(b));
    setSpent((s) => s + request.total);
    setRedeemedItems((prev) => [...benefits, ...prev]);
    onSubmitSelection(request);
  };

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
            redeemedItems={redeemedItems}
          />
        ) : null}
        {tab === "wallet" ? (
          <EmployeeWallet user={user} companyName={company.name} balance={balance} appData={appData} />
        ) : null}
        {tab === "allocate" ? (
          <BudgetAllocation user={user} monthlyBudget={monthlyBudget} spent={spent} appData={appData} />
        ) : null}
        {tab === "alerts" ? (
          <EmployeeOffers user={user} appData={appData} onSubmitSelection={handleRedeem} />
        ) : null}
      </ScrollView>
      <BottomNav active={tab} onChange={setTab} />
    </View>
  );
}

function EmployeeHome({
  user,
  companyName,
  monthlyBudget,
  balance,
  appData,
  redeemedItems
}: {
  user: User;
  companyName: string;
  monthlyBudget: number;
  balance: number;
  appData: AppData;
  redeemedItems: Benefit[];
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

      <Section
        title="This month"
        meta={redeemedItems.length ? currency(redeemedItems.reduce((s, b) => s + b.price, 0)) : "No spending"}
      >
        {redeemedItems.length ? redeemedItems.map((benefit, i) => (
          <View key={`${benefit.id}-${i}`} style={styles.listRow}>
            <View style={styles.smallIcon}>
              <CircleDollarSign size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>{benefit.title}</Text>
              <Text style={styles.listSub}>{benefit.providerName} · {benefit.category}</Text>
            </View>
            <Text style={styles.listAmount}>{currency(benefit.price)}</Text>
          </View>
        )) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <CircleDollarSign size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No spending yet</Text>
              <Text style={styles.listSub}>Redeemed perks will appear here.</Text>
            </View>
          </View>
        )}
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
      <Section title="Wallet" meta="Swipe benefits">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={332}>
          {walletBenefits.map((benefit) => (
            <Pressable key={benefit.id} onPress={() => setActiveBenefit(benefit)}>
              <WalletCard user={user} companyName={companyName} balance={balance} benefit={benefit} />
            </Pressable>
          ))}
        </ScrollView>
      </Section>

      <GlassPanel style={styles.qrPanel}>
        <View style={styles.qrBox}>
          <QRCode value={qrValue} size={158} color={colors.background} backgroundColor={colors.text} />
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
            {nfcActive
              ? "Hold near terminal. Awaiting provider confirmation."
              : "Tap to arm a wallet payment session."}
          </Text>
        </View>
        <CapsuleButton
          label={nfcActive ? "Armed" : "Tap NFC"}
          onPress={() => setNfcActive((v) => !v)}
          variant={nfcActive ? "soft" : "primary"}
        />
      </GlassPanel>
    </>
  );
}

function BudgetAllocation({
  user,
  monthlyBudget,
  spent,
  appData
}: {
  user: User;
  monthlyBudget: number;
  spent: number;
  appData: AppData;
}) {
  const startingValues = useMemo(() => ({
    Food: 0, Fitness: 0, Family: 0, Learning: 0,
    Health: 0, Mobility: 0, Wellness: 0
  } as Record<BenefitCategory, number>), []);

  const [values, setValues] = useState(startingValues);
  const total = allocationCategories.reduce((sum, cat) => sum + values[cat], 0);
  const remaining = Math.max(0, monthlyBudget - spent - total);

  const updateCategory = (category: BenefitCategory, nextValue: number) => {
    const otherTotal = allocationCategories.reduce(
      (sum, item) => sum + (item === category ? 0 : values[item]), 0
    );
    const available = Math.max(0, monthlyBudget - spent - otherTotal);
    setValues((current) => ({ ...current, [category]: Math.min(nextValue, available) }));
  };

  return (
    <>
      <GlassPanel style={styles.allocationSummary}>
        <Text style={styles.cardTitle}>Monthly split</Text>
        <Text style={styles.largeNumber}>{currency(remaining)}</Text>
        <Text style={styles.bodyText}>
          left to allocate · {currency(spent)} already spent
        </Text>
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
  const [activeCategory, setActiveCategory] = useState<BenefitCategory | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const marketplaceBenefits = appData.benefits;
  const marketplaceProviders = appData.providerProfiles;
  const visibleBenefits = marketplaceBenefits
    .filter((b) => !selectedProviderNames.length || selectedProviderNames.includes(b.providerName))
    .filter((b) => !activeCategory || b.category === activeCategory);
  const selectedBenefits = marketplaceBenefits.filter((b) => selectedIds.includes(b.id));
  const selectedTotal = selectedBenefits.reduce((sum, b) => sum + b.price, 0);
  const selectedPoints = selectedBenefits.reduce((sum, b) => sum + b.pointsPrice, 0);
  const selectedByProvider = useMemo(
    () => selectedBenefits.reduce<Record<string, Benefit[]>>((grouped, b) => {
      grouped[b.providerName] = [...(grouped[b.providerName] ?? []), b];
      return grouped;
    }, {}),
    [selectedBenefits]
  );
  const selectedProviderGroups = Object.entries(selectedByProvider);
  const company = appData.companies.find((item) => item.id === user.companyId);
  const connectedEmployerId =
    company?.employerId ||
    appData.users.find((c) => c.role === "employer" && c.companyId === user.companyId)?.id ||
    appData.users.find((c) => c.role === "employer")?.id;

  const toggleBenefit = (benefitId: string) => {
    setSubmitted(false);
    setSelectedIds((current) =>
      current.includes(benefitId) ? current.filter((id) => id !== benefitId) : [...current, benefitId]
    );
  };

  const toggleProvider = (providerName: string) => {
    setSubmitted(false);
    const providerBenefitIds = marketplaceBenefits
      .filter((b) => b.providerName === providerName)
      .map((b) => b.id);
    setSelectedProviderNames((current) => {
      const selected = current.includes(providerName);
      return selected ? current.filter((n) => n !== providerName) : [...current, providerName];
    });
    setSelectedIds((current) => {
      const selected = selectedProviderNames.includes(providerName);
      if (selected) return current.filter((id) => !providerBenefitIds.includes(id));
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

  if (submitted) {
    return (
      <>
        <GlassPanel style={styles.successPanel}>
          <View style={styles.successIconWrap}>
            <Check size={30} color={colors.background} />
          </View>
          <Text style={styles.heroTitle}>Redeemed!</Text>
          <Text style={styles.bodyText}>
            Payment routed to{" "}
            {Object.keys(
              selectedBenefits.reduce<Record<string, boolean>>((acc, b) => ({ ...acc, [b.providerName]: true }), {})
            ).join(", ")}
            . Show your QR at the venue.
          </Text>
          {selectedBenefits.map((b) => (
            <View key={b.id} style={styles.listRow}>
              <View style={styles.smallIcon}>
                <Check size={16} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{b.title}</Text>
                <Text style={styles.listSub}>{b.providerName} · {currency(b.price)}</Text>
              </View>
            </View>
          ))}
          <CapsuleButton
            label="Browse more perks"
            onPress={() => {
              setSubmitted(false);
              setSelectedIds([]);
              setSelectedProviderNames([]);
              setActiveCategory(null);
            }}
            variant="soft"
          />
        </GlassPanel>
      </>
    );
  }

  return (
    <>
      <GlassPanel style={styles.packagePanel}>
        <View style={styles.packageFooter}>
          <Text style={styles.confidence}>{currency(selectedTotal)}</Text>
          <CapsuleButton
            label="Redeem package"
            onPress={submitSelection}
            variant="primary"
          />
        </View>
      </GlassPanel>

      <Section title="Selected package" meta={`${selectedBenefits.length} perks`}>
        <GlassPanel style={styles.packageSummaryPanel} intensity={12}>
          <View style={styles.packageSummaryHeader}>
            <View style={styles.listText}>
              <Text style={styles.cardTitle}>Your selected package</Text>
              <Text style={styles.bodyText}>
                Grouped by provider. Payment goes directly to each provider on redemption.
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
                  <Text style={styles.listSub}>{providerBenefits.map((b) => b.title).join(", ")}</Text>
                </View>
                <Text style={styles.listAmount}>
                  {providerBenefits.reduce((sum, b) => sum + b.pointsPrice, 0)} pts
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          {([null, ...benefitCategoryOptions] as (BenefitCategory | null)[]).map((cat) => (
            <Pressable key={cat ?? "all"} onPress={() => setActiveCategory(cat)}>
              <View style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive, { marginRight: 8 }]}>
                <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>
                  {cat ?? "All"}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

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
              <GlassPanel style={[styles.offerCard, selected && styles.selectedOfferCard]} intensity={14}>
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

      <Section title="How it works" meta="Live flow">
        <View style={styles.listRow}>
          <View style={styles.smallIcon}>
            <UsersRound size={18} color={colors.text} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>Redeem using employer budget</Text>
            <Text style={styles.listSub}>
              Payment is routed directly to each provider. The employee never receives cash.
            </Text>
          </View>
        </View>
      </Section>
    </>
  );
}

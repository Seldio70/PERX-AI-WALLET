import {
  Gift,
  Heart,
  MapPin,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Store,
  Tag,
  WalletCards,
  Zap
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { BottomNav, NavTab } from "../components/BottomNav";
import { BudgetHealthRing } from "../components/BudgetHealthRing";
import { CapsuleButton } from "../components/CapsuleButton";
import { EmployeePointChallenges } from "../components/EmployeePointChallenges";
import { GlassPanel } from "../components/GlassPanel";
import { Section } from "../components/Section";
import { UserProfileScreen } from "../components/UserProfileScreen";
import { WalletCard } from "../components/WalletCard";
import { WalletFocus } from "../components/WalletFocus";
import {
  AutopilotPlan,
  buildAutopilotPlan,
  computeWalletHealth,
  getTimeContext,
  pickNearby,
  rankBenefits,
  WalletHealth
} from "../lib/benefitAutopilot";
import { currency, market } from "../lib/format";
import { createSelectionRequest, PerxLiveData } from "../lib/perxRepository";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import { Benefit, BenefitCategory, Challenge, RewardEvent, SelectionRequest, User } from "../types";
import {
  BUDGET_PER_REDEEM,
  POINTS_REDEEM_RATE,
  rewardKindLabel
} from "../lib/rewardsDemo";

type AppData = PerxLiveData;

const categoryTint: Record<BenefitCategory, string> = {
  Food: colors.primary,
  Fitness: colors.secondary,
  Health: colors.primary,
  Family: colors.tertiary,
  Learning: colors.tertiary,
  Mobility: colors.primaryContainer,
  Wellness: colors.secondary
};

type EmployeeTab = "home" | "wallet" | "alerts" | "profile";

const employeeTabs: Array<NavTab<EmployeeTab>> = [
  { id: "home", label: "Home", icon: "home-outline", iconActive: "home" },
  { id: "wallet", label: "Wallet", icon: "wallet-outline", iconActive: "wallet" },
  { id: "alerts", label: "Offers", icon: "tag-outline", iconActive: "tag" },
  { id: "profile", label: "Profile", icon: "account-circle-outline", iconActive: "account-circle" }
];

export function EmployeeExperience({
  user,
  appData,
  onSubmitSelection,
  onLogout,
  pointsBalance = 0,
  rewardEvents = [],
  openChallenges = [],
  bonusBudget = 0,
  onRedeemPoints
}: {
  user: User;
  appData: AppData;
  onSubmitSelection: (request: SelectionRequest) => void;
  onLogout: () => void;
  pointsBalance?: number;
  rewardEvents?: RewardEvent[];
  openChallenges?: Challenge[];
  bonusBudget?: number;
  onRedeemPoints?: (points: number) => boolean;
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
  const monthlyBudget = company.monthlyBudgetPerEmployee + (user.yearsEmployed ?? 0) * 500 + bonusBudget;
  const health = useMemo(
    () =>
      computeWalletHealth({
        user,
        monthlyBudget,
        selectionRequests: appData.selectionRequests
      }),
    [user, monthlyBudget, appData.selectionRequests]
  );

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
            companyId={company.id}
            health={health}
            appData={appData}
            onSubmitSelection={onSubmitSelection}
            pointsBalance={pointsBalance}
            rewardEvents={rewardEvents}
            openChallenges={openChallenges}
            onRedeemPoints={onRedeemPoints}
          />
        ) : null}
        {tab === "wallet" ? (
          <EmployeeWallet
            user={user}
            companyName={company.name}
            balance={health.available}
            appData={appData}
            pointsBalance={pointsBalance}
            rewardEvents={rewardEvents}
            openChallenges={openChallenges}
            onRedeemPoints={onRedeemPoints}
          />
        ) : null}
        {tab === "alerts" ? <EmployeeOffers appData={appData} /> : null}
        {tab === "profile" ? <UserProfileScreen user={user} onLogout={onLogout} /> : null}
      </ScrollView>

      <BottomNav tabs={employeeTabs} active={tab} onChange={setTab} />
    </View>
  );
}

function resolveEmployerId(appData: AppData, user: User): string | undefined {
  const company = appData.companies.find((item) => item.id === user.companyId);
  return (
    company?.employerId ||
    appData.users.find((candidate) => candidate.role === "employer" && candidate.companyId === user.companyId)?.id ||
    appData.users.find((candidate) => candidate.role === "employer")?.id
  );
}

function EmployeePointsPanel({
  pointsBalance,
  rewardEvents,
  openChallenges,
  onRedeemPoints,
  compact = false
}: {
  pointsBalance: number;
  rewardEvents: RewardEvent[];
  openChallenges: Challenge[];
  onRedeemPoints?: (points: number) => boolean;
  compact?: boolean;
}) {
  const canRedeem = pointsBalance >= POINTS_REDEEM_RATE;

  const handleRedeem = () => {
    if (!canRedeem || !onRedeemPoints) return;
    const ok = onRedeemPoints(POINTS_REDEEM_RATE);
    if (ok) {
      Alert.alert(
        "Points redeemed",
        `${POINTS_REDEEM_RATE} PerX Points converted to ${currency(BUDGET_PER_REDEEM)} bonus budget.`
      );
    }
  };

  return (
    <Section title="PerX Points" meta={`${pointsBalance} pts`}>
      <GlassPanel style={compact ? styles.compactPointsCard : styles.pointsHero} intensity={32}>
        <View style={styles.redeemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pointsHeroValue}>{pointsBalance.toLocaleString()}</Text>
            <Text style={styles.pointsHeroSub}>
              Earn from challenges and recognition · {POINTS_REDEEM_RATE} pts = {currency(BUDGET_PER_REDEEM)} budget
            </Text>
          </View>
          <Gift size={compact ? 20 : 28} color={colors.primary} />
        </View>
        {onRedeemPoints ? (
          <CapsuleButton
            label={canRedeem ? `Redeem ${POINTS_REDEEM_RATE} pts` : "Need more points"}
            onPress={handleRedeem}
            variant={canRedeem ? "primary" : "soft"}
          />
        ) : null}
      </GlassPanel>

      {openChallenges.length ? (
        <>
          <Text style={styles.modalFieldLabel}>Open challenges</Text>
          {openChallenges.slice(0, compact ? 2 : 4).map((challenge) => (
            <GlassPanel key={challenge.id} style={styles.challengeCard} intensity={20}>
              <View style={styles.challengeMeta}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{challenge.title}</Text>
                  <Text style={styles.listSub} numberOfLines={2}>
                    {challenge.description}
                  </Text>
                </View>
                <Text style={styles.challengePoints}>+{challenge.rewardPoints}</Text>
              </View>
            </GlassPanel>
          ))}
        </>
      ) : null}

      {rewardEvents.length ? (
        <>
          <Text style={styles.modalFieldLabel}>Recent rewards</Text>
          {rewardEvents.slice(0, compact ? 3 : 5).map((event) => (
            <View key={event.id} style={styles.pointsFeedRow}>
              <View style={styles.pointsFeedIcon}>
                <Star size={16} color={colors.primary} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{rewardKindLabel(event.kind)}</Text>
                <Text style={styles.listSub} numberOfLines={1}>
                  {event.note}
                </Text>
              </View>
              <Text style={styles.challengePoints}>+{event.points}</Text>
            </View>
          ))}
        </>
      ) : null}
    </Section>
  );
}

function EmployeeHome({
  user,
  companyName,
  companyId,
  health,
  appData,
  onSubmitSelection,
  pointsBalance = 0,
  rewardEvents = [],
  openChallenges = [],
  onRedeemPoints
}: {
  user: User;
  companyName: string;
  companyId: string;
  health: WalletHealth;
  appData: AppData;
  onSubmitSelection: (request: SelectionRequest) => void;
  pointsBalance?: number;
  rewardEvents?: RewardEvent[];
  openChallenges?: Challenge[];
  onRedeemPoints?: (points: number) => boolean;
}) {
  const now = useMemo(() => new Date(), []);
  const benefits = appData.benefits;
  const ranked = useMemo(() => rankBenefits(user, benefits, now), [user, benefits, now]);
  const basePlan: AutopilotPlan = useMemo(
    () => buildAutopilotPlan({ user, benefits, health, now }),
    [user, benefits, health, now]
  );
  const nearby = useMemo(() => pickNearby(benefits, now, 3), [benefits, now]);
  const timeCtx = useMemo(() => getTimeContext(now), [now]);
  const monthLabel = now.toLocaleString(market.locale, { month: "long" });

  const primary = ranked[0];
  const [planItems, setPlanItems] = useState<Benefit[]>(basePlan.items);
  const [autopilotOpen, setAutopilotOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const planTotal = planItems.reduce((sum, benefit) => sum + benefit.price, 0);
  const planPoints = planItems.reduce((sum, benefit) => sum + benefit.pointsPrice, 0);

  const addToPackage = (benefit: Benefit) => {
    setSent(false);
    setAutopilotOpen(true);
    setPlanItems((current) =>
      current.some((item) => item.id === benefit.id) ? current : [...current, benefit].slice(0, 4)
    );
  };

  const swapItem = (index: number) => {
    setSent(false);
    setPlanItems((current) => {
      const ids = new Set(current.map((benefit) => benefit.id));
      const alternative = ranked.find((benefit) => !ids.has(benefit.id));
      if (!alternative) return current;
      const next = [...current];
      next[index] = alternative;
      return next;
    });
  };

  const sendToEmployer = () => {
    if (!planItems.length) return;
    const employerId = resolveEmployerId(appData, user);
    const request: SelectionRequest = {
      id: `request_${Date.now()}`,
      employeeId: user.id,
      employeeName: user.name,
      employerId,
      benefitIds: planItems.map((benefit) => benefit.id),
      total: planTotal,
      totalPoints: planPoints,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    void createSelectionRequest({
      employeeId: user.id,
      employerId,
      companyId: companyId || undefined,
      benefitIds: request.benefitIds,
      benefits: planItems
    });

    onSubmitSelection(request);
    setSent(true);
  };

  const useNow = (benefit: Benefit) => {
    Alert.alert("Ready to use", `Open Wallet, choose ${benefit.title}, and hold your phone to the reader to pay.`);
  };

  return (
    <>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Hi, {user.name.split(" ")[0]}</Text>
        <Text style={styles.greetingSub}>{companyName}</Text>
      </View>

      <GlassPanel style={styles.aiCard} intensity={40}>
        <View style={styles.aiHead}>
          <View style={styles.aiBadge}>
            <Sparkles size={14} color={colors.onPrimary} />
            <Text style={styles.aiBadgeText}>PerX AI</Text>
          </View>
          <Text style={styles.aiHeadTitle}>AI picked your best use this week</Text>
        </View>

        {primary ? (
          <>
            <View style={styles.aiPrimary}>
              <Image source={{ uri: primary.imageUrl }} style={styles.aiThumb} />
              <View style={styles.aiPrimaryInfo}>
                <Text style={styles.aiName} numberOfLines={1}>
                  {primary.title}
                </Text>
                <Text style={styles.aiProvider} numberOfLines={1}>
                  {primary.providerName} · {primary.discount}
                </Text>
                <Text style={styles.aiPrice}>{currency(primary.price)}</Text>
              </View>
            </View>
            <Text style={styles.aiReason}>
              Based on your remaining budget, past selections, and nearby offers.
            </Text>
            <View style={styles.aiCtas}>
              <CapsuleButton
                label="Add to package"
                onPress={() => addToPackage(primary)}
                variant="soft"
                style={{ flex: 1 }}
              />
              <CapsuleButton label="Use now" onPress={() => useNow(primary)} style={{ flex: 1 }} />
            </View>
          </>
        ) : (
          <Text style={styles.aiReason}>
            Once providers publish offers near you, your weekly pick will appear here.
          </Text>
        )}
      </GlassPanel>

      <EmployeePointChallenges />

      <Section title="Wallet health" meta={monthLabel}>
        <BudgetHealthRing health={health} />
      </Section>

      <EmployeePointsPanel
        pointsBalance={pointsBalance}
        rewardEvents={rewardEvents}
        openChallenges={openChallenges}
        onRedeemPoints={onRedeemPoints}
        compact
      />

      <Section title="Today nearby" meta={timeCtx.label}>
        {nearby.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {nearby.map(({ benefit, reason }) => (
              <Pressable key={benefit.id} onPress={() => addToPackage(benefit)}>
                <GlassPanel style={styles.nearbyCard} intensity={20}>
                  <Image source={{ uri: benefit.imageUrl }} style={styles.nearbyThumb} />
                  <Text style={styles.nearbyName} numberOfLines={1}>
                    {benefit.title}
                  </Text>
                  <View style={styles.nearbyMetaRow}>
                    <MapPin size={12} color={colors.muted} />
                    <Text style={styles.nearbyMeta} numberOfLines={1}>
                      {benefit.providerName} · {benefit.city}
                    </Text>
                  </View>
                  <Text style={styles.nearbyReason} numberOfLines={2}>
                    {reason}
                  </Text>
                </GlassPanel>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <Store size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No nearby offers yet</Text>
              <Text style={styles.listSub}>Local providers will show up here as they join.</Text>
            </View>
          </View>
        )}
      </Section>

      <Section title="PerX AI Autopilot" meta={`${monthLabel} plan`}>
        <GlassPanel style={styles.apCard} intensity={40}>
          <Pressable style={styles.apHead} onPress={() => setAutopilotOpen((value) => !value)}>
            <View style={styles.apIcon}>
              <Zap size={20} color={colors.onPrimary} />
            </View>
            <View style={styles.apHeadBody}>
              <Text style={styles.cardTitle}>Recommended package for {monthLabel}</Text>
              <Text style={styles.listSub}>
                {planItems.length} perk{planItems.length === 1 ? "" : "s"} · {currency(planTotal)} · tap to {autopilotOpen ? "hide" : "review"}
              </Text>
            </View>
            <View style={styles.apConfidence}>
              <Text style={styles.apConfidenceValue}>{basePlan.confidence}%</Text>
              <Text style={styles.apConfidenceLabel}>confidence</Text>
            </View>
          </Pressable>

          {autopilotOpen ? (
            <View style={styles.apDetail}>
              {planItems.length ? (
                planItems.map((benefit, index) => (
                  <View key={benefit.id} style={styles.apItem}>
                    <View style={styles.apItemIndex}>
                      <Text style={styles.apItemIndexText}>{index + 1}</Text>
                    </View>
                    <View style={styles.apItemBody}>
                      <Text style={styles.apItemName} numberOfLines={1}>
                        {benefit.title}
                      </Text>
                      <Text style={styles.apItemMeta} numberOfLines={1}>
                        {benefit.providerName} · {currency(benefit.price)}
                      </Text>
                    </View>
                    <Pressable style={styles.apSwap} onPress={() => swapItem(index)}>
                      <RefreshCw size={14} color={colors.primary} />
                      <Text style={styles.apSwapText}>Swap</Text>
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={styles.bodyText}>No offers available to plan yet.</Text>
              )}

              <View style={styles.apReasonBox}>
                <Text style={styles.apReasonLabel}>Why this plan</Text>
                <Text style={styles.apReasonText}>{basePlan.reasoning}</Text>
              </View>

              <View style={styles.apTotalRow}>
                <Text style={styles.bodyText}>Plan total</Text>
                <Text style={styles.confidence}>{currency(planTotal)}</Text>
              </View>

              <CapsuleButton
                label={sent ? "Sent to employer" : "Send to employer"}
                onPress={sendToEmployer}
                variant={sent ? "soft" : "primary"}
                icon={sent ? undefined : <Send size={16} color={colors.onPrimary} />}
              />
            </View>
          ) : null}
        </GlassPanel>
      </Section>
    </>
  );
}

function EmployeeWallet({
  user,
  companyName,
  balance,
  appData,
  pointsBalance = 0,
  rewardEvents = [],
  openChallenges = [],
  onRedeemPoints
}: {
  user: User;
  companyName: string;
  balance: number;
  appData: AppData;
  pointsBalance?: number;
  rewardEvents?: RewardEvent[];
  openChallenges?: Challenge[];
  onRedeemPoints?: (points: number) => boolean;
}) {
  const walletBenefits = appData.benefits;
  const [focusId, setFocusId] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [celebrateKey, setCelebrateKey] = useState(0);

  if (!walletBenefits.length) {
    return (
      <Section title="Wallet" meta="No offers">
        <View style={styles.listRow}>
          <View style={styles.smallIcon}>
            <WalletCards size={18} color={colors.text} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>No wallet benefits yet</Text>
            <Text style={styles.listSub}>Provider offers will appear here after they are added.</Text>
          </View>
        </View>
      </Section>
    );
  }

  const focusIndex = walletBenefits.findIndex((benefit) => benefit.id === focusId);
  const focused = focusIndex >= 0 ? walletBenefits[focusIndex] : null;

  return (
    <>
      <View style={styles.walletHero}>
        <Text style={styles.greetingText}>My Cards</Text>
        <Text style={styles.greetingSub}>Tap a card to bring it forward and pay.</Text>
      </View>

      <EmployeePointsPanel
        pointsBalance={pointsBalance}
        rewardEvents={rewardEvents}
        openChallenges={openChallenges}
        onRedeemPoints={onRedeemPoints}
      />

      <View style={styles.cardStack}>
        {walletBenefits.map((benefit, index) => (
          <Pressable
            key={benefit.id}
            onPress={() => {
              setFocusId(benefit.id);
              setAccepted(false);
            }}
            style={[styles.stackItem, index > 0 && styles.stackItemCollapsed]}
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
        ))}
      </View>

      <WalletFocus
        visible={!!focused}
        benefit={focused}
        user={user}
        companyName={companyName}
        balance={balance}
        variant={focusIndex < 0 ? 0 : focusIndex}
        accepted={accepted}
        celebrateKey={celebrateKey}
        onTap={() => {
          setAccepted(true);
          setCelebrateKey((value) => value + 1);
        }}
        onClose={() => {
          setFocusId(null);
          setAccepted(false);
        }}
      />
    </>
  );
}

type CategoryFilter = BenefitCategory | "All";

function EmployeeOffers({ appData }: { appData: AppData }) {
  const marketplaceBenefits = appData.benefits;
  const marketplaceProviders = appData.providerProfiles;
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [savedOnly, setSavedOnly] = useState(false);

  const categories = useMemo<CategoryFilter[]>(() => {
    const present = Array.from(new Set(marketplaceBenefits.map((benefit) => benefit.category)));
    return ["All", ...present];
  }, [marketplaceBenefits]);

  const visibleBenefits = marketplaceBenefits.filter((benefit) => {
    if (activeCategory !== "All" && benefit.category !== activeCategory) return false;
    if (savedOnly && !savedIds.includes(benefit.id)) return false;
    return true;
  });

  const logoFor = (providerName: string) =>
    marketplaceProviders.find((provider) => provider.businessName === providerName)?.logoUrl;

  const toggleSaved = (benefitId: string) => {
    setSavedIds((current) =>
      current.includes(benefitId) ? current.filter((id) => id !== benefitId) : [...current, benefitId]
    );
  };

  return (
    <>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Discover</Text>
        <Text style={styles.greetingSub}>Fresh perks from local spots in {market.city}.</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {categories.map((category) => {
          const active = activeCategory === category;
          return (
            <Pressable
              key={category}
              onPress={() => setActiveCategory(category)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{category}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setSavedOnly((value) => !value)}
          style={[styles.filterChip, styles.filterSavedChip, savedOnly && styles.filterChipActive]}
        >
          <Heart
            size={13}
            color={savedOnly ? colors.onPrimary : colors.primary}
            fill={savedOnly ? colors.onPrimary : "transparent"}
          />
          <Text style={[styles.filterChipText, savedOnly && styles.filterChipTextActive]}>
            Saved {savedIds.length ? `(${savedIds.length})` : ""}
          </Text>
        </Pressable>
      </ScrollView>

      {visibleBenefits.length ? (
        visibleBenefits.map((benefit) => {
          const saved = savedIds.includes(benefit.id);
          const tint = categoryTint[benefit.category] ?? colors.primary;
          const logo = logoFor(benefit.providerName);
          return (
            <View key={benefit.id} style={styles.offerV2}>
              <View style={styles.offerV2Hero}>
                <Image source={{ uri: benefit.imageUrl }} style={styles.offerV2Img} />
                <LinearGradient
                  colors={["transparent", "rgba(12,14,22,0.62)"]}
                  style={styles.offerV2Grad}
                />
                <View style={[styles.offerV2Cat, { backgroundColor: tint }]}>
                  <Text style={styles.offerV2CatText}>{benefit.category}</Text>
                </View>
                <View style={styles.offerV2Discount}>
                  <Tag size={12} color={colors.onPrimary} />
                  <Text style={styles.offerV2DiscountText}>{benefit.discount}</Text>
                </View>
                <Pressable
                  onPress={() => toggleSaved(benefit.id)}
                  hitSlop={8}
                  style={[styles.offerV2Save, saved && styles.offerV2SaveActive]}
                >
                  <Heart
                    size={18}
                    color={saved ? colors.onPrimary : colors.text}
                    fill={saved ? colors.onPrimary : "transparent"}
                  />
                </Pressable>
                <Text style={styles.offerV2HeroTitle} numberOfLines={1}>
                  {benefit.title}
                </Text>
              </View>

              <View style={styles.offerV2Body}>
                <View style={styles.offerV2ProviderRow}>
                  {logo ? (
                    <Image source={{ uri: logo }} style={styles.offerV2Logo} />
                  ) : (
                    <View style={[styles.offerV2Logo, styles.offerV2LogoFallback]}>
                      <Store size={14} color={colors.primary} />
                    </View>
                  )}
                  <Text style={styles.offerV2Provider} numberOfLines={1}>
                    {benefit.providerName}
                  </Text>
                  <View style={styles.offerV2LocPill}>
                    <MapPin size={11} color={colors.muted} />
                    <Text style={styles.offerV2Loc}>{benefit.city}</Text>
                  </View>
                </View>

                <Text style={styles.offerV2Desc} numberOfLines={2}>
                  {benefit.description}
                </Text>

                <View style={styles.offerV2Footer}>
                  <View style={styles.offerV2PriceChip}>
                    <Text style={styles.offerV2Price}>{currency(benefit.price)}</Text>
                    <Text style={styles.offerV2PriceLabel}>value</Text>
                  </View>
                  <Text style={styles.offerV2Ends}>ends {benefit.validUntil}</Text>
                </View>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.listRow}>
          <View style={styles.smallIcon}>
            <Store size={18} color={colors.text} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>No offers to show</Text>
            <Text style={styles.listSub}>
              {savedOnly ? "You have not saved any offers in this category yet." : "Check back soon as local providers join."}
            </Text>
          </View>
        </View>
      )}
    </>
  );
}

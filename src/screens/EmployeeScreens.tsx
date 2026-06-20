import {
  ChevronRight,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Star,
  Store,
  Tag,
  Trophy,
  WalletCards,
  X
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { BottomNav, NavTab } from "../components/BottomNav";
import { CapsuleButton } from "../components/CapsuleButton";
import { EmployeePointChallenges } from "../components/EmployeePointChallenges";
import { GlassPanel } from "../components/GlassPanel";
import { PointsHealthRing } from "../components/PointsHealthRing";
import { Section } from "../components/Section";
import { UserProfileScreen } from "../components/UserProfileScreen";
import { WalletCard } from "../components/WalletCard";
import { WalletFocus } from "../components/WalletFocus";
import {
  getTimeContext,
  pickNearby,
  rankBenefits
} from "../lib/benefitAutopilot";
import { market } from "../lib/format";
import {
  canAffordPerk,
  computePointsHealth,
  perkPointsCost,
  redeemedWalletBenefits
} from "../lib/perkPayment";
import { PerxLiveData } from "../lib/perxRepository";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import { Benefit, BenefitCategory, Challenge, RewardEvent, SelectionRequest, User } from "../types";
import {
  formatDateLabel,
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

type EmployeeTab = "home" | "wallet" | "challenges" | "alerts" | "profile";

const employeeTabs: Array<NavTab<EmployeeTab>> = [
  { id: "home", label: "Home", icon: "home-outline", iconActive: "home" },
  { id: "wallet", label: "Wallet", icon: "wallet-outline", iconActive: "wallet" },
  { id: "challenges", label: "Challenges", icon: "trophy-outline", iconActive: "trophy" },
  { id: "alerts", label: "Offers", icon: "tag-outline", iconActive: "tag" },
  { id: "profile", label: "Profile", icon: "account-circle-outline", iconActive: "account-circle" }
];

function challengesForEmployee(challenges: Challenge[], userId: string) {
  return challenges.filter(
    (challenge) =>
      challenge.target === "everyone" ||
      challenge.target === userId ||
      challenge.employeeId === userId
  );
}

export function EmployeeExperience({
  user,
  appData,
  onSubmitSelection,
  onLogout,
  pointsBalance = 0,
  rewardEvents = [],
  openChallenges = [],
  onPayForPerk,
  onPayForPerks
}: {
  user: User;
  appData: AppData;
  onSubmitSelection: (request: SelectionRequest) => void;
  onLogout: () => void;
  pointsBalance?: number;
  rewardEvents?: RewardEvent[];
  openChallenges?: Challenge[];
  onPayForPerk?: (benefit: Benefit) => boolean;
  onPayForPerks?: (benefits: Benefit[]) => boolean;
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
  const pointsHealth = useMemo(
    () =>
      computePointsHealth({
        user,
        pointsBalance,
        selectionRequests: appData.selectionRequests
      }),
    [user, pointsBalance, appData.selectionRequests]
  );
  const employeeChallenges = useMemo(
    () => challengesForEmployee(appData.challenges, user.id),
    [appData.challenges, user.id]
  );
  const now = useMemo(() => new Date(), []);

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
            pointsHealth={pointsHealth}
            appData={appData}
            onSubmitSelection={onSubmitSelection}
            pointsBalance={pointsBalance}
            rewardEvents={rewardEvents}
            openChallenges={openChallenges}
            onPayForPerk={onPayForPerk}
            onPayForPerks={onPayForPerks}
          />
        ) : null}
        {tab === "wallet" ? (
          <EmployeeWallet
            user={user}
            companyName={company.name}
            appData={appData}
          />
        ) : null}
        {tab === "challenges" ? (
          <EmployeeChallenges
            openChallenges={openChallenges}
            allChallenges={employeeChallenges}
            pointsBalance={pointsBalance}
            rewardEvents={rewardEvents}
          />
        ) : null}
        {tab === "alerts" ? (
          <EmployeeOffers
            user={user}
            companyName={company.name}
            appData={appData}
            pointsBalance={pointsBalance}
            onPayForPerk={onPayForPerk}
          />
        ) : null}
        {tab === "profile" ? <UserProfileScreen user={user} onLogout={onLogout} /> : null}
      </ScrollView>

      <BottomNav tabs={employeeTabs} active={tab} onChange={setTab} />
    </View>
  );
}

function EmployeeChallenges({
  openChallenges,
  allChallenges,
  pointsBalance,
  rewardEvents
}: {
  openChallenges: Challenge[];
  allChallenges: Challenge[];
  pointsBalance: number;
  rewardEvents: RewardEvent[];
}) {
  const completedChallenges = allChallenges.filter((challenge) => challenge.status === "completed");
  const availablePoints = openChallenges.reduce((sum, challenge) => sum + challenge.rewardPoints, 0);

  return (
    <>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Challenges</Text>
        <Text style={styles.greetingSub}>
          {openChallenges.length
            ? `${openChallenges.length} active from your employer · ${availablePoints.toLocaleString()} pts to earn`
            : "New employer challenges will show up here as soon as they go live."}
        </Text>
      </View>

      <GlassPanel style={styles.pointsHero} intensity={32}>
        <View style={styles.redeemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pointsHeroValue}>{pointsBalance.toLocaleString()}</Text>
            <Text style={styles.pointsHeroSub}>
              Complete challenges to earn more PerX Points.
            </Text>
          </View>
          <Trophy size={28} color={colors.primary} />
        </View>
      </GlassPanel>

      <Section title="Active challenges" meta={`${openChallenges.length}`}>
        {openChallenges.length ? (
          openChallenges.map((challenge) => (
            <GlassPanel key={challenge.id} style={styles.challengeCard} intensity={24}>
              <View style={styles.challengeMeta}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{challenge.title}</Text>
                  <Text style={styles.listSub}>{challenge.description}</Text>
                  <Text style={styles.listSub}>
                    {challenge.target === "everyone" ? "Everyone at your company" : "Assigned to you"}
                    {challenge.dueDate ? ` · due ${formatDateLabel(challenge.dueDate)}` : ""}
                  </Text>
                </View>
                <Text style={styles.challengePoints}>+{challenge.rewardPoints}</Text>
              </View>
            </GlassPanel>
          ))
        ) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}>
              <Trophy size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No active challenges</Text>
              <Text style={styles.listSub}>
                When your employer launches a challenge, it will appear here right away.
              </Text>
            </View>
          </View>
        )}
      </Section>

      {completedChallenges.length ? (
        <Section title="Completed" meta={`${completedChallenges.length}`}>
          {completedChallenges.map((challenge) => (
            <GlassPanel key={challenge.id} style={styles.challengeCard} intensity={18}>
              <View style={styles.challengeMeta}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{challenge.title}</Text>
                  <Text style={styles.listSub}>{challenge.description}</Text>
                </View>
                <Text style={[styles.challengePoints, { color: colors.secondary }]}>
                  +{challenge.rewardPoints}
                </Text>
              </View>
            </GlassPanel>
          ))}
        </Section>
      ) : null}

      <EmployeePointChallenges />

      {rewardEvents.length ? (
        <Section title="Recent rewards" meta={`${rewardEvents.length}`}>
          {rewardEvents.slice(0, 6).map((event) => (
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
        </Section>
      ) : null}
    </>
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

function EmployeeHome({
  user,
  companyName,
  companyId,
  pointsHealth,
  appData,
  onSubmitSelection,
  pointsBalance = 0,
  rewardEvents = [],
  openChallenges = [],
  onPayForPerk,
  onPayForPerks
}: {
  user: User;
  companyName: string;
  companyId: string;
  pointsHealth: ReturnType<typeof computePointsHealth>;
  appData: AppData;
  onSubmitSelection: (request: SelectionRequest) => void;
  pointsBalance?: number;
  rewardEvents?: RewardEvent[];
  openChallenges?: Challenge[];
  onPayForPerk?: (benefit: Benefit) => boolean;
  onPayForPerks?: (benefits: Benefit[]) => boolean;
}) {
  const now = useMemo(() => new Date(), []);
  const benefits = appData.benefits;
  const ranked = useMemo(() => rankBenefits(user, benefits, now), [user, benefits, now]);
  const nearby = useMemo(() => pickNearby(benefits, now, 3), [benefits, now]);
  const timeCtx = useMemo(() => getTimeContext(now), [now]);
  const monthLabel = now.toLocaleString(market.locale, { month: "long" });

  const primary = ranked[0];
  const [aiOfferDetail, setAiOfferDetail] = useState<Benefit | null>(null);

  const useNow = (benefit: Benefit) => {
    if (!canAffordPerk(pointsBalance, benefit)) {
      Alert.alert("Not enough points", `You need ${perkPointsCost(benefit)} pts for this perk.`);
      return;
    }
    if (onPayForPerk?.(benefit)) {
      Alert.alert("Perk ready", `${benefit.title} is paid. Open My Cards to use it at the provider.`);
    }
  };

  const logoFor = (providerName: string) =>
    appData.providerProfiles.find((provider) => provider.businessName === providerName)?.logoUrl;

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
            <Pressable onPress={() => setAiOfferDetail(primary)} style={styles.aiPrimary}>
              <Image source={{ uri: primary.imageUrl }} style={styles.aiThumb} />
              <View style={styles.aiPrimaryInfo}>
                <Text style={styles.aiName} numberOfLines={1}>
                  {primary.title}
                </Text>
                <Text style={styles.aiProvider} numberOfLines={1}>
                  {primary.providerName} · {primary.discount}
                </Text>
                <Text style={styles.aiPrice}>{perkPointsCost(primary)} pts</Text>
                <Text style={styles.aiTapHint}>Tap for full details</Text>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </Pressable>
            <Text style={styles.aiReason}>
              Based on your points balance, past selections, and nearby offers.
            </Text>
            <View style={styles.aiCtas}>
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

      <Section title="Points health" meta={monthLabel}>
        <PointsHealthRing health={pointsHealth} />
      </Section>

      <Section title="Today nearby" meta={timeCtx.label}>
        {nearby.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {nearby.map(({ benefit, reason }) => (
              <View key={benefit.id}>
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
              </View>
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

      <OfferDetailModal
        visible={!!aiOfferDetail}
        benefit={aiOfferDetail}
        pointsBalance={pointsBalance}
        logoUrl={aiOfferDetail ? logoFor(aiOfferDetail.providerName) : undefined}
        onClose={() => setAiOfferDetail(null)}
        onRedeem={(benefit) => {
          useNow(benefit);
          setAiOfferDetail(null);
        }}
        primaryLabel={
          aiOfferDetail && canAffordPerk(pointsBalance, aiOfferDetail)
            ? `Use now · ${perkPointsCost(aiOfferDetail)} pts`
            : undefined
        }
      />
    </>
  );
}

function EmployeeWallet({
  user,
  companyName,
  appData
}: {
  user: User;
  companyName: string;
  appData: AppData;
}) {
  const redeemedBenefits = useMemo(
    () => redeemedWalletBenefits(user.id, appData.selectionRequests, appData.benefits),
    [user.id, appData.selectionRequests, appData.benefits]
  );
  const [focusId, setFocusId] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [celebrateKey, setCelebrateKey] = useState(0);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());

  const focusIndex = redeemedBenefits.findIndex((benefit) => benefit.id === focusId);
  const focused = focusIndex >= 0 ? redeemedBenefits[focusIndex] : null;
  const focusedUsed = focused ? usedIds.has(focused.id) : false;

  return (
    <>
      <View style={styles.walletHero}>
        <Text style={styles.greetingText}>My Cards</Text>
        <Text style={styles.greetingSub}>
          {redeemedBenefits.length
            ? `${redeemedBenefits.length} perk${redeemedBenefits.length === 1 ? "" : "s"} ready · tap a card to use at the provider.`
            : "Perks you redeem from Offers will appear here."}
        </Text>
      </View>

      {redeemedBenefits.length ? (
        <View style={styles.cardStack}>
          {redeemedBenefits.map((benefit, index) => (
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
                benefit={benefit}
                pointsBalance={perkPointsCost(benefit)}
                redeemed
                used={usedIds.has(benefit.id)}
                variant={index}
                compact
              />
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.listRow}>
          <View style={styles.smallIcon}>
            <WalletCards size={18} color={colors.text} />
          </View>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>No cards yet</Text>
            <Text style={styles.listSub}>Redeem perks from Offers and they will appear here.</Text>
          </View>
        </View>
      )}

      <WalletFocus
        visible={!!focused}
        benefit={focused}
        user={user}
        companyName={companyName}
        pointsBalance={focused ? perkPointsCost(focused) : 0}
        variant={focusIndex < 0 ? 0 : focusIndex}
        accepted={accepted}
        celebrateKey={celebrateKey}
        redeemed
        used={focusedUsed}
        onTap={() => {
          if (focused) {
            setUsedIds((current) => new Set([...current, focused.id]));
          }
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

function EmployeeOffers({
  user,
  companyName,
  appData,
  pointsBalance = 0,
  onPayForPerk
}: {
  user: User;
  companyName: string;
  appData: AppData;
  pointsBalance?: number;
  onPayForPerk?: (benefit: Benefit) => boolean;
}) {
  const marketplaceBenefits = appData.benefits;
  const marketplaceProviders = appData.providerProfiles;
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [savedOnly, setSavedOnly] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Benefit | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo<CategoryFilter[]>(() => {
    const present = Array.from(new Set(marketplaceBenefits.map((benefit) => benefit.category)));
    return ["All", ...present];
  }, [marketplaceBenefits]);

  const visibleBenefits = marketplaceBenefits.filter((benefit) => {
    if (activeCategory !== "All" && benefit.category !== activeCategory) return false;
    if (savedOnly && !savedIds.includes(benefit.id)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const haystack = `${benefit.title} ${benefit.providerName} ${benefit.category} ${benefit.city}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const logoFor = (providerName: string) =>
    marketplaceProviders.find((provider) => provider.businessName === providerName)?.logoUrl;

  const toggleSaved = (benefitId: string) => {
    setSavedIds((current) =>
      current.includes(benefitId) ? current.filter((id) => id !== benefitId) : [...current, benefitId]
    );
  };

  const handleRedeem = (benefit: Benefit) => {
    if (!canAffordPerk(pointsBalance, benefit)) {
      Alert.alert(
        "Not enough points",
        `You need ${perkPointsCost(benefit)} pts. Your balance is ${pointsBalance}.`
      );
      return;
    }
    if (onPayForPerk?.(benefit)) {
      setSelectedOffer(null);
      Alert.alert("Redeemed", `${benefit.title} is in My Cards. Use it at ${benefit.providerName}.`);
    }
  };

  return (
    <>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Marketplace</Text>
        <Text style={styles.greetingSub}>Browse perks from local partners.</Text>
      </View>

      <View style={styles.inputWrap}>
        <Search size={18} color={colors.muted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search perks, providers, cities…"
          placeholderTextColor={colors.muted}
          style={styles.inputField}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
            <X size={16} color={colors.muted} />
          </Pressable>
        ) : null}
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
        <View style={styles.marketGrid}>
        {visibleBenefits.map((benefit) => {
          const saved = savedIds.includes(benefit.id);
          const tint = categoryTint[benefit.category] ?? colors.primary;
          const logo = logoFor(benefit.providerName);
          const cost = perkPointsCost(benefit);
          return (
            <Pressable
              key={benefit.id}
              onPress={() => setSelectedOffer(benefit)}
              style={styles.marketCard}
            >
              <Image source={{ uri: benefit.imageUrl }} style={styles.marketCardImg} />
              <View style={styles.marketCardBody}>
                <View style={styles.marketCardTop}>
                  <View style={[styles.marketCatDot, { backgroundColor: tint }]} />
                  <Text style={styles.marketCardCat}>{benefit.category}</Text>
                  <Pressable
                    onPress={(event) => {
                      event.stopPropagation?.();
                      toggleSaved(benefit.id);
                    }}
                    hitSlop={8}
                    style={styles.marketSaveBtn}
                  >
                    <Heart
                      size={14}
                      color={saved ? colors.onPrimary : colors.muted}
                      fill={saved ? colors.onPrimary : "transparent"}
                    />
                  </Pressable>
                </View>
                <Text style={styles.marketCardTitle} numberOfLines={2}>
                  {benefit.title}
                </Text>
                <View style={styles.marketCardProvider}>
                  {logo ? (
                    <Image source={{ uri: logo }} style={styles.marketCardLogo} />
                  ) : (
                    <Store size={12} color={colors.primary} />
                  )}
                  <Text style={styles.marketCardProviderName} numberOfLines={1}>
                    {benefit.providerName}
                  </Text>
                </View>
                <View style={styles.marketCardFooter}>
                  <Text style={styles.marketCardPrice}>{cost} pts</Text>
                  <View style={styles.marketDiscountPill}>
                    <Tag size={10} color={colors.primary} />
                    <Text style={styles.marketDiscountText}>{benefit.discount}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
        </View>
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

      <OfferDetailModal
        visible={!!selectedOffer}
        benefit={selectedOffer}
        pointsBalance={pointsBalance}
        logoUrl={selectedOffer ? logoFor(selectedOffer.providerName) : undefined}
        onClose={() => setSelectedOffer(null)}
        onRedeem={handleRedeem}
      />
    </>
  );
}

function OfferDetailModal({
  visible,
  benefit,
  pointsBalance,
  logoUrl,
  onClose,
  onRedeem,
  primaryLabel,
  secondaryLabel,
  onSecondary
}: {
  visible: boolean;
  benefit: Benefit | null;
  pointsBalance: number;
  logoUrl?: string;
  onClose: () => void;
  onRedeem: (benefit: Benefit) => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  onSecondary?: (benefit: Benefit) => void;
}) {
  if (!benefit) return null;
  const cost = perkPointsCost(benefit);
  const affordable = canAffordPerk(pointsBalance, benefit);
  const tint = categoryTint[benefit.category] ?? colors.primary;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{benefit.title}</Text>
              <Text style={styles.modalSub}>{benefit.providerName} · {benefit.city}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Image source={{ uri: benefit.imageUrl }} style={styles.detailHeroImage} />
            <View style={[styles.offerV2Cat, { backgroundColor: tint, alignSelf: "flex-start" }]}>
              <Text style={styles.offerV2CatText}>{benefit.category}</Text>
            </View>
            <View style={styles.offerV2ProviderRow}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.offerV2Logo} />
              ) : (
                <View style={[styles.offerV2Logo, styles.offerV2LogoFallback]}>
                  <Store size={14} color={colors.primary} />
                </View>
              )}
              <Text style={styles.offerV2Provider}>{benefit.providerName}</Text>
            </View>
            <Text style={styles.bodyText}>{benefit.description}</Text>
            <View style={styles.offerV2Discount}>
              <Tag size={12} color={colors.onPrimary} />
              <Text style={styles.offerV2DiscountText}>{benefit.discount}</Text>
            </View>
            <Text style={styles.listSub}>Valid until {benefit.validUntil}</Text>
            <Text style={styles.listSub}>
              Redeem with {cost} pts · your balance {pointsBalance.toLocaleString()} pts
            </Text>
            <View style={styles.offerModalActions}>
              <CapsuleButton
                label={
                  primaryLabel ??
                  (affordable ? `Redeem for ${cost} pts` : `Need ${cost - pointsBalance} more pts`)
                }
                onPress={() => onRedeem(benefit)}
                variant={affordable ? "primary" : "soft"}
                style={secondaryLabel ? { flex: 1 } : undefined}
              />
              {secondaryLabel && onSecondary ? (
                <CapsuleButton
                  label={secondaryLabel}
                  onPress={() => onSecondary(benefit)}
                  variant="soft"
                  style={{ flex: 1 }}
                />
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

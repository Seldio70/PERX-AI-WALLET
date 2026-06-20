import {
  ChevronRight,
  Gift,
  Heart,
  MapPin,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Store,
  Tag,
  Trophy,
  WalletCards,
  X,
  Zap
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
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
  AutopilotPlan,
  buildAutopilotPlan,
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

function EmployeePointsPanel({
  pointsBalance,
  rewardEvents,
  openChallenges,
  compact = false
}: {
  pointsBalance: number;
  rewardEvents: RewardEvent[];
  openChallenges: Challenge[];
  compact?: boolean;
}) {
  return (
    <Section title="PerX Points" meta={`${pointsBalance} pts`}>
      <GlassPanel style={compact ? styles.compactPointsCard : styles.pointsHero} intensity={32}>
        <View style={styles.redeemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pointsHeroValue}>{pointsBalance.toLocaleString()}</Text>
            <Text style={styles.pointsHeroSub}>
              Spend points on perks in My Cards · employer pays providers in cash
            </Text>
          </View>
          <Gift size={compact ? 20 : 28} color={colors.primary} />
        </View>
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
  const basePlan: AutopilotPlan = useMemo(
    () =>
      buildAutopilotPlan({
        user,
        benefits,
        health: {
          monthlyBudget: pointsBalance,
          available: pointsBalance,
          used: pointsHealth.spentThisMonth,
          reserved: 0,
          daysLeft: pointsHealth.daysLeft,
          cycleDays: pointsHealth.cycleDays,
          usedPct: 0,
          reservedPct: 0,
          availablePct: 1
        },
        now
      }),
    [user, benefits, pointsBalance, pointsHealth, now]
  );
  const nearby = useMemo(() => pickNearby(benefits, now, 3), [benefits, now]);
  const timeCtx = useMemo(() => getTimeContext(now), [now]);
  const monthLabel = now.toLocaleString(market.locale, { month: "long" });

  const primary = ranked[0];
  const [planItems, setPlanItems] = useState<Benefit[]>(basePlan.items);
  const [autopilotOpen, setAutopilotOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [aiOfferDetail, setAiOfferDetail] = useState<Benefit | null>(null);

  const planTotal = planItems.reduce((sum, benefit) => sum + perkPointsCost(benefit), 0);

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
    if (planTotal > pointsBalance) {
      Alert.alert("Not enough points", `This package needs ${planTotal} pts. You have ${pointsBalance}.`);
      return;
    }
    if (!onPayForPerks?.(planItems)) {
      Alert.alert("Payment failed", "Could not complete this package. Try again.");
      return;
    }
    setSent(true);
    Alert.alert("Perks paid", `${planTotal} points spent across ${planItems.length} perk(s).`);
  };

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

      {planItems.length ? (
        <Pressable style={styles.packageCapsule} onPress={() => setAutopilotOpen(true)}>
          <View style={styles.packageCapsuleThumbs}>
            {planItems.slice(0, 3).map((benefit, index) => (
              <Image
                key={benefit.id}
                source={{ uri: benefit.imageUrl }}
                style={[styles.packageCapsuleThumb, index > 0 && { marginLeft: -10 }]}
              />
            ))}
          </View>
          <View style={styles.packageCapsuleCopy}>
            <Text style={styles.packageCapsuleTitle}>My package</Text>
            <Text style={styles.packageCapsuleMeta}>
              {planItems.length} perk{planItems.length === 1 ? "" : "s"} · {planTotal} pts
            </Text>
          </View>
          <ChevronRight size={16} color={colors.muted} />
        </Pressable>
      ) : null}

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

      <Section title="Points health" meta={monthLabel}>
        <PointsHealthRing health={pointsHealth} />
      </Section>

      <EmployeePointsPanel
        pointsBalance={pointsBalance}
        rewardEvents={rewardEvents}
        openChallenges={openChallenges}
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
                {planItems.length} perk{planItems.length === 1 ? "" : "s"} · {planTotal} pts · tap to{" "}
                {autopilotOpen ? "hide" : "review"}
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
                        {benefit.providerName} · {perkPointsCost(benefit)} pts
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
                <Text style={styles.bodyText}>Package total</Text>
                <Text style={styles.confidence}>{planTotal} pts</Text>
              </View>

              <CapsuleButton
                label={sent ? "Package paid" : "Pay with points"}
                onPress={sendToEmployer}
                variant={sent ? "soft" : "primary"}
                icon={sent ? undefined : <Send size={16} color={colors.onPrimary} />}
              />
            </View>
          ) : null}
        </GlassPanel>
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
        secondaryLabel="Add to package"
        onSecondary={(benefit) => {
          addToPackage(benefit);
          setAiOfferDetail(null);
        }}
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

  const focusIndex = redeemedBenefits.findIndex((benefit) => benefit.id === focusId);
  const focused = focusIndex >= 0 ? redeemedBenefits[focusIndex] : null;

  return (
    <>
      <View style={styles.walletHero}>
        <Text style={styles.greetingText}>My Cards</Text>
        <Text style={styles.greetingSub}>
          {redeemedBenefits.length
            ? `${redeemedBenefits.length} perk${redeemedBenefits.length === 1 ? "" : "s"} redeemed · tap to use at the provider.`
            : "Perks you redeem from Offers will appear here."}
        </Text>
      </View>

      {redeemedBenefits.length ? (
        <View style={styles.walletCardList}>
          {redeemedBenefits.map((benefit, index) => (
            <Pressable
              key={benefit.id}
              onPress={() => {
                setFocusId(benefit.id);
                setAccepted(false);
              }}
              style={styles.walletCardListItem}
            >
              <WalletCard
                user={user}
                companyName={companyName}
                benefit={benefit}
                pointsBalance={perkPointsCost(benefit)}
                redeemed
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
        <Text style={styles.greetingText}>Discover</Text>
        <Text style={styles.greetingSub}>Fresh perks from local partners.</Text>
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
            <Pressable key={benefit.id} onPress={() => setSelectedOffer(benefit)}>
            <View style={styles.offerV2}>
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
                  onPress={(event) => {
                    event.stopPropagation?.();
                    toggleSaved(benefit.id);
                  }}
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
                    <Text style={styles.offerV2Price}>{perkPointsCost(benefit)} pts</Text>
                    <Text style={styles.offerV2PriceLabel}>to redeem</Text>
                  </View>
                  <Text style={styles.offerV2Ends}>ends {benefit.validUntil}</Text>
                </View>
              </View>
            </View>
            </Pressable>
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

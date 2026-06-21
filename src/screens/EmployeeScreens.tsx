import {
  ChevronRight,
  Heart,
  MapPin,
  Send,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
  Trophy,
  WalletCards,
  X
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { BottomNav, NavTab } from "../components/BottomNav";
import { CapsuleButton } from "../components/CapsuleButton";
import { EmployeePointChallenges, ChallengeListCard } from "../components/EmployeePointChallenges";
import { ConfettiBurst } from "../components/ConfettiBurst";
import {
  mergeChallengeViewsForEmployee,
  openChallengeViews,
  completedChallengeViews,
  resolveEmployerIdForUser
} from "../lib/challengeService";
import { EmployeeHealthSnapshot } from "../lib/healthDataService";
import { GlassPanel } from "../components/GlassPanel";
import { PointsHealthRing } from "../components/PointsHealthRing";
import { ScreenTransition } from "../components/ScreenTransition";
import { Section } from "../components/Section";
import { UserProfileScreen } from "../components/UserProfileScreen";
import { WalletCard } from "../components/WalletCard";
import { WalletFocus } from "../components/WalletFocus";
import {
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
import { Benefit, BenefitCategory, ChallengeDefinition, ChallengeProgress, ChallengeView, RewardEvent, SelectionRequest, User } from "../types";
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

function useEmployeeChallengeViews(input: {
  user: User;
  appData: AppData;
  employeeLoginDays: Record<string, string[]>;
  employeeHealthMetrics?: EmployeeHealthSnapshot;
}) {
  return useMemo(() => {
    const employerId = resolveEmployerIdForUser(input.appData.users, input.appData.companies, input.user);
    if (!employerId) return [];
    return mergeChallengeViewsForEmployee({
      definitions: input.appData.challengeDefinitions,
      progressRows: input.appData.challengeProgress,
      employee: input.user,
      employerId,
      disabledTemplateKeys: input.appData.disabledChallengeTemplates[employerId] ?? [],
      selectionRequests: input.appData.selectionRequests,
      benefits: input.appData.benefits,
      loginDates: input.employeeLoginDays[input.user.id] ?? [],
      healthMetrics: input.employeeHealthMetrics
    });
  }, [input.user, input.appData, input.employeeLoginDays, input.employeeHealthMetrics]);
}

function shufflePackageWithinBudget(benefits: Benefit[], pointsBudget: number, maxItems = 4) {
  const now = Date.now();
  const eligible = benefits.filter((benefit) => {
    const expiresAt = Date.parse(benefit.validUntil);
    return perkPointsCost(benefit) <= pointsBudget && (Number.isNaN(expiresAt) || expiresAt >= now);
  });
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const selected: Benefit[] = [];
  const usedCategories = new Set<BenefitCategory>();
  let remaining = pointsBudget;

  for (const benefit of shuffled) {
    if (selected.length >= maxItems) break;
    const cost = perkPointsCost(benefit);
    if (cost > remaining || usedCategories.has(benefit.category)) continue;
    selected.push(benefit);
    usedCategories.add(benefit.category);
    remaining -= cost;
  }

  for (const benefit of shuffled) {
    if (selected.length >= maxItems) break;
    if (selected.some((item) => item.id === benefit.id)) continue;
    const cost = perkPointsCost(benefit);
    if (cost > remaining) continue;
    selected.push(benefit);
    remaining -= cost;
  }

  return selected;
}

export function EmployeeExperience({
  user,
  appData,
  onSubmitSelection,
  onLogout,
  pointsBalance = 0,
  rewardEvents = [],
  challengeDefinitions = [],
  challengeProgress = [],
  disabledChallengeTemplates = {},
  employeeLoginDays = {},
  employeeHealthMetrics,
  onConnectAppleHealth,
  onSubmitChallenge,
  onPayForPerk,
  onPayForPerks
}: {
  user: User;
  appData: AppData;
  onSubmitSelection: (request: SelectionRequest) => void;
  onLogout: () => void;
  pointsBalance?: number;
  rewardEvents?: RewardEvent[];
  challengeDefinitions?: ChallengeDefinition[];
  challengeProgress?: ChallengeProgress[];
  disabledChallengeTemplates?: Record<string, string[]>;
  employeeLoginDays?: Record<string, string[]>;
  employeeHealthMetrics?: EmployeeHealthSnapshot;
  onConnectAppleHealth?: () => void | Promise<void>;
  onSubmitChallenge?: (definitionId: string) => void | Promise<void>;
  onPayForPerk?: (benefit: Benefit) => boolean;
  onPayForPerks?: (benefits: Benefit[]) => boolean;
}) {
  const [tab, setTab] = useState<EmployeeTab>("home");
  const [celebrateKey, setCelebrateKey] = useState(0);
  const completedCountRef = useRef(0);

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
  const challengeViews = useEmployeeChallengeViews({
    user,
    appData: {
      ...appData,
      challengeDefinitions,
      challengeProgress,
      disabledChallengeTemplates
    },
    employeeLoginDays,
    employeeHealthMetrics
  });
  const activeChallenges = useMemo(() => openChallengeViews(challengeViews), [challengeViews]);
  const completedChallenges = useMemo(() => completedChallengeViews(challengeViews), [challengeViews]);

  useEffect(() => {
    if (completedChallenges.length > completedCountRef.current) {
      setCelebrateKey((value) => value + 1);
    }
    completedCountRef.current = completedChallenges.length;
  }, [completedChallenges.length]);

  const milestoneMessage = useMemo(() => {
    const candidate = activeChallenges.find(
      (challenge) =>
        challenge.source === "platform" &&
        challenge.progressTarget > 0 &&
        challenge.current / challenge.progressTarget >= 0.5 &&
        challenge.current < challenge.progressTarget
    );
    if (!candidate) return null;
    const remaining = candidate.progressTarget - candidate.current;
    return `Almost there — ${remaining} more step${remaining === 1 ? "" : "s"} to earn ${candidate.rewardPoints} pts on "${candidate.title}".`;
  }, [activeChallenges]);
  const now = useMemo(() => new Date(), []);
  const benefits = appData.benefits;
  const basePlan = useMemo(
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
  const [planItems, setPlanItems] = useState<Benefit[]>([]);
  const [packageOpen, setPackageOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const packageSeeded = useRef(false);

  useEffect(() => {
    if (packageSeeded.current || !basePlan.items.length) return;
    packageSeeded.current = true;
    setPlanItems(basePlan.items.slice(0, 4));
  }, [basePlan.items]);

  const planTotal = planItems.reduce((sum, benefit) => sum + perkPointsCost(benefit), 0);

  const removeFromPackage = useCallback((benefitId: string) => {
    setSent(false);
    setPlanItems((current) => current.filter((item) => item.id !== benefitId));
  }, []);

  const addToPackage = useCallback(
    (benefit: Benefit, options?: { openModal?: boolean; notify?: boolean }) => {
      if (planItems.some((item) => item.id === benefit.id)) {
        if (options?.notify) {
          Alert.alert("Already in package", `${benefit.title} is already in your home package.`);
        }
        if (options?.openModal) setPackageOpen(true);
        return;
      }
      if (planItems.length >= 4) {
        Alert.alert("Package full", "Remove a perk from your package to add another.");
        return;
      }

      setSent(false);
      if (options?.openModal) setPackageOpen(true);
      setPlanItems((current) => [...current, benefit]);
      if (options?.notify) {
        Alert.alert("Added to package", `${benefit.title} was added to your home package.`);
      }
    },
    [planItems]
  );

  const sendToEmployer = useCallback(() => {
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
  }, [planItems, planTotal, pointsBalance, onPayForPerks]);

  const shufflePackage = useCallback(() => {
    const nextPackage = shufflePackageWithinBudget(benefits, pointsBalance);
    if (!nextPackage.length) {
      Alert.alert("No package found", "There are no available offers within your current points balance.");
      return;
    }
    setSent(false);
    setPlanItems(nextPackage);
    setPackageOpen(true);
  }, [benefits, pointsBalance]);

  return (
    <View style={styles.roleShell}>
      {celebrateKey > 0 ? <ConfettiBurst key={celebrateKey} /> : null}
      <ScrollView
        contentContainerStyle={[styles.screenContent, styles.employeeContent]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTransition transitionKey={tab}>
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
              challengeViews={challengeViews}
              onPayForPerk={onPayForPerk}
              onPayForPerks={onPayForPerks}
              healthConnected={employeeHealthMetrics?.connected}
              onConnectAppleHealth={onConnectAppleHealth}
              onSubmitChallenge={onSubmitChallenge}
              onGoToChallenges={() => setTab("challenges")}
              milestoneMessage={milestoneMessage}
              planItems={planItems}
              planTotal={planTotal}
              packageOpen={packageOpen}
              sent={sent}
              onPackageOpenChange={setPackageOpen}
              onAddToPackage={addToPackage}
              onRemoveFromPackage={removeFromPackage}
              onSendToEmployer={sendToEmployer}
              onShufflePackage={shufflePackage}
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
              challengeViews={challengeViews}
              pointsBalance={pointsBalance}
              rewardEvents={rewardEvents}
              healthConnected={employeeHealthMetrics?.connected}
              onConnectAppleHealth={onConnectAppleHealth}
              onSubmitChallenge={onSubmitChallenge}
            />
          ) : null}
          {tab === "alerts" ? (
            <EmployeeOffers
              user={user}
              companyName={company.name}
              appData={appData}
              pointsBalance={pointsBalance}
              onPayForPerk={onPayForPerk}
              planItemIds={planItems.map((item) => item.id)}
              onAddToPackage={(benefit) => addToPackage(benefit, { notify: true })}
            />
          ) : null}
          {tab === "profile" ? <UserProfileScreen user={user} onLogout={onLogout} /> : null}
        </ScreenTransition>
      </ScrollView>

      <BottomNav tabs={employeeTabs} active={tab} onChange={setTab} />
    </View>
  );
}

function EmployeeChallenges({
  challengeViews,
  pointsBalance,
  rewardEvents,
  healthConnected,
  onConnectAppleHealth,
  onSubmitChallenge
}: {
  challengeViews: ChallengeView[];
  pointsBalance: number;
  rewardEvents: RewardEvent[];
  healthConnected?: boolean;
  onConnectAppleHealth?: () => void | Promise<void>;
  onSubmitChallenge?: (definitionId: string) => void | Promise<void>;
}) {
  const active = openChallengeViews(challengeViews);
  const completed = completedChallengeViews(challengeViews);
  const availablePoints = active.reduce((sum, challenge) => sum + challenge.rewardPoints, 0);

  return (
    <>
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Challenges</Text>
        <Text style={styles.greetingSub}>
          {active.length
            ? `${active.length} active · ${availablePoints.toLocaleString()} pts to earn`
            : "Complete platform and employer challenges to earn PerX Points."}
        </Text>
      </View>

      <GlassPanel style={styles.pointsHero} intensity={32}>
        <View style={styles.redeemRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pointsHeroValue}>{pointsBalance.toLocaleString()}</Text>
            <Text style={styles.pointsHeroSub}>
              Platform goals track automatically. Employer goals are awarded by your manager.
            </Text>
          </View>
          <Trophy size={28} color={colors.primary} />
        </View>
      </GlassPanel>

      <EmployeePointChallenges
        challenges={active}
        title="Active challenges"
        healthConnected={healthConnected}
        onConnectAppleHealth={onConnectAppleHealth}
        onSubmitChallenge={onSubmitChallenge}
      />

      {completed.length ? (
        <Section title="Completed" meta={`${completed.length}`}>
          {completed.map((challenge) => (
            <ChallengeListCard key={challenge.id} challenge={challenge} />
          ))}
        </Section>
      ) : null}

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
  challengeViews = [],
  onPayForPerk,
  onPayForPerks,
  healthConnected,
  onConnectAppleHealth,
  onSubmitChallenge,
  onGoToChallenges,
  milestoneMessage,
  planItems,
  planTotal,
  packageOpen,
  sent,
  onPackageOpenChange,
  onAddToPackage,
  onRemoveFromPackage,
  onSendToEmployer,
  onShufflePackage
}: {
  user: User;
  companyName: string;
  companyId: string;
  pointsHealth: ReturnType<typeof computePointsHealth>;
  appData: AppData;
  onSubmitSelection: (request: SelectionRequest) => void;
  pointsBalance?: number;
  rewardEvents?: RewardEvent[];
  challengeViews?: ChallengeView[];
  onPayForPerk?: (benefit: Benefit) => boolean;
  onPayForPerks?: (benefits: Benefit[]) => boolean;
  healthConnected?: boolean;
  onConnectAppleHealth?: () => void | Promise<void>;
  onSubmitChallenge?: (definitionId: string) => void | Promise<void>;
  onGoToChallenges?: () => void;
  milestoneMessage?: string | null;
  planItems: Benefit[];
  planTotal: number;
  packageOpen: boolean;
  sent: boolean;
  onPackageOpenChange: (open: boolean) => void;
  onAddToPackage: (benefit: Benefit, options?: { openModal?: boolean; notify?: boolean }) => void;
  onRemoveFromPackage: (benefitId: string) => void;
  onSendToEmployer: () => void;
  onShufflePackage: () => void;
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

      {planItems.length ? (
        <View style={styles.packageCapsule}>
          <Pressable style={styles.packageCapsuleMain} onPress={() => onPackageOpenChange(true)}>
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
          </Pressable>
          <Pressable
            onPress={() => onPackageOpenChange(true)}
            hitSlop={12}
            style={styles.packageCapsuleArrow}
          >
            <ChevronRight size={18} color={colors.primary} />
          </Pressable>
        </View>
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
              <Image source={{ uri: primary.imageUrl }} style={styles.aiThumb} resizeMode="cover" />
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
                label="Shuffle"
                onPress={onShufflePackage}
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

      {milestoneMessage ? (
        <View style={styles.challengeMilestoneBanner}>
          <Text style={styles.challengeMilestoneText}>{milestoneMessage}</Text>
        </View>
      ) : null}

      <EmployeePointChallenges
        challenges={openChallengeViews(challengeViews)}
        limit={3}
        healthConnected={healthConnected}
        onConnectAppleHealth={onConnectAppleHealth}
        onSubmitChallenge={onSubmitChallenge}
        footerAction={
          onGoToChallenges ? (
            <Pressable onPress={onGoToChallenges} style={{ marginTop: 8 }}>
              <Text style={styles.challengeLinkText}>See all challenges</Text>
            </Pressable>
          ) : null
        }
      />

      <Section title="Points health" meta={monthLabel}>
        <PointsHealthRing health={pointsHealth} />
      </Section>

      <Section title="Today nearby" meta={timeCtx.label}>
        {nearby.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.nearbyScrollRow}
          >
            {nearby.map(({ benefit, reason }) => (
              <Pressable key={benefit.id} onPress={() => onAddToPackage(benefit, { openModal: true })}>
                <GlassPanel style={styles.nearbyCard} intensity={20}>
                  <Image source={{ uri: benefit.imageUrl }} style={styles.nearbyThumb} resizeMode="cover" />
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

      <PackageModal
        visible={packageOpen}
        planItems={planItems}
        planTotal={planTotal}
        pointsBalance={pointsBalance}
        sent={sent}
        onClose={() => onPackageOpenChange(false)}
        onRemove={onRemoveFromPackage}
        onPay={onSendToEmployer}
      />

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
          onAddToPackage(benefit, { openModal: true });
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
  type CardFilter = "all" | "ready" | "used";

  const redeemedBenefits = useMemo(
    () => redeemedWalletBenefits(user.id, appData.selectionRequests, appData.benefits),
    [user.id, appData.selectionRequests, appData.benefits]
  );
  const [focusId, setFocusId] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [celebrateKey, setCelebrateKey] = useState(0);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");

  const readyCount = redeemedBenefits.filter((benefit) => !usedIds.has(benefit.id)).length;
  const usedCount = redeemedBenefits.filter((benefit) => usedIds.has(benefit.id)).length;

  const filteredBenefits = useMemo(() => {
    if (cardFilter === "ready") {
      return redeemedBenefits.filter((benefit) => !usedIds.has(benefit.id));
    }
    if (cardFilter === "used") {
      return redeemedBenefits.filter((benefit) => usedIds.has(benefit.id));
    }
    return redeemedBenefits;
  }, [cardFilter, redeemedBenefits, usedIds]);

  const focusIndex = filteredBenefits.findIndex((benefit) => benefit.id === focusId);
  const focused =
    focusIndex >= 0
      ? filteredBenefits[focusIndex]
      : redeemedBenefits.find((benefit) => benefit.id === focusId) ?? null;
  const focusedUsed = focused ? usedIds.has(focused.id) : false;
  const focusedVariant = focused
    ? Math.max(0, redeemedBenefits.findIndex((benefit) => benefit.id === focused.id))
    : 0;

  const filterOptions: Array<{ id: CardFilter; label: string; count: number }> = [
    { id: "all", label: "All", count: redeemedBenefits.length },
    { id: "ready", label: "Ready", count: readyCount },
    { id: "used", label: "Used", count: usedCount }
  ];

  return (
    <>
      <View style={styles.walletHero}>
        <Text style={styles.greetingText}>My Cards</Text>
        <Text style={styles.greetingSub}>
          {redeemedBenefits.length
            ? `${readyCount} ready · ${usedCount} used · tap a card to redeem at the provider`
            : "Perks you redeem from Offers will appear here."}
        </Text>
      </View>

      {redeemedBenefits.length ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.walletFilterRow}
          >
            {filterOptions.map((option) => {
              const selected = cardFilter === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setCardFilter(option.id)}
                  style={[styles.filterChip, selected && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>
                    {option.label} · {option.count}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {filteredBenefits.length ? (
            <View style={styles.cardStack}>
              {filteredBenefits.map((benefit, index) => (
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
                    variant={redeemedBenefits.findIndex((item) => item.id === benefit.id)}
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
                <Text style={styles.listTitle}>
                  {cardFilter === "used" ? "No used cards" : "No ready cards"}
                </Text>
                <Text style={styles.listSub}>
                  {cardFilter === "used"
                    ? "Cards move here after you simulate NFC at the provider."
                    : "All your cards have been used. Redeem more perks from Offers."}
                </Text>
              </View>
            </View>
          )}
        </>
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
        variant={focusedVariant}
        accepted={accepted}
        celebrateKey={celebrateKey}
        redeemed
        used={focusedUsed}
        onTap={() => {
          if (focused && !usedIds.has(focused.id)) {
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
  onPayForPerk,
  planItemIds = [],
  onAddToPackage
}: {
  user: User;
  companyName: string;
  appData: AppData;
  pointsBalance?: number;
  onPayForPerk?: (benefit: Benefit) => boolean;
  planItemIds?: string[];
  onAddToPackage?: (benefit: Benefit) => void;
}) {
  const marketplaceBenefits = appData.benefits;
  const marketplaceProviders = appData.providerProfiles;
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [savedOnly, setSavedOnly] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Benefit | null>(null);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const heroCarouselRef = useRef<ScrollView | null>(null);
  const { width: viewportWidth } = useWindowDimensions();
  const heroSlideWidth = Math.max(1, viewportWidth);

  const categories = useMemo<CategoryFilter[]>(() => {
    const present = Array.from(new Set(marketplaceBenefits.map((benefit) => benefit.category)));
    return ["All", ...present];
  }, [marketplaceBenefits]);

  const heroBenefits = marketplaceBenefits.slice(0, 5);
  const heroBenefit = heroBenefits[activeHeroIndex] ?? marketplaceBenefits[0];

  const featuredStores = useMemo(() => {
    const providersFromProfiles = marketplaceProviders.map((provider) => {
      const offers = marketplaceBenefits.filter((benefit) => benefit.providerName === provider.businessName);
      return {
        id: provider.id,
        name: provider.businessName,
        logoUrl: provider.logoUrl,
        meta: offers[0]?.discount ?? provider.category,
        offerCount: offers.length,
        primaryBenefit: offers[0]
      };
    });

    const knownProviderNames = new Set(providersFromProfiles.map((provider) => provider.name));
    const providersFromBenefits = Array.from(
      new Map(
        marketplaceBenefits
          .filter((benefit) => !knownProviderNames.has(benefit.providerName))
          .map((benefit) => [
            benefit.providerName,
            {
              id: benefit.providerName,
              name: benefit.providerName,
              logoUrl: undefined,
              meta: benefit.discount,
              offerCount: marketplaceBenefits.filter((item) => item.providerName === benefit.providerName).length,
              primaryBenefit: benefit
            }
          ])
      ).values()
    );

    return [...providersFromProfiles, ...providersFromBenefits].slice(0, 6);
  }, [marketplaceBenefits, marketplaceProviders]);

  useEffect(() => {
    if (heroBenefits.length <= 1) return;
    const timer = setInterval(() => {
      setActiveHeroIndex((index) => {
        const nextIndex = (index + 1) % heroBenefits.length;
        heroCarouselRef.current?.scrollTo({ x: nextIndex * heroSlideWidth, animated: true });
        return nextIndex;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [heroBenefits.length, heroSlideWidth]);

  useEffect(() => {
    if (activeHeroIndex >= heroBenefits.length) {
      setActiveHeroIndex(0);
      heroCarouselRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [activeHeroIndex, heroBenefits.length]);

  const selectHero = useCallback(
    (index: number) => {
      setActiveHeroIndex(index);
      heroCarouselRef.current?.scrollTo({ x: index * heroSlideWidth, animated: true });
    },
    [heroSlideWidth]
  );

  const handleHeroSwipe = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / heroSlideWidth);
    setActiveHeroIndex(Math.max(0, Math.min(heroBenefits.length - 1, nextIndex)));
  };

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
      <View style={styles.offersShopHero}>
        <ScrollView
          ref={heroCarouselRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          snapToAlignment="center"
          snapToInterval={heroSlideWidth}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleHeroSwipe}
          style={styles.offersShopHeroRail}
        >
          {heroBenefits.length ? (
            heroBenefits.map((benefit) => (
              <View key={benefit.id} style={[styles.offersShopHeroSlide, { width: heroSlideWidth }]}>
                <Image source={{ uri: benefit.imageUrl }} style={styles.offersShopHeroImage} resizeMode="cover" />
                <View style={styles.offersShopHeroShade} />
                <View style={styles.offersShopHeroContent}>
                  <Text style={styles.offersShopKicker}>Promoted</Text>
                  <Text style={styles.offersShopHeadline} numberOfLines={2}>
                    {benefit.title}
                  </Text>
                  <Pressable onPress={() => setSelectedOffer(benefit)} style={styles.offersShopCta}>
                    <Text style={styles.offersShopCtaText}>Shop now</Text>
                  </Pressable>
                  <View style={styles.offersShopDots}>
                    {heroBenefits.map((dotBenefit, index) => (
                      <Pressable
                        key={dotBenefit.id}
                        onPress={() => selectHero(index)}
                        hitSlop={8}
                        style={[styles.offersShopDot, index === activeHeroIndex && styles.offersShopDotActive]}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.offersShopHeroSlide, { width: heroSlideWidth }]}>
              <View style={styles.offersShopHeroShade} />
              <View style={styles.offersShopHeroContent}>
                <Text style={styles.offersShopKicker}>{companyName}</Text>
                <Text style={styles.offersShopHeadline}>Perks will appear here soon</Text>
              </View>
            </View>
          )}
        </ScrollView>
        <View style={styles.offersShopTopBar}>
          <View style={styles.offersShopTitleWrap}>
            <View style={styles.offersShopAvatar}>
              {heroBenefit && logoFor(heroBenefit.providerName) ? (
                <Image source={{ uri: logoFor(heroBenefit.providerName) }} style={styles.offersShopAvatarLogo} />
              ) : (
                <Text style={styles.offersShopAvatarText}>
                  {(heroBenefit?.providerName ?? companyName).slice(0, 1).toUpperCase()}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.offersShopActions}>
            <Pressable
              onPress={() => setSavedOnly((value) => !value)}
              style={[styles.offersHeroIcon, savedOnly && styles.offersHeroIconActive]}
            >
              <Heart
                size={23}
                color={savedOnly ? colors.onPrimary : colors.onPrimaryContainer}
                fill={savedOnly ? colors.onPrimary : "transparent"}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {featuredStores.length ? (
        <Section title="Featured stores" meta="View all">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredStoreRow}>
            {featuredStores.map((store) => (
              <Pressable
                key={store.id}
                onPress={() => {
                  if (store.primaryBenefit) setSelectedOffer(store.primaryBenefit);
                }}
                style={styles.featuredStoreCard}
              >
                <View style={styles.featuredStoreLogoWrap}>
                  {store.logoUrl ? (
                    <Image source={{ uri: store.logoUrl }} style={styles.featuredStoreLogo} />
                  ) : (
                    <Text style={styles.featuredStoreInitial}>{store.name.slice(0, 1).toUpperCase()}</Text>
                  )}
                </View>
                <Text style={styles.featuredStoreName} numberOfLines={2}>
                  {store.name}
                </Text>
                <Text style={styles.featuredStoreMeta} numberOfLines={1}>
                  {store.offerCount ? store.meta : "Coming soon"}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Section>
      ) : null}

      <View style={styles.offersBrowseHead}>
        <Text style={styles.offersSectionTitle}>Browse offers</Text>
        <Text style={styles.offersBrowseMeta}>{visibleBenefits.length} shown</Text>
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
                <Image source={{ uri: benefit.imageUrl }} style={styles.marketCardImg} resizeMode="cover" />
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
        secondaryLabel={
          selectedOffer && planItemIds.includes(selectedOffer.id)
            ? "In package"
            : "Add to package"
        }
        onSecondary={(benefit) => {
          if (planItemIds.includes(benefit.id)) {
            Alert.alert("Already in package", `${benefit.title} is already in your home package.`);
            return;
          }
          onAddToPackage?.(benefit);
          setSelectedOffer(null);
        }}
      />
    </>
  );
}

function PackageModal({
  visible,
  planItems,
  planTotal,
  pointsBalance,
  sent,
  onClose,
  onRemove,
  onPay
}: {
  visible: boolean;
  planItems: Benefit[];
  planTotal: number;
  pointsBalance: number;
  sent: boolean;
  onClose: () => void;
  onRemove: (benefitId: string) => void;
  onPay: () => void;
}) {
  const affordable = planTotal <= pointsBalance && planItems.length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>My package</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {planItems.length ? (
              planItems.map((benefit) => (
                <View key={benefit.id} style={styles.packageModalItem}>
                  <Image source={{ uri: benefit.imageUrl }} style={styles.packageModalThumb} resizeMode="cover" />
                  <View style={styles.packageModalBody}>
                    <Text style={styles.packageModalName} numberOfLines={1}>
                      {benefit.title}
                    </Text>
                    <Text style={styles.packageModalMeta} numberOfLines={1}>
                      {benefit.providerName} · {perkPointsCost(benefit)} pts
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => onRemove(benefit.id)}
                    hitSlop={8}
                    style={styles.packageModalRemove}
                  >
                    <Trash2 size={16} color={colors.muted} />
                  </Pressable>
                </View>
              ))
            ) : (
              <Text style={styles.bodyText}>
                No perks in your package yet. Add some from PerX AI or Offers.
              </Text>
            )}

            <View style={styles.apTotalRow}>
              <Text style={styles.bodyText}>Package total</Text>
              <Text style={styles.confidence}>{planTotal} pts</Text>
            </View>
            <Text style={styles.listSub}>Your balance: {pointsBalance.toLocaleString()} pts</Text>

            <CapsuleButton
              label={
                sent
                  ? "Package paid"
                  : affordable
                    ? `Purchase package · ${planTotal} pts`
                    : planItems.length
                      ? `Need ${planTotal - pointsBalance} more pts`
                      : "Add perks to package"
              }
              onPress={() => {
                if (affordable && !sent) onPay();
              }}
              variant={sent || !affordable ? "soft" : "primary"}
              icon={sent || !affordable ? undefined : <Send size={16} color={colors.onPrimary} />}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
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
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Image source={{ uri: benefit.imageUrl }} style={styles.detailHeroImage} resizeMode="cover" />
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

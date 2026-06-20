import {
  ChevronRight,
  Heart,
  MapPin,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Star,
  Store,
  Tag,
  Trash2,
  Trophy,
  WalletCards,
  X,
  Zap
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
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
  const [autopilotEnabled, setAutopilotEnabled] = useState<Record<string, boolean>>({});
  const [packageOpen, setPackageOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const packageSeeded = useRef(false);

  useEffect(() => {
    if (packageSeeded.current || !basePlan.items.length) return;
    packageSeeded.current = true;
    setPlanItems(basePlan.items);
    setAutopilotEnabled(Object.fromEntries(basePlan.items.map((benefit) => [benefit.id, true])));
  }, [basePlan.items]);

  const planTotal = planItems.reduce((sum, benefit) => sum + perkPointsCost(benefit), 0);

  const removeFromPackage = useCallback((benefitId: string) => {
    setSent(false);
    setPlanItems((current) => current.filter((item) => item.id !== benefitId));
    setAutopilotEnabled((current) => ({ ...current, [benefitId]: false }));
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
      setAutopilotEnabled((current) => ({ ...current, [benefit.id]: true }));
      if (options?.notify) {
        Alert.alert("Added to package", `${benefit.title} was added to your home package.`);
      }
    },
    [planItems]
  );

  const toggleAutopilotItem = useCallback((benefit: Benefit, enabled: boolean) => {
    setSent(false);
    setAutopilotEnabled((current) => ({ ...current, [benefit.id]: enabled }));
    setPlanItems((current) => {
      if (enabled) {
        return current.some((item) => item.id === benefit.id)
          ? current
          : [...current, benefit].slice(0, 4);
      }
      return current.filter((item) => item.id !== benefit.id);
    });
  }, []);

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
            basePlan={basePlan}
            planItems={planItems}
            planTotal={planTotal}
            autopilotEnabled={autopilotEnabled}
            packageOpen={packageOpen}
            sent={sent}
            onPackageOpenChange={setPackageOpen}
            onAddToPackage={addToPackage}
            onRemoveFromPackage={removeFromPackage}
            onToggleAutopilotItem={toggleAutopilotItem}
            onSendToEmployer={sendToEmployer}
            setPlanItems={setPlanItems}
            setSent={setSent}
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
            planItemIds={planItems.map((item) => item.id)}
            onAddToPackage={(benefit) => addToPackage(benefit, { notify: true })}
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
  onPayForPerks,
  basePlan,
  planItems,
  planTotal,
  autopilotEnabled,
  packageOpen,
  sent,
  onPackageOpenChange,
  onAddToPackage,
  onRemoveFromPackage,
  onToggleAutopilotItem,
  onSendToEmployer,
  setPlanItems,
  setSent
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
  basePlan: AutopilotPlan;
  planItems: Benefit[];
  planTotal: number;
  autopilotEnabled: Record<string, boolean>;
  packageOpen: boolean;
  sent: boolean;
  onPackageOpenChange: (open: boolean) => void;
  onAddToPackage: (benefit: Benefit, options?: { openModal?: boolean; notify?: boolean }) => void;
  onRemoveFromPackage: (benefitId: string) => void;
  onToggleAutopilotItem: (benefit: Benefit, enabled: boolean) => void;
  onSendToEmployer: () => void;
  setPlanItems: Dispatch<SetStateAction<Benefit[]>>;
  setSent: Dispatch<SetStateAction<boolean>>;
}) {
  const now = useMemo(() => new Date(), []);
  const benefits = appData.benefits;
  const ranked = useMemo(() => rankBenefits(user, benefits, now), [user, benefits, now]);
  const nearby = useMemo(() => pickNearby(benefits, now, 3), [benefits, now]);
  const timeCtx = useMemo(() => getTimeContext(now), [now]);
  const monthLabel = now.toLocaleString(market.locale, { month: "long" });

  const primary = ranked[0];
  const [aiOfferDetail, setAiOfferDetail] = useState<Benefit | null>(null);
  const budgetPct = pointsBalance > 0 ? Math.min(1, planTotal / pointsBalance) : 0;

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
                onPress={() => onAddToPackage(primary, { openModal: true })}
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

      <Section title="Today nearby" meta={timeCtx.label}>
        {nearby.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {nearby.map(({ benefit, reason }) => (
              <Pressable key={benefit.id} onPress={() => onAddToPackage(benefit, { openModal: true })}>
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

      <Section title="PerX AI Autopilot" meta={`${monthLabel} · planner`}>
        <GlassPanel style={styles.apPlanner} intensity={36}>
          <View style={styles.apPlannerHead}>
            <View style={styles.apPlannerBadge}>
              <Zap size={14} color={colors.onPrimary} />
              <Text style={styles.apPlannerBadgeText}>Monthly planner</Text>
            </View>
            <Text style={styles.apPlannerTitle}>Build your {monthLabel} package</Text>
            <Text style={styles.apPlannerSub}>
              Toggle perks on or off · {basePlan.confidence}% match to your habits
            </Text>
          </View>

          <View style={styles.apBudgetBar}>
            <View style={styles.apBudgetTrack}>
              <View style={[styles.apBudgetFill, { width: `${budgetPct * 100}%` }]} />
            </View>
            <View style={styles.apBudgetLabels}>
              <Text style={styles.apBudgetUsed}>{planTotal} pts planned</Text>
              <Text style={styles.apBudgetAvail}>{pointsBalance} pts available</Text>
            </View>
          </View>

          {basePlan.items.length ? (
            basePlan.items.map((benefit, index) => {
              const enabled = autopilotEnabled[benefit.id] ?? false;
              return (
                <View key={benefit.id} style={[styles.apToggleRow, enabled && styles.apToggleRowOn]}>
                  <View style={styles.apToggleIndex}>
                    <Text style={styles.apToggleIndexText}>{index + 1}</Text>
                  </View>
                  <Image source={{ uri: benefit.imageUrl }} style={styles.apToggleThumb} />
                  <View style={styles.apToggleBody}>
                    <Text style={styles.apToggleName} numberOfLines={1}>
                      {benefit.title}
                    </Text>
                    <Text style={styles.apToggleMeta} numberOfLines={1}>
                      {benefit.providerName} · {perkPointsCost(benefit)} pts
                    </Text>
                  </View>
                  <Switch
                    value={enabled}
                    onValueChange={(value) => onToggleAutopilotItem(benefit, value)}
                    trackColor={{ false: colors.stroke, true: colors.secondary }}
                    thumbColor={colors.surface}
                  />
                </View>
              );
            })
          ) : (
            <Text style={styles.bodyText}>No offers available to plan yet.</Text>
          )}

          <View style={styles.apPlannerActions}>
            <Pressable style={styles.apShuffleBtn} onPress={() => swapItem(0)}>
              <RefreshCw size={14} color={colors.secondary} />
              <Text style={styles.apShuffleText}>Shuffle pick</Text>
            </Pressable>
            <CapsuleButton
              label={planItems.length ? `Review package (${planItems.length})` : "Add perks first"}
              onPress={() => onPackageOpenChange(true)}
              variant={planItems.length ? "primary" : "soft"}
              style={{ flex: 1 }}
            />
          </View>
        </GlassPanel>
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
              <Text style={styles.modalSub}>
                {planItems.length} perk{planItems.length === 1 ? "" : "s"} · {planTotal} pts total
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {planItems.length ? (
              planItems.map((benefit) => (
                <View key={benefit.id} style={styles.packageModalItem}>
                  <Image source={{ uri: benefit.imageUrl }} style={styles.packageModalThumb} />
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
                No perks in your package yet. Use PerX AI or Autopilot to add some.
              </Text>
            )}

            <View style={styles.apTotalRow}>
              <Text style={styles.bodyText}>Package total</Text>
              <Text style={styles.confidence}>{planTotal} pts</Text>
            </View>
            <Text style={styles.listSub}>
              Your balance: {pointsBalance.toLocaleString()} pts
            </Text>

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

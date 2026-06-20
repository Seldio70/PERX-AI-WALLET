import {
  Check,
  Dumbbell,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  Plane,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  UsersRound,
  Wallet
} from "lucide-react-native";
import { LucideIcon } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Pressable, ScrollView, StyleProp, Text, TextInput, View, ViewStyle } from "react-native";
import { BentoMetricCard } from "../components/BentoMetricCard";
import { CapsuleButton } from "../components/CapsuleButton";
import { GlassPanel } from "../components/GlassPanel";
import { Section } from "../components/Section";
import { createProviderOffer, upsertProviderProfile } from "../lib/perxRepository";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import { Benefit, BenefitCategory, OfferDraft, ProviderProfile, SelectionRequest, User } from "../types";
import { benefitCategoryOptions, currency, market } from "../utils/format";

type AppData = {
  providerProfiles: ProviderProfile[];
  benefits: Benefit[];
  selectionRequests: SelectionRequest[];
  [key: string]: unknown;
};

const categoryIcons: Record<BenefitCategory, LucideIcon> = {
  Food: ShoppingBag,
  Fitness: Dumbbell,
  Health: HeartPulse,
  Learning: GraduationCap,
  Mobility: Plane,
  Wellness: Sparkles,
  Family: HeartHandshake
};

const categoryAvatarStyle: Record<BenefitCategory, StyleProp<ViewStyle>> = {
  Food: styles.transactionAvatarTertiary,
  Fitness: styles.transactionAvatarSecondary,
  Health: styles.transactionAvatarPrimary,
  Learning: styles.transactionAvatarPrimary,
  Mobility: styles.transactionAvatarTertiary,
  Wellness: styles.transactionAvatarSecondary,
  Family: styles.transactionAvatarPrimary
};

const categoryAvatarColor: Record<BenefitCategory, string> = {
  Food: colors.tertiary,
  Fitness: colors.secondary,
  Health: colors.primary,
  Learning: colors.primary,
  Mobility: colors.tertiary,
  Wellness: colors.secondary,
  Family: colors.primary
};

function PulseDot({ delay = 0 }: { delay?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.25, duration: 700, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity]);

  return <Animated.View style={[styles.activityPulseDot, { opacity }]} />;
}

type TransactionRow = {
  id: string;
  title: string;
  meta: string;
  amount: number;
  status: string;
  category: BenefitCategory;
  inflow: boolean;
};

export function BusinessExperience({
  user,
  appData,
  selectionRequests,
  onUpdateProviderProfile,
  onAddOffer
}: {
  user: User;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onUpdateProviderProfile: (profile: ProviderProfile) => void;
  onAddOffer: (offer: Benefit) => void;
}) {
  const existingProfile =
    appData.providerProfiles.find((p) => p.userId === user.id) ??
    appData.providerProfiles.find((p) => p.businessName === user.name);

  const [profileDraft, setProfileDraft] = useState({
    businessName: existingProfile?.businessName ?? user.name,
    description: existingProfile?.description ?? "Local partner offering employee perks.",
    category: existingProfile?.category ?? "Wellness",
    logoUrl:
      existingProfile?.logoUrl ??
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=300&q=80",
    city: existingProfile?.city ?? market.city
  });

  const [offers, setOffers] = useState<Benefit[]>(
    appData.benefits.filter((item) => item.businessId === (user.businessId ?? user.id))
  );

  useEffect(() => {
    setOffers(appData.benefits.filter((item) => item.businessId === (user.businessId ?? user.id)));
  }, [appData.benefits, user.businessId, user.id]);

  const [draft, setDraft] = useState<OfferDraft>({
    title: "", description: "", discount: "", price: "",
    pointsPrice: "", imageUrl: "", redemptionType: "QR", validUntil: "2026-12-31"
  });

  const allBenefits = useMemo(() => ([
    ...appData.benefits.filter((item) => !offers.some((o) => o.id === item.id)),
    ...offers
  ]), [appData.benefits, offers]);

  const routedPayments = useMemo(() => selectionRequests.flatMap((request) =>
    request.benefitIds
      .map((id) => allBenefits.find((b) => b.id === id))
      .filter((b): b is Benefit => Boolean(b))
      .filter((b) => b.businessId === user.businessId)
      .map((b) => ({ request, benefit: b }))
  ), [selectionRequests, allBenefits, user.businessId]);

  const payoutTotal = routedPayments.reduce((sum, { benefit }) => sum + benefit.price, 0);
  const reachedEmployees = new Set(routedPayments.map(({ request }) => request.employeeId)).size;
  const growthSignal = routedPayments.length > 0
    ? `+${Math.min(48, routedPayments.length * 8)}%`
    : "+0%";

  const transactions: TransactionRow[] = useMemo(() => (
    routedPayments
      .slice(0, 6)
      .map(({ request, benefit }) => ({
        id: `${request.id}-${benefit.id}`,
        title: benefit.title,
        meta: `${request.employeeName.split(" ")[0]} • Paid out`,
        amount: benefit.price,
        status: "Settled",
        category: benefit.category,
        inflow: true
      }))
  ), [routedPayments]);

  const saveProviderProfile = async () => {
    const localProfile: ProviderProfile = {
      id: existingProfile?.id ?? `provider_${Date.now()}`,
      userId: user.id,
      businessName: profileDraft.businessName.trim() || user.name,
      logoUrl: profileDraft.logoUrl.trim(),
      description: profileDraft.description.trim(),
      category: profileDraft.category as BenefitCategory,
      city: profileDraft.city.trim() || market.city,
      isApproved: true
    };
    const saved = await upsertProviderProfile({
      providerUserId: user.id,
      businessName: localProfile.businessName,
      logoUrl: localProfile.logoUrl,
      description: localProfile.description,
      category: localProfile.category,
      city: localProfile.city
    });
    onUpdateProviderProfile(saved ?? localProfile);
  };

  const addOffer = async () => {
    if (!draft.title.trim()) return;
    const nextOffer: Benefit = {
      id: `benefit_${Date.now()}`,
      businessId: user.businessId ?? user.id,
      providerId: existingProfile?.id,
      providerName: profileDraft.businessName.trim() || user.name,
      title: draft.title,
      description: draft.description || "Member-only partner offer.",
      discount: draft.discount || "10% off",
      price: Number(draft.price) || 1200,
      pointsPrice: Number(draft.pointsPrice) || 140,
      imageUrl:
        draft.imageUrl ||
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
      redemptionType: draft.redemptionType,
      category: profileDraft.category as BenefitCategory,
      validUntil: draft.validUntil,
      city: profileDraft.city.trim() || market.city
    };
    const saved = await createProviderOffer({
      providerUserId: user.id,
      providerName: nextOffer.providerName,
      title: nextOffer.title,
      description: nextOffer.description,
      discount: nextOffer.discount,
      price: nextOffer.price,
      pointsPrice: nextOffer.pointsPrice,
      imageUrl: nextOffer.imageUrl,
      redemptionType: nextOffer.redemptionType,
      category: nextOffer.category,
      city: nextOffer.city
    });
    onAddOffer(saved ?? nextOffer);
    setOffers((current) => [saved ?? nextOffer, ...current]);
    setDraft({ title: "", description: "", discount: "", price: "", pointsPrice: "", imageUrl: "", redemptionType: "QR", validUntil: "2026-12-31" });
  };

  const tagline = routedPayments.length > 0
    ? `Your business ecosystem at a glance. ${reachedEmployees} ${reachedEmployees === 1 ? "person" : "people"} reached this period.`
    : "Your business ecosystem at a glance. Publish your first offer to start tracking redemptions.";

  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <View style={styles.insightsHero}>
        <Text style={styles.insightsTitle}>Insights</Text>
        <Text style={styles.insightsTagline}>{tagline}</Text>
      </View>

      <View style={styles.bentoGrid}>
        <BentoMetricCard
          title="Revenue"
          value={currency(payoutTotal)}
          trend={growthSignal}
          accent={colors.primary}
          Icon={Wallet}
        />
        <BentoMetricCard
          title="Customers"
          value={`${reachedEmployees}`}
          trend={reachedEmployees > 0 ? `+${reachedEmployees}` : "—"}
          accent={colors.tertiary}
          Icon={UsersRound}
        />
        <BentoMetricCard
          title="Growth"
          value={`${Math.min(99, routedPayments.length * 4)}%`}
          trend={growthSignal}
          accent={colors.secondary}
          Icon={TrendingUp}
        />
      </View>

      <GlassPanel style={styles.activityCard} intensity={36}>
        <View style={styles.activityHeader}>
          <View style={styles.activityHeaderText}>
            <Text style={styles.sectionTitle}>Activity Heatmap</Text>
            <Text style={styles.bodyText}>Live redemption signal across your offers.</Text>
          </View>
          <Pressable style={styles.exportButton} onPress={() => { /* export hook */ }}>
            <Text style={styles.exportButtonText}>Export</Text>
          </Pressable>
        </View>
        <View style={styles.activityStage}>
          <Text style={styles.activityStageLabel}>Live Optimization</Text>
          <View style={styles.activityPulseRow}>
            <PulseDot />
            <PulseDot delay={350} />
            <PulseDot delay={700} />
          </View>
        </View>
      </GlassPanel>

      <Section title="Recent Transactions" meta={transactions.length ? `${transactions.length}` : undefined}>
        <GlassPanel style={styles.transactionList} intensity={32}>
          {transactions.length ? transactions.map((row, index) => {
            const Icon = categoryIcons[row.category] ?? Store;
            const lastRow = index === transactions.length - 1;
            return (
              <View
                key={row.id}
                style={[styles.transactionRow, lastRow && styles.transactionRowLast]}
              >
                <View style={[styles.transactionAvatar, categoryAvatarStyle[row.category]]}>
                  <Icon size={20} color={categoryAvatarColor[row.category]} />
                </View>
                <View style={styles.transactionBody}>
                  <Text style={styles.transactionTitle}>{row.title}</Text>
                  <Text style={styles.transactionMeta}>{row.meta}</Text>
                </View>
                <View style={styles.transactionAmounts}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      row.inflow ? styles.transactionAmountInflow : styles.transactionAmountOutflow
                    ]}
                  >
                    {row.inflow ? "+" : ""}{currency(row.amount)}
                  </Text>
                  <Text style={styles.transactionStatus}>{row.status}</Text>
                </View>
              </View>
            );
          }) : (
            <View style={styles.transactionEmpty}>
              <View style={styles.smallIcon}>
                <Store size={18} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>No routed payments yet</Text>
                <Text style={styles.listSub}>Approved employee packages will appear here.</Text>
              </View>
            </View>
          )}
        </GlassPanel>
      </Section>

      <View style={styles.manageDivider} />

      <Section title="Provider profile" meta="Merchant">
        <GlassPanel style={styles.businessProfile} intensity={34}>
          <Image source={{ uri: profileDraft.logoUrl }} style={styles.businessLogoImage} />
          <Text style={styles.greetingText}>{profileDraft.businessName}</Text>
          <Text style={styles.greetingSub}>{profileDraft.description}</Text>
        </GlassPanel>
        <GlassPanel style={styles.formPanel}>
          <TextInput
            value={profileDraft.businessName}
            onChangeText={(businessName) => setProfileDraft((c) => ({ ...c, businessName }))}
            placeholder="Business name" placeholderTextColor={colors.muted} style={styles.input}
          />
          <TextInput
            value={profileDraft.description}
            onChangeText={(description) => setProfileDraft((c) => ({ ...c, description }))}
            placeholder="Description" placeholderTextColor={colors.muted} style={styles.input} multiline
          />
          <View style={styles.categoryWrap}>
            {benefitCategoryOptions.map((category) => {
              const selected = profileDraft.category === category;
              return (
                <Pressable
                  key={category}
                  onPress={() => setProfileDraft((c) => ({ ...c, category }))}
                  style={[styles.categoryChip, selected && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryChipText, selected && styles.categoryChipTextActive]}>
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={profileDraft.logoUrl}
            onChangeText={(logoUrl) => setProfileDraft((c) => ({ ...c, logoUrl }))}
            placeholder="Logo image URL" placeholderTextColor={colors.muted} style={styles.input}
          />
          <TextInput
            value={profileDraft.city}
            onChangeText={(city) => setProfileDraft((c) => ({ ...c, city }))}
            placeholder="City" placeholderTextColor={colors.muted} style={styles.input}
          />
          <CapsuleButton label="Save profile" onPress={() => void saveProviderProfile()} />
        </GlassPanel>
      </Section>

      <Section title="Add offer" meta="Provider">
        <GlassPanel style={styles.formPanel}>
          <TextInput value={draft.title} onChangeText={(title) => setDraft((c) => ({ ...c, title }))} placeholder="Offer title" placeholderTextColor={colors.muted} style={styles.input} />
          <TextInput value={draft.discount} onChangeText={(discount) => setDraft((c) => ({ ...c, discount }))} placeholder="Discount value" placeholderTextColor={colors.muted} style={styles.input} />
          <TextInput value={draft.price} onChangeText={(price) => setDraft((c) => ({ ...c, price }))} placeholder={`Price in ${market.currency}`} placeholderTextColor={colors.muted} style={styles.input} keyboardType="numeric" />
          <TextInput value={draft.pointsPrice} onChangeText={(pointsPrice) => setDraft((c) => ({ ...c, pointsPrice }))} placeholder="Points price for employer" placeholderTextColor={colors.muted} style={styles.input} keyboardType="numeric" />
          <TextInput value={draft.imageUrl} onChangeText={(imageUrl) => setDraft((c) => ({ ...c, imageUrl }))} placeholder="Product image URL" placeholderTextColor={colors.muted} style={styles.input} />
          <TextInput value={draft.description} onChangeText={(description) => setDraft((c) => ({ ...c, description }))} placeholder="Description" placeholderTextColor={colors.muted} style={styles.input} multiline />
          <View style={styles.segmented}>
            {(["QR", "NFC"] as const).map((type) => (
              <Pressable key={type} onPress={() => setDraft((c) => ({ ...c, redemptionType: type }))} style={[styles.segment, draft.redemptionType === type && styles.segmentActive]}>
                <Text style={[styles.segmentText, draft.redemptionType === type && styles.segmentTextActive]}>{type}</Text>
              </Pressable>
            ))}
          </View>
          <CapsuleButton label="Publish offer" onPress={() => void addOffer()} icon={<Plus size={16} color={colors.background} />} />
        </GlassPanel>
      </Section>

      <Section title="Live offers" meta={`${offers.length}`}>
        {offers.map((offer) => (
          <GlassPanel key={offer.id} style={styles.offerCard} intensity={14}>
            <Image source={{ uri: offer.imageUrl }} style={styles.offerImage} />
            <View style={styles.offerTop}>
              <View style={styles.smallIcon}>
                <Check size={18} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{offer.title}</Text>
                <Text style={styles.listSub}>{offer.discount} · {currency(offer.price)} · {offer.pointsPrice} pts · {offer.redemptionType}</Text>
              </View>
              <Text style={styles.listSub}>{offer.validUntil}</Text>
            </View>
            <Text style={styles.bodyText}>{offer.description}</Text>
          </GlassPanel>
        ))}
      </Section>
    </ScrollView>
  );
}

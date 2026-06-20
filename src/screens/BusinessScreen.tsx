import { Check, CircleDollarSign, Plus, Store } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { AnalyticsRow } from "../components/AnalyticsRow";
import { CapsuleButton } from "../components/CapsuleButton";
import { GlassPanel } from "../components/GlassPanel";
import { MetricPill } from "../components/MetricPill";
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

  const allBenefits = [
    ...appData.benefits.filter((item) => !offers.some((o) => o.id === item.id)),
    ...offers
  ];

  const routedPayments = selectionRequests.flatMap((request) =>
    request.benefitIds
      .map((id) => allBenefits.find((b) => b.id === id))
      .filter((b): b is Benefit => Boolean(b))
      .filter((b) => b.businessId === user.businessId)
      .map((b) => ({ request, benefit: b }))
  );
  const approvedPayoutTotal = routedPayments
    .filter(({ request }) => request.status === "approved")
    .reduce((sum, { benefit }) => sum + benefit.price, 0);
  const approvedRoutedPayments = routedPayments.filter(({ request }) => request.status === "approved");
  const reachedEmployees = new Set(approvedRoutedPayments.map(({ request }) => request.employeeId)).size;

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

  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <GlassPanel style={styles.businessProfile}>
        <Image source={{ uri: profileDraft.logoUrl }} style={styles.businessLogoImage} />
        <Text style={styles.greetingText}>{profileDraft.businessName}</Text>
        <Text style={styles.greetingSub}>{profileDraft.description}</Text>
      </GlassPanel>

      <View style={styles.metricRow}>
        <MetricPill label="Redeemed" value={`${approvedRoutedPayments.length}`} />
        <MetricPill label="Reached" value={`${reachedEmployees}`} />
        <MetricPill label="Payouts" value={currency(approvedPayoutTotal)} />
      </View>

      <Section title="Provider profile" meta="Merchant">
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
                <Text style={styles.listSub}>{offer.discount} - {currency(offer.price)} - {offer.pointsPrice} pts - {offer.redemptionType}</Text>
              </View>
              <Text style={styles.listSub}>{offer.validUntil}</Text>
            </View>
            <Text style={styles.bodyText}>{offer.description}</Text>
          </GlassPanel>
        ))}
      </Section>

      <Section title="Payment routing" meta="Simulated">
        {routedPayments.length ? routedPayments.map(({ request, benefit }) => (
          <View key={`${request.id}-${benefit.id}`} style={styles.listRow}>
            <View style={styles.smallIcon}>
              <CircleDollarSign size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>{benefit.title}</Text>
              <Text style={styles.listSub}>{request.employeeName} - {request.status === "approved" ? "paid to provider" : "awaiting"}</Text>
            </View>
            <Text style={styles.listAmount}>{currency(benefit.price)}</Text>
          </View>
        )) : (
          <View style={styles.listRow}>
            <View style={styles.smallIcon}><Store size={18} color={colors.text} /></View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No routed payments yet</Text>
              <Text style={styles.listSub}>Approved employee packages will appear here.</Text>
            </View>
          </View>
        )}
      </Section>

      <Section title="Redemption stats" meta="Today">
        <GlassPanel style={styles.analyticsGrid} intensity={14}>
          <AnalyticsRow label="Employees used offers" value={`${reachedEmployees}`} />
          <AnalyticsRow label="Approved payouts" value={`${approvedRoutedPayments.length}`} />
          <AnalyticsRow label="Offer count" value={`${offers.length}`} />
        </GlassPanel>
      </Section>
    </ScrollView>
  );
}

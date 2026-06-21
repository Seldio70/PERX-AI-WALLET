import * as ImagePicker from "expo-image-picker";
import { Activity, BadgeCheck, Building2, Calendar, Camera, Check, ChevronRight, CircleDollarSign, Dumbbell, GraduationCap, HeartPulse, MapPin, Pencil, Plane, Plus, ShoppingBag, Sparkles, Store, Tag, Trash2, TrendingUp, UserRound, UsersRound, Wallet, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { BottomNav, NavTab } from "../components/BottomNav";
import { CapsuleButton } from "../components/CapsuleButton";
import { GlassPanel } from "../components/GlassPanel";
import { Section } from "../components/Section";
import { UserProfileScreen } from "../components/UserProfileScreen";
import { ProviderMetricCarousel, ProviderProgressBar, ProviderRevenueChart } from "../components/ProviderAnalyticsWidgets";
import { currency, market } from "../lib/format";
import { formatPointsRate, pointsToAll } from "../lib/pointsConversion";
import { employerPayoutAmount } from "../lib/perkPayment";
import { buildProviderPaymentRows, computeProviderAnalytics, ProviderAnalytics, ProviderPaymentRow } from "../lib/providerAnalytics";
import { ensurePublicImageUrl, isLocalImageUri, uploadImageToStorage } from "../lib/imageUpload";
import { DEFAULT_PROVIDER_LOGO, isProviderProfileComplete, validateProviderProfileDraft } from "../lib/providerProfile";
import { createProviderOffer, PerxLiveData, upsertProviderProfile } from "../lib/perxRepository";
import { styles } from "../styles/appStyles";
import { colors } from "../theme";
import { Benefit, BenefitCategory, OfferDraft, ProviderProfile, SelectionRequest, User } from "../types";

type AppData = PerxLiveData;

const benefitCategoryOptions: BenefitCategory[] = [
  "Health",
  "Food",
  "Fitness",
  "Family",
  "Learning",
  "Mobility",
  "Wellness"
];

const businessCategoryIcons: Record<BenefitCategory, typeof Store> = {
  Food: ShoppingBag,
  Fitness: Dumbbell,
  Health: HeartPulse,
  Learning: GraduationCap,
  Mobility: Plane,
  Wellness: Sparkles,
  Family: UsersRound
};

const businessCategoryAvatar: Record<BenefitCategory, { background: string; color: string }> = {
  Food: { background: "rgba(76,74,202,0.14)", color: colors.tertiary },
  Fitness: { background: "rgba(0,110,40,0.14)", color: colors.secondary },
  Health: { background: "rgba(0,88,188,0.14)", color: colors.primary },
  Learning: { background: "rgba(0,88,188,0.14)", color: colors.primary },
  Mobility: { background: "rgba(76,74,202,0.14)", color: colors.tertiary },
  Wellness: { background: "rgba(0,110,40,0.14)", color: colors.secondary },
  Family: { background: "rgba(0,88,188,0.14)", color: colors.primary }
};

async function pickImageFromDevice(): Promise<string | null> {
  try {
    if (Platform.OS !== "web") {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission needed", "Allow photo access to upload images.");
        return null;
      }
    }

    // iOS often fails to present the picker when launched from inside a Modal.
    if (Platform.OS === "ios") {
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    });
    if (result.canceled || !result.assets?.[0]?.uri) return null;
    return result.assets[0].uri;
  } catch (error) {
    console.warn("Image picker failed", error);
    Alert.alert("Image picker", "Could not open your photo library. Try again.");
    return null;
  }
}

type BusinessTab = "home" | "analytics" | "customers" | "offers" | "profile";

const businessTabs: Array<NavTab<BusinessTab>> = [
  { id: "home", label: "Home", icon: "home-outline", iconActive: "home" },
  { id: "analytics", label: "Analytics", icon: "chart-box-outline", iconActive: "chart-box" },
  { id: "customers", label: "Customers", icon: "account-group-outline", iconActive: "account-group" },
  { id: "offers", label: "Offers", icon: "tag-outline", iconActive: "tag" },
  { id: "profile", label: "Profile", icon: "account-circle-outline", iconActive: "account-circle" }
];

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function CategoryGrid({
  options,
  value,
  onChange
}: {
  options: readonly BenefitCategory[];
  value: BenefitCategory;
  onChange: (next: BenefitCategory) => void;
}) {
  return (
    <View style={styles.categoryGrid}>
      {options.map((category) => {
        const selected = value === category;
        const Icon = businessCategoryIcons[category] ?? Store;
        const tint = businessCategoryAvatar[category] ?? { background: "rgba(0,88,188,0.14)", color: colors.primary };
        return (
          <Pressable
            key={category}
            onPress={() => onChange(category)}
            style={[
              styles.categoryTile,
              selected && styles.categoryTileActive,
              selected && { borderColor: tint.color, backgroundColor: tint.background }
            ]}
          >
            <Icon size={18} color={selected ? tint.color : colors.muted} />
            <Text
              style={[
                styles.categoryTileText,
                selected && { color: tint.color, fontWeight: "900" }
              ]}
            >
              {category}
            </Text>
            {selected ? (
              <View style={[styles.categoryTileCheck, { backgroundColor: tint.color }]}>
                <Check size={11} color={colors.onPrimary} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

type OfferFormDraft = OfferDraft & { category: BenefitCategory };

function OfferFormModal({
  visible,
  initial,
  defaultCategory,
  defaultCity,
  mode,
  onClose,
  onSubmit,
  onDelete
}: {
  visible: boolean;
  initial?: Benefit;
  defaultCategory: BenefitCategory;
  defaultCity: string;
  mode: "create" | "edit";
  onClose: () => void;
  onSubmit: (draft: OfferFormDraft) => Promise<void> | void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState<OfferFormDraft>(() => ({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    discount: initial?.discount ?? "",
    pointsPrice: initial ? String(initial.pointsPrice) : "",
    imageUrl: initial?.imageUrl ?? "",
    redemptionType: "NFC",
    validUntil: initial?.validUntil ?? "2026-12-31",
    category: initial?.category ?? defaultCategory
  }));
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDraft({
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      discount: initial?.discount ?? "",
      pointsPrice: initial ? String(initial.pointsPrice) : "",
      imageUrl: initial?.imageUrl ?? "",
      redemptionType: "NFC",
      validUntil: initial?.validUntil ?? "2026-12-31",
      category: initial?.category ?? defaultCategory
    });
  }, [visible, initial, defaultCategory]);

  const handlePickImage = async () => {
    const uri = await pickImageFromDevice();
    if (!uri) return;

    setDraft((current) => ({ ...current, imageUrl: uri }));
    setUploadingImage(true);
    try {
      const publicUrl = await uploadImageToStorage(uri, "offers");
      if (publicUrl && !isLocalImageUri(publicUrl)) {
        setDraft((current) => ({ ...current, imageUrl: publicUrl }));
      } else if (isLocalImageUri(uri)) {
        Alert.alert(
          "Photo selected",
          "Preview is ready. We will upload it when you publish the offer."
        );
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!draft.title.trim()) {
      Alert.alert("Missing title", "Give the offer a name before publishing.");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl = draft.imageUrl;
      if (imageUrl) {
        const uploaded = await ensurePublicImageUrl(imageUrl, "offers");
        if (isLocalImageUri(imageUrl) && (!uploaded || isLocalImageUri(uploaded))) {
          Alert.alert(
            "Upload failed",
            "The offer photo could not be uploaded. Try picking the image again."
          );
          return;
        }
        imageUrl = uploaded ?? imageUrl;
      }
      await onSubmit({ ...draft, imageUrl });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { flexShrink: 1 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{mode === "edit" ? "Edit offer" : "New offer"}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.modalClose}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView
              style={{ flexShrink: 1 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={[styles.modalContent, { paddingBottom: 120 }]}
              showsVerticalScrollIndicator={false}
            >
            <Pressable onPress={handlePickImage} disabled={uploadingImage} style={styles.imagePicker}>
              {draft.imageUrl ? (
                <Image source={{ uri: draft.imageUrl }} style={styles.imagePickerPreview} resizeMode="cover" />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Camera size={26} color={colors.muted} />
                  <Text style={styles.imagePickerLabel}>Tap to upload from your device</Text>
                  <Text style={styles.imagePickerHint}>JPG or PNG, 4:3 looks best</Text>
                </View>
              )}
              {uploadingImage ? (
                <View style={styles.imagePickerOverlay}>
                  <ActivityIndicator color={colors.onPrimary} />
                  <Text style={styles.imagePickerOverlayText}>Uploading…</Text>
                </View>
              ) : draft.imageUrl ? (
                <View style={styles.imagePickerOverlay}>
                  <Camera size={16} color={colors.onPrimary} />
                  <Text style={styles.imagePickerOverlayText}>Replace</Text>
                </View>
              ) : null}
            </Pressable>

            <Text style={styles.modalFieldLabel}>Image URL</Text>
            <TextInput
              value={draft.imageUrl}
              onChangeText={(imageUrl) => setDraft((c) => ({ ...c, imageUrl }))}
              placeholder="Paste a direct image address"
              placeholderTextColor={colors.muted}
              style={styles.input}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.imagePickerHint}>
              JPG or PNG, 4:3 looks best
            </Text>

            <Text style={styles.modalFieldLabel}>Title</Text>
            <TextInput
              value={draft.title}
              onChangeText={(title) => setDraft((c) => ({ ...c, title }))}
              placeholder="e.g. Monthly gym membership"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <Text style={styles.modalFieldLabel}>Discount</Text>
            <TextInput
              value={draft.discount}
              onChangeText={(discount) => setDraft((c) => ({ ...c, discount }))}
              placeholder="e.g. 20% off, 1 month free"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <Text style={styles.modalFieldLabel}>Points cost</Text>
            <TextInput
              value={draft.pointsPrice}
              onChangeText={(pointsPrice) => setDraft((c) => ({ ...c, pointsPrice }))}
              placeholder="140"
              placeholderTextColor={colors.muted}
              style={styles.input}
              keyboardType="numeric"
            />
            <Text style={styles.imagePickerHint}>{formatPointsRate()}</Text>
            {draft.pointsPrice.trim() ? (
              <Text style={styles.imagePickerHint}>
                Settlement preview: ≈ {currency(pointsToAll(Number(draft.pointsPrice) || 0))}
              </Text>
            ) : null}

            <Text style={styles.modalFieldLabel}>Category</Text>
            <CategoryGrid
              options={benefitCategoryOptions}
              value={draft.category}
              onChange={(category) => setDraft((c) => ({ ...c, category }))}
            />

            <Text style={styles.modalFieldLabel}>Description</Text>
            <TextInput
              value={draft.description}
              onChangeText={(description) => setDraft((c) => ({ ...c, description }))}
              placeholder="What does this perk include?"
              placeholderTextColor={colors.muted}
              style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
              multiline
            />

            <Text style={styles.modalFieldLabel}>Valid until</Text>
            <TextInput
              value={draft.validUntil}
              onChangeText={(validUntil) => setDraft((c) => ({ ...c, validUntil }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <View style={{ height: 8 }} />
            <CapsuleButton
              label={submitting ? "Publishing..." : mode === "edit" ? "Save changes" : "Publish offer"}
              onPress={() => void handleSubmit()}
              icon={<Plus size={16} color={colors.onPrimary} />}
            />
            {mode === "edit" && onDelete ? (
              <Pressable onPress={onDelete} style={styles.dangerButton}>
                <Trash2 size={16} color={colors.error} />
                <Text style={styles.dangerButtonText}>Archive offer</Text>
              </Pressable>
            ) : null}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function OfferDetailModal({
  visible,
  offer,
  stats,
  onClose,
  onEdit,
  onArchive
}: {
  visible: boolean;
  offer: Benefit | null;
  stats: { redemptions: number; revenue: number };
  onClose: () => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  if (!offer) return null;
  const Icon = businessCategoryIcons[offer.category] ?? Store;
  const tint = businessCategoryAvatar[offer.category] ?? { background: "rgba(0,88,188,0.14)", color: colors.primary };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{offer.title}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Image source={{ uri: offer.imageUrl }} style={styles.detailHeroImage} resizeMode="cover" />

            <View style={styles.detailMetaRow}>
              <View style={[styles.detailCategoryBadge, { backgroundColor: tint.background }]}>
                <Icon size={16} color={tint.color} />
                <Text style={[styles.detailCategoryText, { color: tint.color }]}>{offer.category}</Text>
              </View>
              <View style={styles.detailMetaPill}>
                <Tag size={14} color={colors.muted} />
                <Text style={styles.detailMetaText}>{offer.discount}</Text>
              </View>
              <View style={styles.detailMetaPill}>
                <Calendar size={14} color={colors.muted} />
                <Text style={styles.detailMetaText}>{offer.validUntil}</Text>
              </View>
              <View style={styles.detailMetaPill}>
                <MapPin size={14} color={colors.muted} />
                <Text style={styles.detailMetaText}>{offer.city}</Text>
              </View>
            </View>

            <View style={styles.detailStatsRow}>
              <GlassPanel style={styles.detailStatCard} intensity={28}>
                <Text style={styles.detailStatLabel}>Points cost</Text>
                <Text style={styles.detailStatValue}>{offer.pointsPrice.toLocaleString(market.locale)}</Text>
              </GlassPanel>
              <GlassPanel style={styles.detailStatCard} intensity={28}>
                <Text style={styles.detailStatLabel}>Settlement</Text>
                <Text style={styles.detailStatValue}>{currency(employerPayoutAmount(offer))}</Text>
              </GlassPanel>
              <GlassPanel style={styles.detailStatCard} intensity={28}>
                <Text style={styles.detailStatLabel}>Redemptions</Text>
                <Text style={styles.detailStatValue}>{stats.redemptions}</Text>
              </GlassPanel>
            </View>

            <Text style={styles.modalFieldLabel}>Description</Text>
            <Text style={styles.detailBody}>{offer.description}</Text>

            <View style={styles.detailKeyValueRow}>
              <Text style={styles.detailKeyLabel}>Total revenue</Text>
              <Text style={styles.detailKeyValue}>{currency(stats.revenue)}</Text>
            </View>
            <View style={styles.detailKeyValueRow}>
              <Text style={styles.detailKeyLabel}>Offer ID</Text>
              <Text style={styles.detailKeyValueMono}>{offer.id.slice(0, 14)}…</Text>
            </View>

            <View style={{ height: 16 }} />
            <CapsuleButton
              label="Edit offer"
              onPress={onEdit}
              icon={<Pencil size={16} color={colors.onPrimary} />}
            />
            <Pressable onPress={onArchive} style={styles.dangerButton}>
              <Trash2 size={16} color={colors.error} />
              <Text style={styles.dangerButtonText}>Archive offer</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function TransactionDetailModal({
  visible,
  data,
  onClose
}: {
  visible: boolean;
  data: { request: SelectionRequest; benefit: Benefit } | null;
  onClose: () => void;
}) {
  if (!data) return null;
  const { request, benefit } = data;
  const Icon = businessCategoryIcons[benefit.category] ?? Store;
  const tint = businessCategoryAvatar[benefit.category] ?? { background: "rgba(0,88,188,0.14)", color: colors.primary };
  const created = new Date(request.createdAt);
  const formattedDate = created.toLocaleString(market.locale, {
    dateStyle: "medium",
    timeStyle: "short"
  });
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Transaction</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.txDetailHero}>
              <View style={[styles.txDetailIcon, { backgroundColor: tint.background }]}>
                <Icon size={26} color={tint.color} />
              </View>
              <Text style={styles.txDetailAmount}>+{currency(employerPayoutAmount(benefit))}</Text>
              <View style={styles.txDetailBadge}>
                <BadgeCheck size={14} color={colors.secondary} />
                <Text style={styles.txDetailBadgeText}>Settled</Text>
              </View>
            </View>

            <GlassPanel style={styles.txDetailCard} intensity={32}>
              <View style={styles.detailKeyValueRow}>
                <Text style={styles.detailKeyLabel}>Date</Text>
                <Text style={styles.detailKeyValue}>{formattedDate}</Text>
              </View>
              <View style={styles.detailKeyValueRow}>
                <Text style={styles.detailKeyLabel}>Customer</Text>
                <Text style={styles.detailKeyValue}>{request.employeeName}</Text>
              </View>
              <View style={styles.detailKeyValueRow}>
                <Text style={styles.detailKeyLabel}>Offer</Text>
                <Text style={styles.detailKeyValue}>{benefit.title}</Text>
              </View>
              <View style={styles.detailKeyValueRow}>
                <Text style={styles.detailKeyLabel}>Category</Text>
                <Text style={styles.detailKeyValue}>{benefit.category}</Text>
              </View>
              <View style={styles.detailKeyValueRow}>
                <Text style={styles.detailKeyLabel}>Points charged</Text>
                <Text style={styles.detailKeyValue}>
                  {benefit.pointsPrice.toLocaleString(market.locale)}
                </Text>
              </View>
              <View style={styles.detailKeyValueRow}>
                <Text style={styles.detailKeyLabel}>Routed to</Text>
                <Text style={styles.detailKeyValue}>{benefit.providerName}</Text>
              </View>
              <View style={styles.detailKeyValueRow}>
                <Text style={styles.detailKeyLabel}>Transaction ID</Text>
                <Text style={styles.detailKeyValueMono}>{request.id.slice(0, 18)}…</Text>
              </View>
            </GlassPanel>

            <View style={{ height: 16 }} />
            <CapsuleButton label="Download receipt" onPress={() => Alert.alert("Receipt", "Receipt export is coming soon.")} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function BusinessExperience({
  user,
  appData,
  selectionRequests,
  onUpdateProviderProfile,
  onAddOffer,
  onLogout
}: {
  user: User;
  appData: AppData;
  selectionRequests: SelectionRequest[];
  onUpdateProviderProfile: (profile: ProviderProfile) => void;
  onAddOffer: (offer: Benefit) => void;
  onLogout: () => void;
}) {
  const existingProfile =
    appData.providerProfiles.find((profile) => profile.userId === user.id) ??
    appData.providerProfiles.find((profile) => profile.businessName === user.name);

  const [tab, setTab] = useState<BusinessTab>("home");
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Benefit | null>(null);
  const [detailOffer, setDetailOffer] = useState<Benefit | null>(null);
  const [detailTransaction, setDetailTransaction] = useState<{ request: SelectionRequest; benefit: Benefit } | null>(null);

  const [profileDraft, setProfileDraft] = useState({
    businessName: existingProfile?.businessName ?? user.name,
    description: existingProfile?.description ?? "",
    category: (existingProfile?.category ?? "Wellness") as BenefitCategory,
    logoUrl:
      existingProfile?.logoUrl && existingProfile.logoUrl !== DEFAULT_PROVIDER_LOGO
        ? existingProfile.logoUrl
        : "",
    city: existingProfile?.city ?? ""
  });

  const profileComplete = isProviderProfileComplete(profileDraft);
  const showProfileModal = profileEditOpen || !profileComplete;

  useEffect(() => {
    if (!existingProfile) return;
    setProfileDraft({
      businessName: existingProfile.businessName,
      description: existingProfile.description,
      category: existingProfile.category,
      logoUrl:
        existingProfile.logoUrl && existingProfile.logoUrl !== DEFAULT_PROVIDER_LOGO
          ? existingProfile.logoUrl
          : "",
      city: existingProfile.city
    });
  }, [existingProfile]);

  const [offers, setOffers] = useState<Benefit[]>(
    appData.benefits.filter((item) => item.businessId === (user.businessId ?? user.id))
  );

  useEffect(() => {
    setOffers(appData.benefits.filter((item) => item.businessId === (user.businessId ?? user.id)));
  }, [appData.benefits, user.businessId, user.id]);

  const providerBusinessId = user.businessId ?? user.id;

  const analytics = useMemo(() => {
    const paymentRows = buildProviderPaymentRows({
      selectionRequests,
      offers,
      companies: appData.companies,
      users: appData.users,
      providerBusinessId
    });
    return computeProviderAnalytics({ paymentRows, offers, selectionRequests });
  }, [selectionRequests, offers, appData.companies, appData.users, providerBusinessId]);

  const statsForOffer = useCallback(
    (offerId: string) => {
      const item = analytics.revenueByOffer.find((offer) => offer.offerId === offerId);
      return { redemptions: item?.redemptions ?? 0, revenue: item?.revenue ?? 0 };
    },
    [analytics]
  );

  const saveProviderProfile = async (next: typeof profileDraft) => {
    const validationError = validateProviderProfileDraft(next);
    if (validationError) {
      Alert.alert("Profile incomplete", validationError);
      return;
    }

    let logoUrl = next.logoUrl.trim();
    if (logoUrl) {
      const uploaded = await ensurePublicImageUrl(logoUrl, "logos");
      logoUrl = isLocalImageUri(logoUrl)
        ? (!uploaded || isLocalImageUri(uploaded)) ? DEFAULT_PROVIDER_LOGO : uploaded
        : uploaded ?? logoUrl;
    }
    if (!logoUrl) logoUrl = DEFAULT_PROVIDER_LOGO;

    const localProfile: ProviderProfile = {
      id: existingProfile?.id ?? `provider_${Date.now()}`,
      userId: user.id,
      businessName: next.businessName.trim() || user.name,
      logoUrl,
      description: next.description.trim(),
      category: next.category,
      city: next.city.trim() || market.city,
      isApproved: true
    };

    setProfileDraft({ ...next, logoUrl });

    const savedProfile = await upsertProviderProfile({
      providerUserId: user.id,
      businessName: localProfile.businessName,
      logoUrl: localProfile.logoUrl,
      description: localProfile.description,
      category: localProfile.category,
      city: localProfile.city
    });

    onUpdateProviderProfile(savedProfile ?? localProfile);
  };

  const handleOfferSubmit = async (draft: OfferFormDraft) => {
    let imageUrl = draft.imageUrl;
    if (imageUrl) {
      const uploaded = await ensurePublicImageUrl(imageUrl, "offers");
      if (isLocalImageUri(imageUrl) && (!uploaded || isLocalImageUri(uploaded))) {
        Alert.alert("Upload failed", "The offer photo could not be uploaded. Try picking the image again.");
        return;
      }
      imageUrl = uploaded ?? imageUrl;
    }

    if (editingOffer) {
      const pointsPrice = Number(draft.pointsPrice) || editingOffer.pointsPrice;
      const updated: Benefit = {
        ...editingOffer,
        title: draft.title,
        description: draft.description || editingOffer.description,
        discount: draft.discount || editingOffer.discount,
        price: pointsToAll(pointsPrice),
        pointsPrice,
        imageUrl: imageUrl || editingOffer.imageUrl,
        redemptionType: "NFC",
        category: draft.category,
        validUntil: draft.validUntil
      };
      onAddOffer(updated);
      setOffers((current) => current.map((o) => (o.id === updated.id ? updated : o)));
      setEditingOffer(null);
      return;
    }

    const pointsPrice = Number(draft.pointsPrice) || 140;
    const nextOffer: Benefit = {
      id: `benefit_${Date.now()}`,
      businessId: user.businessId ?? user.id,
      providerId: existingProfile?.id,
      providerName: profileDraft.businessName.trim() || user.name,
      title: draft.title,
      description: draft.description || "Member-only partner offer.",
      discount: draft.discount || "10% off",
      price: pointsToAll(pointsPrice),
      pointsPrice,
      imageUrl:
        imageUrl ||
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
      redemptionType: "NFC",
      category: draft.category,
      validUntil: draft.validUntil,
      city: profileDraft.city.trim() || market.city
    };

    const savedOffer = await createProviderOffer({
      providerUserId: user.id,
      providerName: nextOffer.providerName,
      title: nextOffer.title,
      description: nextOffer.description,
      discount: nextOffer.discount,
      price: nextOffer.price,
      pointsPrice: nextOffer.pointsPrice,
      imageUrl: nextOffer.imageUrl,
      redemptionType: "NFC",
      category: nextOffer.category,
      city: nextOffer.city
    });

    onAddOffer(savedOffer ?? nextOffer);
    setOffers((current) => [savedOffer ?? nextOffer, ...current]);
  };

  const handleArchiveOffer = (offer: Benefit) => {
    Alert.alert("Archive offer", `Hide "${offer.title}" from the marketplace?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        style: "destructive",
        onPress: () => {
          setOffers((current) => current.filter((o) => o.id !== offer.id));
          setDetailOffer(null);
          setEditingOffer(null);
          setOfferFormOpen(false);
        }
      }
    ]);
  };

  const handleOpenAdd = () => {
    if (!profileComplete) {
      Alert.alert("Finish your profile", "Complete your business profile before publishing offers.");
      return;
    }
    setEditingOffer(null);
    setOfferFormOpen(true);
  };

  const handleOpenEditFromDetail = () => {
    if (!detailOffer) return;
    setEditingOffer(detailOffer);
    setDetailOffer(null);
    setOfferFormOpen(true);
  };

  return (
    <View style={styles.roleShell}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, styles.adminContent]}
        showsVerticalScrollIndicator={false}
      >
        {tab === "home" ? (
          <BusinessHomeTab
            profileDraft={profileDraft}
            analytics={analytics}
            offerCount={offers.length}
            onEditProfile={() => setProfileEditOpen(true)}
            onAddOffer={handleOpenAdd}
            onGoToOffers={() => setTab("offers")}
            onGoToAnalytics={() => setTab("analytics")}
            onGoToCustomers={() => setTab("customers")}
            onSelectTransaction={(item) => setDetailTransaction({ request: item.request, benefit: item.benefit })}
          />
        ) : null}

        {tab === "analytics" ? (
          <BusinessAnalyticsTab
            analytics={analytics}
            offers={offers}
            onSelectOffer={(offer) => setDetailOffer(offer)}
          />
        ) : null}

        {tab === "customers" ? (
          <BusinessCustomersTab
            analytics={analytics}
            onSelectTransaction={(item) => setDetailTransaction({ request: item.request, benefit: item.benefit })}
          />
        ) : null}

        {tab === "offers" ? (
          <BusinessOffersTab
            offers={offers}
            statsForOffer={statsForOffer}
            onAdd={handleOpenAdd}
            onSelect={(offer) => setDetailOffer(offer)}
          />
        ) : null}

        {tab === "profile" ? <UserProfileScreen user={user} onLogout={onLogout} /> : null}
      </ScrollView>

      <BottomNav tabs={businessTabs} active={tab} onChange={setTab} />

      <OfferFormModal
        visible={offerFormOpen}
        initial={editingOffer ?? undefined}
        mode={editingOffer ? "edit" : "create"}
        defaultCategory={profileDraft.category}
        defaultCity={profileDraft.city}
        onClose={() => {
          setOfferFormOpen(false);
          setEditingOffer(null);
        }}
        onSubmit={handleOfferSubmit}
        onDelete={editingOffer ? () => handleArchiveOffer(editingOffer) : undefined}
      />

      <OfferDetailModal
        visible={!!detailOffer}
        offer={detailOffer}
        stats={detailOffer ? statsForOffer(detailOffer.id) : { redemptions: 0, revenue: 0 }}
        onClose={() => setDetailOffer(null)}
        onEdit={handleOpenEditFromDetail}
        onArchive={() => detailOffer && handleArchiveOffer(detailOffer)}
      />

      <TransactionDetailModal
        visible={!!detailTransaction}
        data={detailTransaction}
        onClose={() => setDetailTransaction(null)}
      />

      <ProfileEditModal
        visible={showProfileModal}
        mode={profileComplete ? "edit" : "onboarding"}
        initial={profileDraft}
        onClose={() => {
          if (!profileComplete) return;
          setProfileEditOpen(false);
        }}
        onSubmit={async (next) => {
          await saveProviderProfile(next);
          setProfileEditOpen(false);
        }}
      />
    </View>
  );
}

function BusinessHomeTab({
  profileDraft,
  analytics,
  offerCount,
  onEditProfile,
  onAddOffer,
  onGoToOffers,
  onGoToAnalytics,
  onGoToCustomers,
  onSelectTransaction
}: {
  profileDraft: {
    businessName: string;
    category: BenefitCategory;
    city: string;
    logoUrl: string;
  };
  analytics: ProviderAnalytics;
  offerCount: number;
  onEditProfile: () => void;
  onAddOffer: () => void;
  onGoToOffers: () => void;
  onGoToAnalytics: () => void;
  onGoToCustomers: () => void;
  onSelectTransaction: (row: ProviderPaymentRow) => void;
}) {
  const categoryTint =
    businessCategoryAvatar[profileDraft.category] ?? { background: "rgba(0,88,188,0.14)", color: colors.primary };

  const todayPreview = analytics.todayActivity.slice(0, 4);

  return (
    <>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.adminTitle}>Hi, {profileDraft.businessName}</Text>
        </View>
      </View>

      <Pressable onPress={onEditProfile}>
        <GlassPanel style={styles.compactPanel} intensity={18}>
          <View style={styles.adminListRow}>
            <Image
              source={{ uri: profileDraft.logoUrl || DEFAULT_PROVIDER_LOGO }}
              style={styles.providerHomeLogo}
            />
            <View style={styles.listText}>
              <Text style={styles.listTitle} numberOfLines={1}>
                {profileDraft.businessName}
              </Text>
              <Text style={styles.listSub} numberOfLines={1}>
                {profileDraft.city} · {profileDraft.category}
              </Text>
            </View>
            <Pencil size={16} color={colors.muted} />
          </View>
        </GlassPanel>
      </Pressable>

      <View style={styles.employerStatGrid}>
        <View style={styles.employerStatCapsule}>
          <Wallet size={14} color={colors.primary} />
          <Text style={styles.employerStatValue}>{currency(analytics.totalRevenue)}</Text>
          <Text style={styles.employerStatLabel}>Revenue</Text>
        </View>
        <View style={styles.employerStatCapsule}>
          <TrendingUp size={14} color={colors.secondary} />
          <Text style={styles.employerStatValue}>{currency(analytics.averageTransactionValue)}</Text>
          <Text style={styles.employerStatLabel}>Avg sale</Text>
        </View>
        <View style={styles.employerStatCapsule}>
          <UsersRound size={14} color={colors.tertiary} />
          <Text style={styles.employerStatValue}>{analytics.customers.length}</Text>
          <Text style={styles.employerStatLabel}>Customers</Text>
        </View>
        <View style={styles.employerStatCapsule}>
          <Store size={14} color={colors.accent} />
          <Text style={styles.employerStatValue}>{offerCount}</Text>
          <Text style={styles.employerStatLabel}>Live offers</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.employerActionRow}>
        <Pressable onPress={onAddOffer} style={styles.employerActionCapsule}>
          <Plus size={14} color={colors.primary} />
          <Text style={styles.employerActionCapsuleText}>New offer</Text>
        </Pressable>
        <Pressable onPress={onGoToAnalytics} style={styles.employerActionCapsule}>
          <TrendingUp size={14} color={colors.primary} />
          <Text style={styles.employerActionCapsuleText}>Analytics</Text>
        </Pressable>
        <Pressable onPress={onGoToCustomers} style={styles.employerActionCapsule}>
          <UsersRound size={14} color={colors.primary} />
          <Text style={styles.employerActionCapsuleText}>Customers</Text>
        </Pressable>
        <Pressable onPress={onGoToOffers} style={styles.employerActionCapsule}>
          <Tag size={14} color={colors.primary} />
          <Text style={styles.employerActionCapsuleText}>All offers</Text>
        </Pressable>
      </ScrollView>

      <Section dense title="Revenue" meta="Last 7 days">
        <GlassPanel style={styles.compactPanel} intensity={16}>
          <ProviderRevenueChart data={analytics.revenueByDay} />
        </GlassPanel>
      </Section>

      <Section dense
        title="Today's activity"
        meta={analytics.todayActivity.length ? `${analytics.todayActivity.length} today` : undefined}
      >
        {todayPreview.length ? (
          <GlassPanel style={styles.compactPanel} intensity={16}>
            {todayPreview.map((row, index) => {
              const Icon = businessCategoryIcons[row.benefit.category] ?? Store;
              const tint = businessCategoryAvatar[row.benefit.category] ?? categoryTint;
              const last = index === todayPreview.length - 1;
              return (
                <Pressable
                  key={`${row.request.id}-${row.benefit.id}`}
                  onPress={() => onSelectTransaction(row)}
                  style={[styles.providerHomeRow, !last && styles.providerHomeRowDivider]}
                >
                  <View style={[styles.smallIcon, { backgroundColor: tint.background }]}>
                    <Icon size={16} color={tint.color} />
                  </View>
                  <View style={styles.listText}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {row.benefit.title}
                    </Text>
                    <Text style={styles.listSub}>
                      {row.request.employeeName.split(" ")[0]} · {row.companyName}
                    </Text>
                  </View>
                  <Text style={styles.providerHomeAmount}>+{currency(employerPayoutAmount(row.benefit))}</Text>
                </Pressable>
              );
            })}
            {analytics.todayActivity.length > todayPreview.length ? (
              <Pressable onPress={onGoToCustomers} style={styles.providerHomeSeeAll}>
                <Text style={styles.challengeLinkText}>See all activity</Text>
              </Pressable>
            ) : null}
          </GlassPanel>
        ) : (
          <GlassPanel style={styles.compactPanel} intensity={16}>
            <View style={styles.adminListRow}>
              <View style={styles.smallIcon}>
                <Activity size={16} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>Quiet day so far</Text>
                <Text style={styles.listSub}>Redemptions today will appear here in real time.</Text>
              </View>
            </View>
          </GlassPanel>
        )}
      </Section>

      <Section
        title="Top companies"
        meta={analytics.topCompanies.length ? "By revenue" : undefined}
      >
        {analytics.topCompanies.length ? (
          <GlassPanel style={styles.compactPanel} intensity={16}>
            {analytics.topCompanies.map((company, index) => {
              const last = index === analytics.topCompanies.length - 1;
              const maxRevenue = analytics.topCompanies[0]?.revenue ?? 1;
              return (
                <View
                  key={company.companyId}
                  style={[styles.providerHomeRow, !last && styles.providerHomeRowDivider]}
                >
                  <View style={[styles.smallIcon, { backgroundColor: "rgba(0,88,188,0.12)" }]}>
                    <Building2 size={16} color={colors.primary} />
                  </View>
                  <View style={styles.providerStatContent}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {company.companyName}
                    </Text>
                    <Text style={[styles.listSub, styles.providerStatSub]}>
                      {company.redemptions} redemption{company.redemptions === 1 ? "" : "s"} · {currency(company.revenue)}
                    </Text>
                    <ProviderProgressBar ratio={company.revenue / maxRevenue} />
                  </View>
                </View>
              );
            })}
          </GlassPanel>
        ) : (
          <GlassPanel style={styles.compactPanel} intensity={16}>
            <View style={styles.adminListRow}>
              <View style={styles.smallIcon}>
                <Building2 size={16} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>No company data yet</Text>
                <Text style={styles.listSub}>Employer redemptions will rank here once they start.</Text>
              </View>
            </View>
          </GlassPanel>
        )}
      </Section>
    </>
  );
}

function BusinessAnalyticsTab({
  analytics,
  offers,
  onSelectOffer
}: {
  analytics: ProviderAnalytics;
  offers: Benefit[];
  onSelectOffer: (offer: Benefit) => void;
}) {
  const revenueSorted = [...analytics.revenueByOffer].sort((a, b) => b.revenue - a.revenue);
  const maxOfferRevenue = revenueSorted[0]?.revenue ?? 1;
  const metricItems = [
    { label: "Total revenue", value: currency(analytics.totalRevenue) },
    {
      label: "Avg transaction",
      value: currency(analytics.averageTransactionValue),
      hint: "Per redemption"
    },
    {
      label: "Conversion rate",
      value: `${analytics.conversionRate}%`,
      hint: "Redemptions vs views"
    },
    {
      label: "Redemptions",
      value: String(analytics.totalRedemptions),
      hint: `${analytics.totalViews} views`
    },
    {
      label: "Customers",
      value: String(analytics.customers.length),
      hint: "Redeemed employees"
    },
    {
      label: "Live offers",
      value: String(offers.length),
      hint: "Published perks"
    }
  ];

  return (
    <>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.adminTitle}>Analytics</Text>
        </View>
      </View>

      <ProviderMetricCarousel items={metricItems} />

      <Section dense title="Revenue by offer" meta={revenueSorted.length ? `${revenueSorted.length} live` : undefined}>
        {revenueSorted.length ? (
          <GlassPanel style={styles.compactPanel} intensity={16}>
            {revenueSorted.map((item, index) => {
              const offer = offers.find((entry) => entry.id === item.offerId);
              const last = index === revenueSorted.length - 1;
              const Icon = offer ? businessCategoryIcons[offer.category] ?? Store : Store;
              const tint = offer
                ? businessCategoryAvatar[offer.category] ?? { background: "rgba(0,88,188,0.14)", color: colors.primary }
                : { background: "rgba(0,88,188,0.14)", color: colors.primary };
              return (
                <Pressable
                  key={item.offerId}
                  disabled={!offer}
                  onPress={() => offer && onSelectOffer(offer)}
                  style={[styles.providerHomeRow, !last && styles.providerHomeRowDivider]}
                >
                  <View style={[styles.smallIcon, { backgroundColor: tint.background }]}>
                    <Icon size={16} color={tint.color} />
                  </View>
                  <View style={styles.providerStatContent}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.listSub, styles.providerStatSub]}>
                      {item.redemptions} redemption{item.redemptions === 1 ? "" : "s"} · {currency(item.revenue)}
                    </Text>
                    <ProviderProgressBar ratio={item.revenue / maxOfferRevenue} />
                  </View>
                  {offer ? <ChevronRight size={16} color={colors.muted} /> : null}
                </Pressable>
              );
            })}
          </GlassPanel>
        ) : (
          <GlassPanel style={styles.compactPanel} intensity={16}>
            <View style={styles.adminListRow}>
              <View style={styles.smallIcon}>
                <Tag size={16} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>No offer revenue yet</Text>
                <Text style={styles.listSub}>Publish offers to start tracking revenue by perk.</Text>
              </View>
            </View>
          </GlassPanel>
        )}
      </Section>

      <Section dense title="Best-performing perks" meta="By redemptions">
        {analytics.bestPerforming.length ? (
          <GlassPanel style={styles.compactPanel} intensity={16}>
            {analytics.bestPerforming.map((item, index) => {
              const last = index === analytics.bestPerforming.length - 1;
              return (
                <View
                  key={item.offerId}
                  style={[styles.providerHomeRow, !last && styles.providerHomeRowDivider]}
                >
                  <View style={[styles.smallIcon, { backgroundColor: "rgba(0,88,188,0.12)" }]}>
                    <Sparkles size={16} color={colors.primary} />
                  </View>
                  <View style={styles.listText}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.listSub}>
                      {item.redemptions} redemption{item.redemptions === 1 ? "" : "s"} · {item.conversionRate}% conversion
                    </Text>
                  </View>
                  <Text style={styles.providerHomeAmount}>{currency(item.revenue)}</Text>
                </View>
              );
            })}
          </GlassPanel>
        ) : (
          <GlassPanel style={styles.compactPanel} intensity={16}>
            <View style={styles.adminListRow}>
              <View style={styles.smallIcon}>
                <Sparkles size={16} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>No performance data yet</Text>
                <Text style={styles.listSub}>Top perks will rank here after the first redemptions.</Text>
              </View>
            </View>
          </GlassPanel>
        )}
      </Section>

      <Section dense title="Views vs redemptions" meta="Per offer">
        {analytics.revenueByOffer.length ? (
          <GlassPanel style={styles.compactPanel} intensity={16}>
            {analytics.revenueByOffer.map((item, index) => {
              const last = index === analytics.revenueByOffer.length - 1;
              const viewRatio = item.views > 0 ? item.redemptions / item.views : 0;
              return (
                <View
                  key={`views-${item.offerId}`}
                  style={[styles.providerHomeRow, !last && styles.providerHomeRowDivider]}
                >
                  <View style={styles.providerStatContent}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.listSub, styles.providerStatSub]}>
                      {item.views} views · {item.redemptions} redeemed · {item.conversionRate}%
                    </Text>
                    <ProviderProgressBar ratio={viewRatio} />
                  </View>
                </View>
              );
            })}
          </GlassPanel>
        ) : null}
      </Section>
    </>
  );
}

function BusinessCustomersTab({
  analytics,
  onSelectTransaction
}: {
  analytics: ProviderAnalytics;
  onSelectTransaction: (row: ProviderPaymentRow) => void;
}) {
  const categoryTint = { background: "rgba(0,88,188,0.14)", color: colors.primary };
  const history = useMemo(
    () =>
      [...analytics.paymentRows].sort(
        (a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
      ),
    [analytics.paymentRows]
  );

  return (
    <>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.adminTitle}>Customers</Text>
        </View>
      </View>

      <Section dense title="Customer list" meta={analytics.customers.length ? "Redeemed employees" : undefined}>
        {analytics.customers.length ? (
          <GlassPanel style={styles.compactPanel} intensity={16}>
            {analytics.customers.map((customer, index) => {
              const last = index === analytics.customers.length - 1;
              return (
                <View
                  key={customer.employeeId}
                  style={[styles.providerHomeRow, !last && styles.providerHomeRowDivider]}
                >
                  <View style={[styles.smallIcon, { backgroundColor: categoryTint.background }]}>
                    <UserRound size={16} color={categoryTint.color} />
                  </View>
                  <View style={styles.listText}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {customer.employeeName}
                    </Text>
                    <Text style={styles.listSub}>
                      {customer.companyName} · {customer.redemptions} visit{customer.redemptions === 1 ? "" : "s"} ·{" "}
                      {currency(customer.totalSpent)}
                    </Text>
                    <Text style={styles.listSub}>Last · {formatShortDate(customer.lastRedemptionAt)}</Text>
                  </View>
                </View>
              );
            })}
          </GlassPanel>
        ) : (
          <GlassPanel style={styles.compactPanel} intensity={16}>
            <View style={styles.adminListRow}>
              <View style={styles.smallIcon}>
                <UsersRound size={16} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>No customers yet</Text>
                <Text style={styles.listSub}>Redeeming employees and their companies will show up here.</Text>
              </View>
            </View>
          </GlassPanel>
        )}
      </Section>

      <Section dense title="Redemption history" meta={history.length ? `${history.length} total` : undefined}>
        {history.length ? (
          <GlassPanel style={styles.compactPanel} intensity={16}>
            {history.map((row, index) => {
              const Icon = businessCategoryIcons[row.benefit.category] ?? Store;
              const tint = businessCategoryAvatar[row.benefit.category] ?? categoryTint;
              const last = index === history.length - 1;
              return (
                <Pressable
                  key={`${row.request.id}-${row.benefit.id}-${index}`}
                  onPress={() => onSelectTransaction(row)}
                  style={[styles.providerHomeRow, !last && styles.providerHomeRowDivider]}
                >
                  <View style={[styles.smallIcon, { backgroundColor: tint.background }]}>
                    <Icon size={16} color={tint.color} />
                  </View>
                  <View style={styles.listText}>
                    <Text style={styles.listTitle} numberOfLines={1}>
                      {row.benefit.title}
                    </Text>
                    <Text style={styles.listSub}>
                      {row.request.employeeName} · {row.companyName}
                    </Text>
                    <Text style={styles.listSub}>{formatShortDate(row.redeemedAt)} · Settled</Text>
                  </View>
                  <Text style={styles.providerHomeAmount}>+{currency(employerPayoutAmount(row.benefit))}</Text>
                </Pressable>
              );
            })}
          </GlassPanel>
        ) : (
          <GlassPanel style={styles.compactPanel} intensity={16}>
            <View style={styles.adminListRow}>
              <View style={styles.smallIcon}>
                <CircleDollarSign size={16} color={colors.text} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>No redemptions yet</Text>
                <Text style={styles.listSub}>Full payout history will live here once employees start redeeming.</Text>
              </View>
            </View>
          </GlassPanel>
        )}
      </Section>
    </>
  );
}

function BusinessOffersTab({
  offers,
  statsForOffer,
  onAdd,
  onSelect
}: {
  offers: Benefit[];
  statsForOffer: (offerId: string) => { redemptions: number; revenue: number };
  onAdd: () => void;
  onSelect: (offer: Benefit) => void;
}) {
  return (
    <>
      <View style={styles.offersHeader}>
        <View>
          <Text style={styles.adminTitle}>Offers</Text>
          <Text style={styles.insightsTagline}>
            {offers.length ? `${offers.length} live offer${offers.length === 1 ? "" : "s"}` : "Publish your first offer to start earning."}
          </Text>
        </View>
        <Pressable style={styles.offersHeaderAction} onPress={onAdd}>
          <Plus size={16} color={colors.onPrimary} />
          <Text style={styles.offersHeaderActionText}>New</Text>
        </Pressable>
      </View>

      {offers.length ? offers.map((offer) => {
        const stats = statsForOffer(offer.id);
        return (
          <Pressable key={offer.id} onPress={() => onSelect(offer)}>
            <GlassPanel style={styles.offerListCard} intensity={20}>
              <Image source={{ uri: offer.imageUrl }} style={styles.offerListThumb} resizeMode="cover" />
              <View style={styles.offerListBody}>
                <Text style={styles.offerListTitle}>{offer.title}</Text>
                <Text style={styles.offerListMeta}>
                  {offer.discount} · {offer.category}
                </Text>
                <View style={styles.offerListSubRow}>
                  <View style={styles.offerListPriceChip}>
                    <Text style={styles.offerListPriceText}>{offer.pointsPrice} pts</Text>
                  </View>
                  <Text style={styles.offerListMeta}>{stats.redemptions} redemptions</Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </GlassPanel>
          </Pressable>
        );
      }) : (
        <GlassPanel style={styles.txList} intensity={32}>
          <View style={styles.txEmpty}>
            <View style={styles.smallIcon}>
              <Tag size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No offers yet</Text>
              <Text style={styles.listSub}>Tap "New" to publish your first offer.</Text>
            </View>
          </View>
        </GlassPanel>
      )}
    </>
  );
}

function ProfileEditModal({
  visible,
  mode = "edit",
  initial,
  onClose,
  onSubmit
}: {
  visible: boolean;
  mode?: "edit" | "onboarding";
  initial: {
    businessName: string;
    description: string;
    category: BenefitCategory;
    logoUrl: string;
    city: string;
  };
  onClose: () => void;
  onSubmit: (next: typeof initial) => Promise<void> | void;
}) {
  const [draft, setDraft] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (visible) setDraft(initial);
  }, [visible, initial]);

  const handlePickLogo = async () => {
    const uri = await pickImageFromDevice();
    if (!uri) return;
    setDraft((current) => ({ ...current, logoUrl: uri }));
    setUploadingLogo(true);
    try {
      const publicUrl = await uploadImageToStorage(uri, "logos");
      if (publicUrl) {
        setDraft((current) => ({ ...current, logoUrl: publicUrl }));
      } else {
        Alert.alert(
          "Upload failed",
          "Could not upload the logo. Check your connection and try again."
        );
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    const validationError = validateProviderProfileDraft(draft);
    if (validationError) {
      Alert.alert("Profile incomplete", validationError);
      return;
    }

    setSubmitting(true);
    try {
      let logoUrl = draft.logoUrl;
      if (logoUrl) {
        const uploaded = await ensurePublicImageUrl(logoUrl, "logos");
        logoUrl = isLocalImageUri(logoUrl)
          ? (!uploaded || isLocalImageUri(uploaded)) ? DEFAULT_PROVIDER_LOGO : uploaded
          : uploaded ?? logoUrl;
      }
      if (!logoUrl) logoUrl = DEFAULT_PROVIDER_LOGO;
      await onSubmit({ ...draft, logoUrl });
      if (mode === "edit") onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const isOnboarding = mode === "onboarding";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={isOnboarding ? () => undefined : onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { flexShrink: 1 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {isOnboarding ? "Set up your business profile" : "Edit profile"}
                </Text>
              </View>
              {isOnboarding ? null : (
                <Pressable onPress={onClose} style={styles.modalClose}>
                  <X size={18} color={colors.text} />
                </Pressable>
              )}
            </View>
            <ScrollView
              style={{ flexShrink: 1 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
            <Text style={styles.modalFieldLabel}>Logo (optional)</Text>
            <Pressable onPress={handlePickLogo} disabled={uploadingLogo} style={styles.imagePicker}>
              {draft.logoUrl ? (
                <Image source={{ uri: draft.logoUrl }} style={styles.imagePickerPreview} resizeMode="cover" />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Camera size={26} color={colors.muted} />
                  <Text style={styles.imagePickerLabel}>Upload a logo</Text>
                </View>
              )}
              {uploadingLogo ? (
                <View style={styles.imagePickerOverlay}>
                  <ActivityIndicator color={colors.onPrimary} />
                  <Text style={styles.imagePickerOverlayText}>Uploading…</Text>
                </View>
              ) : draft.logoUrl ? (
                <View style={styles.imagePickerOverlay}>
                  <Camera size={16} color={colors.onPrimary} />
                  <Text style={styles.imagePickerOverlayText}>Replace logo</Text>
                </View>
              ) : null}
            </Pressable>

            <Text style={styles.modalFieldLabel}>Logo URL</Text>
            <TextInput
              value={draft.logoUrl}
              onChangeText={(logoUrl) => setDraft((c) => ({ ...c, logoUrl }))}
              placeholder="Paste a direct logo image address"
              placeholderTextColor={colors.muted}
              style={styles.input}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.modalFieldLabel}>Business name *</Text>
            <TextInput
              value={draft.businessName}
              onChangeText={(businessName) => setDraft((c) => ({ ...c, businessName }))}
              placeholder="Business name"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <Text style={styles.modalFieldLabel}>Description *</Text>
            <TextInput
              value={draft.description}
              onChangeText={(description) => setDraft((c) => ({ ...c, description }))}
              placeholder="One-liner that sells your business."
              placeholderTextColor={colors.muted}
              style={[styles.input, { minHeight: 84, textAlignVertical: "top" }]}
              multiline
            />

            <Text style={styles.modalFieldLabel}>Category *</Text>
            <CategoryGrid
              options={benefitCategoryOptions}
              value={draft.category}
              onChange={(category) => setDraft((c) => ({ ...c, category }))}
            />

            <Text style={styles.modalFieldLabel}>City *</Text>
            <TextInput
              value={draft.city}
              onChangeText={(city) => setDraft((c) => ({ ...c, city }))}
              placeholder="Your city"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <View style={{ height: 8 }} />
            <CapsuleButton
              label={submitting ? "Saving..." : isOnboarding ? "Finish setup" : "Save profile"}
              onPress={() => void handleSave()}
              icon={<Check size={16} color={colors.onPrimary} />}
            />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

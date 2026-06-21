import * as ImagePicker from "expo-image-picker";
import { Activity, BadgeCheck, Building2, Calendar, Camera, Check, ChevronRight, Dumbbell, GraduationCap, HeartPulse, Home, LayoutGrid, MapPin, Pencil, Plane, Plus, Settings, ShieldCheck, ShoppingBag, Sparkles, Store, Tag, Trash2, TrendingUp, UserRound, UsersRound, Wallet, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { AccountSettingsHub } from "../components/AccountSettingsHub";
import { AppIcon } from "../components/AppIcon";
import { BentoMetricCard } from "../components/BentoMetricCard";
import { CapsuleButton } from "../components/CapsuleButton";
import { GlassPanel } from "../components/GlassPanel";
import { currency, market } from "../lib/format";
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    });
    if (result.canceled || !result.assets?.[0]) return null;
    return result.assets[0].uri;
  } catch (error) {
    Alert.alert("Image picker", "Could not open the picker. Make sure expo-image-picker is installed.");
    return null;
  }
}

type BusinessTab = "home" | "offers" | "profile" | "account";

function BusinessBottomNav({
  active,
  onChange,
  onAddOffer
}: {
  active: BusinessTab;
  onChange: (tab: BusinessTab) => void;
  onAddOffer: () => void;
}) {
  const items: Array<{ key: BusinessTab; Icon: typeof Home; label: string }> = [
    { key: "home", Icon: Home, label: "Home" },
    { key: "offers", Icon: LayoutGrid, label: "Offers" },
    { key: "profile", Icon: Store, label: "Profile" },
    { key: "account", Icon: Settings, label: "Account" }
  ];
  return (
    <View style={styles.businessNav} pointerEvents="box-none">
      <View style={styles.businessNavPill}>
        {items.map(({ key, Icon, label }) => {
          const isActive = active === key;
          return (
            <BusinessNavItem
              key={key}
              Icon={Icon}
              label={label}
              selected={isActive}
              onPress={() => onChange(key)}
            />
          );
        })}
        <Pressable
          onPress={onAddOffer}
          style={({ pressed }) => [styles.businessNavFab, pressed && styles.navItemPressed]}
        >
          <Plus size={20} color={colors.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

function BusinessNavItem({
  Icon,
  label,
  selected,
  onPress
}: {
  Icon: typeof Home;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: selected ? 1 : 0,
      duration: 190,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [progress, selected]);

  const activeScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1]
  });
  const iconScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08]
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.businessNavItem, pressed && styles.navItemPressed]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.businessNavItemActiveLayer,
          { opacity: progress, transform: [{ scale: activeScale }] }
        ]}
      />
      <Animated.View style={{ transform: [{ scale: iconScale }] }}>
        <Icon size={20} color={selected ? colors.onPrimary : colors.muted} />
      </Animated.View>
      <Text style={[styles.businessNavLabel, selected && styles.businessNavLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
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
    price: initial ? String(initial.price) : "",
    pointsPrice: initial ? String(initial.pointsPrice) : "",
    imageUrl: initial?.imageUrl ?? "",
    redemptionType: initial?.redemptionType ?? "QR",
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
      price: initial ? String(initial.price) : "",
      pointsPrice: initial ? String(initial.pointsPrice) : "",
      imageUrl: initial?.imageUrl ?? "",
      redemptionType: initial?.redemptionType ?? "QR",
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
      if (publicUrl) {
        setDraft((current) => ({ ...current, imageUrl: publicUrl }));
      } else {
        Alert.alert(
          "Upload failed",
          "Could not upload the photo. Check your connection and try again."
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
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{mode === "edit" ? "Edit offer" : "New offer"}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <X size={18} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
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

            <View style={styles.modalRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalFieldLabel}>Price ({market.currency})</Text>
                <TextInput
                  value={draft.price}
                  onChangeText={(price) => setDraft((c) => ({ ...c, price }))}
                  placeholder="1200"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalFieldLabel}>Employer points</Text>
                <TextInput
                  value={draft.pointsPrice}
                  onChangeText={(pointsPrice) => setDraft((c) => ({ ...c, pointsPrice }))}
                  placeholder="140"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  keyboardType="numeric"
                />
              </View>
            </View>

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

            <Text style={styles.modalFieldLabel}>Redemption</Text>
            <View style={styles.segmented}>
              {(["QR", "NFC"] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setDraft((c) => ({ ...c, redemptionType: type }))}
                  style={[styles.segment, draft.redemptionType === type && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, draft.redemptionType === type && styles.segmentTextActive]}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>

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
                <Text style={styles.detailStatLabel}>Price</Text>
                <Text style={styles.detailStatValue}>{currency(offer.price)}</Text>
              </GlassPanel>
              <GlassPanel style={styles.detailStatCard} intensity={28}>
                <Text style={styles.detailStatLabel}>Employer pts</Text>
                <Text style={styles.detailStatValue}>{offer.pointsPrice.toLocaleString(market.locale)}</Text>
              </GlassPanel>
              <GlassPanel style={styles.detailStatCard} intensity={28}>
                <Text style={styles.detailStatLabel}>Redemptions</Text>
                <Text style={styles.detailStatValue}>{stats.redemptions}</Text>
              </GlassPanel>
            </View>

            <Text style={styles.modalFieldLabel}>Description</Text>
            <Text style={styles.detailBody}>{offer.description}</Text>

            <View style={styles.detailKeyValueRow}>
              <Text style={styles.detailKeyLabel}>Redemption method</Text>
              <Text style={styles.detailKeyValue}>{offer.redemptionType}</Text>
            </View>
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
              <Text style={styles.txDetailAmount}>+{currency(benefit.price)}</Text>
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

function PulseDot({ delay = 0 }: { delay?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    opacity.setValue(0.3);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: false })
      ]),
      { resetBeforeIteration: true }
    );
    animation.start();
    return () => {
      animation.stop();
      opacity.setValue(0.3);
    };
  }, [delay, opacity]);

  return <Animated.View style={[styles.activityPulseDot, { opacity }]} />;
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
  const allBenefits = useMemo(
    () => [...appData.benefits.filter((item) => !offers.some((offer) => offer.id === item.id)), ...offers],
    [appData.benefits, offers]
  );

  useEffect(() => {
    setOffers(appData.benefits.filter((item) => item.businessId === (user.businessId ?? user.id)));
  }, [appData.benefits, user.businessId, user.id]);

  const routedPayments = useMemo(
    () =>
      selectionRequests.flatMap((request) =>
        request.benefitIds
          .map((benefitId) => allBenefits.find((benefit) => benefit.id === benefitId))
          .filter((benefit): benefit is Benefit => Boolean(benefit))
          .filter((benefit) => benefit.businessId === user.businessId)
          .map((benefit) => ({ request, benefit }))
      ),
    [selectionRequests, allBenefits, user.businessId]
  );
  const payoutTotal = routedPayments.reduce((sum, { benefit }) => sum + benefit.price, 0);
  const pointsRedeemed = routedPayments.reduce((sum, { benefit }) => sum + benefit.pointsPrice, 0);
  const reachedEmployees = new Set(routedPayments.map(({ request }) => request.employeeId)).size;

  const statsForOffer = (offerId: string) => {
    const matches = routedPayments.filter(({ benefit }) => benefit.id === offerId);
    return {
      redemptions: matches.length,
      revenue: matches.reduce((sum, { benefit }) => sum + benefit.price, 0)
    };
  };

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
      const updated: Benefit = {
        ...editingOffer,
        title: draft.title,
        description: draft.description || editingOffer.description,
        discount: draft.discount || editingOffer.discount,
        price: Number(draft.price) || editingOffer.price,
        pointsPrice: Number(draft.pointsPrice) || editingOffer.pointsPrice,
        imageUrl: imageUrl || editingOffer.imageUrl,
        redemptionType: draft.redemptionType,
        category: draft.category,
        validUntil: draft.validUntil
      };
      onAddOffer(updated);
      setOffers((current) => current.map((o) => (o.id === updated.id ? updated : o)));
      setEditingOffer(null);
      return;
    }

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
        imageUrl ||
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
      redemptionType: draft.redemptionType,
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
      redemptionType: nextOffer.redemptionType,
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
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, styles.businessContent]}
        showsVerticalScrollIndicator={false}
      >
        {tab === "home" ? (
            <BusinessHomeTab
              profileDraft={profileDraft}
              payoutTotal={payoutTotal}
              pointsRedeemed={pointsRedeemed}
              reachedEmployees={reachedEmployees}
              routedPayments={routedPayments}
              onOpenAccount={() => setTab("account")}
              onSelectTransaction={(item) => setDetailTransaction(item)}
              onSeeAllTransactions={() => setTab("offers")}
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

          {tab === "profile" ? (
            <BusinessProfileTab
              user={user}
              profile={profileDraft}
              offerCount={offers.length}
              customerCount={reachedEmployees}
              payoutTotal={payoutTotal}
              onEdit={() => setProfileEditOpen(true)}
            />
          ) : null}

          {tab === "account" ? (
            <BusinessAccountTab
              user={user}
              profile={profileDraft}
              onLogout={onLogout}
            />
          ) : null}
      </ScrollView>

      <BusinessBottomNav active={tab} onChange={setTab} onAddOffer={handleOpenAdd} />

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
  payoutTotal,
  pointsRedeemed,
  reachedEmployees,
  routedPayments,
  onOpenAccount,
  onSelectTransaction,
  onSeeAllTransactions
}: {
  profileDraft: { businessName: string };
  payoutTotal: number;
  pointsRedeemed: number;
  reachedEmployees: number;
  routedPayments: Array<{ request: SelectionRequest; benefit: Benefit }>;
  onOpenAccount: () => void;
  onSelectTransaction: (data: { request: SelectionRequest; benefit: Benefit }) => void;
  onSeeAllTransactions: () => void;
}) {
  const heroTagline = routedPayments.length > 0
    ? `Your business ecosystem at a glance. ${reachedEmployees} ${reachedEmployees === 1 ? "person" : "people"} reached this period.`
    : `Your business ecosystem at a glance. Publish your first offer to start tracking redemptions, ${profileDraft.businessName.split(" ")[0]}.`;

  const growthTrend = routedPayments.length > 0
    ? `+${Math.min(48, routedPayments.length * 8)}%`
    : "+0%";

  const recentTransactions = routedPayments.slice(0, 6);

  return (
    <>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.greetingText}>Insights</Text>
          <Text style={styles.insightsTagline}>{heroTagline}</Text>
        </View>
        <Pressable onPress={onOpenAccount} style={styles.searchPill}>
          <AppIcon name="account-cog-outline" size={18} color={colors.soft} />
        </Pressable>
      </View>

      <View style={styles.bentoRow}>
        <BentoMetricCard
          title="Revenue"
          value={currency(payoutTotal)}
          trend={growthTrend}
          accent={colors.primary}
          Icon={Wallet}
        />
        <BentoMetricCard
          title="Pts redeemed"
          value={`${pointsRedeemed}`}
          trend="Employee spend"
          accent={colors.tertiary}
          Icon={UsersRound}
        />
        <BentoMetricCard
          title="Customers"
          value={`${reachedEmployees}`}
          trend={reachedEmployees > 0 ? `+${reachedEmployees}` : "—"}
          accent={colors.secondary}
          Icon={UsersRound}
        />
      </View>

      <GlassPanel style={styles.activityPanel} intensity={36}>
        <View style={styles.activityHeader}>
          <View>
            <Text style={styles.cardTitle}>Activity Heatmap</Text>
            <Text style={styles.bodyText}>Live redemption signal across your offers.</Text>
          </View>
          <Pressable style={styles.exportPill} onPress={() => undefined}>
            <Text style={styles.exportPillText}>Export</Text>
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {recentTransactions.length ? (
          <Pressable onPress={onSeeAllTransactions}>
            <Text style={styles.sectionMeta}>{recentTransactions.length} · See all</Text>
          </Pressable>
        ) : null}
      </View>
      <GlassPanel style={styles.txList} intensity={32}>
        {recentTransactions.length ? recentTransactions.map(({ request, benefit }, index) => {
          const Icon = businessCategoryIcons[benefit.category] ?? Store;
          const avatar = businessCategoryAvatar[benefit.category] ?? { background: "rgba(0,88,188,0.14)", color: colors.primary };
          const last = index === recentTransactions.length - 1;
          return (
            <Pressable
              key={`${request.id}-${benefit.id}`}
              onPress={() => onSelectTransaction({ request, benefit })}
              style={[styles.txRow, last && styles.txRowLast]}
            >
              <View style={[styles.txAvatar, { backgroundColor: avatar.background }]}>
                <Icon size={20} color={avatar.color} />
              </View>
              <View style={styles.txBody}>
                <Text style={styles.txTitle}>{benefit.title}</Text>
                <Text style={styles.txMeta}>
                  {request.employeeName.split(" ")[0]} · Paid out
                </Text>
              </View>
              <View style={styles.txAmounts}>
                <Text style={styles.txAmount}>+{currency(benefit.price)}</Text>
                <Text style={styles.txStatus}>Settled</Text>
              </View>
            </Pressable>
          );
        }) : (
          <View style={styles.txEmpty}>
            <View style={styles.smallIcon}>
              <Store size={18} color={colors.text} />
            </View>
            <View style={styles.listText}>
              <Text style={styles.listTitle}>No routed payments yet</Text>
              <Text style={styles.listSub}>Employee redemptions will land here automatically.</Text>
            </View>
          </View>
        )}
      </GlassPanel>
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
          <Text style={styles.greetingText}>Offers</Text>
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
                    <Text style={styles.offerListPriceText}>{currency(offer.price)}</Text>
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
              <LayoutGrid size={18} color={colors.text} />
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

function BusinessProfileTab({
  user,
  profile,
  offerCount,
  customerCount,
  payoutTotal,
  onEdit
}: {
  user: User;
  profile: {
    businessName: string;
    description: string;
    category: BenefitCategory;
    logoUrl: string;
    city: string;
  };
  offerCount: number;
  customerCount: number;
  payoutTotal: number;
  onEdit: () => void;
}) {
  const Icon = businessCategoryIcons[profile.category] ?? Store;
  const tint = businessCategoryAvatar[profile.category] ?? { background: "rgba(0,88,188,0.14)", color: colors.primary };
  return (
    <>
      <GlassPanel style={styles.profileHeroCard} intensity={34}>
        <Pressable style={styles.profileHeroLogoWrap} onPress={onEdit}>
          <Image source={{ uri: profile.logoUrl || DEFAULT_PROVIDER_LOGO }} style={styles.profileHeroLogo} />
          <View style={styles.profileHeroLogoEdit}>
            <Camera size={14} color={colors.onPrimary} />
          </View>
        </Pressable>
        <Text style={styles.profileHeroName}>{profile.businessName}</Text>
        <View style={styles.profileHeroMetaRow}>
          <View style={[styles.detailCategoryBadge, { backgroundColor: tint.background }]}>
            <Icon size={14} color={tint.color} />
            <Text style={[styles.detailCategoryText, { color: tint.color }]}>{profile.category}</Text>
          </View>
          <View style={styles.detailMetaPill}>
            <MapPin size={14} color={colors.muted} />
            <Text style={styles.detailMetaText}>{profile.city}</Text>
          </View>
          <View style={styles.profileVerifiedBadge}>
            <BadgeCheck size={14} color={colors.secondary} />
            <Text style={styles.profileVerifiedText}>Verified</Text>
          </View>
        </View>
        <Text style={styles.profileHeroDescription}>{profile.description}</Text>
        <CapsuleButton label="Edit profile" onPress={onEdit} icon={<Pencil size={16} color={colors.onPrimary} />} />
      </GlassPanel>

      <View style={styles.bentoRow}>
        <BentoMetricCard
          title="Offers"
          value={`${offerCount}`}
          accent={colors.secondary}
          Icon={Store}
        />
        <BentoMetricCard
          title="Customers"
          value={`${customerCount}`}
          accent={colors.tertiary}
          Icon={UsersRound}
        />
        <BentoMetricCard
          title="Revenue"
          value={currency(payoutTotal)}
          accent={colors.primary}
          Icon={Wallet}
        />
      </View>

      <GlassPanel style={styles.profileSection} intensity={32}>
        <Text style={styles.profileSectionTitle}>Account</Text>
        <View style={styles.profileRow}>
          <View style={styles.profileRowIcon}>
            <UserRound size={18} color={colors.primary} />
          </View>
          <View style={styles.profileRowBody}>
            <Text style={styles.profileRowLabel}>Owner</Text>
            <Text style={styles.profileRowValue}>{user.name}</Text>
          </View>
        </View>
        <View style={[styles.profileRow, styles.profileRowDivider]}>
          <View style={styles.profileRowIcon}>
            <Building2 size={18} color={colors.primary} />
          </View>
          <View style={styles.profileRowBody}>
            <Text style={styles.profileRowLabel}>Email</Text>
            <Text style={styles.profileRowValue}>{user.email}</Text>
          </View>
        </View>
        <View style={[styles.profileRow, styles.profileRowDivider]}>
          <View style={styles.profileRowIcon}>
            <MapPin size={18} color={colors.primary} />
          </View>
          <View style={styles.profileRowBody}>
            <Text style={styles.profileRowLabel}>City</Text>
            <Text style={styles.profileRowValue}>{profile.city}</Text>
          </View>
        </View>
      </GlassPanel>
    </>
  );
}

function BusinessAccountTab({
  user,
  profile,
  onLogout
}: {
  user: User;
  profile: { businessName: string };
  onLogout: () => void;
}) {
  return (
    <>
      <View style={styles.adminHeader}>
        <View style={styles.adminHeaderCopy}>
          <Text style={styles.greetingText}>Account</Text>
          <Text style={styles.insightsTagline}>
            Signed in as {profile.businessName}. Manage how PerX works for you.
          </Text>
        </View>
      </View>
      <AccountSettingsHub
        user={user}
        onLogout={onLogout}
        subtitle={`Provider account for ${profile.businessName}`}
        showHero={false}
      />
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
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
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
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
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
    </Modal>
  );
}

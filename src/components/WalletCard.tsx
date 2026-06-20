import { LinearGradient } from "expo-linear-gradient";
import { Lock, Nfc, QrCode } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { perkPointsCost } from "../lib/perkPayment";
import { Benefit, User } from "../types";
import { cardGradients, colors, radius, shadow } from "../theme";

type Props = {
  user: User;
  companyName: string;
  benefit: Benefit;
  pointsBalance: number;
  variant?: number;
  compact?: boolean;
  selected?: boolean;
  redeemed?: boolean;
  used?: boolean;
};

export function WalletCard({
  user,
  companyName,
  benefit,
  pointsBalance,
  variant = 0,
  compact = false,
  selected = false,
  redeemed = false,
  used = false
}: Props) {
  const scale = useRef(new Animated.Value(compact ? 1 : 0.96)).current;
  const gradient = cardGradients[variant % cardGradients.length];
  const cost = perkPointsCost(benefit);
  const affordable = redeemed || pointsBalance >= cost;
  const disabled = used || (!affordable && !redeemed);

  useEffect(() => {
    if (compact) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
  }, [compact, scale]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        selected && styles.wrapSelected,
        disabled && styles.wrapDisabled,
        used && styles.wrapUsed,
        { transform: [{ scale }] }
      ]}
    >
      <LinearGradient
        colors={[...gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          selected && styles.cardSelected,
          disabled && styles.cardDisabled,
          used && styles.cardUsed
        ]}
      >
        <View style={styles.overlay} />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0.42)", "rgba(255,255,255,0.06)", "rgba(255,255,255,0.18)"]}
          locations={[0, 0.48, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.liquidHighlight}
        />
        {used ? (
          <View style={styles.usedOverlay}>
            <Text style={styles.usedOverlayText}>Used</Text>
          </View>
        ) : null}
        {!affordable && !redeemed ? (
          <View style={styles.lockedOverlay}>
            <Lock size={18} color={colors.onPrimary} />
            <Text style={styles.lockedText}>Need {cost - pointsBalance} more pts</Text>
          </View>
        ) : null}
        <View style={styles.topRow}>
          <View style={styles.topCopy}>
            <Text style={styles.eyebrow}>{benefit.category}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {benefit.title}
            </Text>
            <Text style={styles.provider} numberOfLines={1}>
              {benefit.providerName}
            </Text>
          </View>
          {benefit.imageUrl ? (
            <Image source={{ uri: benefit.imageUrl }} style={styles.logo} />
          ) : (
            <View style={styles.iconBubble}>
              {benefit.redemptionType === "NFC" ? (
                <Nfc size={20} color={colors.onPrimaryContainer} />
              ) : (
                <QrCode size={20} color={colors.onPrimaryContainer} />
              )}
            </View>
          )}
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.bottomCopy}>
            <Text style={styles.holder} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={styles.company} numberOfLines={1}>
              {companyName}
            </Text>
          </View>
          {used ? (
            <View style={[styles.readyPill, styles.usedPill]}>
              <Text style={styles.readyText}>Used</Text>
            </View>
          ) : selected && affordable ? (
            <View style={styles.readyPill}>
              <Nfc size={14} color={colors.onPrimary} />
              <Text style={styles.readyText}>{redeemed ? "Use" : "Ready"}</Text>
            </View>
          ) : redeemed ? (
            <View style={styles.readyPill}>
              <Nfc size={14} color={colors.onPrimary} />
              <Text style={styles.readyText}>Ready to use</Text>
            </View>
          ) : (
            <View style={styles.pointsPill}>
              <Text style={styles.pointsValue}>{cost}</Text>
              <Text style={styles.pointsLabel}>pts</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 318,
    marginRight: 14,
    ...shadow
  },
  wrapCompact: {
    width: "100%",
    marginRight: 0
  },
  wrapSelected: {
    shadowOpacity: 0.22,
    shadowRadius: 30
  },
  wrapDisabled: {
    opacity: 0.72
  },
  wrapUsed: {
    opacity: 0.55
  },
  card: {
    height: 178,
    borderRadius: radius.cardLg,
    padding: 18,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.35)",
    justifyContent: "space-between"
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: "#FFFFFF"
  },
  cardDisabled: {
    borderColor: "rgba(255,255,255,0.2)"
  },
  cardUsed: {
    borderColor: "rgba(255,255,255,0.15)"
  },
  usedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 1
  },
  usedOverlayText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  liquidHighlight: {
    ...StyleSheet.absoluteFillObject
  },
  lockedOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.capsule,
    backgroundColor: "rgba(0,0,0,0.35)"
  },
  lockedText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: "700"
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between"
  },
  topCopy: {
    flex: 1,
    paddingRight: 12
  },
  eyebrow: {
    color: "rgba(254,252,255,0.82)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  name: {
    color: colors.onPrimaryContainer,
    fontSize: 19,
    fontWeight: "800",
    marginTop: 4
  },
  provider: {
    color: "rgba(254,252,255,0.78)",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600"
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)"
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)"
  },
  pointsPill: {
    alignItems: "flex-end"
  },
  pointsValue: {
    color: colors.onPrimaryContainer,
    fontSize: 22,
    fontWeight: "900"
  },
  pointsLabel: {
    color: "rgba(254,252,255,0.75)",
    fontSize: 11,
    fontWeight: "700",
    marginTop: -2
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  bottomCopy: {
    flex: 1,
    paddingRight: 12
  },
  holder: {
    color: colors.onPrimaryContainer,
    fontSize: 15,
    fontWeight: "800"
  },
  company: {
    color: "rgba(254,252,255,0.75)",
    fontSize: 12,
    marginTop: 3,
    fontWeight: "600"
  },
  readyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.capsule,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.22)"
  },
  readyText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4
  },
  usedPill: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderColor: "rgba(255,255,255,0.2)"
  }
});

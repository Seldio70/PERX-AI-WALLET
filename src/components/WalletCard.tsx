import { LinearGradient } from "expo-linear-gradient";
import { Nfc, QrCode } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { Benefit, User } from "../types";
import { currency } from "../lib/format";
import { cardGradients, colors, radius, shadow } from "../theme";

type Props = {
  user: User;
  companyName: string;
  balance: number;
  benefit: Benefit;
  variant?: number;
  compact?: boolean;
  selected?: boolean;
};

export function WalletCard({
  user,
  companyName,
  balance,
  benefit,
  variant = 0,
  compact = false,
  selected = false
}: Props) {
  const scale = useRef(new Animated.Value(compact ? 1 : 0.96)).current;
  const gradient = cardGradients[variant % cardGradients.length];

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
        { transform: [{ scale }] }
      ]}
    >
      <LinearGradient
        colors={[...gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, selected && styles.cardSelected]}
      >
        <View style={styles.overlay} />
        <View style={styles.topRow}>
          <View style={styles.topCopy}>
            <Text style={styles.eyebrow}>{benefit.category}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {benefit.title}
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
          {selected ? (
            <View style={styles.readyPill}>
              <Nfc size={14} color={colors.onPrimary} />
              <Text style={styles.readyText}>Ready</Text>
            </View>
          ) : (
            <Text style={styles.balance}>{currency(balance)}</Text>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.1)"
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
  balance: {
    color: colors.onPrimaryContainer,
    fontSize: 22,
    fontWeight: "900"
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
  }
});

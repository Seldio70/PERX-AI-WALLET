import { LinearGradient } from "expo-linear-gradient";
import { Nfc, QrCode } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
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
};

export function WalletCard({
  user,
  companyName,
  balance,
  benefit,
  variant = 0,
  compact = false
}: Props) {
  const scale = useRef(new Animated.Value(compact ? 1 : 0.96)).current;
  const gradient = cardGradients[variant % cardGradients.length];

  useEffect(() => {
    if (compact) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
  }, [compact, scale]);

  return (
    <Animated.View style={[styles.wrap, compact && styles.wrapCompact, { transform: [{ scale }] }]}>
      <LinearGradient colors={[...gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.overlay} />
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>{benefit.title}</Text>
            <Text style={styles.name}>{user.name.split(" ")[0]}</Text>
          </View>
          <View style={styles.iconBubble}>
            {benefit.redemptionType === "NFC" ? (
              <Nfc size={20} color={colors.onPrimaryContainer} />
            ) : (
              <QrCode size={20} color={colors.onPrimaryContainer} />
            )}
          </View>
        </View>
        <View style={styles.middle}>
          <Text style={styles.balance}>{currency(balance)}</Text>
          <Text style={styles.balanceLabel}>available this month</Text>
        </View>
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.company}>{companyName}</Text>
            <Text style={styles.number}>5284  73XX  XXXX  2046</Text>
          </View>
          <View style={styles.benefitCapsule}>
            <Text style={styles.benefitText}>{benefit.category}</Text>
          </View>
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
  card: {
    height: 224,
    borderRadius: radius.cardLg,
    padding: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.35)"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.12)"
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between"
  },
  eyebrow: {
    color: "rgba(254,252,255,0.82)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  name: {
    color: colors.onPrimaryContainer,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: radius.capsule,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)"
  },
  middle: {
    marginTop: 24
  },
  balance: {
    color: colors.onPrimaryContainer,
    fontSize: 34,
    fontWeight: "900"
  },
  balanceLabel: {
    color: "rgba(254,252,255,0.78)",
    fontSize: 13,
    fontWeight: "600"
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto"
  },
  company: {
    color: colors.onPrimaryContainer,
    fontSize: 14,
    fontWeight: "700"
  },
  number: {
    color: "rgba(254,252,255,0.72)",
    fontSize: 12,
    marginTop: 3,
    letterSpacing: 1.2
  },
  benefitCapsule: {
    borderRadius: radius.capsule,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.18)"
  },
  benefitText: {
    color: colors.onPrimaryContainer,
    fontSize: 12,
    fontWeight: "800"
  }
});

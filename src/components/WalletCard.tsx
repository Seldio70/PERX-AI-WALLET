import { LinearGradient } from "expo-linear-gradient";
import { Nfc, QrCode } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Benefit, User } from "../types";
import { colors, radius, shadow } from "../theme";

type Props = {
  user: User;
  companyName: string;
  balance: number;
  benefit: Benefit;
};

export function WalletCard({ user, companyName, balance, benefit }: Props) {
  const scale = useRef(new Animated.Value(0.96)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: true })
        ])
      )
    ]).start();
  }, [glow, scale]);

  const opacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.28] });

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
      <LinearGradient
        colors={["#12182B", "#0B1020", "#17233D"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Animated.View style={[styles.glow, { opacity }]} />
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>PerX AI Wallet</Text>
            <Text style={styles.name}>{user.name}</Text>
          </View>
          <View style={styles.iconBubble}>
            {benefit.redemptionType === "NFC" ? (
              <Nfc size={20} color={colors.text} />
            ) : (
              <QrCode size={20} color={colors.text} />
            )}
          </View>
        </View>
        <View style={styles.middle}>
          <Text style={styles.balance}>${balance.toFixed(0)}</Text>
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
  card: {
    height: 204,
    borderRadius: 32,
    padding: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)"
  },
  glow: {
    position: "absolute",
    right: -48,
    top: -36,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.accent
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between"
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: radius.capsule,
    borderWidth: 1,
    borderColor: colors.stroke,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  middle: {
    marginTop: 28
  },
  balance: {
    color: colors.text,
    fontSize: 36,
    fontWeight: "900"
  },
  balanceLabel: {
    color: colors.soft,
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
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  number: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
    letterSpacing: 1.2
  },
  benefitCapsule: {
    borderRadius: radius.capsule,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.1)"
  },
  benefitText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800"
  }
});

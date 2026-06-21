import { Nfc, X } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { canAffordPerk, perkPointsCost } from "../lib/perkPayment";
import { Benefit, User } from "../types";
import { colors } from "../theme";
import { CapsuleButton } from "./CapsuleButton";
import { ConfettiBurst } from "./ConfettiBurst";
import { WalletCard } from "./WalletCard";

type Props = {
  visible: boolean;
  benefit: Benefit | null;
  user: User;
  companyName: string;
  pointsBalance: number;
  variant: number;
  accepted: boolean;
  celebrateKey: number;
  redeemed?: boolean;
  used?: boolean;
  onTap: () => void;
  onClose: () => void;
};

export function WalletFocus({
  visible,
  benefit,
  user,
  companyName,
  pointsBalance,
  variant,
  accepted,
  celebrateKey,
  redeemed = false,
  used = false,
  onTap,
  onClose
}: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const closeTop = Platform.OS === "ios" ? 54 : 14;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 70
      }).start();
    }
  }, [visible, benefit?.id, anim]);

  if (!benefit) return null;

  const cost = perkPointsCost(benefit);
  const affordable = redeemed || canAffordPerk(pointsBalance, benefit);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.scrim} pointerEvents="none" />

        <View style={styles.content} pointerEvents="box-none">
          <Animated.View style={[styles.cardWrap, { opacity: anim, transform: [{ translateY }, { scale }] }]}>
            <WalletCard
              user={user}
              companyName={companyName}
              benefit={benefit}
              pointsBalance={pointsBalance}
              variant={variant}
              selected
              redeemed={redeemed}
              used={used}
            />
            {redeemed ? (
              <Text style={styles.captionCost}>Tap to use at provider</Text>
            ) : null}
          </Animated.View>
        </View>

        <View style={styles.bottom} pointerEvents="box-none">
          <CapsuleButton
            label={
              used
                ? "Already used"
                : accepted
                  ? "Tap again"
                  : affordable
                    ? redeemed
                      ? "Simulate NFC tap"
                      : "Simulate NFC tap & pay"
                    : "Not enough points"
            }
            onPress={() => {
              if (!used) onTap();
            }}
            variant={affordable && !used ? "primary" : "soft"}
            icon={<Nfc size={16} color={colors.onPrimary} />}
          />
        </View>

        {accepted ? <ConfettiBurst key={celebrateKey} /> : null}

        <Pressable
          style={[styles.closeBtn, { top: closeTop }]}
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={18} color={colors.text} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  cardWrap: {
    width: "100%",
    maxWidth: 340,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 38,
    shadowOffset: { width: 0, height: 22 },
    elevation: 16
  },
  captionCost: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 16
  },
  bottom: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 40,
    gap: 14,
    alignItems: "stretch"
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.muted
  },
  dotActive: {
    backgroundColor: colors.secondary
  },
  statusText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  closeBtn: {
    position: "absolute",
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    zIndex: 20,
    elevation: 20
  }
});

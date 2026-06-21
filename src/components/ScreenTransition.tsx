import { ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, StyleProp, ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  transitionKey: string;
  style?: StyleProp<ViewStyle>;
  distance?: number;
  duration?: number;
  /** When false, content renders immediately without enter animation (better for tab switches). */
  enabled?: boolean;
};

export function ScreenTransition({
  children,
  transitionKey,
  style,
  distance = 10,
  duration = 220,
  enabled = true
}: Props) {
  const opacity = useRef(new Animated.Value(enabled ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(enabled ? distance : 0)).current;
  const scale = useRef(new Animated.Value(enabled ? 0.985 : 1)).current;

  useEffect(() => {
    if (!enabled) {
      opacity.setValue(1);
      translateY.setValue(0);
      scale.setValue(1);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(distance);
    scale.setValue(0.985);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    ]).start();
  }, [distance, duration, enabled, opacity, scale, transitionKey, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }, { scale }] }]}>
      {children}
    </Animated.View>
  );
}

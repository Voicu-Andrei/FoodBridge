import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

/** Drifts its children slowly up and down forever, like something resting on water. */
export function Float({ children, delay = 0, distance = 6, style }: { children: ReactNode; delay?: number; distance?: number; style?: StyleProp<ViewStyle> }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(withDelay(delay, withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true)));
  }, [t, delay]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (t.get() - 0.5) * 2 * distance }] }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

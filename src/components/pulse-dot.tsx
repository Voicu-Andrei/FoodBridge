import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/** A small "live" dot with a ring that keeps radiating outwards. */
export function PulseDot({ color, size = 8 }: { color: string; size?: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false));
  }, [progress]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.7 * (1 - progress.get()),
    transform: [{ scale: 1 + progress.get() * 2 }],
  }));

  const dot = { width: size, height: size, borderRadius: size / 2, backgroundColor: color };

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, dot, ringStyle]} />
      <View style={dot} />
    </View>
  );
}

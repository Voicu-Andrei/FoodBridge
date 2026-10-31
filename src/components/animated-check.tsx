import { useEffect } from 'react';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { EASE_OUT } from '@/constants/motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CHECK_LENGTH = 62;

/** A ring that draws itself, followed by a check mark. */
export function AnimatedCheck({ size = 112, ringColor, checkColor, fill }: { size?: number; ringColor: string; checkColor: string; fill: string }) {
  const ring = useSharedValue(0);
  const check = useSharedValue(0);
  const appear = useSharedValue(0);

  useEffect(() => {
    appear.set(withTiming(1, { duration: 420, easing: EASE_OUT }));
    ring.set(withTiming(1, { duration: 650, easing: EASE_OUT }));
    check.set(withDelay(420, withTiming(1, { duration: 380, easing: EASE_OUT })));
  }, [appear, ring, check]);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - ring.get()) }));
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LENGTH * (1 - check.get()) }));
  const containerStyle = useAnimatedStyle(() => ({
    opacity: appear.get(),
    transform: [{ scale: 0.8 + 0.2 * appear.get() }],
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, containerStyle]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx={50} cy={50} r={RADIUS} fill={fill} />
        <AnimatedCircle
          cx={50}
          cy={50}
          r={RADIUS}
          stroke={ringColor}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={ringProps}
          transform="rotate(-90 50 50)"
        />
        <AnimatedPath
          d="M 30 51 L 44 65 L 71 37"
          stroke={checkColor}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={CHECK_LENGTH}
          animatedProps={checkProps}
        />
      </Svg>
    </Animated.View>
  );
}

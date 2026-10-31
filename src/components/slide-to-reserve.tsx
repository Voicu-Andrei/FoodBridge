import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon } from '@/components/icon';
import { Txt } from '@/components/text';
import { Timing } from '@/constants/motion';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { haptics } from '@/lib/haptics';

const HEIGHT = 62;
const PAD = 5;
const KNOB = HEIGHT - PAD * 2;
const COMPLETE_AT = 0.85;

type Props = {
  label: string;
  /** Shown bold at the end of the track, e.g. the order total. */
  price: string;
  onComplete: () => void;
};

/** "Slide to reserve" track: drag the knob to the end to confirm, with haptic ticks along the way. */
export function SlideToReserve({ label, price, onComplete }: Props) {
  const theme = useTheme();
  const x = useSharedValue(0);
  const maxX = useSharedValue(0);
  const step = useSharedValue(0);
  const done = useSharedValue(false);
  const hint = useSharedValue(0);

  // A gentle nudge of the arrows so it's obvious the knob can be dragged.
  useEffect(() => {
    hint.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      ),
    );
  }, [hint]);

  const tick = () => haptics.select();
  const complete = () => {
    haptics.success();
    onComplete();
  };

  const pan = usePanGesture({
    onUpdate: (e) => {
      'worklet';
      const max = maxX.get();
      if (done.get() || max <= 0) return;
      const next = Math.min(max, Math.max(0, e.translationX));
      x.set(next);
      const quarter = Math.floor((next / max) * 4);
      if (quarter !== step.get()) {
        step.set(quarter);
        scheduleOnRN(tick);
      }
    },
    onDeactivate: () => {
      'worklet';
      const max = maxX.get();
      if (done.get() || max <= 0) return;
      if (x.get() >= max * COMPLETE_AT) {
        done.set(true);
        x.set(withTiming(max, Timing.slide));
        scheduleOnRN(complete);
      } else {
        step.set(0);
        x.set(withTiming(0, Timing.release));
      }
    },
  });

  // While idle, the knob nudges right a few points to invite a drag.
  const knobStyle = useAnimatedStyle(() => {
    const idle = x.get() === 0 && !done.get();
    return { transform: [{ translateX: x.get() + (idle ? hint.get() * 6 : 0) }] };
  });
  const fillStyle = useAnimatedStyle(() => ({ width: x.get() + KNOB + PAD * 2 }));
  const labelStyle = useAnimatedStyle(() => {
    const progress = maxX.get() > 0 ? x.get() / maxX.get() : 0;
    return { opacity: interpolate(progress, [0, 0.6], [1, 0], 'clamp') };
  });

  return (
    <View
      onLayout={(e) => maxX.set(Math.max(0, e.nativeEvent.layout.width - KNOB - PAD * 2))}
      style={[styles.track, { backgroundColor: theme.primary }]}>
      <Animated.View style={[styles.fill, { backgroundColor: theme.accent }, fillStyle]} />
      <Animated.View style={[styles.labelWrap, labelStyle]} pointerEvents="none">
        <Txt variant="bodyMedium" tint={theme.onPrimary} style={styles.label} numberOfLines={1}>
          {label}
        </Txt>
        <Txt variant="headline" tint={theme.onPrimary} style={styles.price}>
          {price}
        </Txt>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.knob, { backgroundColor: theme.onPrimary }, knobStyle]}>
          <Icon sf="arrow.right" md="arrow_forward" size={20} color={theme.primary} weight="bold" />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: HEIGHT / 2,
  },
  labelWrap: {
    position: 'absolute',
    left: KNOB + PAD * 2 + 12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: { fontFamily: Fonts.sansSemiBold, flexShrink: 1 },
  price: { fontSize: 17, fontVariant: ['tabular-nums'] },
  knob: {
    position: 'absolute',
    left: PAD,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
});

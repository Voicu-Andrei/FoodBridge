import { Easing, FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

/**
 * Shared motion language: smooth ease-out curves with no overshoot.
 * Use these instead of springs so every animation in the app settles the same way.
 */
export const EASE_OUT = Easing.out(Easing.cubic);

export const Timing = {
  /** Finger down on a pressable. */
  press: { duration: 110, easing: EASE_OUT },
  /** Finger up / returning to rest. */
  release: { duration: 220, easing: EASE_OUT },
  /** Thumbs, indicators and other things that slide between positions. */
  slide: { duration: 260, easing: EASE_OUT },
} as const;

/** Content rising gently into place. */
export function enterUp(delay = 0, duration = 420) {
  return FadeInDown.delay(delay).duration(duration).easing(EASE_OUT);
}

export function enterFade(delay = 0, duration = 320) {
  return FadeIn.delay(delay).duration(duration);
}

/** Items re-ordering or making room for each other. */
export const layoutTransition = LinearTransition.duration(280).easing(EASE_OUT);

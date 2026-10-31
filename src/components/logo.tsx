import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** FoodBridge mark: a bridge arc carrying a single "food" dot. */
export function Logo({ size = 30, background, foreground, accent }: { size?: number; background: string; foreground: string; accent: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect width={32} height={32} rx={9} fill={background} />
      <Path d="M6 21.5 C 10 11, 22 11, 26 21.5" stroke={foreground} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Path d="M5 21.5 H27" stroke={foreground} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M11.5 15.6 V21.5 M20.5 15.6 V21.5" stroke={foreground} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={16} cy={9.6} r={2.6} fill={accent} />
    </Svg>
  );
}

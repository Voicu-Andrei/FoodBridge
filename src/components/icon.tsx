import { SymbolView, type AndroidSymbol, type SFSymbol, type SymbolWeight } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';

type IconProps = {
  /** SF Symbol shown on iOS. */
  sf: SFSymbol;
  /** Material Symbol used on Android and web. */
  md: AndroidSymbol;
  size?: number;
  color: string;
  weight?: SymbolWeight;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ sf, md, size = 16, color, weight = 'semibold', style }: IconProps) {
  return (
    <SymbolView
      name={{ ios: sf, android: md, web: md }}
      size={size}
      tintColor={color}
      weight={weight}
      style={[{ width: size, height: size }, style]}
    />
  );
}

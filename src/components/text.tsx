import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, type Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'display' | 'title' | 'headline' | 'body' | 'bodyMedium' | 'caption' | 'label' | 'price';

export type TxtProps = TextProps & {
  variant?: Variant;
  color?: keyof Palette;
  /** Overrides the palette color, e.g. for text on gradients. */
  tint?: string;
};

export function Txt({ variant = 'body', color = 'ink', tint, style, ...rest }: TxtProps) {
  const theme = useTheme();
  return <Text style={[styles[variant], { color: tint ?? theme[color] }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  display: { fontFamily: Fonts.serif, fontSize: 36, lineHeight: 40, letterSpacing: -0.6 },
  title: { fontFamily: Fonts.serif, fontSize: 24, lineHeight: 29, letterSpacing: -0.3 },
  headline: { fontFamily: Fonts.serif, fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontFamily: Fonts.sans, fontSize: 15, lineHeight: 21 },
  bodyMedium: { fontFamily: Fonts.sansMedium, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: Fonts.sansMedium, fontSize: 12.5, lineHeight: 17 },
  label: { fontFamily: Fonts.sansSemiBold, fontSize: 11, lineHeight: 14, letterSpacing: 1.1, textTransform: 'uppercase' },
  price: { fontFamily: Fonts.serifBold, fontSize: 24, lineHeight: 28, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
});

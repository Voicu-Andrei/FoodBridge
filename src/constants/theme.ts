import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import { Platform } from 'react-native';

import type { CategoryId } from '@/data/types';

/**
 * FoodBridge "premium" palette: deep forest green on warm cream, with a terracotta accent.
 * Every screen reads colors through `useTheme()` so light and dark mode stay in sync.
 */
export const Colors = {
  light: {
    background: '#F4EEE3',
    surface: '#FBF8F1',
    surfaceAlt: '#ECE4D5',
    ink: '#1A2B21',
    inkMuted: '#5E6B62',
    inkFaint: '#8E968F',
    line: '#E1D8C6',
    primary: '#1F3A2B',
    primaryDeep: '#132619',
    onPrimary: '#F6F0E4',
    accent: '#D46E46',
    accentSoft: '#F5DACB',
    positive: '#2E7A4E',
    positiveSoft: '#DCEBDD',
    heroFrom: '#24452F',
    heroTo: '#11231A',
    // Chart marks: one green hue, two validated lightness steps (base / highlighted).
    chartBar: '#86B796',
    chartBarActive: '#2F7A4E',
  },
  dark: {
    background: '#0C1410',
    surface: '#141F19',
    surfaceAlt: '#1D2A22',
    ink: '#F1EADC',
    inkMuted: '#A7B1A6',
    inkFaint: '#717D73',
    line: '#24322A',
    primary: '#CFE2C4',
    primaryDeep: '#A9C7A0',
    onPrimary: '#0C1410',
    accent: '#EE8A60',
    accentSoft: 'rgba(238, 138, 96, 0.18)',
    positive: '#8FD0A4',
    positiveSoft: 'rgba(143, 208, 164, 0.14)',
    heroFrom: '#1F3A2B',
    heroTo: '#0F1D15',
    chartBar: '#2F5E43',
    chartBarActive: '#6FC08F',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

/** Gradient pairs and SF Symbols for the illustrated category artwork. */
export const CategoryStyle: Record<
  CategoryId,
  { gradient: [string, string]; solid: string; symbol: SFSymbol; webSymbol: AndroidSymbol }
> = {
  bakery: { gradient: ['#F2D29B', '#CF8C48'], solid: '#C1803F', symbol: 'birthday.cake.fill', webSymbol: 'bakery_dining' },
  meat: { gradient: ['#E69C84', '#A8463A'], solid: '#A8463A', symbol: 'frying.pan.fill', webSymbol: 'kebab_dining' },
  fish: { gradient: ['#A2C8D3', '#3F7488'], solid: '#3F7488', symbol: 'fish.fill', webSymbol: 'set_meal' },
  vegetarian: { gradient: ['#C0D8A0', '#5B8A4C'], solid: '#5B8A4C', symbol: 'carrot.fill', webSymbol: 'eco' },
  dairy: { gradient: ['#DCD2EC', '#8B79B3'], solid: '#7E6CA8', symbol: 'drop.fill', webSymbol: 'water_drop' },
  prepared: { gradient: ['#F3BB7E', '#C4623A'], solid: '#C4623A', symbol: 'takeoutbag.and.cup.and.straw.fill', webSymbol: 'takeout_dining' },
};

/** Font family names as registered by `useFonts` in the root layout. */
export const Fonts = {
  serif: 'Fraunces_600SemiBold',
  serifBold: 'Fraunces_700Bold',
  serifItalic: 'Fraunces_500Medium_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const Shadow = Platform.select({
  ios: {
    shadowColor: '#1A2B21',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  default: { elevation: 3 },
});

/** Bottom padding that keeps content clear of the floating tab bar where iOS doesn't inset automatically. */
export const TabBarClearance = Platform.select({ ios: 0, default: 96 });

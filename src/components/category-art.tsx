import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Icon } from '@/components/icon';
import { CategoryStyle } from '@/constants/theme';
import type { CategoryId } from '@/data/types';

type CategoryArtProps = {
  category: CategoryId;
  height: number;
  /** A real photo replaces the illustration when the seller took one. */
  photoUri?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/** Illustrated header for an offer: category gradient, soft shapes, the bridge arc and a big symbol. */
export function CategoryArt({ category, height, photoUri, style, children }: CategoryArtProps) {
  const art = CategoryStyle[category];
  const symbolSize = height * 0.78;

  if (photoUri) {
    return (
      <View style={[{ height }, styles.root, style]}>
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        <LinearGradient
          colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.35)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }

  return (
    <LinearGradient colors={art.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ height }, styles.root, style]}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice">
        <Circle cx={168} cy={18} r={58} fill="#FFFFFF" opacity={0.13} />
        <Circle cx={22} cy={96} r={34} fill="#FFFFFF" opacity={0.1} />
        <Circle cx={118} cy={88} r={6} fill="#FFFFFF" opacity={0.18} />
        <Path d="M -10 104 C 50 40, 150 40, 210 104" stroke="#FFFFFF" strokeWidth={1.2} opacity={0.28} fill="none" />
      </Svg>
      <View style={[styles.symbolGhost, { right: -symbolSize * 0.18, bottom: -symbolSize * 0.22 }]}>
        <Icon sf={art.symbol} md={art.webSymbol} size={symbolSize * 1.35} color="rgba(255,255,255,0.16)" />
      </View>
      <View style={[styles.symbol, { right: height * 0.16, bottom: height * 0.14 }]}>
        <Icon sf={art.symbol} md={art.webSymbol} size={symbolSize * 0.62} color="rgba(255,255,255,0.95)" />
      </View>
      {children}
    </LinearGradient>
  );
}

/** Round gradient badge with the category symbol, used for business avatars. */
export function CategoryBadge({ category, size = 44 }: { category: CategoryId; size?: number }) {
  const art = CategoryStyle[category];
  return (
    <LinearGradient
      colors={art.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <Icon sf={art.symbol} md={art.webSymbol} size={size * 0.46} color="#FFFFFF" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  badge: { alignItems: 'center', justifyContent: 'center' },
  symbolGhost: { position: 'absolute', transform: [{ rotate: '-14deg' }] },
  symbol: {
    position: 'absolute',
    transform: [{ rotate: '-8deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
});

import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { PulseDot } from '@/components/pulse-dot';
import { Timing } from '@/constants/motion';
import { CategoryStyle } from '@/constants/theme';
import type { CategoryId } from '@/data/types';

/** Category-coloured map pin that grows when selected. */
export function OfferPin({ category, selected }: { category: CategoryId; selected: boolean }) {
  const art = CategoryStyle[category];
  const scale = useSharedValue(selected ? 1.22 : 1);

  useEffect(() => {
    scale.set(withTiming(selected ? 1.22 : 1, Timing.slide));
  }, [selected, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - scale.get()) * 20 }, { scale: scale.get() }] }));

  return (
    <Animated.View style={[styles.pinWrap, style]}>
      <LinearGradient colors={art.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pin}>
        <Icon sf={art.symbol} md={art.webSymbol} size={17} color="#FFFFFF" />
      </LinearGradient>
      <View style={[styles.tail, { borderTopColor: '#FFFFFF' }]} />
    </Animated.View>
  );
}

/** The current business: a forest dot with a radiating ring. */
export function MePin({ color }: { color: string }) {
  return (
    <View style={styles.me}>
      <PulseDot color={color} size={18} />
    </View>
  );
}

/** Delivery van marker. */
export function VanPin({ background, foreground }: { background: string; foreground: string }) {
  return (
    <View style={[styles.van, { backgroundColor: background }]}>
      <Icon sf="box.truck.fill" md="local_shipping" size={18} color={foreground} />
    </View>
  );
}

/** A labelled home pin for the delivery destination. */
export function HomePin({ background, foreground }: { background: string; foreground: string }) {
  return (
    <View style={[styles.home, { backgroundColor: background }]}>
      <Icon sf="house.fill" md="home" size={15} color={foreground} />
    </View>
  );
}

const styles = StyleSheet.create({
  pinWrap: { alignItems: 'center', paddingTop: 6 },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  tail: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  me: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  van: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  home: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

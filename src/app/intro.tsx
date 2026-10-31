import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { CategoryArt, CategoryBadge } from '@/components/category-art';
import { Float } from '@/components/float';
import { Icon } from '@/components/icon';
import { Logo } from '@/components/logo';
import { PressableScale } from '@/components/pressable-scale';
import { Txt } from '@/components/text';
import { enterUp } from '@/constants/motion';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import type { CategoryId } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { useT, type StringKey } from '@/i18n';
import { formatDistance, formatEUR } from '@/lib/format';
import { haptics } from '@/lib/haptics';

const CREAM = '#F6F0E4';
const CREAM_MUTED = 'rgba(246,240,228,0.72)';

const SLIDES: { title: StringKey; body: StringKey }[] = [
  { title: 'welcome.slide1.title', body: 'welcome.slide1.body' },
  { title: 'welcome.slide2.title', body: 'welcome.slide2.body' },
  { title: 'welcome.slide3.title', body: 'welcome.slide3.body' },
];

const ORBIT: { category: CategoryId; x: number; y: number; size: number; delay: number }[] = [
  { category: 'bakery', x: -110, y: -70, size: 58, delay: 0 },
  { category: 'fish', x: 104, y: -88, size: 50, delay: 400 },
  { category: 'vegetarian', x: 128, y: 40, size: 60, delay: 800 },
  { category: 'dairy', x: -128, y: 54, size: 48, delay: 1200 },
  { category: 'meat', x: -36, y: 118, size: 46, delay: 600 },
  { category: 'prepared', x: 50, y: 110, size: 54, delay: 1000 },
];

export default function WelcomeScreen() {
  const theme = useTheme();
  const { t } = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [page, setPage] = useState(0);
  const x = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    x.set(e.contentOffset.x);
  });

  const last = page === SLIDES.length - 1;
  const next = () => {
    haptics.select();
    if (last) router.push('/login');
    else scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
  };

  return (
    <LinearGradient colors={[theme.heroFrom, theme.heroTo]} style={styles.root}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice">
        <Path d="M -60 520 C 60 230, 340 230, 460 520" stroke={CREAM} strokeWidth={1} opacity={0.1} fill="none" />
        <Path d="M -20 560 C 90 320, 310 320, 420 560" stroke={CREAM} strokeWidth={1} opacity={0.07} fill="none" />
      </Svg>

      <View style={[styles.top, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.brand}>
          <Logo size={30} background={CREAM} foreground="#1F3A2B" accent={theme.accent} />
          <Txt variant="headline" tint={CREAM} style={styles.brandText}>
            FoodBridge
          </Txt>
        </View>
        {!last && (
          <PressableScale haptic="none" onPress={() => router.push('/login')} hitSlop={10}>
            <Txt variant="bodyMedium" tint={CREAM_MUTED}>
              {t('welcome.skip')}
            </Txt>
          </PressableScale>
        )}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}>
        {SLIDES.map((slide, index) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View style={styles.visual}>
              {index === 0 && <OrbitVisual accent={theme.accent} />}
              {index === 1 && <CardVisual />}
              {index === 2 && <ChoiceVisual />}
            </View>
            <Animated.View entering={enterUp(150)} style={styles.copy}>
              <Txt variant="display" tint={CREAM} style={styles.title}>
                {t(slide.title)}
              </Txt>
              <Txt variant="body" tint={CREAM_MUTED} style={styles.body}>
                {t(slide.body)}
              </Txt>
            </Animated.View>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, index) => (
            <Dot key={slide.title} index={index} x={x} width={width} />
          ))}
        </View>
        <PressableScale haptic="none" onPress={next} style={[styles.cta, { backgroundColor: last ? theme.accent : CREAM }]}>
          <Txt variant="bodyMedium" tint={last ? '#FFFFFF' : '#1A2B21'} style={styles.ctaText}>
            {last ? t('welcome.start') : t('welcome.next')}
          </Txt>
          <Icon sf="arrow.right" md="arrow_forward" size={16} color={last ? '#FFFFFF' : '#1A2B21'} weight="bold" />
        </PressableScale>
      </View>
    </LinearGradient>
  );
}

function Dot({ index, x, width }: { index: number; x: SharedValue<number>; width: number }) {
  const style = useAnimatedStyle(() => {
    const p = x.get() / width;
    const active = Math.max(0, 1 - Math.abs(p - index));
    return { width: interpolate(active, [0, 1], [8, 26]), opacity: interpolate(active, [0, 1], [0.35, 1]) };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

function OrbitVisual({ accent }: { accent: string }) {
  return (
    <View style={styles.orbit}>
      <Float distance={4}>
        <View style={styles.orbitCenter}>
          <Logo size={92} background={CREAM} foreground="#1F3A2B" accent={accent} />
        </View>
      </Float>
      {ORBIT.map((item) => (
        <View key={item.category} style={[styles.orbitItem, { transform: [{ translateX: item.x }, { translateY: item.y }] }]}>
          <Float delay={item.delay}>
            <CategoryBadge category={item.category} size={item.size} />
          </Float>
        </View>
      ))}
    </View>
  );
}

function CardVisual() {
  const { lang } = useT();
  return (
    <Float distance={5}>
      <View style={styles.mockCard}>
        <CategoryArt category="bakery" height={120}>
          <View style={styles.mockDiscount}>
            <Txt variant="headline" tint={CREAM} style={styles.mockDiscountText}>
              −70%
            </Txt>
          </View>
        </CategoryArt>
        <View style={styles.mockBody}>
          <Txt variant="headline" tint="#1A2B21">
            {lang === 'de' ? 'Sauerteigbrot & Semmeln' : 'Sourdough bread & rolls'}
          </Txt>
          <Txt variant="caption" tint="#5E6B62">
            Panera Schwabing · 15 kg
          </Txt>
          <Txt variant="price" tint="#1A2B21" style={styles.mockPrice}>
            {formatEUR(18, lang)}
          </Txt>
        </View>
      </View>
    </Float>
  );
}

function ChoiceVisual() {
  const theme = useTheme();
  const { t, lang } = useT();
  return (
    <View style={styles.choice}>
      <Float distance={5}>
        <View style={[styles.choiceCard, { backgroundColor: CREAM }]}>
          <View style={[styles.choiceIcon, { backgroundColor: '#DCEBDD' }]}>
            <Icon sf="bicycle" md="pedal_bike" size={26} color="#2E7A4E" />
          </View>
          <Txt variant="headline" tint="#1A2B21">
            {formatDistance(1.2, lang)}
          </Txt>
          <Txt variant="caption" tint="#5E6B62">
            {t('detail.pickupSub', { min: 7 })}
          </Txt>
        </View>
      </Float>
      <Float distance={5} delay={900}>
        <View style={[styles.choiceCard, { backgroundColor: CREAM }]}>
          <View style={[styles.choiceIcon, { backgroundColor: theme.accentSoft }]}>
            <Icon sf="box.truck.fill" md="local_shipping" size={24} color={theme.accent} />
          </View>
          <Txt variant="headline" tint="#1A2B21">
            {formatDistance(6.4, lang)}
          </Txt>
          <Txt variant="caption" tint="#5E6B62">
            {t('detail.deliverySub', { min: 31, price: formatEUR(10.26, lang) })}
          </Txt>
        </View>
      </Float>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  brandText: { fontSize: 20 },
  slide: { flex: 1, paddingHorizontal: Spacing.xl },
  visual: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: Spacing.md, paddingBottom: Spacing.xl },
  title: { fontSize: 34, lineHeight: 39 },
  body: { fontSize: 16, lineHeight: 23 },
  footer: { paddingHorizontal: Spacing.xl, gap: Spacing.xl },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 8, borderRadius: 4, backgroundColor: CREAM },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 17,
    borderRadius: Radius.pill,
  },
  ctaText: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  orbit: { width: 320, height: 300, alignItems: 'center', justifyContent: 'center' },
  orbitCenter: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  orbitItem: { position: 'absolute' },
  mockCard: {
    width: 260,
    borderRadius: Radius.xl,
    backgroundColor: CREAM,
    overflow: 'hidden',
    transform: [{ rotate: '-4deg' }],
  },
  mockDiscount: {
    position: 'absolute',
    left: Spacing.md,
    bottom: Spacing.md,
    backgroundColor: '#1A2B21',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  mockDiscountText: { fontSize: 16, lineHeight: 21 },
  mockBody: { padding: Spacing.lg, gap: 3 },
  mockPrice: { marginTop: Spacing.xs },
  choice: { flexDirection: 'row', gap: Spacing.lg },
  choiceCard: { width: 140, borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.xs },
  choiceIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
});

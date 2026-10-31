import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryChips } from '@/components/category-chips';
import { HeroStats } from '@/components/hero-stats';
import { Icon } from '@/components/icon';
import { Logo } from '@/components/logo';
import { OfferCard } from '@/components/offer-card';
import { PressableScale } from '@/components/pressable-scale';
import { SearchField } from '@/components/search-field';
import { Segmented } from '@/components/segmented';
import { Txt } from '@/components/text';
import { enterFade, enterUp } from '@/constants/motion';
import { Fonts, Radius, Spacing, TabBarClearance } from '@/constants/theme';
import type { CategoryId, Language, SortMode } from '@/data/types';
import { filterAndSort, useLiveOffers } from '@/hooks/use-feed-offers';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { useT, type StringKey } from '@/i18n';
import { initials } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useActiveBusiness, useAppStore } from '@/store/app-store';

export default function OffersScreen() {
  const theme = useTheme();
  const { t, lang } = useT();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const now = useNow();
  const me = useActiveBusiness();
  const refreshDemoIfStale = useAppStore((s) => s.refreshDemoIfStale);

  const live = useLiveOffers(now);
  const [category, setCategory] = useState<CategoryId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('nearest');
  const [refreshing, setRefreshing] = useState(false);
  const visible = useMemo(() => filterAndSort(live, { category, query, sort }), [live, category, query, sort]);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  const compactHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [90, 150], [0, 1], Extrapolation.CLAMP),
  }));

  const openSwitcher = () => router.push('/switch-business');

  const onRefresh = () => {
    setRefreshing(true);
    refreshDemoIfStale();
    setTimeout(() => {
      setRefreshing(false);
      haptics.success();
    }, 900);
  };

  const clearFilters = () => {
    setCategory('all');
    setQuery('');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} progressViewOffset={insets.top} />
        }
        contentContainerStyle={{ paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 110 + TabBarClearance }}>
        {/* Brand row */}
        <View style={[styles.padded, styles.brandRow]}>
          {/* Long-press the logo to open presenter mode. */}
          <Pressable
            onLongPress={() => {
              haptics.success();
              router.push('/presenter');
            }}
            delayLongPress={600}
            style={styles.brand}>
            <Logo size={30} background={theme.primary} foreground={theme.onPrimary} accent={theme.accent} />
            <Txt variant="headline" style={styles.brandText}>
              FoodBridge
            </Txt>
          </Pressable>
          <View style={styles.headerActions}>
            <PressableScale
              onPress={() => router.push('/publish')}
              style={[styles.avatar, { backgroundColor: theme.accent }]}
              accessibilityLabel={t('publish.title')}>
              <Icon sf="plus" md="add" size={18} color="#FFFFFF" weight="bold" />
            </PressableScale>
            <PressableScale onPress={openSwitcher} style={[styles.avatar, { backgroundColor: theme.primary }]} accessibilityLabel={me.name}>
              <Txt variant="caption" tint={theme.onPrimary} style={styles.avatarText}>
                {initials(me.name)}
              </Txt>
            </PressableScale>
          </View>
        </View>

        {/* Editorial title */}
        <Animated.View entering={enterUp(0, 520)} style={[styles.padded, styles.titleBlock]}>
          <Txt variant="label" color="inkMuted">
            {greeting(now, t)} · {formatToday(now, lang)}
          </Txt>
          <Txt variant="display" style={styles.title}>
            {t('feed.titleLead')}
            {'\n'}
            <Txt variant="display" tint={theme.accent} style={styles.titleAccent}>
              {me.district}.
            </Txt>
          </Txt>
        </Animated.View>

        <Animated.View entering={enterFade(150, 400)} style={styles.padded}>
          <PressableScale onPress={openSwitcher} style={[styles.viewingAs, { backgroundColor: theme.surfaceAlt }]}>
            <Icon sf="mappin.circle.fill" md="location_on" size={16} color={theme.accent} />
            <Txt variant="caption" color="inkMuted">
              {t('feed.viewingAs')}
            </Txt>
            <Txt variant="caption" numberOfLines={1} style={styles.viewingAsName}>
              {me.name}
            </Txt>
            <Icon sf="chevron.down" md="expand_more" size={11} color={theme.inkMuted} />
          </PressableScale>
        </Animated.View>

        <Animated.View entering={enterUp(120)} style={[styles.padded, styles.section]}>
          <HeroStats offers={live} />
        </Animated.View>

        <Animated.View entering={enterUp(180)} style={[styles.padded, styles.sectionTight]}>
          <PressableScale
            onPress={() => router.push('/publish')}
            style={[styles.postCta, { backgroundColor: theme.accentSoft }]}>
            <View style={[styles.postIcon, { backgroundColor: theme.accent }]}>
              <Icon sf="plus" md="add" size={18} color="#FFFFFF" weight="bold" />
            </View>
            <View style={styles.flex}>
              <Txt variant="bodyMedium" style={styles.postTitle}>
                {t('feed.postCta.title')}
              </Txt>
              <Txt variant="caption" color="inkMuted">
                {t('feed.postCta.body')}
              </Txt>
            </View>
            <Icon sf="chevron.right" md="chevron_right" size={14} color={theme.inkMuted} />
          </PressableScale>
        </Animated.View>

        <View style={[styles.padded, styles.section]}>
          <SearchField value={query} onChangeText={setQuery} placeholder={t('feed.searchPlaceholder')} />
        </View>

        <View style={styles.chips}>
          <CategoryChips value={category} onChange={setCategory} />
        </View>

        <View style={[styles.padded, styles.section]}>
          <Segmented<SortMode>
            value={sort}
            onChange={setSort}
            options={[
              { value: 'nearest', label: t('feed.sort.nearest') },
              { value: 'endingSoon', label: t('feed.sort.endingSoon') },
              { value: 'bestDeal', label: t('feed.sort.bestDeal') },
            ]}
          />
        </View>

        <View style={[styles.padded, styles.listHeader]}>
          <Txt variant="label" color="inkFaint">
            {t('feed.resultCount', { count: visible.length })}
          </Txt>
        </View>

        <View style={[styles.padded, styles.list]}>
          {visible.map((item, index) => (
            <OfferCard key={item.offer.id} item={item} index={index} now={now} />
          ))}
        </View>

        {visible.length === 0 ? (
          <Animated.View entering={enterFade(0, 300)} style={[styles.padded, styles.empty]}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceAlt }]}>
              <Icon sf="basket" md="shopping_basket" size={28} color={theme.inkMuted} />
            </View>
            <Txt variant="headline">{t('feed.emptyTitle')}</Txt>
            <Txt variant="body" color="inkMuted" style={styles.center}>
              {t('feed.emptyBody')}
            </Txt>
            <PressableScale onPress={clearFilters} style={[styles.clearButton, { backgroundColor: theme.primary }]}>
              <Txt variant="caption" tint={theme.onPrimary}>
                {t('feed.clearFilters')}
              </Txt>
            </PressableScale>
          </Animated.View>
        ) : (
          <View style={styles.footer}>
            <Logo size={22} background={theme.surfaceAlt} foreground={theme.inkFaint} accent={theme.accent} />
            <Txt variant="caption" color="inkFaint">
              {t('feed.footer')}
            </Txt>
          </View>
        )}
      </Animated.ScrollView>

      {/* Compact blurred header that fades in once the big title scrolls away */}
      <Animated.View pointerEvents="none" style={[styles.compact, { height: insets.top + 46 }, compactHeaderStyle]}>
        <BlurView
          intensity={80}
          tint={theme.scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.compactRow, { paddingTop: insets.top }]}>
          <Logo size={22} background={theme.primary} foreground={theme.onPrimary} accent={theme.accent} />
          <Txt variant="headline" style={styles.compactTitle}>
            FoodBridge
          </Txt>
          <Txt variant="caption" color="inkMuted">
            · {me.district}
          </Txt>
        </View>
        <View style={[styles.compactBorder, { backgroundColor: theme.line }]} />
      </Animated.View>
    </View>
  );
}

function greeting(now: number, t: (key: StringKey) => string): string {
  const hour = new Date(now).getHours();
  if (hour < 12) return t('greeting.morning');
  if (hour < 18) return t('greeting.afternoon');
  return t('greeting.evening');
}

function formatToday(now: number, lang: Language): string {
  return new Intl.DateTimeFormat(lang === 'de' ? 'de-DE' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(now);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  padded: { paddingHorizontal: Spacing.xl },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
  sectionTight: { marginTop: Spacing.md },
  postCta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.xl },
  postIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  postTitle: { fontFamily: Fonts.sansSemiBold },
  brandText: { fontSize: 20 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: Fonts.sansBold, letterSpacing: 0.5 },
  titleBlock: { marginTop: Spacing.lg },
  title: { marginTop: Spacing.sm },
  titleAccent: { fontFamily: Fonts.serifItalic },
  viewingAs: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: Spacing.lg,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    maxWidth: '100%',
  },
  viewingAsName: { fontFamily: Fonts.sansSemiBold, flexShrink: 1 },
  section: { marginTop: Spacing.xl },
  chips: { marginTop: Spacing.lg },
  listHeader: { marginTop: Spacing.xl, marginBottom: Spacing.md },
  list: { gap: Spacing.lg },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxxl },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  center: { textAlign: 'center' },
  clearButton: { marginTop: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: 11, borderRadius: Radius.pill },
  footer: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xxl },
  compact: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  compactRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  compactTitle: { fontSize: 17 },
  compactBorder: { position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
});

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { AnimatedNumber } from '@/components/animated-number';
import { CategoryBadge } from '@/components/category-art';
import { Icon } from '@/components/icon';
import { Screen } from '@/components/screen';
import { Txt } from '@/components/text';
import { WeekChart } from '@/components/week-chart';
import { EASE_OUT, enterUp } from '@/constants/motion';
import { Fonts, Radius, Shadow, Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import { formatEUR, formatNumber } from '@/lib/format';
import { businessImpact, cityWeek, IMPACT, leaderboard } from '@/lib/impact';
import { useActiveBusiness, useAppStore } from '@/store/app-store';

export default function ImpactScreen() {
  const theme = useTheme();
  const { t, lang } = useT();
  const now = useNow(60_000);
  const me = useActiveBusiness();
  const orders = useAppStore((s) => s.orders);
  const businesses = useAppStore((s) => s.businesses);

  const week = cityWeek(now, orders);
  const weekKg = week.reduce((sum, d) => sum + d.kg, 0);
  const goalShare = Math.min(1, weekKg / IMPACT.weeklyGoalKg);
  const mine = businessImpact(me.id, orders);
  const leaders = leaderboard(businesses, orders);
  const compact = (n: number) => formatNumber(n, lang);

  return (
    <Screen title={t('impact.title')}>
      {/* Hero figure + goal meter */}
      <Animated.View entering={enterUp(60)} style={[styles.card, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Txt variant="caption" color="inkMuted">
          {t('impact.city')}
        </Txt>
        <View style={styles.heroRow}>
          <AnimatedNumber value={weekKg} format={compact} style={[styles.hero, { color: theme.ink }]} />
          <Txt variant="bodyMedium" color="inkMuted" style={styles.heroUnit}>
            {t('impact.cityUnit')}
          </Txt>
        </View>
        <Meter share={goalShare} track={theme.chartBar} fill={theme.chartBarActive} />
        <Txt variant="caption" color="inkMuted">
          {t('impact.goal', { percent: Math.round(goalShare * 100), goal: compact(IMPACT.weeklyGoalKg) })}
        </Txt>
      </Animated.View>

      {/* Stat tiles */}
      <Animated.View entering={enterUp(110)} style={styles.tiles}>
        <Tile label={t('impact.meals')} value={weekKg / IMPACT.kgPerMeal} format={compact} sf="fork.knife" md="restaurant" />
        <Tile label={t('impact.co2')} value={weekKg * IMPACT.co2PerKg} format={compact} sf="leaf.fill" md="eco" />
        <Tile label={t('impact.businesses')} value={businesses.length} format={compact} sf="storefront.fill" md="storefront" />
        <Tile label={t('impact.rescues')} value={Math.round(weekKg / 6) + orders.length} format={compact} sf="arrow.triangle.2.circlepath" md="autorenew" />
      </Animated.View>

      {/* Last 7 days */}
      <Animated.View entering={enterUp(160)} style={[styles.card, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Txt variant="headline">{t('impact.week')}</Txt>
        <Txt variant="caption" color="inkMuted" style={styles.subtitle}>
          {t('impact.weekCaption')}
        </Txt>
        <WeekChart data={week} lang={lang} todayLabel={t('time.today')} />
      </Animated.View>

      {/* Your business */}
      <Animated.View entering={enterUp(210)} style={[styles.card, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.yoursHeader}>
          <CategoryBadge category={me.category} size={36} />
          <View style={styles.flex}>
            <Txt variant="caption" color="inkMuted">
              {t('impact.yours')}
            </Txt>
            <Txt variant="bodyMedium">{me.name}</Txt>
          </View>
        </View>
        <View style={styles.yoursRow}>
          <Figure value={mine.kg} format={(n) => formatNumber(n, lang, 1)} label={t('impact.yourRescued')} />
          <Figure value={mine.saved} format={(n) => formatEUR(n, lang)} label={t('impact.yourSaved')} />
          <Figure value={mine.earned} format={(n) => formatEUR(n, lang)} label={t('impact.yourEarned')} />
        </View>
      </Animated.View>

      {/* Leaderboard */}
      <Animated.View entering={enterUp(260)} style={[styles.card, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Txt variant="headline">{t('impact.leaders')}</Txt>
        <View style={styles.leaders}>
          {leaders.map((entry, index) => (
            <View key={entry.business.id} style={styles.leaderRow}>
              <Txt variant="bodyMedium" color="inkFaint" style={styles.rank}>
                {index + 1}
              </Txt>
              <CategoryBadge category={entry.business.category} size={32} />
              <View style={styles.flex}>
                <Txt variant="bodyMedium" numberOfLines={1}>
                  {entry.business.name}
                  {entry.business.id === me.id ? ' ★' : ''}
                </Txt>
                <Txt variant="caption" color="inkFaint">
                  {entry.business.district}
                </Txt>
              </View>
              <Txt variant="bodyMedium" style={styles.leaderValue}>
                {compact(entry.kg)} kg
              </Txt>
            </View>
          ))}
        </View>
      </Animated.View>

      <Txt variant="caption" color="inkFaint" style={styles.footnote}>
        {t('impact.footnote', { kgPerMeal: formatNumber(IMPACT.kgPerMeal, lang, 1), co2: formatNumber(IMPACT.co2PerKg, lang, 1) })}
      </Txt>
    </Screen>
  );
}

function Meter({ share, track, fill }: { share: number; track: string; fill: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withDelay(200, withTiming(share, { duration: 900, easing: EASE_OUT })));
  }, [share, progress]);
  const style = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));
  return (
    <View style={[styles.meter, { backgroundColor: track }]}>
      <Animated.View style={[styles.meterFill, { backgroundColor: fill }, style]} />
    </View>
  );
}

function Tile({
  label,
  value,
  format,
  sf,
  md,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  sf: 'fork.knife' | 'leaf.fill' | 'storefront.fill' | 'arrow.triangle.2.circlepath';
  md: 'restaurant' | 'eco' | 'storefront' | 'autorenew';
}) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Icon sf={sf} md={md} size={16} color={theme.chartBarActive} />
      <AnimatedNumber value={value} format={format} style={[styles.tileValue, { color: theme.ink }]} />
      <Txt variant="caption" color="inkMuted">
        {label}
      </Txt>
    </View>
  );
}

function Figure({ value, format, label }: { value: number; format: (n: number) => string; label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.figure}>
      <AnimatedNumber value={value} format={format} style={[styles.figureValue, { color: theme.ink }]} numberOfLines={1} adjustsFontSizeToFit />
      <Txt variant="caption" color="inkMuted">
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.lg, gap: Spacing.sm },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: Spacing.sm },
  hero: { fontFamily: Fonts.sansSemiBold, fontSize: 52, lineHeight: 60, letterSpacing: -1 },
  heroUnit: { marginBottom: 6 },
  meter: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: Spacing.xs },
  meterFill: { height: 8, borderRadius: 4 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: 4,
  },
  tileValue: { fontFamily: Fonts.sansSemiBold, fontSize: 26, lineHeight: 32, marginTop: Spacing.xs },
  subtitle: { marginBottom: Spacing.sm },
  yoursHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  yoursRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  figure: { flex: 1, gap: 2 },
  figureValue: { fontFamily: Fonts.sansSemiBold, fontSize: 20, lineHeight: 26 },
  leaders: { marginTop: Spacing.sm },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  rank: { width: 16, textAlign: 'center' },
  leaderValue: { fontVariant: ['tabular-nums'] },
  footnote: { textAlign: 'center', paddingHorizontal: Spacing.lg },
});

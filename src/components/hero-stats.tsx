import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AnimatedNumber } from '@/components/animated-number';
import { Icon } from '@/components/icon';
import { PulseDot } from '@/components/pulse-dot';
import { Txt } from '@/components/text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { offerKg, type FeedOffer } from '@/hooks/use-feed-offers';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useAppStore } from '@/store/app-store';

const CREAM = '#F6F0E4';
const CREAM_MUTED = 'rgba(246,240,228,0.68)';

/** Dark-green "live market" card with count-up totals for every offer currently on FoodBridge. */
export function HeroStats({ offers }: { offers: FeedOffer[] }) {
  const theme = useTheme();
  const { t, lang } = useT();
  const thresholdKm = useAppStore((s) => s.thresholdKm);

  const kg = offers.reduce((sum, item) => sum + offerKg(item.offer), 0);
  const avgDiscount = offers.length ? offers.reduce((sum, item) => sum + item.discount, 0) / offers.length : 0;
  const nearby = offers.filter((item) => item.recommendSelf).length;

  return (
    <LinearGradient colors={[theme.heroFrom, theme.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 340 170" preserveAspectRatio="xMidYMid slice">
        <Path d="M 150 190 C 200 40, 330 40, 380 190" stroke={CREAM} strokeWidth={1} opacity={0.12} fill="none" />
        <Path d="M 190 190 C 230 80, 320 80, 360 190" stroke={CREAM} strokeWidth={1} opacity={0.09} fill="none" />
      </Svg>

      <View style={styles.liveRow}>
        <PulseDot color="#7EE0A1" />
        <Txt variant="label" tint={CREAM}>
          {t('hero.live')}
        </Txt>
      </View>

      <View style={styles.stats}>
        <Stat value={offers.length} label={t('hero.offers')} format={(n) => formatNumber(n, lang)} />
        <View style={styles.separator} />
        <Stat value={kg} label={t('hero.kg')} format={(n) => formatNumber(n, lang)} />
        <View style={styles.separator} />
        <Stat value={avgDiscount} label={t('hero.avgOff')} format={(n) => `${Math.round(n)}%`} />
      </View>

      <View style={styles.nearbyRow}>
        <Icon sf="scope" md="my_location" size={13} color={theme.accent} />
        <Txt variant="caption" tint={CREAM_MUTED}>
          {t('hero.nearby', { count: nearby, km: formatNumber(thresholdKm, lang, 1) })}
        </Txt>
      </View>
    </LinearGradient>
  );
}

function Stat({ value, label, format }: { value: number; label: string; format: (n: number) => string }) {
  return (
    <View style={styles.stat}>
      <AnimatedNumber value={value} format={format} variant="display" tint={CREAM} style={styles.statValue} />
      <Txt variant="caption" tint={CREAM_MUTED}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    overflow: 'hidden',
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stats: { flexDirection: 'row', alignItems: 'flex-end', marginTop: Spacing.lg },
  stat: { flex: 1 },
  statValue: { fontFamily: Fonts.sansSemiBold, fontSize: 30, lineHeight: 36, letterSpacing: -0.5 },
  separator: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(246,240,228,0.2)', marginHorizontal: Spacing.md },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(246,240,228,0.18)',
  },
});

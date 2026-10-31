import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

import { AnimatedCheck } from '@/components/animated-check';
import { Confetti } from '@/components/confetti';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { Txt } from '@/components/text';
import { enterUp } from '@/constants/motion';
import { CategoryStyle, Fonts, Radius, Spacing } from '@/constants/theme';
import { offerKg, offerTitle } from '@/hooks/use-feed-offers';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import { formatClock, formatEUR, formatNumber } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useAppStore } from '@/store/app-store';

const CREAM = '#F6F0E4';
const CREAM_MUTED = 'rgba(246,240,228,0.72)';
const INK = '#1A2B21';
const CHECK_TOP = 72;
const CHECK_SIZE = 112;

export default function ReservedScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const theme = useTheme();
  const { t, lang } = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const order = useAppStore((s) => s.orders.find((o) => o.id === orderId));
  const businesses = useAppStore((s) => s.businesses);

  useEffect(() => {
    haptics.success();
  }, []);

  if (!order) return null;

  const seller = businesses.find((b) => b.id === order.sellerId);
  const buyer = businesses.find((b) => b.id === order.buyerId);
  const art = CategoryStyle[order.offer.category];
  const isDelivery = order.method === 'delivery';
  const confettiColors = [...art.gradient, theme.accent, CREAM, '#7EE0A1', '#F2D29B'];
  const done = () => router.dismissTo('/');

  return (
    <LinearGradient colors={[theme.heroFrom, theme.heroTo]} style={styles.root}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + CHECK_TOP, paddingBottom: insets.bottom + 180 }]}>
        <View style={styles.hero}>
          <AnimatedCheck size={CHECK_SIZE} ringColor={theme.accent} checkColor={CREAM} fill="rgba(246,240,228,0.08)" />
          <Animated.View entering={enterUp(500)} style={styles.heroText}>
            <Txt variant="display" tint={CREAM} style={styles.title}>
              {t('reserved.title')}
            </Txt>
            <Txt variant="body" tint={CREAM_MUTED} style={styles.center}>
              {isDelivery
                ? t('reserved.subtitleDelivery', { min: order.etaMinutes })
                : t('reserved.subtitlePickup', {
                    business: seller?.name ?? '',
                    from: formatClock(order.offer.windowStart),
                    to: formatClock(order.offer.windowEnd),
                  })}
            </Txt>
          </Animated.View>
        </View>

        {/* Ticket */}
        <Animated.View entering={enterUp(650)} style={[styles.ticket, { backgroundColor: CREAM }]}>
          <View style={styles.ticketTop}>
            <LinearGradient colors={art.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ticketBadge}>
              <Icon sf={art.symbol} md={art.webSymbol} size={22} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.flex}>
              <Txt variant="headline" tint={INK} numberOfLines={2}>
                {offerTitle(order.offer, lang)}
              </Txt>
              <Txt variant="caption" tint="#5E6B62">
                {seller?.name} · {seller?.district}
              </Txt>
            </View>
          </View>

          <View style={styles.codeBlock}>
            <Txt variant="label" tint="#8E968F">
              {t('reserved.code')}
            </Txt>
            <Txt tint={INK} style={styles.code}>
              {order.code}
            </Txt>
          </View>

          <TicketDivider width={width - Spacing.xl * 2} />

          <TicketRow
            label={t('reserved.method')}
            value={isDelivery ? t('reserved.methodDelivery') : t('reserved.methodPickup')}
            sf={isDelivery ? 'box.truck.fill' : 'bicycle'}
            md={isDelivery ? 'local_shipping' : 'pedal_bike'}
          />
          <TicketRow label={t('reserved.paid')} value={formatEUR(order.total, lang)} sf="creditcard.fill" md="credit_card" />
          <TicketRow
            label={t('reserved.balance')}
            value={formatEUR(buyer?.walletBalance ?? 0, lang)}
            sf="wallet.bifold.fill"
            md="account_balance_wallet"
          />

          <View style={[styles.earned, { backgroundColor: '#DCEBDD' }]}>
            <Icon sf="arrow.up.right.circle.fill" md="trending_up" size={16} color="#2E7A4E" />
            <Txt variant="caption" tint="#2E7A4E">
              {t('reserved.sellerEarned', { business: seller?.name ?? '', amount: formatEUR(order.itemPrice, lang) })}
            </Txt>
          </View>
        </Animated.View>

        <Animated.View entering={enterUp(800)} style={styles.rescued}>
          <Icon sf="leaf.fill" md="eco" size={16} color="#7EE0A1" />
          <Txt variant="bodyMedium" tint={CREAM}>
            {t('reserved.rescued', { kg: formatNumber(offerKg(order.offer), lang, 1) })}
          </Txt>
        </Animated.View>
      </ScrollView>

      <Confetti x={width / 2} y={insets.top + CHECK_TOP + CHECK_SIZE / 2} colors={confettiColors} />

      <Animated.View entering={enterUp(900)} style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {isDelivery && (
          <PressableScale
            onPress={() => router.replace({ pathname: '/track/[orderId]', params: { orderId: order.id, from: 'reserved' } })}
            style={[styles.doneButton, styles.trackButton, { backgroundColor: theme.accent }]}>
            <Icon sf="box.truck.fill" md="local_shipping" size={16} color="#FFFFFF" />
            <Txt variant="bodyMedium" tint="#FFFFFF" style={styles.doneText}>
              {t('reserved.track')}
            </Txt>
          </PressableScale>
        )}
        <PressableScale
          onPress={done}
          style={[styles.doneButton, isDelivery ? styles.secondaryButton : { backgroundColor: CREAM }]}>
          <Txt variant="bodyMedium" tint={isDelivery ? CREAM : INK} style={styles.doneText}>
            {t('reserved.done')}
          </Txt>
        </PressableScale>
      </Animated.View>
    </LinearGradient>
  );
}

function TicketRow({
  label,
  value,
  sf,
  md,
}: {
  label: string;
  value: string;
  sf: 'box.truck.fill' | 'bicycle' | 'creditcard.fill' | 'wallet.bifold.fill';
  md: 'local_shipping' | 'pedal_bike' | 'credit_card' | 'account_balance_wallet';
}) {
  return (
    <View style={styles.row}>
      <Icon sf={sf} md={md} size={15} color="#8E968F" />
      <Txt variant="body" tint="#5E6B62" style={styles.flex}>
        {label}
      </Txt>
      <Txt variant="bodyMedium" tint={INK}>
        {value}
      </Txt>
    </View>
  );
}

/** Dashed tear line with half-circle notches, like a paper ticket. */
function TicketDivider({ width }: { width: number }) {
  const theme = useTheme();
  return (
    <View style={styles.dividerWrap}>
      <View style={[styles.notch, styles.notchLeft, { backgroundColor: theme.heroTo }]} />
      <Svg width={width} height={2}>
        <Line x1={16} y1={1} x2={width - 16} y2={1} stroke="#D5CBB8" strokeWidth={1.5} strokeDasharray="6 6" />
      </Svg>
      <View style={[styles.notch, styles.notchRight, { backgroundColor: theme.heroTo }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  content: { paddingHorizontal: Spacing.xl, gap: Spacing.xl },
  hero: { alignItems: 'center', gap: Spacing.lg },
  heroText: { alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  title: { fontSize: 40, lineHeight: 46 },
  ticket: { borderRadius: Radius.xl, paddingVertical: Spacing.xl, overflow: 'hidden' },
  ticketTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },
  ticketBadge: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  codeBlock: { alignItems: 'center', marginTop: Spacing.xl, gap: Spacing.xs },
  code: { fontFamily: Fonts.serifBold, fontSize: 40, lineHeight: 46, letterSpacing: 4, fontVariant: ['tabular-nums'] },
  dividerWrap: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl },
  notch: { position: 'absolute', width: 24, height: 24, borderRadius: 12 },
  notchLeft: { left: -12 },
  notchRight: { right: -12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: 7 },
  earned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  rescued: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  footer: { position: 'absolute', left: Spacing.xl, right: Spacing.xl, bottom: 0, gap: Spacing.sm },
  doneButton: { alignItems: 'center', paddingVertical: 17, borderRadius: Radius.pill },
  trackButton: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  secondaryButton: { borderWidth: 1, borderColor: 'rgba(246,240,228,0.45)', paddingVertical: 14 },
  doneText: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
});

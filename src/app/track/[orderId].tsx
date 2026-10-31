import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedCheck } from '@/components/animated-check';
import { CategoryBadge } from '@/components/category-art';
import { DeliveryMap } from '@/components/delivery-map';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { Txt } from '@/components/text';
import { enterUp, layoutTransition } from '@/constants/motion';
import { Fonts, Radius, Shadow, Spacing } from '@/constants/theme';
import type { Order } from '@/data/types';
import { offerTitle } from '@/hooks/use-feed-offers';
import { useFrameNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { useT, type StringKey } from '@/i18n';
import { formatEUR } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { buildRoute } from '@/lib/route';
import { useAppStore } from '@/store/app-store';

const SHEET_HEIGHT = 330;
/** Share of the simulated trip spent at the seller before the van starts moving. */
const PICKUP_SHARE = 0.22;

const STEPS: { key: StringKey; at: number }[] = [
  { key: 'track.step.assigned', at: 0 },
  { key: 'track.step.pickedUp', at: PICKUP_SHARE },
  { key: 'track.step.onTheWay', at: PICKUP_SHARE + 0.05 },
  { key: 'track.step.delivered', at: 1 },
];

export default function TrackScreen() {
  const { orderId, from } = useLocalSearchParams<{ orderId: string; from?: string }>();
  const order = useAppStore((s) => s.orders.find((o) => o.id === orderId));
  if (!order) return null;
  return <Tracking order={order} fromReserved={from === 'reserved'} />;
}

function Tracking({ order, fromReserved }: { order: Order; fromReserved: boolean }) {
  const theme = useTheme();
  const { t, lang } = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const businesses = useAppStore((s) => s.businesses);
  const completeOrder = useAppStore((s) => s.completeOrder);
  const seller = businesses.find((b) => b.id === order.sellerId);
  const buyer = businesses.find((b) => b.id === order.buyerId);

  const running = order.status === 'onTheWay';
  const now = useFrameNow(running);
  const progress = running ? Math.min(1, (now - order.createdAt) / (order.deliverySeconds * 1000)) : 1;
  const vanProgress = Math.max(0, (progress - PICKUP_SHARE) / (1 - PICKUP_SHARE));
  const arrived = progress >= 1;
  const minutesLeft = Math.max(1, Math.ceil(order.etaMinutes * (1 - progress)));

  const route = useMemo(
    () =>
      seller && buyer
        ? buildRoute({ latitude: seller.lat, longitude: seller.lng }, { latitude: buyer.lat, longitude: buyer.lng })
        : [],
    [seller, buyer],
  );

  useEffect(() => {
    if (arrived && running) {
      completeOrder(order.id);
      haptics.success();
    }
  }, [arrived, running, completeOrder, order.id]);

  const close = () => (fromReserved ? router.dismissTo('/') : router.back());

  if (!seller || !buyer) return null;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <DeliveryMap
        route={route}
        progress={vanProgress}
        category={order.offer.category}
        topInset={insets.top}
        bottomInset={SHEET_HEIGHT + insets.bottom}
      />

      <PressableScale onPress={close} accessibilityLabel={t('track.close')} style={[styles.close, { top: insets.top + 8 }]}>
        <BlurView intensity={70} tint={theme.scheme === 'dark' ? 'dark' : 'light'} style={styles.closeBlur}>
          <Icon sf="xmark" md="close" size={16} color={theme.ink} weight="bold" />
        </BlurView>
      </PressableScale>

      <Animated.View
        entering={enterUp(100)}
        layout={layoutTransition}
        style={[styles.sheet, Shadow, { backgroundColor: theme.surface, paddingBottom: insets.bottom + Spacing.lg }]}>
        {arrived ? (
          <View style={styles.deliveredRow}>
            <AnimatedCheck size={56} ringColor={theme.positive} checkColor={theme.positive} fill={theme.positiveSoft} />
            <View style={styles.flex}>
              <Txt variant="title">{t('track.delivered')}</Txt>
              <Txt variant="caption" color="inkMuted">
                {t('track.deliveredBody', { product: offerTitle(order.offer, lang), business: seller.name })}
              </Txt>
            </View>
          </View>
        ) : (
          <View>
            <Txt variant="label" color="inkFaint">
              {t('track.title')}
            </Txt>
            <Txt variant="display" style={styles.eta}>
              {t('track.arriving', { min: minutesLeft })}
            </Txt>
          </View>
        )}

        {/* Step progress */}
        <View style={styles.steps}>
          {STEPS.map((step, i) => {
            const reached = progress >= step.at;
            const next = STEPS[i + 1];
            const fill = next ? Math.min(1, Math.max(0, (progress - step.at) / (next.at - step.at))) : 0;
            return (
              <View key={step.key} style={[styles.step, !next && styles.stepLast]}>
                <View style={styles.stepTrack}>
                  <View style={[styles.stepDot, { backgroundColor: reached ? theme.accent : theme.surfaceAlt }]}>
                    {reached && <Icon sf="checkmark" md="check" size={10} color="#FFFFFF" weight="bold" />}
                  </View>
                  {next && (
                    <View style={[styles.stepLine, { backgroundColor: theme.surfaceAlt }]}>
                      <View style={[styles.stepLineFill, { width: `${fill * 100}%`, backgroundColor: theme.accent }]} />
                    </View>
                  )}
                </View>
                <Txt variant="caption" color={reached ? 'ink' : 'inkFaint'} numberOfLines={1} style={styles.stepLabel}>
                  {t(step.key)}
                </Txt>
              </View>
            );
          })}
        </View>

        {/* Courier and order */}
        <View style={[styles.courier, { backgroundColor: theme.surfaceAlt }]}>
          <View style={[styles.courierAvatar, { backgroundColor: theme.primary }]}>
            <Txt variant="bodyMedium" tint={theme.onPrimary} style={styles.courierInitial}>
              L
            </Txt>
          </View>
          <View style={styles.flex}>
            <Txt variant="caption" color="inkFaint">
              {t('track.courier')}
            </Txt>
            <Txt variant="bodyMedium">{t('track.courierName')}</Txt>
          </View>
          <Icon sf="bolt.car.fill" md="electric_car" size={20} color={theme.positive} />
        </View>

        <View style={styles.orderRow}>
          <CategoryBadge category={order.offer.category} size={36} />
          <View style={styles.flex}>
            <Txt variant="bodyMedium" numberOfLines={1}>
              {offerTitle(order.offer, lang)}
            </Txt>
            <Txt variant="caption" color="inkMuted" numberOfLines={1}>
              {t('track.from', { business: seller.name })} · {order.code}
            </Txt>
          </View>
          <Txt variant="bodyMedium">{formatEUR(order.total, lang)}</Txt>
        </View>

        {arrived && (
          <Animated.View entering={enterUp(150, 320)}>
            <PressableScale onPress={close} style={[styles.doneButton, { backgroundColor: theme.primary }]}>
              <Txt variant="bodyMedium" tint={theme.onPrimary} style={styles.doneText}>
                {t('track.done')}
              </Txt>
            </PressableScale>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  close: { position: 'absolute', left: Spacing.lg, width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  closeBlur: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: SHEET_HEIGHT,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  eta: { fontSize: 30, lineHeight: 36, marginTop: Spacing.xs, fontVariant: ['tabular-nums'] },
  deliveredRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  steps: { flexDirection: 'row' },
  step: { flex: 1 },
  stepLast: { flex: 0.7 },
  stepTrack: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, height: 3, marginHorizontal: 4, borderRadius: 2, overflow: 'hidden' },
  stepLineFill: { height: 3 },
  stepLabel: { marginTop: 6, fontSize: 11 },
  courier: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg },
  courierAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  courierInitial: { fontFamily: Fonts.sansBold },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  doneButton: { alignItems: 'center', paddingVertical: 16, borderRadius: Radius.pill },
  doneText: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
});

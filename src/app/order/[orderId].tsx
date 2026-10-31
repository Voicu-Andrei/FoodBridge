import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedCheck } from '@/components/animated-check';
import { CategoryBadge } from '@/components/category-art';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { StatusChip } from '@/components/status-chip';
import { Txt } from '@/components/text';
import { enterUp } from '@/constants/motion';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { offerTitle } from '@/hooks/use-feed-offers';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import { formatClock, formatEUR } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useAppStore } from '@/store/app-store';

const QR_INK = '#1A2B21';
const QR_PAPER = '#FBF8F1';

export default function OrderSheet() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const theme = useTheme();
  const { t, lang } = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const order = useAppStore((s) => s.orders.find((o) => o.id === orderId));
  const businesses = useAppStore((s) => s.businesses);
  const completeOrder = useAppStore((s) => s.completeOrder);

  if (!order) return null;
  const seller = businesses.find((b) => b.id === order.sellerId);
  const isDelivery = order.method === 'delivery';

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
      <View style={styles.header}>
        <CategoryBadge category={order.offer.category} size={48} />
        <View style={styles.flex}>
          <Txt variant="headline" numberOfLines={2}>
            {offerTitle(order.offer, lang)}
          </Txt>
          <Txt variant="caption" color="inkMuted">
            {seller?.name} · {seller?.district}
          </Txt>
        </View>
        <StatusChip status={order.status} />
      </View>

      {/* QR ticket */}
      <Animated.View entering={enterUp(60)} style={[styles.ticket, { backgroundColor: QR_PAPER }]}>
        {order.status === 'completed' ? (
          <View style={styles.completed}>
            <AnimatedCheck size={120} ringColor="#2E7A4E" checkColor="#2E7A4E" fill="#DCEBDD" />
            <Txt variant="headline" tint={QR_INK}>
              {t('order.pickedUp')}
            </Txt>
          </View>
        ) : (
          <>
            <QRCode value={`FOODBRIDGE:${order.code}:${order.id}`} size={196} color={QR_INK} backgroundColor={QR_PAPER} />
            <Txt variant="label" tint="#8E968F" style={styles.showCode}>
              {t('order.showCode')}
            </Txt>
          </>
        )}
        <Txt tint={QR_INK} style={styles.code}>
          {order.code}
        </Txt>
      </Animated.View>

      <Animated.View entering={enterUp(120)} style={[styles.details, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Row
          label={t('reserved.method')}
          value={isDelivery ? t('reserved.methodDelivery') : t('reserved.methodPickup')}
          icon={isDelivery ? 'delivery' : 'pickup'}
        />
        <Row
          label={t('detail.pickupWindow')}
          value={`${formatClock(order.offer.windowStart)} – ${formatClock(order.offer.windowEnd)}`}
          icon="clock"
        />
        <Row label={t('detail.total')} value={formatEUR(order.total, lang)} icon="card" />
      </Animated.View>

      {order.status === 'reserved' && (
        <Animated.View entering={enterUp(180)}>
          <PressableScale
            onPress={() => {
              completeOrder(order.id);
              haptics.success();
            }}
            style={[styles.button, { backgroundColor: theme.primary }]}>
            <Icon sf="checkmark.circle.fill" md="check_circle" size={17} color={theme.onPrimary} />
            <Txt variant="bodyMedium" tint={theme.onPrimary} style={styles.buttonText}>
              {t('order.markPickedUp')}
            </Txt>
          </PressableScale>
        </Animated.View>
      )}
      {order.status === 'onTheWay' && (
        <Animated.View entering={enterUp(180)}>
          <PressableScale
            onPress={() => {
              router.back();
              router.push({ pathname: '/track/[orderId]', params: { orderId: order.id } });
            }}
            style={[styles.button, { backgroundColor: theme.accent }]}>
            <Icon sf="box.truck.fill" md="local_shipping" size={17} color="#FFFFFF" />
            <Txt variant="bodyMedium" tint="#FFFFFF" style={styles.buttonText}>
              {t('order.trackDelivery')}
            </Txt>
          </PressableScale>
        </Animated.View>
      )}
    </ScrollView>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon: 'delivery' | 'pickup' | 'clock' | 'card' }) {
  const theme = useTheme();
  const icons = {
    delivery: { sf: 'box.truck.fill', md: 'local_shipping' },
    pickup: { sf: 'bicycle', md: 'pedal_bike' },
    clock: { sf: 'clock.fill', md: 'schedule' },
    card: { sf: 'creditcard.fill', md: 'credit_card' },
  } as const;
  return (
    <View style={styles.row}>
      <Icon sf={icons[icon].sf} md={icons[icon].md} size={15} color={theme.inkFaint} />
      <Txt variant="body" color="inkMuted" style={styles.flex}>
        {label}
      </Txt>
      <Txt variant="bodyMedium">{value}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.xl, paddingTop: Spacing.xxl, gap: Spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  ticket: { alignItems: 'center', borderRadius: Radius.xl, paddingVertical: Spacing.xxl, gap: Spacing.sm },
  completed: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  showCode: { marginTop: Spacing.md },
  code: { fontFamily: Fonts.serifBold, fontSize: 34, lineHeight: 40, letterSpacing: 4 },
  details: { borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 10 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: Radius.pill,
  },
  buttonText: { fontFamily: Fonts.sansSemiBold, fontSize: 16 },
});

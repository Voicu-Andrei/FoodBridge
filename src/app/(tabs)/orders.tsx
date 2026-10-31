import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { CategoryArt, CategoryBadge } from '@/components/category-art';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { Segmented } from '@/components/segmented';
import { StatusChip } from '@/components/status-chip';
import { Txt } from '@/components/text';
import { enterUp, layoutTransition } from '@/constants/motion';
import { Fonts, Radius, Shadow, Spacing } from '@/constants/theme';
import type { Offer, Order } from '@/data/types';
import { offerTitle } from '@/hooks/use-feed-offers';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import { formatClock, formatEUR } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useActiveBusiness, useAppStore } from '@/store/app-store';

type Segment = 'purchases' | 'sales' | 'listings';

function isSegment(value: string | undefined): value is Segment {
  return value === 'purchases' || value === 'sales' || value === 'listings';
}

export default function OrdersScreen() {
  const { t } = useT();
  const { segment } = useLocalSearchParams<{ segment?: string }>();
  const me = useActiveBusiness();
  const now = useNow();
  const orders = useAppStore((s) => s.orders);
  const offers = useAppStore((s) => s.offers);

  const [tab, setTab] = useState<Segment>(isSegment(segment) ? segment : 'purchases');
  // Follow the segment param when another screen links here (e.g. "View my listings").
  const [lastParam, setLastParam] = useState(segment);
  if (segment !== lastParam) {
    setLastParam(segment);
    if (isSegment(segment)) setTab(segment);
  }

  const purchases = useMemo(() => orders.filter((o) => o.buyerId === me.id), [orders, me.id]);
  const sales = useMemo(() => orders.filter((o) => o.sellerId === me.id), [orders, me.id]);
  const listings = useMemo(
    () => offers.filter((o) => o.businessId === me.id && o.windowEnd > now).sort((a, b) => b.createdAt - a.createdAt),
    [offers, me.id, now],
  );

  return (
    <Screen title={t('tab.orders')}>
      <Segmented<Segment>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'purchases', label: `${t('orders.purchases')} · ${purchases.length}` },
          { value: 'sales', label: `${t('orders.sales')} · ${sales.length}` },
          { value: 'listings', label: `${t('orders.listings')} · ${listings.length}` },
        ]}
      />

      {tab === 'purchases' && <PurchaseList orders={purchases} now={now} />}
      {tab === 'sales' && <SalesList orders={sales} />}
      {tab === 'listings' && <ListingList offers={listings} />}
    </Screen>
  );
}

function PurchaseList({ orders, now }: { orders: Order[]; now: number }) {
  const theme = useTheme();
  const { t, lang } = useT();
  const router = useRouter();
  const businesses = useAppStore((s) => s.businesses);

  if (orders.length === 0) {
    return (
      <Empty
        sf="bag"
        md="shopping_bag"
        title={t('orders.emptyPurchases')}
        body={t('orders.emptyPurchasesBody')}
        action={t('orders.browse')}
        onAction={() => router.navigate('/')}
      />
    );
  }

  return (
    <View style={styles.list}>
      {orders.map((order, index) => {
        const seller = businesses.find((b) => b.id === order.sellerId);
        const tracking = order.status === 'onTheWay';
        const left = Math.max(1, Math.ceil(order.etaMinutes * (1 - (now - order.createdAt) / (order.deliverySeconds * 1000))));
        return (
          <Animated.View key={order.id} entering={enterUp(Math.min(index, 6) * 50, 360)} layout={layoutTransition}>
            <PressableScale
              onPress={() => router.push({ pathname: '/order/[orderId]', params: { orderId: order.id } })}
              style={[styles.card, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
              <View style={styles.cardRow}>
                <CategoryBadge category={order.offer.category} size={46} />
                <View style={styles.flex}>
                  <Txt variant="bodyMedium" numberOfLines={1}>
                    {offerTitle(order.offer, lang)}
                  </Txt>
                  <Txt variant="caption" color="inkMuted" numberOfLines={1}>
                    {seller?.name} · {order.code}
                  </Txt>
                  <View style={styles.chipRow}>
                    <StatusChip status={order.status} />
                  </View>
                </View>
                <View style={styles.amount}>
                  <Txt variant="bodyMedium">{formatEUR(order.total, lang)}</Txt>
                  <Icon sf="qrcode" md="qr_code_2" size={18} color={theme.inkFaint} />
                </View>
              </View>
              {tracking && (
                <PressableScale
                  onPress={() => router.push({ pathname: '/track/[orderId]', params: { orderId: order.id } })}
                  style={[styles.trackBar, { backgroundColor: theme.accentSoft }]}>
                  <Icon sf="box.truck.fill" md="local_shipping" size={15} color={theme.accent} />
                  <Txt variant="caption" tint={theme.accent} style={styles.flex}>
                    {t('track.arriving', { min: left })}
                  </Txt>
                  <Txt variant="caption" tint={theme.accent} style={styles.bold}>
                    {t('orders.track')} →
                  </Txt>
                </PressableScale>
              )}
            </PressableScale>
          </Animated.View>
        );
      })}
    </View>
  );
}

function SalesList({ orders }: { orders: Order[] }) {
  const theme = useTheme();
  const { t, lang } = useT();
  const businesses = useAppStore((s) => s.businesses);

  if (orders.length === 0) {
    return <Empty sf="chart.line.uptrend.xyaxis" md="trending_up" title={t('orders.emptySales')} body={t('orders.emptySalesBody')} />;
  }

  return (
    <View style={styles.list}>
      {orders.map((order, index) => {
        const buyer = businesses.find((b) => b.id === order.buyerId);
        return (
          <Animated.View
            key={order.id}
            entering={enterUp(Math.min(index, 6) * 50, 360)}
            layout={layoutTransition}
            style={[styles.card, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <View style={styles.cardRow}>
              <CategoryBadge category={order.offer.category} size={46} />
              <View style={styles.flex}>
                <Txt variant="bodyMedium" numberOfLines={1}>
                  {offerTitle(order.offer, lang)}
                </Txt>
                <Txt variant="caption" color="inkMuted" numberOfLines={1}>
                  {t('orders.boughtBy', { business: buyer?.name ?? '' })}
                </Txt>
                <View style={styles.chipRow}>
                  <StatusChip status={order.status} />
                </View>
              </View>
              <View style={styles.amount}>
                <Txt variant="bodyMedium" tint={theme.positive}>
                  +{formatEUR(order.itemPrice, lang)}
                </Txt>
                <Txt variant="caption" color="inkFaint">
                  {t('orders.earned')}
                </Txt>
              </View>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

function ListingList({ offers }: { offers: Offer[] }) {
  const theme = useTheme();
  const { t, lang } = useT();
  const router = useRouter();
  const removeOffer = useAppStore((s) => s.removeOffer);

  const confirmRemove = (offer: Offer) =>
    Alert.alert(t('orders.removeConfirm'), t('orders.removeBody'), [
      { text: t('orders.cancel'), style: 'cancel' },
      {
        text: t('orders.remove'),
        style: 'destructive',
        onPress: () => {
          removeOffer(offer.id);
          haptics.success();
        },
      },
    ]);

  return (
    <View style={styles.list}>
      <PressableScale onPress={() => router.push('/publish')} style={[styles.postButton, { backgroundColor: theme.accent }]}>
        <Icon sf="plus" md="add" size={16} color="#FFFFFF" weight="bold" />
        <Txt variant="bodyMedium" tint="#FFFFFF" style={styles.bold}>
          {t('orders.post')}
        </Txt>
      </PressableScale>

      {offers.length === 0 && <Empty sf="tray" md="inbox" title={t('orders.emptyListings')} body={t('orders.emptyListingsBody')} />}

      {offers.map((offer, index) => (
        <Animated.View
          key={offer.id}
          entering={enterUp(Math.min(index, 6) * 50, 360)}
          exiting={FadeOut.duration(180)}
          layout={layoutTransition}
          style={[styles.listing, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <CategoryArt category={offer.category} height={84} photoUri={offer.photoUri} style={styles.listingArt} />
          <View style={styles.listingBody}>
            <Txt variant="bodyMedium" numberOfLines={1}>
              {offerTitle(offer, lang)}
            </Txt>
            <Txt variant="caption" color="inkMuted">
              {formatEUR(offer.priceDiscount, lang)} · {t('orders.live', { time: formatClock(offer.windowEnd) })}
            </Txt>
            <View style={styles.listingActions}>
              <PressableScale
                onPress={() => router.push({ pathname: '/publish', params: { offerId: offer.id } })}
                style={[styles.smallButton, { backgroundColor: theme.surfaceAlt }]}>
                <Icon sf="pencil" md="edit" size={12} color={theme.ink} />
                <Txt variant="caption">{t('orders.edit')}</Txt>
              </PressableScale>
              <PressableScale onPress={() => confirmRemove(offer)} style={[styles.smallButton, { backgroundColor: theme.accentSoft }]}>
                <Icon sf="trash" md="delete" size={12} color={theme.accent} />
                <Txt variant="caption" tint={theme.accent}>
                  {t('orders.remove')}
                </Txt>
              </PressableScale>
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

type EmptyProps = {
  sf: SFSymbol;
  md: AndroidSymbol;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
};

function Empty({ sf, md, title, body, action, onAction }: EmptyProps) {
  const theme = useTheme();
  return (
    <Animated.View entering={enterUp(80)} style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceAlt }]}>
        <Icon sf={sf} md={md} size={26} color={theme.inkMuted} />
      </View>
      <Txt variant="headline">{title}</Txt>
      <Txt variant="body" color="inkMuted" style={styles.center}>
        {body}
      </Txt>
      {action && onAction && (
        <PressableScale onPress={onAction} style={[styles.emptyButton, { backgroundColor: theme.primary }]}>
          <Txt variant="bodyMedium" tint={theme.onPrimary}>
            {action}
          </Txt>
        </PressableScale>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  bold: { fontFamily: Fonts.sansSemiBold },
  list: { gap: Spacing.md },
  card: { borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.md, gap: Spacing.md },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  chipRow: { marginTop: 6 },
  amount: { alignItems: 'flex-end', gap: 6 },
  trackBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radius.pill,
  },
  listing: { flexDirection: 'row', borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  listingArt: { width: 96, height: '100%', minHeight: 104 },
  listingBody: { flex: 1, padding: Spacing.md, gap: 3 },
  listingActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  smallButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.pill },
  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  emptyButton: { marginTop: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: 12, borderRadius: Radius.pill },
});

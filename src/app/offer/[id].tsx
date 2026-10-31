import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryArt, CategoryBadge } from '@/components/category-art';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { SlideToReserve } from '@/components/slide-to-reserve';
import { Txt } from '@/components/text';
import { enterFade, enterUp } from '@/constants/motion';
import { Fonts, Radius, Shadow, Spacing } from '@/constants/theme';
import type { Business, FulfilmentMethod, Offer, Order } from '@/data/types';
import { offerNotes, offerTitle } from '@/hooks/use-feed-offers';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import {
  formatClock,
  formatCountdown,
  formatDistance,
  formatEUR,
  formatQuantity,
} from '@/lib/format';
import { orderTotal, quoteOffer, round2 } from '@/lib/pricing';
import { useActiveBusiness, useAppStore } from '@/store/app-store';

const ART_HEIGHT = 340;
const ON_ART = '#1A2B21';

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useActiveBusiness();
  const offer = useAppStore((s) => s.offers.find((o) => o.id === id));
  const myOrder = useAppStore((s) => s.orders.find((o) => o.offer.id === id && o.buyerId === me.id));
  const businesses = useAppStore((s) => s.businesses);

  const shown = offer ?? myOrder?.offer;
  const seller = shown && businesses.find((b) => b.id === shown.businessId);
  if (!shown || !seller) return <Unavailable />;
  return <OfferDetail offer={shown} seller={seller} buyer={me} order={myOrder} />;
}

function OfferDetail({ offer, seller, buyer, order }: { offer: Offer; seller: Business; buyer: Business; order?: Order }) {
  const theme = useTheme();
  const { t, lang } = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const thresholdKm = useAppStore((s) => s.thresholdKm);
  const reserveOffer = useAppStore((s) => s.reserveOffer);

  const quote = quoteOffer(offer, seller, buyer, thresholdKm);
  const recommended: FulfilmentMethod = quote.recommendSelf ? 'pickup' : 'delivery';
  const [method, setMethod] = useState<FulfilmentMethod>(recommended);
  const totals = orderTotal(offer, quote, method);
  const balanceAfter = round2(buyer.walletBalance - totals.total);
  const canAfford = balanceAfter >= 0;

  const isOpen = now >= offer.windowStart;
  const windowProgress = Math.min(1, Math.max(0, (now - offer.windowStart) / (offer.windowEnd - offer.windowStart)));
  const unitLabel = offer.unit === 'kg' ? 'kg' : t(offer.unit === 'portions' ? 'unit.portions' : 'unit.units');
  const notes = offerNotes(offer, lang);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  // Stretch the artwork when pulling down, drift it slower than the content when scrolling up.
  const artStyle = useAnimatedStyle(() => {
    const y = scrollY.get();
    return {
      transform: [
        { translateY: y < 0 ? y / 2 : y * 0.4 },
        { scale: y < 0 ? 1 + -y / ART_HEIGHT : 1 },
      ],
    };
  });
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [ART_HEIGHT - 160, ART_HEIGHT - 100], [0, 1], Extrapolation.CLAMP),
  }));

  const reserve = () => {
    const result = reserveOffer(offer.id, method);
    if (result.ok) router.push({ pathname: '/reserved/[orderId]', params: { orderId: result.orderId } });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}>
        <Animated.View style={artStyle}>
          <CategoryArt category={offer.category} height={ART_HEIGHT} photoUri={offer.photoUri}>
            <View style={[styles.artTop, { paddingTop: insets.top + 60 }]}>
              <View style={styles.artPill}>
                <Txt variant="caption" tint={ON_ART}>
                  {t(`category.${offer.category}`)}
                </Txt>
              </View>
              <View style={styles.artPill}>
                <Icon sf="location.fill" md="location_on" size={11} color={ON_ART} />
                <Txt variant="caption" tint={ON_ART}>
                  {formatDistance(quote.distanceKm, lang)}
                </Txt>
              </View>
            </View>
            <View style={styles.artBottom}>
              <View style={styles.discount}>
                <Txt variant="title" tint="#F6F0E4">
                  −{quote.discount}%
                </Txt>
              </View>
            </View>
          </CategoryArt>
        </Animated.View>

        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <Animated.View entering={enterUp(80)}>
            <Txt variant="display" style={styles.title}>
              {offerTitle(offer, lang)}
            </Txt>
            <View style={styles.sellerRow}>
              <CategoryBadge category={seller.category} size={36} />
              <View style={styles.flex}>
                <Txt variant="bodyMedium">{seller.name}</Txt>
                <Txt variant="caption" color="inkMuted">
                  {seller.district}, München
                </Txt>
              </View>
            </View>
          </Animated.View>

          {/* Live pickup countdown */}
          <Animated.View entering={enterUp(140)} style={[styles.card, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <View style={styles.rowBetween}>
              <Txt variant="label" color="inkFaint">
                {t('detail.pickupWindow')}
              </Txt>
              <Txt variant="caption" color="inkMuted">
                {formatClock(offer.windowStart)} – {formatClock(offer.windowEnd)}
              </Txt>
            </View>
            <View style={[styles.rowBetween, styles.countdownRow]}>
              <Txt variant="bodyMedium" color="inkMuted">
                {isOpen ? t('detail.endsIn') : t('detail.opensIn')}
              </Txt>
              <Txt variant="title" style={styles.tabular}>
                {formatCountdown((isOpen ? offer.windowEnd : offer.windowStart) - now)}
              </Txt>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.surfaceAlt }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${windowProgress * 100}%`, backgroundColor: windowProgress > 0.7 ? '#B8432C' : theme.accent },
                ]}
              />
            </View>
          </Animated.View>

          {/* Key facts */}
          <Animated.View entering={enterUp(200)} style={styles.facts}>
            <Fact label={t('detail.quantity')} value={formatQuantity(offer.quantity, offer.unit, unitLabel)} />
            <Fact label={t('detail.distance')} value={formatDistance(quote.distanceKm, lang)} />
            <Fact label={t('detail.youSave')} value={formatEUR(offer.priceOriginal - offer.priceDiscount, lang)} accent />
          </Animated.View>

          {notes.length > 0 && (
            <Animated.View entering={enterUp(240)} style={[styles.note, { backgroundColor: theme.surfaceAlt }]}>
              <Icon sf="quote.opening" md="format_quote" size={16} color={theme.inkFaint} />
              <View style={styles.flex}>
                <Txt variant="label" color="inkFaint">
                  {t('detail.notes')}
                </Txt>
                <Txt variant="body" style={styles.noteText}>
                  {notes}
                </Txt>
              </View>
            </Animated.View>
          )}

          {/* Pickup vs delivery */}
          {!order && (
            <Animated.View entering={enterUp(280)}>
              <Txt variant="headline" style={styles.sectionTitle}>
                {t('detail.howTitle')}
              </Txt>
              <View style={styles.methods}>
                <MethodOption
                  selected={method === 'pickup'}
                  recommended={recommended === 'pickup'}
                  onPress={() => setMethod('pickup')}
                  sf="bicycle"
                  md="pedal_bike"
                  title={t('detail.pickupTitle')}
                  subtitle={t('detail.pickupSub', { min: quote.bikeMinutes })}
                />
                <MethodOption
                  selected={method === 'delivery'}
                  recommended={recommended === 'delivery'}
                  onPress={() => setMethod('delivery')}
                  sf="box.truck.fill"
                  md="local_shipping"
                  title={t('detail.deliveryTitle')}
                  subtitle={t('detail.deliverySub', { min: quote.deliveryMinutes, price: formatEUR(quote.deliveryPrice, lang) })}
                />
              </View>
            </Animated.View>
          )}

          {/* Price summary */}
          {!order && (
            <Animated.View entering={enterUp(320)} style={[styles.card, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }]}>
              <Txt variant="label" color="inkFaint">
                {t('detail.summary')}
              </Txt>
              <SummaryRow label={t('detail.item')} value={formatEUR(totals.itemPrice, lang)} strike={formatEUR(offer.priceOriginal, lang)} />
              <SummaryRow
                label={t('detail.deliveryFee')}
                value={totals.deliveryFee > 0 ? formatEUR(totals.deliveryFee, lang) : t('detail.free')}
              />
              <View style={[styles.divider, { backgroundColor: theme.line }]} />
              <View style={styles.rowBetween}>
                <Txt variant="bodyMedium">{t('detail.total')}</Txt>
                <Txt variant="price">{formatEUR(totals.total, lang)}</Txt>
              </View>
              <Txt variant="caption" tint={canAfford ? theme.inkMuted : theme.accent} style={styles.walletAfter}>
                {t('detail.walletAfter', { amount: formatEUR(balanceAfter, lang) })}
              </Txt>
            </Animated.View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Compact top bar that appears once the artwork scrolls away */}
      <Animated.View pointerEvents="none" style={[styles.topBar, { height: insets.top + 56 }, barStyle]}>
        <BlurView
          intensity={80}
          tint={theme.scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.topBarRow, { paddingTop: insets.top }]}>
          <Txt variant="headline" numberOfLines={1} style={styles.topBarTitle}>
            {offerTitle(offer, lang)}
          </Txt>
        </View>
      </Animated.View>

      <PressableScale
        onPress={() => router.back()}
        accessibilityLabel={t('detail.back')}
        style={[styles.backButton, { top: insets.top + 8 }]}>
        <BlurView intensity={60} tint={theme.scheme === 'dark' ? 'dark' : 'light'} style={styles.backBlur}>
          <Icon sf="chevron.left" md="arrow_back" size={18} color={theme.ink} weight="bold" />
        </BlurView>
      </PressableScale>

      {/* Bottom action bar */}
      <Animated.View entering={enterFade(250)} style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
        <BlurView
          intensity={80}
          tint={theme.scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
          style={StyleSheet.absoluteFill}
        />
        {order ? (
          <View style={[styles.reservedPill, { backgroundColor: theme.positiveSoft }]}>
            <Icon sf="checkmark.seal.fill" md="verified" size={20} color={theme.positive} />
            <View style={styles.flex}>
              <Txt variant="bodyMedium" tint={theme.positive}>
                {t('detail.reservedTitle')}
              </Txt>
              <Txt variant="caption" color="inkMuted">
                {t('detail.reservedBody', { code: order.code })}
              </Txt>
            </View>
          </View>
        ) : canAfford ? (
          <SlideToReserve label={t('detail.slide')} price={formatEUR(totals.total, lang)} onComplete={reserve} />
        ) : (
          <View style={styles.needRow}>
            <Txt variant="caption" tint={theme.accent} style={styles.flex}>
              {t('detail.needMore', { amount: formatEUR(-balanceAfter, lang) })}
            </Txt>
            <PressableScale
              onPress={() => router.push({ pathname: '/top-up', params: { need: String(-balanceAfter) } })}
              style={[styles.topUpButton, { backgroundColor: theme.primary }]}>
              <Icon sf="plus" md="add" size={14} color={theme.onPrimary} weight="bold" />
              <Txt variant="bodyMedium" tint={theme.onPrimary}>
                {t('detail.topUp')}
              </Txt>
            </PressableScale>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

function Fact({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.fact, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Txt variant="label" color="inkFaint" numberOfLines={1}>
        {label}
      </Txt>
      <Txt variant="headline" tint={accent ? theme.positive : theme.ink} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Txt>
    </View>
  );
}

function SummaryRow({ label, value, strike }: { label: string; value: string; strike?: string }) {
  return (
    <View style={[styles.rowBetween, styles.summaryRow]}>
      <Txt variant="body" color="inkMuted">
        {label}
      </Txt>
      <View style={styles.summaryValue}>
        {strike && (
          <Txt variant="caption" color="inkFaint" style={styles.strike}>
            {strike}
          </Txt>
        )}
        <Txt variant="bodyMedium">{value}</Txt>
      </View>
    </View>
  );
}

type MethodOptionProps = {
  selected: boolean;
  recommended: boolean;
  onPress: () => void;
  sf: 'bicycle' | 'box.truck.fill';
  md: 'pedal_bike' | 'local_shipping';
  title: string;
  subtitle: string;
};

function MethodOption({ selected, recommended, onPress, sf, md, title, subtitle }: MethodOptionProps) {
  const theme = useTheme();
  const { t } = useT();
  return (
    <PressableScale
      haptic="select"
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[
        styles.method,
        {
          backgroundColor: selected ? theme.surface : theme.surfaceAlt,
          borderColor: selected ? theme.primary : 'transparent',
        },
      ]}>
      <View style={styles.methodTop}>
        <View style={[styles.methodIcon, { backgroundColor: selected ? theme.primary : theme.surface }]}>
          <Icon sf={sf} md={md} size={18} color={selected ? theme.onPrimary : theme.inkMuted} />
        </View>
        <Icon
          sf={selected ? 'checkmark.circle.fill' : 'circle'}
          md={selected ? 'check_circle' : 'radio_button_unchecked'}
          size={20}
          color={selected ? theme.primary : theme.inkFaint}
        />
      </View>
      <Txt variant="bodyMedium" style={styles.methodTitle}>
        {title}
      </Txt>
      <Txt variant="caption" color="inkMuted">
        {subtitle}
      </Txt>
      {recommended && (
        <View style={[styles.recommended, { backgroundColor: theme.accentSoft }]}>
          <Txt variant="label" tint={theme.accent} style={styles.recommendedText}>
            {t('detail.recommended')}
          </Txt>
        </View>
      )}
    </PressableScale>
  );
}

function Unavailable() {
  const theme = useTheme();
  const { t } = useT();
  const router = useRouter();
  return (
    <View style={[styles.unavailable, { backgroundColor: theme.background }]}>
      <View style={[styles.unavailableIcon, { backgroundColor: theme.surfaceAlt }]}>
        <Icon sf="basket" md="shopping_basket" size={30} color={theme.inkMuted} />
      </View>
      <Txt variant="title">{t('detail.unavailableTitle')}</Txt>
      <Txt variant="body" color="inkMuted" style={styles.center}>
        {t('detail.unavailableBody')}
      </Txt>
      <PressableScale onPress={() => router.back()} style={[styles.topUpButton, { backgroundColor: theme.primary }]}>
        <Txt variant="bodyMedium" tint={theme.onPrimary}>
          {t('detail.backToOffers')}
        </Txt>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  artTop: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.xl },
  artBottom: { position: 'absolute', left: Spacing.xl, bottom: Spacing.xxl + 28 },
  artPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },
  discount: { backgroundColor: '#1A2B21', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.md },
  sheet: {
    marginTop: -28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    gap: Spacing.lg,
  },
  title: { fontSize: 32, lineHeight: 36 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg },
  card: { borderRadius: Radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.lg },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countdownRow: { marginTop: Spacing.md },
  tabular: { fontFamily: Fonts.serifBold, fontVariant: ['tabular-nums'] },
  progressTrack: { height: 6, borderRadius: 3, marginTop: Spacing.md, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  facts: { flexDirection: 'row', gap: Spacing.sm },
  fact: { flex: 1, borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.md, gap: 6 },
  note: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.lg },
  noteText: { marginTop: 4 },
  sectionTitle: { marginTop: Spacing.sm, marginBottom: Spacing.md },
  methods: { flexDirection: 'row', gap: Spacing.sm },
  method: { flex: 1, borderRadius: Radius.lg, borderWidth: 1.5, padding: Spacing.md, minHeight: 138 },
  methodTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  methodIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  methodTitle: { marginTop: Spacing.md },
  recommended: { alignSelf: 'flex-start', marginTop: Spacing.sm, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  recommendedText: { fontSize: 9.5 },
  summaryRow: { marginTop: Spacing.md },
  summaryValue: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  strike: { textDecorationLine: 'line-through' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.md },
  walletAfter: { marginTop: Spacing.sm, textAlign: 'right' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  topBarRow: { flex: 1, justifyContent: 'center', paddingLeft: 72, paddingRight: Spacing.xl },
  topBarTitle: { fontSize: 17 },
  backButton: { position: 'absolute', left: Spacing.lg, width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  backBlur: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    overflow: 'hidden',
  },
  reservedPill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.xl },
  needRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 62 },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.pill,
  },
  unavailable: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xxl },
  unavailableIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});

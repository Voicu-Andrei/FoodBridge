import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { CategoryArt } from '@/components/category-art';
import { Icon } from '@/components/icon';
import { PressableScale } from '@/components/pressable-scale';
import { Txt } from '@/components/text';
import { enterUp, layoutTransition } from '@/constants/motion';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import type { FeedOffer } from '@/hooks/use-feed-offers';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import { formatClock, formatDistance, formatDuration, formatEUR, formatQuantity } from '@/lib/format';

const ON_ART = '#1A2B21';

type OfferCardProps = {
  item: FeedOffer;
  index: number;
  now: number;
};

export function OfferCard({ item, index, now }: OfferCardProps) {
  const theme = useTheme();
  const { t, lang } = useT();
  const { offer, business } = item;

  const isOpen = now >= offer.windowStart;
  const endingSoon = isOpen && offer.windowEnd - now < 45 * 60_000;
  const timeLabel = isOpen
    ? t('card.endsIn', { time: formatDuration(offer.windowEnd - now) })
    : t('card.opensIn', { time: formatDuration(offer.windowStart - now) });
  const unitLabel = offer.unit === 'kg' ? 'kg' : t(offer.unit === 'portions' ? 'unit.portions' : 'unit.units');

  return (
    <Animated.View
      entering={enterUp(Math.min(index, 6) * 60)}
      exiting={FadeOut.duration(160)}
      layout={layoutTransition}>
      {/* On iOS 18+ the card zooms into the detail screen (native zoom transition). */}
      <Link href={{ pathname: '/offer/[id]', params: { id: offer.id } }} asChild>
        <Link.AppleZoom>
          {/* Link's Slot requires a single flattened style object on its child. */}
          <PressableScale
            style={StyleSheet.flatten([styles.card, Shadow, { backgroundColor: theme.surface, borderColor: theme.line }])}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${business.name}, ${formatEUR(offer.priceDiscount, lang)}`}>
            <CategoryArt category={offer.category} height={128} photoUri={offer.photoUri}>
              <View style={styles.artTop}>
                <View style={styles.artPill}>
                  <Txt variant="caption" tint={ON_ART}>
                    {t(`category.${offer.category}`)}
                  </Txt>
                </View>
                <View style={styles.artPill}>
                  <Icon sf="location.fill" md="location_on" size={11} color={ON_ART} />
                  <Txt variant="caption" tint={ON_ART}>
                    {formatDistance(item.distanceKm, lang)}
                  </Txt>
                </View>
              </View>
              <View style={styles.artBottom}>
                <View style={[styles.discount, { backgroundColor: theme.scheme === 'dark' ? '#0C1410' : '#1A2B21' }]}>
                  <Txt variant="headline" tint="#F6F0E4" style={styles.discountText}>
                    −{item.discount}%
                  </Txt>
                </View>
                <View style={[styles.artPill, endingSoon && styles.urgentPill]}>
                  <Icon sf="clock.fill" md="schedule" size={11} color={endingSoon ? '#FFFFFF' : ON_ART} />
                  <Txt variant="caption" tint={endingSoon ? '#FFFFFF' : ON_ART}>
                    {timeLabel}
                  </Txt>
                </View>
              </View>
            </CategoryArt>

            <View style={styles.body}>
              <Txt variant="headline" numberOfLines={2}>
                {item.title}
              </Txt>
              <Txt variant="caption" color="inkMuted" style={styles.business}>
                {business.name} · {business.district}
              </Txt>

              <View style={styles.metaRow}>
                <Meta sf="scalemass.fill" md="scale" text={formatQuantity(offer.quantity, offer.unit, unitLabel)} />
                <Meta
                  sf="bag.fill"
                  md="shopping_bag"
                  text={t('card.pickupWindow', { from: formatClock(offer.windowStart), to: formatClock(offer.windowEnd) })}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.line }]} />

              <View style={styles.footer}>
                <View>
                  <Txt variant="caption" color="inkFaint" style={styles.strike}>
                    {formatEUR(offer.priceOriginal, lang)}
                  </Txt>
                  <Txt variant="price">{formatEUR(offer.priceDiscount, lang)}</Txt>
                </View>
                <Recommendation item={item} />
              </View>
            </View>
          </PressableScale>
        </Link.AppleZoom>
      </Link>
    </Animated.View>
  );
}

function Meta({ sf, md, text }: { sf: 'scalemass.fill' | 'bag.fill'; md: 'scale' | 'shopping_bag'; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.meta}>
      <Icon sf={sf} md={md} size={12} color={theme.inkFaint} />
      <Txt variant="caption" color="inkMuted">
        {text}
      </Txt>
    </View>
  );
}

function Recommendation({ item }: { item: FeedOffer }) {
  const theme = useTheme();
  const { t, lang } = useT();
  const self = item.recommendSelf;

  return (
    <View style={styles.recommendation}>
      <Txt variant="label" color="inkFaint" style={styles.recommendationLabel}>
        {t('card.recommended')}
      </Txt>
      <View style={[styles.recommendationPill, { backgroundColor: self ? theme.positiveSoft : theme.accentSoft }]}>
        <Icon
          sf={self ? 'bicycle' : 'box.truck.fill'}
          md={self ? 'pedal_bike' : 'local_shipping'}
          size={14}
          color={self ? theme.positive : theme.accent}
        />
        <Txt variant="caption" tint={self ? theme.positive : theme.accent}>
          {self
            ? t('card.pickupByBike', { min: item.bikeMinutes })
            : t('card.delivery', { price: formatEUR(item.deliveryPrice, lang) })}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  artTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  artBottom: {
    position: 'absolute',
    left: Spacing.md,
    bottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  artPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },
  urgentPill: { backgroundColor: '#B8432C' },
  discount: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  discountText: { fontSize: 17, lineHeight: 22 },
  body: { padding: Spacing.lg, paddingTop: Spacing.md },
  business: { marginTop: 3 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.md },
  footer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.md },
  strike: { textDecorationLine: 'line-through' },
  recommendation: { alignItems: 'flex-end', flexShrink: 1 },
  recommendationLabel: { fontSize: 9.5, marginBottom: 4 },
  recommendationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
});

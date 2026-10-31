import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOutUp, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryBadge } from '@/components/category-art';
import { PressableScale } from '@/components/pressable-scale';
import { PulseDot } from '@/components/pulse-dot';
import { Txt } from '@/components/text';
import { EASE_OUT } from '@/constants/motion';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { offerTitle } from '@/hooks/use-feed-offers';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import { formatDistance, formatEUR } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { distanceKm } from '@/lib/geo';
import { useActiveBusiness, useAppStore } from '@/store/app-store';

const VISIBLE_MS = 5500;

/** Keeps adding simulated offers from other businesses while the live marketplace is on. */
export function useLiveMarket() {
  const onboarded = useAppStore((s) => s.onboarded);
  const liveMarket = useAppStore((s) => s.liveMarket);
  const intervalSec = useAppStore((s) => s.liveIntervalSec);
  const addLiveOffer = useAppStore((s) => s.addLiveOffer);

  useEffect(() => {
    if (!onboarded || !liveMarket) return;
    const id = setInterval(addLiveOffer, intervalSec * 1000);
    return () => clearInterval(id);
  }, [onboarded, liveMarket, intervalSec, addLiveOffer]);
}

/** Toast that slides down when a new offer appears nearby; tapping it opens the offer. */
export function LiveBanner() {
  const theme = useTheme();
  const { t, lang } = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  const me = useActiveBusiness();
  const onboarded = useAppStore((s) => s.onboarded);
  const last = useAppStore((s) => s.lastLiveOffer);
  const offer = useAppStore((s) => (s.lastLiveOffer ? s.offers.find((o) => o.id === s.lastLiveOffer?.offerId) : undefined));
  const seller = useAppStore((s) => (offer ? s.businesses.find((b) => b.id === offer.businessId) : undefined));
  const [dismissedAt, setDismissedAt] = useState(0);

  const visible = onboarded && !!last && !!offer && !!seller && last.at > dismissedAt && now - last.at < VISIBLE_MS;

  useEffect(() => {
    if (last) haptics.select();
  }, [last]);

  if (!visible || !offer || !seller) return null;

  return (
    <Animated.View
      key={offer.id}
      entering={SlideInUp.duration(420).easing(EASE_OUT)}
      exiting={FadeOutUp.duration(250)}
      style={[styles.wrap, { top: insets.top + Spacing.xs }]}>
      <PressableScale
        onPress={() => {
          setDismissedAt(Date.now());
          router.push({ pathname: '/offer/[id]', params: { id: offer.id } });
        }}
        style={[styles.banner, Shadow]}>
        <BlurView
          intensity={90}
          tint={theme.scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
          style={[styles.blur, { borderColor: theme.line }]}>
          <CategoryBadge category={offer.category} size={40} />
          <View style={styles.text}>
            <View style={styles.liveRow}>
              <PulseDot color={theme.accent} size={7} />
              <Txt variant="label" tint={theme.accent} style={styles.label}>
                {t('live.new')} · {formatDistance(distanceKm(me.lat, me.lng, seller.lat, seller.lng), lang)}
              </Txt>
            </View>
            <Txt variant="bodyMedium" numberOfLines={1}>
              {offerTitle(offer, lang)}
            </Txt>
            <Txt variant="caption" color="inkMuted" numberOfLines={1}>
              {seller.name} · {formatEUR(offer.priceDiscount, lang)}
            </Txt>
          </View>
        </BlurView>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: Spacing.md, right: Spacing.md, zIndex: 100 },
  banner: { borderRadius: Radius.xl },
  blur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, gap: 1 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 10 },
});

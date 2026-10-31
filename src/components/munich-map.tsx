import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryBadge } from '@/components/category-art';
import { Icon } from '@/components/icon';
import { MePin, OfferPin } from '@/components/map-pins';
import { PressableScale } from '@/components/pressable-scale';
import { PulseDot } from '@/components/pulse-dot';
import { Segmented } from '@/components/segmented';
import { Txt } from '@/components/text';
import { enterUp } from '@/constants/motion';
import { Radius, Shadow, Spacing, TabBarClearance } from '@/constants/theme';
import type { FeedOffer } from '@/hooks/use-feed-offers';
import { useLiveOffers } from '@/hooks/use-feed-offers';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/i18n';
import { formatDistance, formatEUR } from '@/lib/format';
import { useActiveBusiness, useAppStore } from '@/store/app-store';

const MUNICH = { latitude: 48.1405, longitude: 11.5745, latitudeDelta: 0.085, longitudeDelta: 0.085 };
const RADIUS_OPTIONS = ['1', '2', '3', '5', '8'] as const;
const GAP = 12;

/** Real Munich map: category pins, the pickup radius and a snapping carousel kept in sync with the pins. */
export function MunichMap() {
  const theme = useTheme();
  const { t, lang } = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const now = useNow();
  const me = useActiveBusiness();
  const thresholdKm = useAppStore((s) => s.thresholdKm);
  const setThresholdKm = useAppStore((s) => s.setThresholdKm);
  const live = useLiveOffers(now);
  const items = useMemo(() => [...live].sort((a, b) => a.distanceKm - b.distanceKm), [live]);
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlatList<FeedOffer>>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cardWidth = width - 64;
  const activeId = items.some((i) => i.offer.id === selectedId) ? selectedId : (items[0]?.offer.id ?? null);
  const nearby = items.filter((i) => i.recommendSelf).length;

  // Several offers from one business would stack on the same spot, so fan them out slightly.
  const coords = useMemo(() => {
    const seen = new Map<string, number>();
    return new Map(
      items.map((item) => {
        const n = seen.get(item.business.id) ?? 0;
        seen.set(item.business.id, n + 1);
        const angle = n * 2.4;
        const r = n === 0 ? 0 : 0.0009 + n * 0.0002;
        return [item.offer.id, { latitude: item.business.lat + Math.sin(angle) * r, longitude: item.business.lng + Math.cos(angle) * r }];
      }),
    );
  }, [items]);

  const focus = (item: FeedOffer) => {
    const center = coords.get(item.offer.id);
    if (center) mapRef.current?.animateCamera({ center }, { duration: 450 });
  };

  const selectFromMap = (index: number) => {
    setSelectedId(items[index].offer.id);
    listRef.current?.scrollToIndex({ index, animated: true });
    focus(items[index]);
  };

  const showAll = () => {
    mapRef.current?.fitToCoordinates([{ latitude: me.lat, longitude: me.lng }, ...coords.values()], {
      edgePadding: { top: insets.top + 180, bottom: 260, left: 50, right: 50 },
      animated: true,
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={MUNICH}
        mapType="mutedStandard"
        userInterfaceStyle={theme.scheme}
        showsPointsOfInterests={false}
        showsCompass={false}
        pitchEnabled
        mapPadding={{ top: insets.top + 150, bottom: 230, left: 0, right: 0 }}>
        <Circle
          center={{ latitude: me.lat, longitude: me.lng }}
          radius={thresholdKm * 1000}
          strokeColor={theme.scheme === 'dark' ? 'rgba(207,226,196,0.7)' : 'rgba(31,58,43,0.55)'}
          fillColor={theme.scheme === 'dark' ? 'rgba(207,226,196,0.10)' : 'rgba(31,58,43,0.08)'}
          strokeWidth={1.5}
        />
        <Marker coordinate={{ latitude: me.lat, longitude: me.lng }} anchor={{ x: 0.5, y: 0.5 }} zIndex={1}>
          <MePin color={theme.primary} />
        </Marker>
        {items.map((item, index) => {
          const coordinate = coords.get(item.offer.id);
          if (!coordinate) return null;
          const selected = item.offer.id === activeId;
          return (
            <Marker
              key={item.offer.id}
              coordinate={coordinate}
              anchor={{ x: 0.5, y: 1 }}
              zIndex={selected ? 3 : 2}
              onPress={() => selectFromMap(index)}>
              <OfferPin category={item.offer.category} selected={selected} />
            </Marker>
          );
        })}
      </MapView>

      {/* Header: live count and pickup radius */}
      <Animated.View entering={enterUp(0, 380)} style={[styles.header, { top: insets.top + Spacing.sm }]}>
        <BlurView
          intensity={85}
          tint={theme.scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
          style={[styles.headerCard, { borderColor: theme.line }]}>
          <View style={styles.headerRow}>
            <View style={styles.liveRow}>
              <PulseDot color={theme.positive} />
              <Txt variant="headline">{t('map.title')}</Txt>
            </View>
            <Txt variant="caption" color="inkMuted">
              {t('map.count', { count: items.length })}
            </Txt>
          </View>
          <Txt variant="label" color="inkFaint" style={styles.radiusLabel}>
            {t('map.radius')} · {t('map.withinRadius', { count: nearby, km: thresholdKm })}
          </Txt>
          <Segmented
            value={String(thresholdKm)}
            onChange={(v) => setThresholdKm(Number(v))}
            options={RADIUS_OPTIONS.map((km) => ({ value: km, label: `${km} km` }))}
          />
        </BlurView>
      </Animated.View>

      {/* Show-all button */}
      <PressableScale
        onPress={showAll}
        accessibilityLabel={t('map.recenter')}
        style={[styles.fab, Shadow, { backgroundColor: theme.surface, bottom: insets.bottom + 236 + TabBarClearance }]}>
        <Icon sf="scope" md="my_location" size={18} color={theme.ink} />
      </PressableScale>

      {/* Carousel synced with the pins */}
      <View style={[styles.carousel, { bottom: insets.bottom + 62 + TabBarClearance }]}>
        <FlatList
          ref={listRef}
          data={items}
          horizontal
          keyExtractor={(item) => item.offer.id}
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + GAP}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: (width - cardWidth) / 2, gap: GAP }}
          getItemLayout={(_, index) => ({ length: cardWidth + GAP, offset: (cardWidth + GAP) * index, index })}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + GAP));
            const item = items[Math.min(items.length - 1, Math.max(0, index))];
            if (item && item.offer.id !== activeId) {
              setSelectedId(item.offer.id);
              focus(item);
            }
          }}
          renderItem={({ item }) => <MapCard item={item} width={cardWidth} active={item.offer.id === activeId} lang={lang} />}
        />
      </View>
    </View>
  );
}

function MapCard({ item, width, active, lang }: { item: FeedOffer; width: number; active: boolean; lang: 'en' | 'de' }) {
  const theme = useTheme();
  const { t } = useT();
  const router = useRouter();
  const self = item.recommendSelf;

  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/offer/[id]', params: { id: item.offer.id } })}
      style={[
        styles.card,
        Shadow,
        { width, backgroundColor: theme.surface, borderColor: active ? theme.primary : theme.line },
      ]}>
      <CategoryBadge category={item.offer.category} size={52} />
      <View style={styles.cardBody}>
        <Txt variant="headline" numberOfLines={1} style={styles.cardTitle}>
          {item.title}
        </Txt>
        <Txt variant="caption" color="inkMuted" numberOfLines={1}>
          {item.business.name} · {formatDistance(item.distanceKm, lang)}
        </Txt>
        <View style={styles.cardFooter}>
          <Txt variant="headline" style={styles.cardPrice}>
            {formatEUR(item.offer.priceDiscount, lang)}
          </Txt>
          <View style={[styles.cardChip, { backgroundColor: self ? theme.positiveSoft : theme.accentSoft }]}>
            <Icon
              sf={self ? 'bicycle' : 'box.truck.fill'}
              md={self ? 'pedal_bike' : 'local_shipping'}
              size={12}
              color={self ? theme.positive : theme.accent}
            />
            <Txt variant="caption" tint={self ? theme.positive : theme.accent}>
              {self ? `${item.bikeMinutes} min` : formatEUR(item.deliveryPrice, lang)}
            </Txt>
          </View>
          <Txt variant="caption" color="inkFaint">
            −{item.discount}% {t('card.off')}
          </Txt>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { position: 'absolute', left: Spacing.lg, right: Spacing.lg },
  headerCard: { borderRadius: Radius.xl, padding: Spacing.lg, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  radiusLabel: { marginTop: Spacing.md, marginBottom: Spacing.sm },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carousel: { position: 'absolute', left: 0, right: 0 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
  },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 17 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  cardPrice: { fontSize: 17 },
  cardChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
});

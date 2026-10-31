import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { CategoryBadge } from '@/components/category-art';
import { HomePin, VanPin } from '@/components/map-pins';
import type { CategoryId } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { pointAlong, type LatLng } from '@/lib/route';

type Props = {
  route: LatLng[];
  /** 0 = at the seller, 1 = at the buyer. */
  progress: number;
  category: CategoryId;
  bottomInset: number;
  topInset: number;
};

/** Map with the delivery route, the part already driven highlighted, and the van moving along it. */
export function DeliveryMap({ route, progress, category, bottomInset, topInset }: Props) {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  const { point, index } = pointAlong(route, progress);
  const driven = [...route.slice(0, index), point];
  const from = route[0];
  const to = route[route.length - 1];

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      mapType="mutedStandard"
      userInterfaceStyle={theme.scheme}
      showsPointsOfInterests={false}
      showsCompass={false}
      initialRegion={{
        latitude: (from.latitude + to.latitude) / 2,
        longitude: (from.longitude + to.longitude) / 2,
        latitudeDelta: Math.abs(from.latitude - to.latitude) * 2.6 + 0.01,
        longitudeDelta: Math.abs(from.longitude - to.longitude) * 2.6 + 0.01,
      }}
      onMapReady={() =>
        mapRef.current?.fitToCoordinates(route, {
          edgePadding: { top: topInset + 90, bottom: bottomInset + 40, left: 60, right: 60 },
          animated: false,
        })
      }>
      <Polyline coordinates={route} strokeColor={theme.inkFaint} strokeWidth={4} lineDashPattern={[2, 8]} />
      <Polyline coordinates={driven} strokeColor={theme.accent} strokeWidth={5} />
      <Marker coordinate={from} anchor={{ x: 0.5, y: 0.5 }}>
        <CategoryBadge category={category} size={36} />
      </Marker>
      <Marker coordinate={to} anchor={{ x: 0.5, y: 0.5 }}>
        <HomePin background={theme.primary} foreground={theme.onPrimary} />
      </Marker>
      <Marker coordinate={point} anchor={{ x: 0.5, y: 0.5 }} zIndex={5}>
        <VanPin background={theme.accent} foreground="#FFFFFF" />
      </Marker>
    </MapView>
  );
}

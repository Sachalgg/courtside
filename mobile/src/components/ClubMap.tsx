import { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import type { ClubMapProps } from './ClubMap.types';
import { PricePin } from './PricePin';

const BRUSSELS_REGION = { latitude: 50.832, longitude: 4.372, latitudeDelta: 0.19, longitudeDelta: 0.19 };

/** Native map (Apple Maps on iOS, Google Maps on Android). The web build uses ClubMap.web.tsx. */
export default function ClubMap({ items, selectedId, onSelect, userLocation, topInset = 0, bottomInset = 0, style }: ClubMapProps) {
  const ref = useRef<MapView>(null);
  const scheme = useColorScheme();
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Only follow selection changes; the item list is rebuilt every time the clock ticks.
  useEffect(() => {
    const sel = itemsRef.current.find((i) => i.club.id === selectedId);
    if (sel) {
      ref.current?.animateToRegion(
        { latitude: sel.club.lat, longitude: sel.club.lng, latitudeDelta: 0.09, longitudeDelta: 0.09 },
        350,
      );
    }
  }, [selectedId]);

  return (
    <MapView
      ref={ref}
      style={style}
      initialRegion={BRUSSELS_REGION}
      mapPadding={{ top: topInset, left: 0, right: 0, bottom: bottomInset }}
      showsUserLocation={!!userLocation}
      showsPointsOfInterests={false}
      toolbarEnabled={false}
      userInterfaceStyle={scheme === 'dark' ? 'dark' : 'light'}>
      {items.map(({ club, price }) => {
        const selected = club.id === selectedId;
        return (
          <Marker
            // Remount on selection so the snapshot of the custom view refreshes on Android.
            key={`${club.id}-${selected ? 1 : 0}`}
            coordinate={{ latitude: club.lat, longitude: club.lng }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            zIndex={selected ? 10 : 1}
            onPress={() => onSelect(club.id)}
            accessibilityLabel={club.name}>
            <PricePin price={price} selected={selected} />
          </Marker>
        );
      })}
    </MapView>
  );
}

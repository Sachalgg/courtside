import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { CLUBS } from '@/lib/clubs';
import { useTheme } from '@/theme';

import type { ClubMapProps } from './ClubMap.types';
import { PricePin } from './PricePin';

// react-native-maps has no web support. On web we draw a schematic map of the
// Brussels-Capital region instead, so the prototype stays usable in a browser.

const KM_PER_DEG_LAT = 111.32;
const KM_PER_DEG_LNG = 111.32 * Math.cos((50.83 * Math.PI) / 180);

// Fit every club once, so filtering never makes the map jump.
const BOUNDS = {
  minLat: Math.min(...CLUBS.map((c) => c.lat)),
  maxLat: Math.max(...CLUBS.map((c) => c.lat)),
  minLng: Math.min(...CLUBS.map((c) => c.lng)),
  maxLng: Math.max(...CLUBS.map((c) => c.lng)),
};
const CENTER = { lat: (BOUNDS.minLat + BOUNDS.maxLat) / 2, lng: (BOUNDS.minLng + BOUNDS.maxLng) / 2 };
const SPAN = {
  x: (BOUNDS.maxLng - BOUNDS.minLng) * KM_PER_DEG_LNG,
  y: (BOUNDS.maxLat - BOUNDS.minLat) * KM_PER_DEG_LAT,
};
const PAD = { x: 44, top: 40, bottom: 8 };

// Rough outline of the 19 communes, enough to read the shape of the city.
const REGION: [number, number][] = [
  [4.355, 50.914], [4.398, 50.906], [4.43, 50.884], [4.478, 50.866], [4.47, 50.842], [4.482, 50.82],
  [4.447, 50.792], [4.412, 50.776], [4.385, 50.769], [4.345, 50.771], [4.318, 50.786], [4.288, 50.801],
  [4.257, 50.82], [4.244, 50.846], [4.268, 50.871], [4.29, 50.891], [4.322, 50.906],
];
const CANAL: [number, number][] = [[4.292, 50.79], [4.318, 50.82], [4.334, 50.842], [4.352, 50.862], [4.37, 50.89], [4.385, 50.915]];
const FOREST: [number, number][] = [[4.41, 50.79], [4.44, 50.795], [4.47, 50.775], [4.45, 50.745], [4.405, 50.75], [4.395, 50.77]];

export default function ClubMap({ items, selectedId, onSelect, userLocation, topInset = 0, bottomInset = 0, style }: ClubMapProps) {
  const t = useTheme();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  // Fit the clubs into the part of the map that the carousel leaves visible.
  const top = topInset + PAD.top;
  const visibleH = Math.max(120, size.h - bottomInset - top - PAD.bottom);
  const pxPerKm = Math.min((size.w - PAD.x * 2) / SPAN.x, visibleH / SPAN.y);
  const cy = top + visibleH / 2;
  const project = (lng: number, lat: number) => ({
    x: size.w / 2 + (lng - CENTER.lng) * KM_PER_DEG_LNG * pxPerKm,
    y: cy - (lat - CENTER.lat) * KM_PER_DEG_LAT * pxPerKm,
  });
  const path = (pts: [number, number][], close = true) =>
    pts.map(([lng, lat], i) => `${i ? 'L' : 'M'}${project(lng, lat).x.toFixed(1)} ${project(lng, lat).y.toFixed(1)}`).join(' ') +
    (close ? ' Z' : '');

  const sorted = [...items].sort((a, b) => (a.club.id === selectedId ? 1 : b.club.id === selectedId ? -1 : b.club.lat - a.club.lat));

  return (
    <View style={[style, { backgroundColor: t.bg, overflow: 'hidden' }]} onLayout={onLayout}>
      {size.w > 0 && (
        <>
          <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill}>
            <Path d={path(REGION)} fill={t.mapLand} stroke={t.line} strokeWidth={1.5} />
            <Path d={path(FOREST)} fill={t.mapWater} opacity={0.6} />
            <Path d={path(CANAL, false)} stroke={t.mapWater} strokeWidth={5} fill="none" strokeLinecap="round" />
            <Circle cx={project(4.3525, 50.8467).x} cy={project(4.3525, 50.8467).y} r={3} fill={t.ink3} />
            <SvgText x={project(4.405, 50.765).x} y={project(4.405, 50.765).y} fill={t.ink3} fontSize={11} fontWeight="700">
              Forêt de Soignes
            </SvgText>
            {userLocation && (
              <>
                <Circle cx={project(userLocation.lng, userLocation.lat).x} cy={project(userLocation.lng, userLocation.lat).y} r={14} fill={t.red} opacity={0.15} />
                <Circle cx={project(userLocation.lng, userLocation.lat).x} cy={project(userLocation.lng, userLocation.lat).y} r={6} fill={t.red} stroke={t.card} strokeWidth={2} />
              </>
            )}
          </Svg>
          {sorted.map(({ club, price }) => {
            const { x, y } = project(club.lng, club.lat);
            return (
              <View key={club.id} pointerEvents="box-none" style={[styles.pin, { left: x - 40, top: y - 38 }]}>
                <Pressable accessibilityRole="button" accessibilityLabel={club.name} onPress={() => onSelect(club.id)}>
                  <PricePin price={price} selected={club.id === selectedId} />
                </Pressable>
              </View>
            );
          })}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pin: { position: 'absolute', width: 80, height: 38, alignItems: 'center', justifyContent: 'flex-end' },
});

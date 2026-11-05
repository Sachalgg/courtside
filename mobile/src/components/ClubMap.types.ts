import type { StyleProp, ViewStyle } from 'react-native';

import type { Club } from '@/lib/clubs';
import type { LatLng } from '@/lib/geo';

export type MapClub = { club: Club; price: number };

export type ClubMapProps = {
  items: MapClub[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation: LatLng | null;
  /** Height covered by floating UI at the top of the map (search and filters). */
  topInset?: number;
  /** Height covered by UI at the bottom of the map (the card carousel). */
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
};

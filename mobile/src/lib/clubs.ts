// Fictional clubs placed in real Brussels communes. Coordinates are approximate
// commune centres so the map reads correctly; names, prices and courts are invented.

export type SurfaceId = 'clay' | 'hard' | 'grass' | 'indoor';

export type Surface = {
  id: SurfaceId;
  name: string;
  short: string;
  note: string;
};

export const SURFACES: Surface[] = [
  { id: 'clay', name: 'Terre battue', short: 'Terre', note: 'Rebond haut, échanges longs' },
  { id: 'hard', name: 'Dur', short: 'Dur', note: 'Rebond régulier, jeu rapide' },
  { id: 'grass', name: 'Gazon', short: 'Gazon', note: 'Rebond bas, points courts' },
  { id: 'indoor', name: 'Indoor', short: 'Indoor', note: 'Synthétique couvert, aucun vent' },
];

export const surfaceById = (id: SurfaceId): Surface => SURFACES.find((s) => s.id === id)!;

export type CourtGroup = { courts: number; price: number };

export type Club = {
  id: string;
  name: string;
  commune: string;
  address: string;
  lat: number;
  lng: number;
  opens: number; // first bookable hour
  closes: number; // hour at which the last slot must end
  surfaces: Partial<Record<SurfaceId, CourtGroup>>;
  amenities: string[];
  rating: number;
  phone: string;
};

export const CLUBS: Club[] = [
  {
    id: 'etangs', name: 'Club des Étangs', commune: 'Uccle', address: 'Avenue de Fré 112, 1180 Uccle',
    lat: 50.8045, lng: 4.3567, opens: 8, closes: 22,
    surfaces: { clay: { courts: 8, price: 26 }, hard: { courts: 2, price: 22 } },
    amenities: ['Vestiaires', 'Bar', 'Parking', 'Éclairage'], rating: 4.7, phone: '+32 2 374 00 11',
  },
  {
    id: 'parc', name: 'Tennis du Parc', commune: 'Woluwe-Saint-Pierre', address: 'Avenue de Tervueren 290, 1150 Woluwe-Saint-Pierre',
    lat: 50.8337, lng: 4.4325, opens: 7, closes: 23,
    surfaces: { indoor: { courts: 4, price: 28 }, hard: { courts: 3, price: 21 } },
    amenities: ['Vestiaires', 'Location de raquettes', 'Éclairage'], rating: 4.5, phone: '+32 2 771 20 22',
  },
  {
    id: 'hetres', name: 'TC des Hêtres', commune: 'Auderghem', address: 'Chaussée de Wavre 1690, 1160 Auderghem',
    lat: 50.8135, lng: 4.4318, opens: 8, closes: 22,
    surfaces: { clay: { courts: 10, price: 24 }, grass: { courts: 2, price: 34 } },
    amenities: ['Vestiaires', 'Restaurant', 'Parking', 'Club house'], rating: 4.8, phone: '+32 2 660 33 33',
  },
  {
    id: 'vivier', name: 'Tennis du Vivier', commune: 'Uccle', address: 'Rue du Vivier d’Oie 45, 1180 Uccle',
    lat: 50.7945, lng: 4.3812, opens: 8, closes: 22,
    surfaces: { hard: { courts: 5, price: 20 }, clay: { courts: 3, price: 25 } },
    amenities: ['Vestiaires', 'Éclairage'], rating: 4.3, phone: '+32 2 375 44 44',
  },
  {
    id: 'smash', name: 'Smash Indoor Ixelles', commune: 'Ixelles', address: 'Rue de la Croix 18, 1050 Ixelles',
    lat: 50.8275, lng: 4.3723, opens: 7, closes: 23,
    surfaces: { indoor: { courts: 4, price: 29 }, hard: { courts: 2, price: 23 } },
    amenities: ['Vestiaires', 'Bar', 'Location de raquettes', 'Douches'], rating: 4.6, phone: '+32 2 640 55 55',
  },
  {
    id: 'pres', name: 'Tennis des Prés', commune: 'Rhode-Saint-Genèse', address: 'Drève de Lorraine 7, 1640 Rhode-Saint-Genèse',
    lat: 50.7473, lng: 4.3577, opens: 9, closes: 21,
    surfaces: { grass: { courts: 4, price: 38 }, clay: { courts: 6, price: 25 } },
    amenities: ['Vestiaires', 'Restaurant', 'Parking', 'Club house'], rating: 4.9, phone: '+32 2 358 66 66',
  },
  {
    id: 'josaphat', name: 'Josaphat Tennis', commune: 'Schaerbeek', address: 'Avenue des Azalées 3, 1030 Schaerbeek',
    lat: 50.8607, lng: 4.3836, opens: 8, closes: 22,
    surfaces: { clay: { courts: 4, price: 22 }, hard: { courts: 3, price: 19 } },
    amenities: ['Vestiaires', 'Bar', 'Éclairage'], rating: 4.2, phone: '+32 2 241 77 77',
  },
  {
    id: 'canal', name: 'Canal Courts', commune: 'Anderlecht', address: 'Quai de l’Industrie 75, 1080 Molenbeek',
    lat: 50.8423, lng: 4.3297, opens: 7, closes: 23,
    surfaces: { indoor: { courts: 6, price: 24 }, hard: { courts: 2, price: 18 } },
    amenities: ['Vestiaires', 'Bar', 'Location de raquettes'], rating: 4.4, phone: '+32 2 520 88 88',
  },
  {
    id: 'heysel', name: 'Royal Heysel TC', commune: 'Laeken', address: 'Avenue de l’Atomium 40, 1020 Laeken',
    lat: 50.8945, lng: 4.3412, opens: 8, closes: 22,
    surfaces: { clay: { courts: 7, price: 25 }, indoor: { courts: 3, price: 30 } },
    amenities: ['Vestiaires', 'Restaurant', 'Parking', 'Éclairage'], rating: 4.6, phone: '+32 2 478 99 99',
  },
  {
    id: 'cinquantenaire', name: 'Cinquantenaire Tennis', commune: 'Etterbeek', address: 'Avenue de la Chevalerie 9, 1040 Etterbeek',
    lat: 50.8392, lng: 4.3928, opens: 8, closes: 22,
    surfaces: { hard: { courts: 4, price: 21 }, clay: { courts: 2, price: 24 } },
    amenities: ['Vestiaires', 'Éclairage'], rating: 4.1, phone: '+32 2 736 10 10',
  },
  {
    id: 'forest', name: 'Forest Lawn Club', commune: 'Forest', address: 'Avenue du Globe 61, 1190 Forest',
    lat: 50.8108, lng: 4.3243, opens: 9, closes: 21,
    surfaces: { grass: { courts: 3, price: 36 }, clay: { courts: 4, price: 23 } },
    amenities: ['Vestiaires', 'Club house', 'Parking'], rating: 4.5, phone: '+32 2 343 12 12',
  },
  {
    id: 'jette', name: 'TC Jette Laerbeek', commune: 'Jette', address: 'Avenue du Laerbeek 120, 1090 Jette',
    lat: 50.8843, lng: 4.3168, opens: 8, closes: 22,
    surfaces: { clay: { courts: 5, price: 21 }, indoor: { courts: 2, price: 26 } },
    amenities: ['Vestiaires', 'Bar', 'Parking'], rating: 4.3, phone: '+32 2 479 13 13',
  },
];

export const clubById = (id: string): Club | undefined => CLUBS.find((c) => c.id === id);

export const clubSurfaces = (club: Club): SurfaceId[] =>
  SURFACES.map((s) => s.id).filter((id) => club.surfaces[id]);

export const totalCourts = (club: Club): number =>
  Object.values(club.surfaces).reduce((n, g) => n + (g?.courts ?? 0), 0);

export const minPrice = (club: Club, surface?: SurfaceId): number => {
  if (surface) return club.surfaces[surface]?.price ?? Infinity;
  return Math.min(...Object.values(club.surfaces).map((g) => g!.price));
};

// Grand-Place, used when the user has not shared a location.
export const BRUSSELS_CENTER = { lat: 50.8467, lng: 4.3525 };

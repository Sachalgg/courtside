import type { SurfaceId } from './clubs';

export type Level = 'Débutant' | 'Intermédiaire' | 'Confirmé' | 'Compétition';
export const LEVELS: Level[] = ['Débutant', 'Intermédiaire', 'Confirmé', 'Compétition'];

export type PaymentMethod = 'card' | 'club';

export type User = {
  name: string;
  email: string;
  phone: string;
  level: Level;
  favSurface: SurfaceId | null;
  memberSince: string; // date key
};

/** Self-declared levels map to the 1.00 to 7.00 scale used by open matches. */
export const LEVEL_VALUE: Record<Level, number> = { Débutant: 1.75, Intermédiaire: 3, Confirmé: 4.5, Compétition: 6 };

export type BookingStatus = 'confirmed' | 'cancelled';

/** Someone on the court. For your own bookings, `paid` tracks whether they paid you back their share. */
export type Participant = {
  id: string;
  name: string | null; // null while the spot has no name yet
  me?: boolean;
  paid: boolean;
};

export type Booking = {
  id: string;
  clubId: string;
  surface: SurfaceId;
  court: number; // 1-based court number within the surface
  date: string; // YYYY-MM-DD
  start: number; // minutes after midnight
  duration: number; // minutes
  price: number; // total in EUR
  players: 2 | 4;
  payment: PaymentMethod;
  status: BookingStatus;
  createdAt: string; // ISO timestamp
  ref: string; // short code shown at the club desk
  owner: string; // account email
  /** 'own' when you booked the court, 'joined' when you took a spot in someone else's open match. */
  kind?: 'own' | 'joined';
  matchId?: string;
  organizer?: string;
  participants?: Participant[];
};

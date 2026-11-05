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

export type BookingStatus = 'confirmed' | 'cancelled';

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
};

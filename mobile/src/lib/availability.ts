import { Club, SurfaceId } from './clubs';
import { dateKey, minutesOfDay, parseDateKey } from './time';
import type { Booking } from './types';

// There is no real club API, so other players' bookings are simulated with a
// deterministic hash: the same club, court, day and hour always give the same answer,
// which keeps the grid stable between renders and between app launches.

export const DURATIONS = [60, 90, 120] as const;
export type Duration = (typeof DURATIONS)[number];

export const SLOT_STEP = 30;
/** Bookings must start at least this many minutes from now. */
export const LEAD_TIME = 15;
/** Free cancellation until this many hours before the start. */
export const FREE_CANCEL_HOURS = 24;

export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const isWeekend = (key: string): boolean => {
  const day = parseDateKey(key).getDay();
  return day === 0 || day === 6;
};

/** Peak hours: weekday evenings and weekend mornings. */
export function isPeak(key: string, startMin: number): boolean {
  const h = startMin / 60;
  return isWeekend(key) ? h >= 9 && h < 13 : h >= 17 && h < 21;
}

/** Share of courts that other players already hold at a given hour. */
function demand(key: string, hour: number): number {
  const weekend = isWeekend(key);
  if (weekend) return hour >= 9 && hour < 13 ? 0.72 : hour < 18 ? 0.5 : 0.35;
  if (hour >= 18 && hour < 21) return 0.78;
  if (hour >= 12 && hour < 14) return 0.45;
  if (hour < 9) return 0.3;
  return 0.25;
}

/** True when the simulated other players hold this court for this hour. */
export function isHeldByOthers(club: Club, surface: SurfaceId, court: number, key: string, hour: number): boolean {
  const roll = hash(`${club.id}|${surface}|${court}|${key}|${hour}`) / 0xffffffff;
  return roll < demand(key, hour);
}

const overlaps = (aStart: number, aDur: number, bStart: number, bDur: number): boolean =>
  aStart < bStart + bDur && bStart < aStart + aDur;

export function isCourtFree(
  club: Club,
  surface: SurfaceId,
  court: number,
  key: string,
  start: number,
  duration: number,
  myBookings: Booking[],
): boolean {
  for (let h = Math.floor(start / 60); h * 60 < start + duration; h++) {
    if (isHeldByOthers(club, surface, court, key, h)) return false;
  }
  return !myBookings.some(
    (b) =>
      b.status === 'confirmed' &&
      b.clubId === club.id &&
      b.surface === surface &&
      b.court === court &&
      b.date === key &&
      overlaps(b.start, b.duration, start, duration),
  );
}

/** EUR price for one court, rounded to the half euro. Peak start adds 20 percent. */
export function priceFor(club: Club, surface: SurfaceId, key: string, start: number, duration: number): number {
  const hourly = club.surfaces[surface]?.price ?? 0;
  const raw = hourly * (duration / 60) * (isPeak(key, start) ? 1.2 : 1);
  return Math.round(raw * 2) / 2;
}

export type Slot = {
  start: number;
  freeCourts: number[];
  price: number;
  peak: boolean;
  past: boolean;
};

export function slotsFor(
  club: Club,
  surface: SurfaceId,
  key: string,
  duration: number,
  myBookings: Booking[],
  now: Date,
): Slot[] {
  const group = club.surfaces[surface];
  if (!group) return [];
  const isToday = key === dateKey(now);
  const cutoff = isToday ? minutesOfDay(now) + LEAD_TIME : -1;
  const out: Slot[] = [];
  for (let start = club.opens * 60; start + duration <= club.closes * 60; start += SLOT_STEP) {
    const past = start < cutoff;
    const freeCourts: number[] = [];
    if (!past) {
      for (let c = 1; c <= group.courts; c++) {
        if (isCourtFree(club, surface, c, key, start, duration, myBookings)) freeCourts.push(c);
      }
    }
    out.push({ start, freeCourts, price: priceFor(club, surface, key, start, duration), peak: isPeak(key, start), past });
  }
  return out;
}

/** First bookable 1h slot on the given day, across every surface (or the chosen one). */
export function nextFreeSlot(
  club: Club,
  key: string,
  myBookings: Booking[],
  now: Date,
  surface?: SurfaceId,
): { start: number; surface: SurfaceId } | null {
  const surfaces = surface ? [surface] : (Object.keys(club.surfaces) as SurfaceId[]);
  let best: { start: number; surface: SurfaceId } | null = null;
  for (const s of surfaces) {
    if (!club.surfaces[s]) continue;
    const slot = slotsFor(club, s, key, 60, myBookings, now).find((x) => x.freeCourts.length > 0);
    if (slot && (!best || slot.start < best.start)) best = { start: slot.start, surface: s };
  }
  return best;
}

export function hoursUntil(b: Pick<Booking, 'date' | 'start'>, now: Date): number {
  const start = parseDateKey(b.date);
  start.setMinutes(b.start);
  return (start.getTime() - now.getTime()) / 36e5;
}

export function canCancelFree(b: Pick<Booking, 'date' | 'start'>, now: Date): boolean {
  return hoursUntil(b, now) >= FREE_CANCEL_HOURS;
}

export function isUpcoming(b: Pick<Booking, 'date' | 'start' | 'duration'>, now: Date): boolean {
  return hoursUntil({ date: b.date, start: b.start + b.duration }, now) > 0;
}

/** Splits a total into equal shares, to the cent, with the leftover cents on the first shares. */
export function splitEqually(total: number, count: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const rest = cents - base * count;
  return Array.from({ length: count }, (_, i) => (base + (i < rest ? 1 : 0)) / 100);
}

export const eur = (n: number): string => {
  const fixed = (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
  return `${fixed.endsWith(',00') ? fixed.slice(0, -3) : fixed} €`;
};

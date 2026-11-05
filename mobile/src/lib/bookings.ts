import { isUpcoming, splitEqually } from './availability';
import { clubById } from './clubs';
import { addDays, dateKey, parseDateKey } from './time';
import type { Booking } from './types';

/** Why the account cannot play at this time, or null when it is free. */
export function clashReason(
  bookings: Booking[],
  owner: string,
  slot: { date: string; start: number; duration: number },
): string | null {
  const clash = bookings.find(
    (b) =>
      b.owner === owner &&
      b.status === 'confirmed' &&
      b.date === slot.date &&
      b.start < slot.start + slot.duration &&
      slot.start < b.start + b.duration,
  );
  if (!clash) return null;
  return `Vous jouez déjà à cette heure-là (${clubById(clash.clubId)?.name ?? 'un autre club'}).`;
}

/** What this booking costs you: the whole court for your own booking, your share for a joined match. */
export function myCost(b: Booking): number {
  return b.kind === 'joined' ? splitEqually(b.price, b.players)[b.players - 1] : b.price;
}

/** Money your partners still owe you on a booking you paid. */
export function owedToMe(b: Booking): number {
  if (b.kind === 'joined' || b.status !== 'confirmed' || b.payment !== 'card' || !b.participants) return 0;
  const shares = splitEqually(b.price, b.players);
  return b.participants.reduce((sum, p, i) => sum + (p.me || p.paid ? 0 : shares[i] ?? 0), 0);
}

/** Week after the same weekday, used to offer "play again" from history. */
export function sameSlotNextWeek(b: Booking, now: Date): string {
  let d = parseDateKey(b.date);
  while (!isUpcoming({ date: dateKey(d), start: b.start, duration: 0 }, now)) d = addDays(d, 7);
  return dateKey(d);
}

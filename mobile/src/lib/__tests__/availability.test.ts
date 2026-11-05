import { describe, expect, it } from 'vitest';

import {
  canCancelFree,
  eur,
  isCourtFree,
  isPeak,
  isUpcoming,
  nextFreeSlot,
  priceFor,
  slotsFor,
  splitEqually,
} from '../availability';
import { clubById, CLUBS } from '../clubs';
import type { Booking } from '../types';

const club = clubById('etangs')!;
// Thursday 5 November 2026, 10:00 local time.
const now = new Date(2026, 10, 5, 10, 0);
const tomorrow = '2026-11-06';

const booking = (over: Partial<Booking> = {}): Booking => ({
  id: 'b1',
  ref: 'ABCDE',
  owner: 'a@b.be',
  clubId: club.id,
  surface: 'clay',
  court: 1,
  date: tomorrow,
  start: 8 * 60,
  duration: 60,
  price: 26,
  players: 2,
  payment: 'card',
  status: 'confirmed',
  createdAt: now.toISOString(),
  ...over,
});

describe('slotsFor', () => {
  it('covers opening hours in 30 minute steps and never runs past closing', () => {
    const slots = slotsFor(club, 'clay', tomorrow, 90, [], now);
    expect(slots[0].start).toBe(club.opens * 60);
    const last = slots[slots.length - 1];
    expect(last.start + 90).toBeLessThanOrEqual(club.closes * 60);
    expect(slots.every((s, i) => i === 0 || s.start - slots[i - 1].start === 30)).toBe(true);
  });

  it('is deterministic', () => {
    expect(slotsFor(club, 'clay', tomorrow, 60, [], now)).toEqual(slotsFor(club, 'clay', tomorrow, 60, [], now));
  });

  it('marks slots before now plus the lead time as past today', () => {
    const slots = slotsFor(club, 'clay', '2026-11-05', 60, [], now);
    expect(slots.filter((s) => s.past).map((s) => s.start)).toEqual([480, 510, 540, 570, 600]);
    expect(slots.filter((s) => s.past).every((s) => s.freeCourts.length === 0)).toBe(true);
  });

  it('returns nothing for a surface the club does not have', () => {
    expect(slotsFor(club, 'grass', tomorrow, 60, [], now)).toEqual([]);
  });

  it('takes the court out once it is booked on the device', () => {
    const before = slotsFor(club, 'clay', tomorrow, 60, [], now).find((s) => s.freeCourts.length > 0)!;
    const court = before.freeCourts[0];
    const after = slotsFor(club, 'clay', tomorrow, 60, [booking({ start: before.start, court })], now).find(
      (s) => s.start === before.start,
    )!;
    expect(after.freeCourts).not.toContain(court);
    expect(after.freeCourts.length).toBe(before.freeCourts.length - 1);
  });

  it('ignores cancelled bookings', () => {
    const before = slotsFor(club, 'clay', tomorrow, 60, [], now).find((s) => s.freeCourts.length > 0)!;
    const b = booking({ start: before.start, court: before.freeCourts[0], status: 'cancelled' });
    expect(isCourtFree(club, 'clay', b.court, tomorrow, before.start, 60, [b])).toBe(true);
  });

  it('blocks a longer slot that overlaps a booking half way', () => {
    const free = slotsFor(club, 'clay', tomorrow, 120, [], now).find((s) => s.freeCourts.length > 0)!;
    const court = free.freeCourts[0];
    const b = booking({ start: free.start + 60, duration: 60, court });
    expect(isCourtFree(club, 'clay', court, tomorrow, free.start, 120, [b])).toBe(false);
  });

  it('leaves some courts free and some taken across the city on a normal day', () => {
    const all = CLUBS.flatMap((c) =>
      (Object.keys(c.surfaces) as (keyof typeof c.surfaces)[]).flatMap((s) => slotsFor(c, s, tomorrow, 60, [], now)),
    );
    const free = all.filter((s) => s.freeCourts.length > 0).length;
    expect(free).toBeGreaterThan(all.length * 0.5);
    expect(free).toBeLessThan(all.length);
  });
});

describe('pricing', () => {
  it('knows peak hours on weekdays and weekends', () => {
    expect(isPeak(tomorrow, 18 * 60)).toBe(true); // Friday evening
    expect(isPeak(tomorrow, 10 * 60)).toBe(false);
    expect(isPeak('2026-11-07', 10 * 60)).toBe(true); // Saturday morning
    expect(isPeak('2026-11-07', 18 * 60)).toBe(false);
  });

  it('scales with duration and adds 20 percent at peak, rounded to the half euro', () => {
    expect(priceFor(club, 'clay', tomorrow, 10 * 60, 60)).toBe(26);
    expect(priceFor(club, 'clay', tomorrow, 10 * 60, 90)).toBe(39);
    expect(priceFor(club, 'clay', tomorrow, 18 * 60, 60)).toBe(31);
    expect(priceFor(club, 'hard', tomorrow, 18 * 60, 90)).toBe(39.5);
  });

  it('splits to the cent with no money lost', () => {
    expect(splitEqually(31, 4)).toEqual([7.75, 7.75, 7.75, 7.75]);
    const parts = splitEqually(39.5, 3);
    expect(parts).toEqual([13.17, 13.17, 13.16]);
    expect(parts.reduce((a, b) => a + b, 0)).toBeCloseTo(39.5, 5);
  });

  it('formats euros the Belgian way', () => {
    expect(eur(26)).toBe('26 €');
    expect(eur(39.5)).toBe('39,50 €');
  });
});

describe('next free slot', () => {
  it('returns the earliest free hour across surfaces', () => {
    const next = nextFreeSlot(club, tomorrow, [], now);
    expect(next).not.toBeNull();
    const clay = slotsFor(club, 'clay', tomorrow, 60, [], now).find((s) => s.freeCourts.length)!;
    const hard = slotsFor(club, 'hard', tomorrow, 60, [], now).find((s) => s.freeCourts.length)!;
    expect(next!.start).toBe(Math.min(clay.start, hard.start));
  });

  it('returns null after closing time', () => {
    const late = new Date(2026, 10, 5, 22, 30);
    expect(nextFreeSlot(club, '2026-11-05', [], late)).toBeNull();
  });
});

describe('cancellation', () => {
  it('is free until 24 hours before', () => {
    expect(canCancelFree({ date: tomorrow, start: 11 * 60 }, now)).toBe(true);
    expect(canCancelFree({ date: tomorrow, start: 9 * 60 }, now)).toBe(false);
  });

  it('counts a match as upcoming until it ends', () => {
    expect(isUpcoming({ date: '2026-11-05', start: 9 * 60 + 30, duration: 60 }, now)).toBe(true);
    expect(isUpcoming({ date: '2026-11-05', start: 8 * 60, duration: 60 }, now)).toBe(false);
  });
});

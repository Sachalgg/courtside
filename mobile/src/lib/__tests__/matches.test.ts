import { describe, expect, it } from 'vitest';

import { myCost, owedToMe, sameSlotNextWeek } from '../bookings';
import { atMyLevel, MATCH_DAYS, matchById, openMatches, spotsLeft } from '../matches';
import { dateKey, addDays } from '../time';
import type { Booking } from '../types';

const now = new Date(2026, 10, 5, 10, 0);

const base: Booking = {
  id: 'b', ref: 'R', owner: 'me@x.be', clubId: 'etangs', surface: 'clay', court: 1, date: '2026-11-06',
  start: 600, duration: 60, price: 26, players: 4, payment: 'card', status: 'confirmed', createdAt: '', kind: 'own',
  participants: [
    { id: '1', name: 'Moi', me: true, paid: true },
    { id: '2', name: 'Camille', paid: true },
    { id: '3', name: 'Yanis', paid: false },
    { id: '4', name: null, paid: false },
  ],
};

describe('open matches', () => {
  const all = openMatches(now, []);

  it('lists several matches a day over the coming week, all in the future', () => {
    expect(all.length).toBeGreaterThanOrEqual(MATCH_DAYS * 3);
    const last = dateKey(addDays(now, MATCH_DAYS - 1));
    for (const m of all) {
      expect(m.date >= dateKey(now) && m.date <= last).toBe(true);
      if (m.date === dateKey(now)) expect(m.start).toBeGreaterThan(600);
    }
  });

  it('is stable and has room left', () => {
    expect(openMatches(now, []).map((m) => m.id)).toEqual(all.map((m) => m.id));
    expect(all.every((m) => spotsLeft(m) >= 1 && m.players.length >= 1)).toBe(true);
    expect(new Set(all.map((m) => m.id)).size).toBe(all.length);
  });

  it('fits inside club opening hours and splits the court price', () => {
    for (const m of all) {
      expect(m.start).toBeGreaterThanOrEqual(m.club.opens * 60);
      expect(m.start + m.duration).toBeLessThanOrEqual(m.club.closes * 60);
      expect(m.share * m.format).toBeCloseTo(m.price, 1);
    }
  });

  it('adds you to a match you joined', () => {
    const m = all[0];
    const joined: Booking = { ...base, kind: 'joined', matchId: m.id };
    expect(matchById(m.id, now, [joined], 'Sacha')!.players.at(-1)).toBe('Sacha');
    expect(matchById(m.id, now, [{ ...joined, status: 'cancelled' }], 'Sacha')!.players).not.toContain('Sacha');
  });

  it('matches levels within three quarters of a point', () => {
    const m = { ...all[0], level: 3 };
    expect(atMyLevel(m, 3.75)).toBe(true);
    expect(atMyLevel(m, 3.8)).toBe(false);
  });
});

describe('money between partners', () => {
  it('counts what partners still owe on a card booking', () => {
    expect(owedToMe(base)).toBe(13); // Yanis and the unnamed spot, 6.50 each
    expect(owedToMe({ ...base, payment: 'club' })).toBe(0);
    expect(owedToMe({ ...base, status: 'cancelled' })).toBe(0);
  });

  it('costs you the whole court or only your share', () => {
    expect(myCost(base)).toBe(26);
    expect(myCost({ ...base, kind: 'joined' })).toBe(6.5);
  });

  it('offers the same slot the next week that is still ahead', () => {
    expect(sameSlotNextWeek({ ...base, date: '2026-10-29' }, now)).toBe('2026-11-12');
    expect(sameSlotNextWeek({ ...base, date: '2026-10-29', start: 11 * 60 }, now)).toBe('2026-11-05');
  });
});

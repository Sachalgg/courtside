import { describe, expect, it } from 'vitest';

import { validateAuth } from '../auth';
import { BRUSSELS_CENTER, clubById, CLUBS, minPrice } from '../clubs';
import { distanceKm, fmtKm } from '../geo';
import { fmtDateLong, fmtDateShort, fmtDuration, fmtTime, nextDays, relativeDay } from '../time';

describe('clubs', () => {
  it('have unique ids, sit around Brussels and offer at least one surface', () => {
    expect(new Set(CLUBS.map((c) => c.id)).size).toBe(CLUBS.length);
    for (const c of CLUBS) {
      expect(distanceKm(BRUSSELS_CENTER, c)).toBeLessThan(15);
      expect(Object.keys(c.surfaces).length).toBeGreaterThan(0);
      expect(c.closes).toBeGreaterThan(c.opens + 2);
    }
  });

  it('gives the cheapest price, or the price of the chosen surface', () => {
    const c = clubById('pres')!;
    expect(minPrice(c)).toBe(25);
    expect(minPrice(c, 'grass')).toBe(38);
    expect(minPrice(c, 'hard')).toBe(Infinity);
  });
});

describe('geo', () => {
  it('measures distances in kilometres', () => {
    // Grand-Place to the Atomium is about 5.5 km.
    expect(distanceKm(BRUSSELS_CENTER, { lat: 50.8949, lng: 4.3415 })).toBeCloseTo(5.45, 1);
    expect(fmtKm(0.42)).toBe('420 m');
    expect(fmtKm(3.456)).toBe('3,5 km');
  });
});

describe('time', () => {
  const now = new Date(2026, 10, 5, 10, 0);
  it('formats times, durations and dates in French', () => {
    expect(fmtTime(18 * 60 + 30)).toBe('18:30');
    expect(fmtDuration(90)).toBe('1h30');
    expect(fmtDuration(120)).toBe('2h');
    expect(fmtDateLong(now)).toBe('jeudi 5 novembre');
    expect(fmtDateShort(now)).toBe('jeu 5 nov.');
  });

  it('names today and tomorrow', () => {
    expect(relativeDay('2026-11-05', now)).toBe("Aujourd'hui");
    expect(relativeDay('2026-11-06', now)).toBe('Demain');
    expect(relativeDay('2026-11-08', now)).toBe('dimanche 8 novembre');
  });

  it('crosses month ends', () => {
    const days = nextDays(new Date(2026, 10, 29), 3).map((d) => d.getDate());
    expect(days).toEqual([29, 30, 1]);
  });
});

describe('auth form', () => {
  const ok = { name: 'Camille Dubois', email: 'camille@exemple.be', password: 'secret1' };
  it('accepts a valid sign up', () => {
    expect(validateAuth('signup', ok, false)).toEqual({});
  });
  it('flags each bad field', () => {
    const e = validateAuth('signup', { name: 'C', email: 'nope', password: '123' }, false);
    expect(Object.keys(e).sort()).toEqual(['email', 'name', 'password']);
  });
  it('refuses to sign in to an unknown account and to sign up twice', () => {
    expect(validateAuth('signin', ok, false).form).toMatch(/Aucun compte/);
    expect(validateAuth('signup', ok, true).form).toMatch(/existe déjà/);
    expect(validateAuth('signin', ok, true)).toEqual({});
  });
});

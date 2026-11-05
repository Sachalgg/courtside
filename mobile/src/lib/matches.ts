import { hash, isUpcoming, priceFor, splitEqually } from './availability';
import { CLUBS, Club, SurfaceId } from './clubs';
import { addDays, dateKey } from './time';
import type { Booking } from './types';

// Open matches published by other players. There is no server, so they are generated
// from a hash of the day: the same day always lists the same matches.

export const PLAYERS: { name: string; level: number }[] = [
  { name: 'Camille Dubois', level: 3.1 }, { name: 'Yanis Berger', level: 4.6 },
  { name: 'Léa Moreau', level: 1.8 }, { name: 'Tom Vandeput', level: 6.1 },
  { name: 'Sofia Renard', level: 3.4 }, { name: 'Noah Lambert', level: 4.9 },
  { name: 'Inès Delvaux', level: 2.6 }, { name: 'Hugo Peeters', level: 3.75 },
  { name: 'Manon Claes', level: 2.2 }, { name: 'Arthur Wauters', level: 5.3 },
  { name: 'Nina Jacobs', level: 3.05 }, { name: 'Ilias Benali', level: 4.2 },
  { name: 'Clara Verlinden', level: 2.95 }, { name: 'Matteo Rossi', level: 5.8 },
  { name: 'Julie Haesaert', level: 3.55 }, { name: 'Simon Dewit', level: 4.05 },
  { name: 'Amina Cherif', level: 2.4 }, { name: 'Louis Maes', level: 3.9 },
  { name: 'Elena Petit', level: 4.45 }, { name: 'Rafael Costa', level: 6.5 },
];

export type OpenMatch = {
  id: string;
  club: Club;
  surface: SurfaceId;
  court: number;
  date: string;
  start: number;
  duration: number;
  format: 2 | 4;
  level: number; // target level, 1.00 to 7.00
  players: string[]; // names already in, organiser first
  price: number; // whole court
  share: number; // per player
};

export const MATCH_DAYS = 7;
/** How far from the target level still counts as "your level". */
export const LEVEL_TOLERANCE = 0.75;

export const fmtLevel = (n: number): string => n.toFixed(2).replace('.', ',');

function matchesForDay(key: string): OpenMatch[] {
  const out: OpenMatch[] = [];
  const count = 4 + (hash(`n|${key}`) % 4);
  const seen = new Set<string>();
  for (let i = 0; out.length < count && i < count * 4; i++) {
    const seed = `${key}|${i}`;
    const club = CLUBS[hash(`c|${seed}`) % CLUBS.length];
    const surfaces = Object.keys(club.surfaces) as SurfaceId[];
    const surface = surfaces[hash(`s|${seed}`) % surfaces.length];
    const duration = hash(`d|${seed}`) % 3 === 0 ? 120 : 90;
    const lastStart = club.closes * 60 - duration;
    const hours = Math.max(1, (lastStart - club.opens * 60) / 30 + 1);
    const start = club.opens * 60 + (hash(`h|${seed}`) % hours) * 30;
    const id = `${club.id}|${surface}|${key}|${start}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const format: 2 | 4 = hash(`f|${seed}`) % 3 === 0 ? 2 : 4;
    const organizer = PLAYERS[hash(`o|${seed}`) % PLAYERS.length];
    const taken = format === 2 ? 1 : 1 + (hash(`t|${seed}`) % 3);
    const players = [organizer.name];
    for (let j = 1; players.length < taken && j < 40; j++) {
      const p = PLAYERS[hash(`p|${seed}|${j}`) % PLAYERS.length];
      if (!players.includes(p.name) && Math.abs(p.level - organizer.level) < 1.2) players.push(p.name);
    }
    const price = priceFor(club, surface, key, start, duration);
    out.push({
      id,
      club,
      surface,
      court: 1 + (hash(`k|${seed}`) % club.surfaces[surface]!.courts),
      date: key,
      start,
      duration,
      format,
      level: Math.round(organizer.level * 4) / 4,
      players,
      price,
      share: splitEqually(price, format)[format - 1],
    });
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Matches still open in the coming days, with the spots you already took marked as taken. */
export function openMatches(now: Date, myBookings: Booking[], me?: string): OpenMatch[] {
  const joined = new Map(
    myBookings.filter((b) => b.kind === 'joined' && b.status === 'confirmed' && b.matchId).map((b) => [b.matchId!, b]),
  );
  return Array.from({ length: MATCH_DAYS }, (_, i) => dateKey(addDays(now, i)))
    .flatMap(matchesForDay)
    .filter((m) => isUpcoming({ date: m.date, start: m.start, duration: 0 }, now))
    .map((m) => (joined.has(m.id) && me ? { ...m, players: [...m.players, me] } : m));
}

export function matchById(id: string, now: Date, myBookings: Booking[], me?: string): OpenMatch | undefined {
  return openMatches(now, myBookings, me).find((m) => m.id === id);
}

export const spotsLeft = (m: OpenMatch): number => m.format - m.players.length;

export const atMyLevel = (m: OpenMatch, mine: number): boolean => Math.abs(m.level - mine) <= LEVEL_TOLERANCE;

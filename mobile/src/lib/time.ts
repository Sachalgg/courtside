// Dates are stored as local "YYYY-MM-DD" keys and times as minutes after midnight.
// That keeps bookings stable across time zones and easy to compare.

export const pad = (n: number): string => String(n).padStart(2, '0');

export const dateKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseDateKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number): Date => {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() + n);
  return out;
};

export const nextDays = (from: Date, count: number): Date[] =>
  Array.from({ length: count }, (_, i) => addDays(from, i));

export const minutesOfDay = (d: Date): number => d.getHours() * 60 + d.getMinutes();

export const fmtTime = (min: number): string => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

export const fmtDuration = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${pad(m)}` : `${h}h`;
};

const WEEKDAYS = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const WEEKDAYS_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// Formatted by hand: Hermes on Android ships limited Intl data, so toLocaleDateString
// would not give the same French output everywhere.
export const fmtWeekdayShort = (d: Date): string => WEEKDAYS[d.getDay()];

export const fmtDateLong = (d: Date): string => `${WEEKDAYS_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export const fmtDateShort = (d: Date): string => `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;

export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export const fmtMonthYear = (d: Date): string => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

export const relativeDay = (key: string, now: Date): string => {
  const today = dateKey(now);
  if (key === today) return "Aujourd'hui";
  if (key === dateKey(addDays(now, 1))) return 'Demain';
  return fmtDateLong(parseDateKey(key));
};

/** Absolute start of a booking, as a Date in local time. */
export const startDate = (key: string, startMin: number): Date => {
  const d = parseDateKey(key);
  d.setMinutes(startMin);
  return d;
};

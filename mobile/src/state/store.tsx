import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';

import { isCourtFree, priceFor } from '@/lib/availability';
import { clashReason } from '@/lib/bookings';
import { clubById, SurfaceId } from '@/lib/clubs';
import { dateKey, startDate } from '@/lib/time';
import type { OpenMatch } from '@/lib/matches';
import type { Booking, Participant, PaymentMethod, User } from '@/lib/types';

const STORAGE_KEY = 'courtside.mobile.v1';

type State = {
  /** Email of the signed-in account, or null. */
  session: string | null;
  /** Every account created on this device, by email. */
  accounts: Record<string, User>;
  /** Every booking made on this device. They all hold courts, whoever made them. */
  allBookings: Booking[];
  /** Favourite clubs, by account email. */
  favoritesBy: Record<string, string[]>;
};

const initialState: State = { session: null, accounts: {}, allBookings: [], favoritesBy: {} };

type Action =
  | { type: 'hydrate'; state: State }
  | { type: 'signIn'; user: User }
  | { type: 'signOut' }
  | { type: 'updateUser'; patch: Partial<User> }
  | { type: 'addBooking'; booking: Booking }
  | { type: 'cancelBooking'; id: string }
  | { type: 'updateParticipant'; bookingId: string; participantId: string; patch: Partial<Participant> }
  | { type: 'toggleFavorite'; clubId: string }
  | { type: 'reset' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'signIn':
      return {
        ...state,
        session: action.user.email,
        accounts: { ...state.accounts, [action.user.email]: state.accounts[action.user.email] ?? action.user },
      };
    case 'signOut':
      return { ...state, session: null };
    case 'updateUser': {
      const me = state.session ? state.accounts[state.session] : null;
      return me ? { ...state, accounts: { ...state.accounts, [me.email]: { ...me, ...action.patch } } } : state;
    }
    case 'addBooking':
      return { ...state, allBookings: [...state.allBookings, action.booking] };
    case 'cancelBooking':
      return {
        ...state,
        allBookings: state.allBookings.map((b) => (b.id === action.id ? { ...b, status: 'cancelled' } : b)),
      };
    case 'updateParticipant':
      return {
        ...state,
        allBookings: state.allBookings.map((b) =>
          b.id === action.bookingId && b.participants
            ? { ...b, participants: b.participants.map((p) => (p.id === action.participantId ? { ...p, ...action.patch } : p)) }
            : b,
        ),
      };
    case 'toggleFavorite': {
      if (!state.session) return state;
      const mine = state.favoritesBy[state.session] ?? [];
      const next = mine.includes(action.clubId) ? mine.filter((id) => id !== action.clubId) : [...mine, action.clubId];
      return { ...state, favoritesBy: { ...state.favoritesBy, [state.session]: next } };
    }
    case 'reset':
      return initialState;
  }
}

export type BookingRequest = {
  clubId: string;
  surface: SurfaceId;
  date: string;
  start: number;
  duration: number;
  players: 2 | 4;
  payment: PaymentMethod;
};

export type BookResult = { ok: true; booking: Booking } | { ok: false; reason: string };

type Store = {
  ready: boolean;
  user: User | null;
  /** The signed-in user's bookings, all statuses. */
  bookings: Booking[];
  /** Every booking on the device, used to work out which courts are taken. */
  allBookings: Booking[];
  favorites: string[];
  signIn: (input: { name: string; email: string; phone?: string }) => void;
  accountExists: (email: string) => boolean;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
  book: (req: BookingRequest, now?: Date) => BookResult;
  joinMatch: (match: OpenMatch, now?: Date) => BookResult;
  updateParticipant: (bookingId: string, participantId: string, patch: Partial<Participant>) => void;
  cancel: (id: string) => void;
  toggleFavorite: (clubId: string) => void;
  reset: () => void;
};

const StoreContext = createContext<Store | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);
const refCode = () => Math.random().toString(36).slice(2, 7).toUpperCase();

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) dispatch({ type: 'hydrate', state: { ...initialState, ...JSON.parse(raw) } });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const book = useCallback(
    (req: BookingRequest, now = new Date()): BookResult => {
      const club = clubById(req.clubId);
      const group = club?.surfaces[req.surface];
      if (!club || !group) return { ok: false, reason: 'Ce terrain n’existe plus.' };
      if (!state.session) return { ok: false, reason: 'Connectez-vous pour réserver.' };
      if (startDate(req.date, req.start).getTime() < now.getTime()) return { ok: false, reason: 'Ce créneau est déjà passé.' };
      const clash = clashReason(state.allBookings, state.session, req);
      if (clash) return { ok: false, reason: clash };
      let court = 0;
      for (let c = 1; c <= group.courts; c++) {
        if (isCourtFree(club, req.surface, c, req.date, req.start, req.duration, state.allBookings)) {
          court = c;
          break;
        }
      }
      if (!court) return { ok: false, reason: 'Quelqu’un vient de prendre le dernier terrain. Choisissez un autre créneau.' };
      const booking: Booking = {
        id: uid(),
        ref: refCode(),
        owner: state.session,
        clubId: club.id,
        surface: req.surface,
        court,
        date: req.date,
        start: req.start,
        duration: req.duration,
        price: priceFor(club, req.surface, req.date, req.start, req.duration),
        players: req.players,
        payment: req.payment,
        status: 'confirmed',
        createdAt: now.toISOString(),
        kind: 'own',
        participants: [
          { id: uid(), name: state.accounts[state.session]?.name ?? 'Moi', me: true, paid: true },
          ...Array.from({ length: req.players - 1 }, () => ({ id: uid(), name: null, paid: false })),
        ],
      };
      dispatch({ type: 'addBooking', booking });
      return { ok: true, booking };
    },
    [state.allBookings, state.session, state.accounts],
  );

  const joinMatch = useCallback(
    (m: OpenMatch, now = new Date()): BookResult => {
      if (!state.session) return { ok: false, reason: 'Connectez-vous pour rejoindre un match.' };
      if (startDate(m.date, m.start).getTime() < now.getTime()) return { ok: false, reason: 'Ce match a déjà commencé.' };
      const mine = state.allBookings.filter((b) => b.owner === state.session);
      if (mine.some((b) => b.matchId === m.id && b.status === 'confirmed')) return { ok: false, reason: 'Vous êtes déjà inscrit.' };
      if (m.players.length >= m.format) return { ok: false, reason: 'Ce match est complet.' };
      const clash = clashReason(state.allBookings, state.session, m);
      if (clash) return { ok: false, reason: clash };
      const me = state.accounts[state.session]?.name ?? 'Moi';
      const booking: Booking = {
        id: uid(),
        ref: refCode(),
        owner: state.session,
        clubId: m.club.id,
        surface: m.surface,
        court: m.court,
        date: m.date,
        start: m.start,
        duration: m.duration,
        price: m.price,
        players: m.format,
        payment: 'club',
        status: 'confirmed',
        createdAt: now.toISOString(),
        kind: 'joined',
        matchId: m.id,
        organizer: m.players[0],
        participants: [
          ...m.players.map((name) => ({ id: uid(), name, paid: false })),
          { id: uid(), name: me, me: true, paid: false },
        ],
      };
      dispatch({ type: 'addBooking', booking });
      return { ok: true, booking };
    },
    [state.allBookings, state.session, state.accounts],
  );

  const value = useMemo<Store>(
    () => ({
      ready,
      user: state.session ? state.accounts[state.session] ?? null : null,
      bookings: state.allBookings.filter((b) => b.owner === state.session),
      allBookings: state.allBookings,
      favorites: state.session ? state.favoritesBy[state.session] ?? [] : [],
      signIn: ({ name, email, phone }) =>
        dispatch({
          type: 'signIn',
          user: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() ?? '',
            level: 'Intermédiaire',
            favSurface: null,
            memberSince: dateKey(new Date()),
          },
        }),
      accountExists: (email) => !!state.accounts[email.trim().toLowerCase()],
      signOut: () => dispatch({ type: 'signOut' }),
      updateUser: (patch) => dispatch({ type: 'updateUser', patch }),
      book,
      joinMatch,
      updateParticipant: (bookingId, participantId, patch) =>
        dispatch({ type: 'updateParticipant', bookingId, participantId, patch }),
      cancel: (id) => dispatch({ type: 'cancelBooking', id }),
      toggleFavorite: (clubId) => dispatch({ type: 'toggleFavorite', clubId }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [state, ready, book, joinMatch],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

/** Current time, refreshed every 30 seconds so past slots grey out on their own. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

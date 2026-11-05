import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Button, EmptyState, Row, Segmented, Txt } from '@/components/ui';
import { eur, isUpcoming } from '@/lib/availability';
import { clubById, surfaceById } from '@/lib/clubs';
import { fmtTime, parseDateKey, relativeDay } from '@/lib/time';
import type { Booking } from '@/lib/types';
import { useNow, useStore } from '@/state/store';
import { radius, useTheme } from '@/theme';

const chrono = (a: Booking, b: Booking) => a.date.localeCompare(b.date) || a.start - b.start;

export default function Bookings() {
  const t = useTheme();
  const now = useNow();
  const { user, bookings } = useStore();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const { upcoming, past } = useMemo(() => {
    const up = bookings.filter((b) => b.status === 'confirmed' && isUpcoming(b, now)).sort(chrono);
    const rest = bookings.filter((b) => !up.includes(b)).sort((a, b) => chrono(b, a));
    return { upcoming: up, past: rest };
  }, [bookings, now]);

  const data = tab === 'upcoming' ? upcoming : past;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 14, paddingBottom: 12 }}>
        <Txt variant="title">Réservations</Txt>
        {user && (
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'upcoming', label: `À venir · ${upcoming.length}` },
              { value: 'past', label: 'Historique' },
            ]}
          />
        )}
      </View>
      {!user ? (
        <EmptyState
          icon="user"
          title="Connectez-vous"
          body="Vos réservations apparaissent ici, avec leur référence pour l'accueil du club."
          action={<Button title="Se connecter" onPress={() => router.push('/sign-in')} style={{ marginTop: 8 }} />}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12 }}
          ListEmptyComponent={
            tab === 'upcoming' ? (
              <EmptyState
                icon="ball"
                title="Aucun match prévu"
                body="Trouvez un terrain libre près de chez vous et réservez en trois gestes."
                action={<Button title="Trouver un terrain" onPress={() => router.navigate('/')} style={{ marginTop: 8 }} />}
              />
            ) : (
              <EmptyState icon="clock" title="Pas encore d'historique" body="Vos matchs joués et annulés s'afficheront ici." />
            )
          }
          renderItem={({ item }) => <BookingRow booking={item} now={now} />}
        />
      )}
    </SafeAreaView>
  );
}

function BookingRow({ booking: b, now }: { booking: Booking; now: Date }) {
  const t = useTheme();
  const club = clubById(b.clubId);
  const cancelled = b.status === 'cancelled';
  const d = parseDateKey(b.date);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/booking/[id]', params: { id: b.id } })}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: t.card, borderColor: t.line, opacity: cancelled ? 0.6 : 1 },
        pressed && { transform: [{ scale: 0.985 }] },
      ]}>
      <View style={[styles.date, { backgroundColor: cancelled ? t.line2 : isUpcoming(b, now) ? t.red : t.hero }]}>
        <Txt variant="heading" color={cancelled ? t.ink2 : isUpcoming(b, now) ? t.onRed : t.onHero}>
          {d.getDate()}
        </Txt>
        <Txt variant="caption" color={cancelled ? t.ink2 : isUpcoming(b, now) ? t.onRed : t.onHero}>
          {fmtTime(b.start)}
        </Txt>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Txt variant="label" numberOfLines={1}>
          {club?.name ?? 'Club'}
        </Txt>
        <Row gap={6}>
          <Icon name={b.surface} size={14} color={t.ink2} />
          <Txt variant="caption" muted numberOfLines={1}>
            {relativeDay(b.date, now)} · Terrain {b.court} · {surfaceById(b.surface).short}
          </Txt>
        </Row>
        <Txt variant="caption" color={cancelled ? t.ink2 : t.ink}>
          {cancelled ? 'Annulée' : `${eur(b.price)} · réf. ${b.ref}`}
        </Txt>
      </View>
      <Icon name="chevronRight" size={18} color={t.ink3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: radius.card, borderWidth: 1 },
  date: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

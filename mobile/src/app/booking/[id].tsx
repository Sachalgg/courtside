import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/Icon';
import { PlayersCard } from '@/components/PlayersCard';
import { Button, Card, Divider, EmptyState, Row, Txt } from '@/components/ui';
import { canCancelFree, eur, FREE_CANCEL_HOURS, isUpcoming, splitEqually } from '@/lib/availability';
import { sameSlotNextWeek } from '@/lib/bookings';
import { clubById, surfaceById } from '@/lib/clubs';
import { capitalize, fmtDateLong, fmtDuration, fmtTime, parseDateKey } from '@/lib/time';
import { useNow, useStore } from '@/state/store';
import { radius, useTheme } from '@/theme';

export default function BookingScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const { bookings, cancel } = useStore();
  const now = useNow();
  const [confirming, setConfirming] = useState(false);

  const b = bookings.find((x) => x.id === id);
  const club = b && clubById(b.clubId);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/bookings'));

  if (!b || !club) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <EmptyState
          icon="calendar"
          title="Réservation introuvable"
          body="Elle a peut-être été faite avec un autre compte."
          action={<Button title="Mes réservations" onPress={() => router.replace('/bookings')} />}
        />
      </SafeAreaView>
    );
  }

  const upcoming = isUpcoming(b, now);
  const cancelled = b.status === 'cancelled';
  const freeCancel = canCancelFree(b, now);
  const share = splitEqually(b.price, b.players)[b.players - 1];
  const joined = b.kind === 'joined';
  const when = `${fmtDateLong(parseDateKey(b.date))}, ${fmtTime(b.start)} à ${fmtTime(b.start + b.duration)}`;

  const onShare = () =>
    Share.share({
      message:
        `Tennis ${when} au ${club.name} (${club.address}). ` +
        `Terrain ${b.court}, ${surfaceById(b.surface).name.toLowerCase()}. ` +
        `${eur(share)} par joueur. Réf. ${b.ref}`,
    }).catch(() => {});

  const heroTitle = cancelled
    ? joined
      ? 'Désisté'
      : 'Annulée'
    : fresh && upcoming
      ? joined
        ? 'Vous y êtes'
        : "C'est réservé"
      : upcoming
        ? 'À venir'
        : 'Joué';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, gap: 16 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={close}
          style={[styles.round, { backgroundColor: t.card, borderColor: t.line }]}>
          <Icon name={fresh ? 'close' : 'chevronLeft'} color={t.ink} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Partager"
          onPress={onShare}
          style={[styles.round, { backgroundColor: t.card, borderColor: t.line }]}>
          <Icon name="share" size={20} color={t.ink} />
        </Pressable>
      </Row>

      <View style={[styles.hero, { backgroundColor: cancelled ? t.line2 : fresh ? t.red : t.hero }]}>
        {fresh && !cancelled && (
          <View style={[styles.check, { backgroundColor: t.onRed }]}>
            <Icon name="check" size={28} color={t.red} strokeWidth={2.6} />
          </View>
        )}
        <Txt variant="display" color={cancelled ? t.ink2 : fresh ? t.onRed : t.onHero}>
          {heroTitle}
        </Txt>
        <Txt variant="label" color={cancelled ? t.ink2 : (fresh ? t.onRed : t.onHero) + 'cc'}>
          {club.name} · Terrain {b.court}
        </Txt>
        <View style={[styles.ref, { borderColor: (cancelled ? t.ink2 : fresh ? t.onRed : t.onHero) + '55' }]}>
          <Txt variant="caption" color={cancelled ? t.ink2 : (fresh ? t.onRed : t.onHero) + 'aa'}>
            Référence à l'accueil
          </Txt>
          <Txt variant="mono" color={cancelled ? t.ink2 : fresh ? t.onRed : t.onHero} style={{ fontSize: 22 }}>
            {b.ref}
          </Txt>
        </View>
      </View>

      <Card style={{ gap: 14 }}>
        <Line icon="calendar" title={fmtDateLong(parseDateKey(b.date))} sub={`${fmtTime(b.start)} à ${fmtTime(b.start + b.duration)} · ${fmtDuration(b.duration)}`} />
        <Line icon={b.surface} title={`Terrain ${b.court} · ${surfaceById(b.surface).name}`} sub={surfaceById(b.surface).note} />
        <Line icon="pin" title={club.name} sub={club.address} />
        {joined ? (
          <Line
            icon="euro"
            title={`${eur(share)} · votre part, à l'accueil`}
            sub={`Match ${b.players === 2 ? 'simple' : 'double'} organisé par ${b.organizer ?? 'un joueur'}`}
          />
        ) : (
          <Line
            icon={b.payment === 'card' ? 'card' : 'euro'}
            title={`${eur(b.price)} · ${b.payment === 'card' ? 'payé par carte' : 'à payer au club'}`}
            sub={`${b.players === 2 ? 'Simple' : 'Double'}, ${eur(share)} par joueur`}
          />
        )}
      </Card>

      <PlayersCard booking={b} editable={!cancelled && !joined} />

      <Row gap={10}>
        <Button
          title="Itinéraire"
          icon="pin"
          kind="secondary"
          style={{ flex: 1 }}
          onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${club.lat},${club.lng}`)}
        />
        <Button title="Partager" icon="share" kind="secondary" style={{ flex: 1 }} onPress={onShare} />
      </Row>

      {upcoming && !cancelled && (
        <Card style={{ gap: 12 }}>
          <Txt variant="heading">{joined ? 'Désistement' : 'Annulation'}</Txt>
          {freeCancel ? (
            <>
              <Txt muted>
                Gratuite jusqu'à {FREE_CANCEL_HOURS} h avant le début.{' '}
                {joined
                  ? 'Votre place est rendue aux autres joueurs.'
                  : b.payment === 'card'
                    ? 'Vous êtes remboursé sur votre carte.'
                    : 'Rien à payer.'}
              </Txt>
              {confirming ? (
                <Row gap={10}>
                  <Button title="Garder" kind="secondary" style={{ flex: 1 }} onPress={() => setConfirming(false)} />
                  <Button
                    title="Oui, annuler"
                    style={{ flex: 1 }}
                    onPress={() => {
                      cancel(b.id);
                      setConfirming(false);
                    }}
                  />
                </Row>
              ) : (
                <Button
                  title={joined ? 'Quitter le match' : 'Annuler la réservation'}
                  kind="ghost"
                  onPress={() => setConfirming(true)}
                />
              )}
            </>
          ) : (
            <>
              <Txt muted>
                Le match commence dans moins de {FREE_CANCEL_HOURS} h, l'annulation en ligne n'est plus possible. Appelez le
                club si vous avez un empêchement.
              </Txt>
              <Button
                title={`Appeler ${club.phone}`}
                icon="phone"
                kind="secondary"
                onPress={() => Linking.openURL(`tel:${club.phone.replace(/\s/g, '')}`)}
              />
            </>
          )}
        </Card>
      )}

      {!upcoming && !joined && (
        <Button
          title="Rejouer au même créneau"
          icon="calendar"
          onPress={() =>
            router.push({
              pathname: '/club/[id]',
              params: {
                id: b.clubId,
                surface: b.surface,
                day: sameSlotNextWeek(b, now),
                start: String(b.start),
                duration: String(b.duration),
              },
            })
          }
        />
      )}

      {fresh && (
        <>
          <Divider />
          <Button title="Voir mes réservations" kind="ghost" onPress={() => router.replace('/bookings')} />
        </>
      )}
    </ScrollView>
  );
}

function Line({ icon, title, sub }: { icon: IconName; title: string; sub: string }) {
  const t = useTheme();
  return (
    <Row gap={12} style={{ alignItems: 'flex-start' }}>
      <View style={[styles.lineIcon, { backgroundColor: t.line2 }]}>
        <Icon name={icon} size={19} color={t.ink} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="label">{capitalize(title)}</Txt>
        <Txt variant="caption" muted>
          {sub}
        </Txt>
      </View>
    </Row>
  );
}

const styles = StyleSheet.create({
  round: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: radius.hero, padding: 22, gap: 4 },
  check: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  ref: { marginTop: 14, borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: 12, alignItems: 'center', gap: 2 },
  lineIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '@/components/Icon';
import { Button, Card, Divider, EmptyState, Row, Segmented, Txt } from '@/components/ui';
import { eur, FREE_CANCEL_HOURS, isPeak, priceFor, splitEqually } from '@/lib/availability';
import { clubById, surfaceById, SurfaceId } from '@/lib/clubs';
import { capitalize, fmtDateLong, fmtDuration, fmtTime, parseDateKey } from '@/lib/time';
import type { PaymentMethod } from '@/lib/types';
import { useStore } from '@/state/store';
import { radius, useTheme } from '@/theme';

export default function BookScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const p = useLocalSearchParams<{ clubId: string; surface: SurfaceId; date: string; start: string; duration: string }>();
  const { user, book } = useStore();
  const [players, setPlayers] = useState<2 | 4>(2);
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [error, setError] = useState<string | null>(null);

  const club = clubById(p.clubId);
  const start = Number(p.start);
  const duration = Number(p.duration);
  const valid = club && club.surfaces[p.surface] && /^\d{4}-\d{2}-\d{2}$/.test(p.date ?? '') && start >= 0 && duration > 0;

  if (!valid) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <EmptyState
          icon="calendar"
          title="Réservation incomplète"
          body="Revenez à la liste des clubs pour choisir un créneau."
          action={<Button title="Explorer les clubs" onPress={() => router.replace('/')} />}
        />
      </SafeAreaView>
    );
  }

  const total = priceFor(club, p.surface, p.date, start, duration);
  const shares = splitEqually(total, players);
  const peak = isPeak(p.date, start);

  const confirm = () => {
    setError(null);
    const res = book({ clubId: club.id, surface: p.surface, date: p.date, start, duration, players, payment });
    if (!res.ok) {
      setError(res.reason);
      return;
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (router.canDismiss()) router.dismissAll();
    router.push({ pathname: '/booking/[id]', params: { id: res.booking.id, fresh: '1' } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 140, gap: 16 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={() => router.back()}
            style={[styles.back, { backgroundColor: t.card, borderColor: t.line }]}>
            <Icon name="chevronLeft" color={t.ink} />
          </Pressable>
          <Txt variant="label" muted>
            Récapitulatif
          </Txt>
          <View style={{ width: 42 }} />
        </Row>

        <View style={[styles.hero, { backgroundColor: t.hero }]}>
          <Txt variant="caption" color={t.onHero + 'aa'}>
            {club.commune}
          </Txt>
          <Txt variant="title" color={t.onHero}>
            {club.name}
          </Txt>
          <Txt variant="label" color={t.onHero} style={{ marginTop: 10 }}>
            {capitalize(fmtDateLong(parseDateKey(p.date)))}
          </Txt>
          <Txt variant="display" color={t.onHero}>
            {fmtTime(start)}
            <Txt variant="heading" color={t.onHero + 'aa'}>
              {'  '}→ {fmtTime(start + duration)}
            </Txt>
          </Txt>
          <Row gap={8} style={{ marginTop: 10, flexWrap: 'wrap' }}>
            <HeroTag icon={p.surface} label={surfaceById(p.surface).name} />
            <HeroTag icon="clock" label={fmtDuration(duration)} />
            {peak && <HeroTag icon="ball" label="Heure pleine" />}
          </Row>
        </View>

        <Card style={{ gap: 12 }}>
          <Txt variant="heading">Joueurs</Txt>
          <Segmented
            value={players}
            onChange={setPlayers}
            options={[
              { value: 2, label: 'Simple · 2' },
              { value: 4, label: 'Double · 4' },
            ]}
          />
          <Txt variant="caption" muted>
            Le terrain coûte {eur(total)}, soit {eur(shares[shares.length - 1])} par joueur. Vous payez tout maintenant et
            partagez la note après le match.
          </Txt>
        </Card>

        <Card style={{ gap: 12 }}>
          <Txt variant="heading">Paiement</Txt>
          <PayOption
            icon="card"
            title="Carte enregistrée"
            subtitle="Visa •••• 4242 (démo, aucun débit)"
            active={payment === 'card'}
            onPress={() => setPayment('card')}
          />
          <PayOption
            icon="euro"
            title="Payer au club"
            subtitle="À l'accueil, avant de jouer"
            active={payment === 'club'}
            onPress={() => setPayment('club')}
          />
        </Card>

        <Card style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt muted>
              Terrain {surfaceById(p.surface).short.toLowerCase()} · {fmtDuration(duration)}
            </Txt>
            <Txt>{eur(club.surfaces[p.surface]!.price * (duration / 60))}</Txt>
          </Row>
          {peak && (
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt muted>Majoration heure pleine</Txt>
              <Txt>+20 %</Txt>
            </Row>
          )}
          <Divider />
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="heading">Total</Txt>
            <Txt variant="heading">{eur(total)}</Txt>
          </Row>
        </Card>

        <Row gap={10} style={{ alignItems: 'flex-start', paddingHorizontal: 4 }}>
          <Icon name="check" size={18} color={t.red} />
          <Txt variant="caption" muted style={{ flex: 1 }}>
            Annulation gratuite jusqu'à {FREE_CANCEL_HOURS} h avant le début. Le numéro du terrain est attribué à la
            confirmation.
          </Txt>
        </Row>

      </ScrollView>

      <View style={[styles.footer, { backgroundColor: t.card, borderTopColor: t.line, paddingBottom: Math.max(insets.bottom, 12) }]}>
        {error && (
          <View style={[styles.error, { backgroundColor: t.redWash }]} accessibilityLiveRegion="polite">
            <Txt variant="label" color={t.red}>
              {error}
            </Txt>
          </View>
        )}
        {user ? (
          <Button title={`Confirmer · ${eur(total)}`} onPress={confirm} />
        ) : (
          <Button title="Se connecter pour réserver" icon="user" onPress={() => router.push('/sign-in')} />
        )}
      </View>
    </View>
  );
}

function HeroTag({ icon, label }: { icon: IconName; label: string }) {
  const t = useTheme();
  return (
    <View style={[styles.tag, { borderColor: t.onHero + '40' }]}>
      <Icon name={icon} size={15} color={t.onHero} />
      <Txt variant="caption" color={t.onHero}>
        {label}
      </Txt>
    </View>
  );
}

function PayOption({
  icon,
  title,
  subtitle,
  active,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  active: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={[styles.pay, { borderColor: active ? t.red : t.line, backgroundColor: active ? t.redWash : 'transparent' }]}>
      <Icon name={icon} color={active ? t.red : t.ink} />
      <View style={{ flex: 1 }}>
        <Txt variant="label">{title}</Txt>
        <Txt variant="caption" muted>
          {subtitle}
        </Txt>
      </View>
      <View style={[styles.radio, { borderColor: active ? t.red : t.ink3 }]}>
        {active && <View style={[styles.radioDot, { backgroundColor: t.red }]} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: radius.hero, padding: 22, gap: 2 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1 },
  pay: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.field, borderWidth: 1.5 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  error: { padding: 14, borderRadius: radius.field, marginBottom: 10 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
});

import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeIn } from '@/components/FadeIn';
import { Icon } from '@/components/Icon';
import { Avatar, Button, Card, EmptyState, Row, Txt } from '@/components/ui';
import { eur, FREE_CANCEL_HOURS } from '@/lib/availability';
import { surfaceById } from '@/lib/clubs';
import { success } from '@/lib/haptics';
import { atMyLevel, fmtLevel, LEVEL_TOLERANCE, matchById, PLAYERS, spotsLeft } from '@/lib/matches';
import { capitalize, fmtDateLong, fmtDuration, fmtTime, parseDateKey } from '@/lib/time';
import { LEVEL_VALUE } from '@/lib/types';
import { useNow, useStore } from '@/state/store';
import { radius, useTheme } from '@/theme';

export default function MatchScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const now = useNow();
  const { user, bookings, joinMatch } = useStore();
  const [error, setError] = useState<string | null>(null);

  const match = matchById(id, now, bookings, user?.name);
  const myBooking = bookings.find((b) => b.matchId === id && b.status === 'confirmed');

  if (!match) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <EmptyState
          icon="ball"
          title="Match introuvable"
          body="Il a peut-être déjà commencé."
          action={<Button title="Voir les matchs ouverts" onPress={() => router.replace('/play')} />}
        />
      </SafeAreaView>
    );
  }

  const left = spotsLeft(match);
  const mine = user ? LEVEL_VALUE[user.level] : null;
  const levelOf = (name: string) => PLAYERS.find((p) => p.name === name)?.level;

  const join = () => {
    setError(null);
    const res = joinMatch(match);
    if (!res.ok) {
      setError(res.reason);
      return;
    }
    success();
    router.replace({ pathname: '/booking/[id]', params: { id: res.booking.id, fresh: '1' } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 160, gap: 16 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/play'))}
          style={[styles.back, { backgroundColor: t.card, borderColor: t.line }]}>
          <Icon name="chevronLeft" color={t.ink} />
        </Pressable>

        <FadeIn>
          <View style={[styles.hero, { backgroundColor: t.hero }]}>
            <Txt variant="caption" color={t.onHero + 'aa'}>
              {match.format === 2 ? 'Simple' : 'Double'} · niveau {fmtLevel(match.level)}
            </Txt>
            <Txt variant="title" color={t.onHero}>
              {match.club.name}
            </Txt>
            <Txt variant="label" color={t.onHero} style={{ marginTop: 10 }}>
              {capitalize(fmtDateLong(parseDateKey(match.date)))}
            </Txt>
            <Txt variant="display" color={t.onHero}>
              {fmtTime(match.start)}
              <Txt variant="heading" color={t.onHero + 'aa'}>
                {'  '}→ {fmtTime(match.start + match.duration)}
              </Txt>
            </Txt>
            <Row gap={8} style={{ marginTop: 10, flexWrap: 'wrap' }}>
              <View style={[styles.tag, { borderColor: t.onHero + '40' }]}>
                <Icon name={match.surface} size={15} color={t.onHero} />
                <Txt variant="caption" color={t.onHero}>
                  {surfaceById(match.surface).name} · terrain {match.court}
                </Txt>
              </View>
              <View style={[styles.tag, { borderColor: t.onHero + '40' }]}>
                <Icon name="clock" size={15} color={t.onHero} />
                <Txt variant="caption" color={t.onHero}>
                  {fmtDuration(match.duration)}
                </Txt>
              </View>
            </Row>
          </View>
        </FadeIn>

        <FadeIn index={1}>
          <Card style={{ gap: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt variant="heading">Joueurs</Txt>
              <Txt variant="caption" muted>
                {match.players.length} sur {match.format}
              </Txt>
            </Row>
            {match.players.map((name, i) => {
              const isMe = !!myBooking && i === match.players.length - 1;
              const lvl = isMe && mine !== null ? mine : levelOf(name);
              return (
                <Row key={name} gap={12}>
                  <Avatar name={name} size={40} red={isMe} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="label">{isMe ? `${name} (vous)` : name}</Txt>
                    <Txt variant="caption" muted>
                      {i === 0 ? 'Organise le match' : 'Inscrit'}
                      {lvl !== undefined ? ` · niveau ${fmtLevel(lvl)}` : ''}
                    </Txt>
                  </View>
                </Row>
              );
            })}
            {Array.from({ length: left }, (_, i) => (
              <Row key={i} gap={12}>
                <View style={[styles.empty, { borderColor: t.ink3 }]}>
                  <Icon name="user" size={18} color={t.ink3} />
                </View>
                <Txt muted>Place libre</Txt>
              </Row>
            ))}
          </Card>
        </FadeIn>

        <FadeIn index={2}>
          <Card style={{ gap: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt muted>Terrain complet</Txt>
              <Txt>{eur(match.price)}</Txt>
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt variant="heading">Votre part</Txt>
              <Txt variant="heading">{eur(match.share)}</Txt>
            </Row>
            <Txt variant="caption" muted>
              Vous réglez votre part à l'accueil du club. Désistement gratuit jusqu'à {FREE_CANCEL_HOURS} h avant.
            </Txt>
          </Card>
        </FadeIn>

        {mine !== null && !atMyLevel(match, mine) && (
          <Row gap={10} style={{ alignItems: 'flex-start', paddingHorizontal: 4 }}>
            <Icon name="ball" size={18} color={t.red} />
            <Txt variant="caption" muted style={{ flex: 1 }}>
              Ce match vise un niveau {fmtLevel(match.level)}, à plus de {fmtLevel(LEVEL_TOLERANCE)} du vôtre (
              {fmtLevel(mine)}). Vous pouvez le rejoindre quand même.
            </Txt>
          </Row>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: t.card, borderTopColor: t.line, paddingBottom: Math.max(insets.bottom, 12) }]}>
        {error && (
          <View style={[styles.error, { backgroundColor: t.redWash }]} accessibilityLiveRegion="polite">
            <Txt variant="label" color={t.red}>
              {error}
            </Txt>
          </View>
        )}
        {myBooking ? (
          <Button
            title="Voir ma place"
            kind="secondary"
            onPress={() => router.push({ pathname: '/booking/[id]', params: { id: myBooking.id } })}
          />
        ) : !user ? (
          <Button title="Se connecter pour rejoindre" icon="user" onPress={() => router.push('/sign-in')} />
        ) : left === 0 ? (
          <Button title="Match complet" disabled />
        ) : (
          <Button title={`Rejoindre · ${eur(match.share)}`} onPress={join} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: radius.hero, padding: 22, gap: 2 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1 },
  empty: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  error: { padding: 14, borderRadius: radius.field, marginBottom: 10 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
});

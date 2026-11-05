import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeIn } from '@/components/FadeIn';
import { MatchCard } from '@/components/MatchCard';
import { Chip, EmptyState, Row, Txt } from '@/components/ui';
import { SURFACES, SurfaceId } from '@/lib/clubs';
import { atMyLevel, fmtLevel, MATCH_DAYS, openMatches, spotsLeft } from '@/lib/matches';
import { addDays, dateKey, fmtWeekdayShort } from '@/lib/time';
import { LEVEL_VALUE } from '@/lib/types';
import { useNow, useStore } from '@/state/store';
import { useTheme } from '@/theme';

export default function Play() {
  const t = useTheme();
  const now = useNow();
  const { user, bookings } = useStore();
  const [levelOnly, setLevelOnly] = useState(true);
  const [surface, setSurface] = useState<SurfaceId | 'all'>('all');
  const [day, setDay] = useState<string | 'all'>('all');

  const mine = user ? LEVEL_VALUE[user.level] : LEVEL_VALUE['Intermédiaire'];
  const joinedIds = useMemo(
    () => new Set(bookings.filter((b) => b.kind === 'joined' && b.status === 'confirmed').map((b) => b.matchId)),
    [bookings],
  );
  const all = useMemo(() => openMatches(now, bookings, user?.name), [now, bookings, user?.name]);
  const shown = all.filter(
    (m) =>
      (joinedIds.has(m.id) || spotsLeft(m) > 0) &&
      (!levelOnly || atMyLevel(m, mine)) &&
      (surface === 'all' || m.surface === surface) &&
      (day === 'all' || m.date === day),
  );
  const days = Array.from({ length: MATCH_DAYS }, (_, i) => addDays(now, i));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={shown}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, gap: 12 }}>
            <View>
              <Txt variant="title">Matchs ouverts</Txt>
              <Txt muted>
                Des joueurs cherchent un partenaire. Rejoignez-les et payez seulement votre part.
              </Txt>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
              <Chip
                label={`Mon niveau · ${fmtLevel(mine)}`}
                icon="ball"
                active={levelOnly}
                onPress={() => setLevelOnly((v) => !v)}
              />
              <Chip label="Toutes surfaces" active={surface === 'all'} onPress={() => setSurface('all')} />
              {SURFACES.map((s) => (
                <Chip key={s.id} label={s.short} icon={s.id} active={surface === s.id} onPress={() => setSurface(s.id)} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
              <Chip label="Tous les jours" active={day === 'all'} onPress={() => setDay('all')} />
              {days.map((d, i) => {
                const key = dateKey(d);
                return (
                  <Chip
                    key={key}
                    label={i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : `${fmtWeekdayShort(d)} ${d.getDate()}`}
                    active={day === key}
                    onPress={() => setDay(key)}
                  />
                );
              })}
            </ScrollView>
            {!user && (
              <Txt variant="caption" muted>
                Niveau par défaut : intermédiaire. Connectez-vous pour utiliser le vôtre.
              </Txt>
            )}
            <Row>
              <Txt variant="caption" muted>
                {shown.length} match{shown.length > 1 ? 's' : ''}
              </Txt>
            </Row>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="ball"
            title="Aucun match pour ces filtres"
            body={levelOnly ? 'Élargissez au-delà de votre niveau ou choisissez un autre jour.' : 'Choisissez un autre jour ou une autre surface.'}
          />
        }
        renderItem={({ item, index }) => (
          <FadeIn index={index} style={{ paddingHorizontal: 16 }}>
            <MatchCard
              match={item}
              now={now}
              joined={joinedIds.has(item.id)}
              atLevel={atMyLevel(item, mine)}
              onPress={() => router.push({ pathname: '/match/[id]', params: { id: item.id } })}
            />
          </FadeIn>
        )}
      />
    </SafeAreaView>
  );
}

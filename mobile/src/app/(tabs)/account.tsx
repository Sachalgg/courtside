import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Avatar, Button, Card, Chip, Divider, EmptyState, Row, Txt } from '@/components/ui';
import { eur, isUpcoming } from '@/lib/availability';
import { myCost, owedToMe } from '@/lib/bookings';
import { clubById, SURFACES } from '@/lib/clubs';
import { fmtMonthYear, parseDateKey } from '@/lib/time';
import { LEVELS } from '@/lib/types';
import { useNow, useStore } from '@/state/store';
import { radius, useTheme } from '@/theme';

export default function Account() {
  const t = useTheme();
  const now = useNow();
  const { user, bookings, favorites, updateUser, signOut, reset } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);

  const stats = useMemo(() => {
    const kept = bookings.filter((b) => b.status === 'confirmed');
    const played = kept.filter((b) => !isUpcoming(b, now));
    const counts = new Map<string, number>();
    kept.forEach((b) => counts.set(b.clubId, (counts.get(b.clubId) ?? 0) + 1));
    const topClub = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      played: played.length,
      hours: played.reduce((h, b) => h + b.duration / 60, 0),
      spent: kept.reduce((s, b) => s + myCost(b), 0),
      owed: kept.reduce((s, b) => s + owedToMe(b), 0),
      joined: kept.filter((b) => b.kind === 'joined').length,
      topClub: topClub ? clubById(topClub)?.name : null,
    };
  }, [bookings, now]);

  if (!user) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Txt variant="title">Compte</Txt>
        </View>
        <EmptyState
          icon="user"
          title="Jouez plus, organisez moins"
          body="Créez un compte pour réserver, retrouver vos matchs et garder vos clubs favoris."
          action={
            <View style={{ gap: 10, alignSelf: 'stretch', marginTop: 8 }}>
              <Button title="Créer un compte" onPress={() => router.push({ pathname: '/sign-in', params: { mode: 'signup' } })} />
              <Button title="J'ai déjà un compte" kind="ghost" onPress={() => router.push('/sign-in')} />
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 16, paddingBottom: 40 }}>
        <Txt variant="title">Compte</Txt>

        <View style={[styles.hero, { backgroundColor: t.hero }]}>
          <Row gap={14}>
            <Avatar name={user.name} size={58} red />
            <View style={{ flex: 1 }}>
              <Txt variant="heading" color={t.onHero} numberOfLines={1}>
                {user.name}
              </Txt>
              <Txt variant="caption" color={t.onHero + 'aa'} numberOfLines={1}>
                {user.email}
              </Txt>
              <Txt variant="caption" color={t.onHero + 'aa'}>
                Membre depuis {fmtMonthYear(parseDateKey(user.memberSince))}
              </Txt>
            </View>
          </Row>
          <Row style={{ marginTop: 18, justifyContent: 'space-between' }}>
            <Stat value={String(stats.played)} label="matchs joués" />
            <Stat value={`${String(stats.hours).replace('.', ',')} h`} label="sur le terrain" />
            <Stat value={eur(stats.spent)} label="réservés" />
          </Row>
        </View>

        {stats.owed > 0 && (
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/bookings')}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: t.red }}>
              <Icon name="euro" color={t.red} />
              <Txt style={{ flex: 1 }}>
                Vos partenaires vous doivent <Txt variant="label">{eur(stats.owed)}</Txt>
              </Txt>
              <Icon name="chevronRight" size={18} color={t.ink3} />
            </Card>
          </Pressable>
        )}

        {stats.topClub && (
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="star" color={t.red} />
            <Txt style={{ flex: 1 }}>
              Votre club : <Txt variant="label">{stats.topClub}</Txt>
            </Txt>
          </Card>
        )}

        <Card style={{ gap: 12 }}>
          <Txt variant="heading">Niveau</Txt>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {LEVELS.map((l) => (
              <Chip key={l} label={l} active={user.level === l} onPress={() => updateUser({ level: l })} />
            ))}
          </Row>
          <Divider />
          <Txt variant="heading">Surface préférée</Txt>
          <Txt variant="caption" muted>
            Présélectionnée quand vous ouvrez un club qui la propose.
          </Txt>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {SURFACES.map((s) => (
              <Chip
                key={s.id}
                label={s.short}
                icon={s.id}
                active={user.favSurface === s.id}
                onPress={() => updateUser({ favSurface: user.favSurface === s.id ? null : s.id })}
              />
            ))}
          </Row>
        </Card>

        <Card style={{ gap: 4 }}>
          <Txt variant="heading" style={{ marginBottom: 6 }}>
            Clubs favoris
          </Txt>
          {favorites.length === 0 ? (
            <Txt variant="caption" muted>
              Touchez le cœur d'un club pour le retrouver ici.
            </Txt>
          ) : (
            favorites.map((id) => {
              const c = clubById(id);
              if (!c) return null;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/club/[id]', params: { id } })}
                  style={styles.favRow}>
                  <Icon name="heartFill" size={18} color={t.red} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="label">{c.name}</Txt>
                    <Txt variant="caption" muted>
                      {c.commune}
                    </Txt>
                  </View>
                  <Icon name="chevronRight" size={18} color={t.ink3} />
                </Pressable>
              );
            })
          )}
        </Card>

        <Card style={{ gap: 10 }}>
          <Txt variant="heading">Données</Txt>
          <Txt variant="caption" muted>
            Courtside est une démo : clubs, tarifs et disponibilités sont fictifs, et tout reste sur ce téléphone.
          </Txt>
          {confirmReset ? (
            <Row gap={10}>
              <Button title="Garder" kind="secondary" small style={{ flex: 1 }} onPress={() => setConfirmReset(false)} />
              <Button
                title="Tout effacer"
                small
                style={{ flex: 1 }}
                onPress={() => {
                  reset();
                  setConfirmReset(false);
                }}
              />
            </Row>
          ) : (
            <Button title="Effacer toutes les données" kind="secondary" small onPress={() => setConfirmReset(true)} />
          )}
        </Card>

        <Button title="Se déconnecter" kind="ghost" onPress={signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'flex-start', flex: 1 }}>
      <Txt variant="heading" color={t.onHero}>
        {value}
      </Txt>
      <Txt variant="caption" color={t.onHero + 'aa'}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.hero, padding: 20 },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
});


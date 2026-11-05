import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Button, Card, EmptyState, Row, Segmented, Txt } from '@/components/ui';
import { DURATIONS, eur, slotsFor } from '@/lib/availability';
import { clubById, clubSurfaces, surfaceById, SurfaceId } from '@/lib/clubs';
import { distanceKm, fmtKm } from '@/lib/geo';
import { dateKey, fmtDuration, fmtTime, fmtWeekdayShort, nextDays, parseDateKey } from '@/lib/time';
import { useLocation } from '@/state/location';
import { useNow, useStore } from '@/state/store';
import { radius, useTheme } from '@/theme';

const DAYS_AHEAD = 14;

export default function ClubScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; surface?: SurfaceId }>();
  const club = clubById(params.id);
  const now = useNow();
  const { allBookings, favorites, toggleFavorite, user } = useStore();
  const { origin } = useLocation();

  const surfaces = club ? clubSurfaces(club) : [];
  const preferred =
    (params.surface && surfaces.includes(params.surface) && params.surface) ||
    (user?.favSurface && surfaces.includes(user.favSurface) && user.favSurface) ||
    surfaces[0];
  const [surface, setSurface] = useState<SurfaceId>(preferred);
  const todayKey = dateKey(now);
  const [pickedDay, setDay] = useState(todayKey);
  // If the screen stays open past midnight, never offer a day that is over.
  const day = pickedDay < todayKey ? todayKey : pickedDay;
  const days = useMemo(() => nextDays(parseDateKey(todayKey), DAYS_AHEAD), [todayKey]);
  const [duration, setDuration] = useState<number>(60);
  const [start, setStart] = useState<number | null>(null);

  const slots = useMemo(
    () => (club ? slotsFor(club, surface, day, duration, allBookings, now) : []),
    [club, surface, day, duration, allBookings, now],
  );
  const bookable = slots.filter((s) => !s.past);
  const selected = slots.find((s) => s.start === start && s.freeCourts.length > 0) ?? null;

  if (!club) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
        <EmptyState
          icon="pin"
          title="Club introuvable"
          body="Ce club n'existe plus dans la liste."
          action={<Button title="Retour" kind="secondary" onPress={() => router.back()} />}
        />
      </SafeAreaView>
    );
  }

  const fav = favorites.includes(club.id);
  const group = club.surfaces[surface]!;
  const pick = (fn: () => void) => {
    fn();
    setStart(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={[styles.hero, { backgroundColor: t.hero, paddingTop: insets.top + 8 }]}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={[styles.heroBtn, { backgroundColor: t.onHero + '1f' }]}>
              <Icon name="chevronLeft" color={t.onHero} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              onPress={() => (user ? toggleFavorite(club.id) : router.push('/sign-in'))}
              style={[styles.heroBtn, { backgroundColor: t.onHero + '1f' }]}>
              <Icon name={fav ? 'heartFill' : 'heart'} color={fav ? t.red : t.onHero} />
            </Pressable>
          </Row>
          <View style={{ gap: 6, marginTop: 18 }}>
            <Txt variant="display" color={t.onHero}>
              {club.name}
            </Txt>
            <Row gap={6}>
              <Icon name="star" size={14} color={t.red} />
              <Txt variant="label" color={t.onHero}>
                {club.rating.toFixed(1).replace('.', ',')}
              </Txt>
              <Txt variant="label" color={t.onHero + 'aa'}>
                · {club.commune} · {fmtKm(distanceKm(origin, club))}
              </Txt>
            </Row>
            <Txt variant="caption" color={t.onHero + 'aa'}>
              {club.address} · ouvert {club.opens}h à {club.closes}h
            </Txt>
          </View>
          <Row gap={8} style={{ marginTop: 16 }}>
            <Pressable
              accessibilityRole="link"
              onPress={() => Linking.openURL(`tel:${club.phone.replace(/\s/g, '')}`)}
              style={[styles.heroPill, { borderColor: t.onHero + '40' }]}>
              <Icon name="phone" size={16} color={t.onHero} />
              <Txt variant="caption" color={t.onHero}>
                Appeler
              </Txt>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              onPress={() =>
                Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${club.lat},${club.lng}`)
              }
              style={[styles.heroPill, { borderColor: t.onHero + '40' }]}>
              <Icon name="pin" size={16} color={t.onHero} />
              <Txt variant="caption" color={t.onHero}>
                Itinéraire
              </Txt>
            </Pressable>
          </Row>
        </View>

        <View style={{ padding: 16, gap: 22 }}>
          <View style={{ gap: 10 }}>
            <Txt variant="heading">Surface</Txt>
            <Segmented
              value={surface}
              onChange={(v) => pick(() => setSurface(v))}
              options={surfaces.map((s) => ({ value: s, label: surfaceById(s).short, icon: s }))}
            />
            <Txt variant="caption" muted>
              {surfaceById(surface).note} · {group.courts} terrain{group.courts > 1 ? 's' : ''} · {eur(group.price)} / heure
            </Txt>
          </View>

          <View style={{ gap: 10 }}>
            <Txt variant="heading">Date</Txt>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {days.map((d) => {
                const key = dateKey(d);
                const active = key === day;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => pick(() => setDay(key))}
                    style={[
                      styles.day,
                      { backgroundColor: active ? t.ink : t.card, borderColor: active ? t.ink : t.line },
                    ]}>
                    <Txt variant="caption" color={active ? t.bg : t.ink2}>
                      {key === todayKey ? 'auj.' : fmtWeekdayShort(d)}
                    </Txt>
                    <Txt variant="heading" color={active ? t.bg : t.ink}>
                      {d.getDate()}
                    </Txt>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={{ gap: 10 }}>
            <Txt variant="heading">Durée</Txt>
            <Segmented
              value={duration}
              onChange={(v) => pick(() => setDuration(v))}
              options={DURATIONS.map((d) => ({ value: d, label: fmtDuration(d) }))}
            />
          </View>

          <View style={{ gap: 10 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt variant="heading">Créneaux</Txt>
              <Row gap={6}>
                <View style={[styles.dot, { backgroundColor: t.red }]} />
                <Txt variant="caption" muted>
                  Heure pleine +20 %
                </Txt>
              </Row>
            </Row>
            {bookable.length === 0 ? (
              <Card>
                <Txt muted>Plus aucun créneau aujourd'hui. Choisissez un autre jour.</Txt>
              </Card>
            ) : (
              <View style={styles.grid}>
                {bookable.map((s) => {
                  const full = s.freeCourts.length === 0;
                  const active = s.start === selected?.start;
                  return (
                    <Pressable
                      key={s.start}
                      disabled={full}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active, disabled: full }}
                      accessibilityLabel={`${fmtTime(s.start)}, ${full ? 'complet' : eur(s.price)}`}
                      onPress={() => setStart(s.start)}
                      style={({ pressed }) => [
                        styles.slot,
                        {
                          backgroundColor: active ? t.red : full ? t.line2 : t.card,
                          borderColor: active ? t.red : full ? t.line2 : t.line,
                        },
                        pressed && { transform: [{ scale: 0.95 }] },
                      ]}>
                      {s.peak && !full && (
                        <View style={[styles.peak, { backgroundColor: active ? t.onRed : t.red }]} />
                      )}
                      <Txt
                        variant="label"
                        color={active ? t.onRed : full ? t.ink3 : t.ink}
                        style={full && { textDecorationLine: 'line-through' }}>
                        {fmtTime(s.start)}
                      </Txt>
                      <Txt variant="caption" color={active ? t.onRed : t.ink3}>
                        {full ? 'complet' : eur(s.price)}
                      </Txt>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={{ gap: 10 }}>
            <Txt variant="heading">Sur place</Txt>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {club.amenities.map((a) => (
                <View key={a} style={[styles.amenity, { borderColor: t.line }]}>
                  <Icon name="check" size={14} color={t.red} />
                  <Txt variant="caption">{a}</Txt>
                </View>
              ))}
            </Row>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: t.card, borderTopColor: t.line, paddingBottom: Math.max(insets.bottom, 12) },
        ]}>
        <View style={{ flex: 1 }}>
          {selected ? (
            <>
              <Txt variant="heading">{eur(selected.price)}</Txt>
              <Txt variant="caption" muted>
                {fmtTime(selected.start)} à {fmtTime(selected.start + duration)} · {selected.freeCourts.length} libre
                {selected.freeCourts.length > 1 ? 's' : ''}
              </Txt>
            </>
          ) : (
            <Txt variant="caption" muted>
              Choisissez un créneau
            </Txt>
          )}
        </View>
        <Button
          title="Réserver"
          disabled={!selected}
          style={{ minWidth: 150 }}
          onPress={() =>
            selected &&
            router.push({
              pathname: '/book',
              params: { clubId: club.id, surface, date: day, start: String(selected.start), duration: String(duration) },
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: radius.hero, borderBottomRightRadius: radius.hero },
  heroBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1 },
  day: { width: 56, height: 66, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: { width: '23.3%', minWidth: 72, flexGrow: 1, height: 58, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  peak: { position: 'absolute', top: 7, right: 8, width: 6, height: 6, borderRadius: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  amenity: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 32, borderRadius: radius.pill, borderWidth: 1 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});

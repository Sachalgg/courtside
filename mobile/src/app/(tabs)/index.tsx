import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ClubMap from '@/components/ClubMap';
import { ClubCard } from '@/components/ClubCard';
import { Icon } from '@/components/Icon';
import { Chip, EmptyState, Row, Txt } from '@/components/ui';
import { nextFreeSlot } from '@/lib/availability';
import { CLUBS, minPrice, SURFACES, SurfaceId } from '@/lib/clubs';
import { distanceKm } from '@/lib/geo';
import { dateKey } from '@/lib/time';
import { useLocation } from '@/state/location';
import { useNow, useStore } from '@/state/store';
import { radius, useTheme } from '@/theme';

type Sort = 'distance' | 'price' | 'rating';

/** Room taken by the card carousel at the bottom of the map. */
const CAROUSEL_H = 186;

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export default function Explore() {
  const t = useTheme();
  const now = useNow();
  const { allBookings, favorites, toggleFavorite, user } = useStore();
  const { origin, located, status, request } = useLocation();
  const { width } = useWindowDimensions();

  const [mode, setMode] = useState<'map' | 'list'>('map');
  const [surface, setSurface] = useState<SurfaceId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('distance');
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const carousel = useRef<FlatList>(null);
  const [overlayH, setOverlayH] = useState(120);

  const today = dateKey(now);
  const items = useMemo(() => {
    const q = normalize(query.trim());
    const s = surface === 'all' ? undefined : surface;
    return CLUBS.filter((c) => !s || c.surfaces[s])
      .filter((c) => !q || normalize(`${c.name} ${c.commune} ${c.address}`).includes(q))
      .filter((c) => !onlyFavs || favorites.includes(c.id))
      .map((club) => ({
        club,
        distance: distanceKm(origin, club),
        price: minPrice(club, s),
        nextFree: nextFreeSlot(club, today, allBookings, now, s)?.start ?? null,
      }))
      .sort((a, b) =>
        sort === 'price' ? a.price - b.price : sort === 'rating' ? b.club.rating - a.club.rating : a.distance - b.distance,
      );
  }, [query, surface, onlyFavs, favorites, origin, today, allBookings, now, sort]);

  const cardWidth = Math.min(width - 48, 380);
  const open = (id: string) => router.push({ pathname: '/club/[id]', params: { id, ...(surface !== 'all' && { surface }) } });

  const selectOnMap = (id: string) => {
    setSelectedId(id);
    const index = items.findIndex((i) => i.club.id === id);
    if (index >= 0) carousel.current?.scrollToOffset({ offset: index * (cardWidth + 12), animated: true });
  };

  const toggle = (
    <View style={[styles.toggle, { backgroundColor: mode === 'map' ? t.card : t.line2, borderColor: t.line }]}>
      {(
        [
          ['map', 'map', 'Voir la carte'],
          ['list', 'list', 'Voir la liste'],
        ] as const
      ).map(([value, icon, label]) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ selected: mode === value }}
          onPress={() => setMode(value)}
          style={[styles.toggleBtn, mode === value && { backgroundColor: mode === 'map' ? t.redWash : t.card }]}>
          <Icon name={icon} size={19} color={mode === value ? t.red : t.ink2} />
        </Pressable>
      ))}
    </View>
  );

  const locateBtn = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Utiliser ma position"
      onPress={request}
      style={[
        styles.roundBtn,
        mode === 'map' && styles.floating,
        { backgroundColor: located ? t.red : t.card, borderColor: located ? t.red : t.line },
      ]}>
      <Icon name="locate" size={20} color={located ? t.onRed : t.ink} />
    </Pressable>
  );

  const search = (
    <View style={[styles.search, mode === 'map' && styles.floating, { backgroundColor: t.card, borderColor: t.line }]}>
      <Icon name="search" size={19} color={t.ink2} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Club, commune, adresse"
        placeholderTextColor={t.ink3}
        style={[styles.searchInput, { color: t.ink }]}
        returnKeyType="search"
        accessibilityLabel="Rechercher un club"
      />
      {query ? (
        <Pressable hitSlop={10} onPress={() => setQuery('')} accessibilityLabel="Effacer la recherche">
          <Icon name="close" size={18} color={t.ink2} />
        </Pressable>
      ) : null}
    </View>
  );

  const chips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -16, flexGrow: 0 }}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: mode === 'map' ? 4 : 0 }}>
      <Chip label="Toutes" active={surface === 'all'} onPress={() => setSurface('all')} />
      {SURFACES.map((s) => (
        <Chip key={s.id} label={s.short} icon={s.id} active={surface === s.id} onPress={() => setSurface(s.id)} />
      ))}
      {favorites.length > 0 && <Chip label="Favoris" icon="heart" active={onlyFavs} onPress={() => setOnlyFavs((v) => !v)} />}
    </ScrollView>
  );

  const denied =
    status === 'denied' ? (
      <Txt variant="caption" muted>
        Position refusée. Les distances partent de la Grand-Place.
      </Txt>
    ) : null;

  const header = (
    <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <Txt variant="caption" muted>
            {user ? `Bonjour ${user.name.split(' ')[0]}` : 'Tennis à Bruxelles'}
          </Txt>
          <Txt variant="title">
            Court<Txt variant="title" color={t.red}>side</Txt>
          </Txt>
        </View>
        <Row gap={8}>
          {toggle}
          {locateBtn}
        </Row>
      </Row>
      {search}
      {chips}
      {denied}
    </View>
  );

  const empty = (
    <EmptyState
      icon="search"
      title="Aucun club trouvé"
      body="Essayez une autre surface ou une autre recherche."
    />
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      {mode === 'map' ? (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <ClubMap
              style={StyleSheet.absoluteFill}
              items={items.map((i) => ({ club: i.club, price: i.price }))}
              selectedId={selectedId}
              onSelect={selectOnMap}
              userLocation={located}
              topInset={overlayH}
              bottomInset={items.length ? CAROUSEL_H : 0}
            />
            <View
              pointerEvents="box-none"
              style={styles.overlay}
              onLayout={(e) => setOverlayH(e.nativeEvent.layout.height)}>
              <Row gap={8}>
                <View style={{ flex: 1 }}>{search}</View>
                {toggle}
              </Row>
              {chips}
              {denied}
            </View>
            <View pointerEvents="box-none" style={[styles.locateWrap, { bottom: (items.length ? CAROUSEL_H : 0) + 12 }]}>
              {locateBtn}
            </View>
            {items.length === 0 ? (
              <View style={[styles.mapEmpty, { backgroundColor: t.card }]}>{empty}</View>
            ) : (
              <FlatList
                ref={carousel}
                style={styles.carousel}
                data={items}
                horizontal
                keyExtractor={(i) => i.club.id}
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardWidth + 12}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: (width - cardWidth) / 2 - 6, paddingBottom: 12 }}
                getItemLayout={(_, index) => ({ length: cardWidth + 12, offset: (cardWidth + 12) * index, index })}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 12));
                  const item = items[Math.max(0, Math.min(items.length - 1, index))];
                  if (item) setSelectedId(item.club.id);
                }}
                renderItem={({ item }) => (
                  <View style={{ width: cardWidth, marginHorizontal: 6 }}>
                    <ClubCard
                      compact
                      highlighted={item.club.id === selectedId}
                      club={item.club}
                      distanceKm={item.distance}
                      price={item.price}
                      nextFree={item.nextFree}
                      favorite={favorites.includes(item.club.id)}
                      onPress={() => open(item.club.id)}
                    />
                  </View>
                )}
              />
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.club.id}
          ListHeaderComponent={
            <View>
              {header}
              <Row style={{ paddingHorizontal: 16, paddingBottom: 12 }} gap={6}>
                <Txt variant="caption" muted>
                  {items.length} club{items.length > 1 ? 's' : ''} · trier par
                </Txt>
                {(
                  [
                    ['distance', 'Distance'],
                    ['price', 'Prix'],
                    ['rating', 'Note'],
                  ] as const
                ).map(([value, label]) => (
                  <Pressable
                    key={value}
                    onPress={() => setSort(value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sort === value }}
                    style={[styles.sort, { backgroundColor: sort === value ? t.redWash : 'transparent' }]}>
                    <Txt variant="caption" color={sort === value ? t.red : t.ink2}>
                      {label}
                    </Txt>
                  </Pressable>
                ))}
              </Row>
            </View>
          }
          ListEmptyComponent={empty}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16 }}>
              <ClubCard
                club={item.club}
                distanceKm={item.distance}
                price={item.price}
                nextFree={item.nextFree}
                favorite={favorites.includes(item.club.id)}
                onPress={() => open(item.club.id)}
                onToggleFavorite={user ? () => toggleFavorite(item.club.id) : () => router.push('/sign-in')}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', borderRadius: 25, padding: 3, height: 50, borderWidth: 1 },
  toggleBtn: { width: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  locateWrap: { position: 'absolute', right: 16 },
  floating: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  roundBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: 16, height: '100%' },
  carousel: { position: 'absolute', left: 0, right: 0, bottom: 0, flexGrow: 0 },
  mapEmpty: { position: 'absolute', left: 16, right: 16, bottom: 16, borderRadius: radius.card },
  sort: { paddingHorizontal: 10, height: 28, borderRadius: radius.pill, justifyContent: 'center' },
});

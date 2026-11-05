import { Pressable, StyleSheet, View } from 'react-native';

import { eur } from '@/lib/availability';
import { Club, clubSurfaces, surfaceById } from '@/lib/clubs';
import { fmtKm } from '@/lib/geo';
import { fmtTime } from '@/lib/time';
import { radius, useTheme } from '@/theme';

import { Icon } from './Icon';
import { Row, Txt } from './ui';

export type ClubCardProps = {
  club: Club;
  distanceKm: number;
  price: number;
  nextFree: number | null;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
  compact?: boolean;
  highlighted?: boolean;
};

export function ClubCard({
  club,
  distanceKm,
  price,
  nextFree,
  favorite,
  onPress,
  onToggleFavorite,
  compact,
  highlighted,
}: ClubCardProps) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${club.name}, ${club.commune}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compact,
        { backgroundColor: t.card, borderColor: highlighted ? t.red : t.line },
        pressed && { transform: [{ scale: 0.985 }] },
      ]}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="heading" numberOfLines={1}>
            {club.name}
          </Txt>
          <Row gap={6}>
            <Txt variant="caption" muted numberOfLines={1}>
              {club.commune} · {fmtKm(distanceKm)}
            </Txt>
            <Icon name="star" size={12} color={t.ink} />
            <Txt variant="caption">{club.rating.toFixed(1).replace('.', ',')}</Txt>
          </Row>
        </View>
        {onToggleFavorite && (
          <Pressable
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            onPress={onToggleFavorite}>
            <Icon name={favorite ? 'heartFill' : 'heart'} color={favorite ? t.red : t.ink3} />
          </Pressable>
        )}
      </Row>

      <Row gap={6} style={[{ flexWrap: 'wrap' }, compact && { flexWrap: 'nowrap', overflow: 'hidden' }]}>
        {clubSurfaces(club).map((s) => (
          <View key={s} style={[styles.surface, { backgroundColor: t.line2 }]}>
            <Icon name={s} size={14} color={t.ink} strokeWidth={1.7} />
            <Txt variant="caption">
              {surfaceById(s).short} · {club.surfaces[s]!.courts}
            </Txt>
          </View>
        ))}
      </Row>

      <Row style={{ justifyContent: 'space-between' }}>
        <Txt variant="label">
          dès {eur(price)}
          <Txt variant="caption" muted>
            {' '}
            / heure
          </Txt>
        </Txt>
        <View style={[styles.next, { backgroundColor: nextFree === null ? t.line2 : t.redWash }]}>
          <Icon name="clock" size={14} color={nextFree === null ? t.ink2 : t.red} />
          <Txt variant="caption" color={nextFree === null ? t.ink2 : t.red}>
            {nextFree === null ? "Complet aujourd'hui" : `Libre dès ${fmtTime(nextFree)}`}
          </Txt>
        </View>
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, borderWidth: 1.5, padding: 16, gap: 12 },
  compact: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  surface: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, height: 26, borderRadius: radius.pill },
  next: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 28, borderRadius: radius.pill },
});

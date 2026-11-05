import { Pressable, StyleSheet, View } from 'react-native';

import { eur } from '@/lib/availability';
import { surfaceById } from '@/lib/clubs';
import { fmtLevel, OpenMatch, spotsLeft } from '@/lib/matches';
import { fmtDuration, fmtTime, relativeDay } from '@/lib/time';
import { radius, useTheme } from '@/theme';

import { Icon } from './Icon';
import { Avatar, Row, Txt } from './ui';

export function MatchCard({
  match,
  now,
  joined,
  atLevel,
  onPress,
}: {
  match: OpenMatch;
  now: Date;
  joined: boolean;
  atLevel: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  const left = spotsLeft(match);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Match ${match.format === 2 ? 'simple' : 'double'} au ${match.club.name}, ${relativeDay(match.date, now)} à ${fmtTime(match.start)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: t.card, borderColor: joined ? t.red : t.line },
        pressed && { transform: [{ scale: 0.985 }] },
      ]}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="caption" color={t.red}>
            {relativeDay(match.date, now)} · {fmtTime(match.start)} · {fmtDuration(match.duration)}
          </Txt>
          <Txt variant="heading" numberOfLines={1}>
            {match.club.name}
          </Txt>
          <Row gap={6}>
            <Icon name={match.surface} size={14} color={t.ink2} />
            <Txt variant="caption" muted numberOfLines={1}>
              {surfaceById(match.surface).short} · {match.club.commune} · {match.format === 2 ? 'Simple' : 'Double'}
            </Txt>
          </Row>
        </View>
        <View style={[styles.level, { backgroundColor: atLevel ? t.redWash : t.line2 }]}>
          <Txt variant="caption" color={atLevel ? t.red : t.ink2}>
            niveau
          </Txt>
          <Txt variant="label" color={atLevel ? t.red : t.ink}>
            {fmtLevel(match.level)}
          </Txt>
        </View>
      </Row>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={0}>
          {match.players.map((name, i) => (
            <View key={name} style={[styles.avatarRing, { borderColor: t.card, zIndex: 10 - i }]}>
              <Avatar name={name} size={32} red={joined && i === match.players.length - 1} />
            </View>
          ))}
          {Array.from({ length: left }, (_, i) => (
            <View key={`empty${i}`} style={[styles.avatarRing, { borderColor: t.card }]}>
              <View style={[styles.empty, { borderColor: t.ink3 }]}>
                <Txt variant="caption" muted>
                  +
                </Txt>
              </View>
            </View>
          ))}
        </Row>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt variant="label">{eur(match.share)}</Txt>
          <Txt variant="caption" muted>
            {joined ? 'vous y êtes' : left === 0 ? 'complet' : `${left} place${left > 1 ? 's' : ''}`}
          </Txt>
        </View>
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card, borderWidth: 1.5, padding: 16, gap: 14 },
  level: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, minWidth: 64 },
  avatarRing: { borderWidth: 2, borderRadius: 20, marginRight: -8 },
  empty: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});

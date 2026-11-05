import { useState } from 'react';
import { Pressable, Share, StyleSheet, TextInput, View } from 'react-native';

import { eur, splitEqually } from '@/lib/availability';
import { owedToMe } from '@/lib/bookings';
import { clubById } from '@/lib/clubs';
import { tap } from '@/lib/haptics';
import { fmtDateLong, fmtTime, parseDateKey } from '@/lib/time';
import type { Booking } from '@/lib/types';
import { useStore } from '@/state/store';
import { radius, useTheme } from '@/theme';

import { Icon } from './Icon';
import { Avatar, Button, Card, Row, Txt } from './ui';

/** Who plays, and for a booking you paid by card, who still owes you their share. */
export function PlayersCard({ booking: b, editable }: { booking: Booking; editable: boolean }) {
  const t = useTheme();
  const { updateParticipant } = useStore();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const people = b.participants ?? [];
  if (!people.length) return null;

  const joined = b.kind === 'joined';
  const tracksPayment = !joined && b.payment === 'card' && b.status === 'confirmed';
  const shares = splitEqually(b.price, b.players);
  const owed = owedToMe(b);
  const unpaid = people.filter((p) => !p.me && !p.paid && p.name);

  const saveName = (id: string) => {
    const name = (draft[id] ?? '').trim();
    if (name.length < 2) return;
    updateParticipant(b.id, id, { name });
    setDraft((d) => ({ ...d, [id]: '' }));
  };

  const remind = () => {
    const club = clubById(b.clubId);
    const names = unpaid.map((p) => p.name!.split(' ')[0]).join(', ');
    Share.share({
      message:
        `${names}, petit rappel pour le tennis du ${fmtDateLong(parseDateKey(b.date))} à ${fmtTime(b.start)}` +
        `${club ? ` au ${club.name}` : ''} : ta part est de ${eur(shares[shares.length - 1])}. Merci !`,
    }).catch(() => {});
  };

  return (
    <Card style={{ gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt variant="heading">Joueurs</Txt>
        {tracksPayment && (
          <Txt variant="caption" color={owed > 0 ? t.red : t.ink2}>
            {owed > 0 ? `On vous doit ${eur(owed)}` : 'Tout est réglé'}
          </Txt>
        )}
      </Row>
      {people.map((p, i) => {
        const share = shares[i] ?? shares[shares.length - 1];
        if (!p.name) {
          return (
            <Row key={p.id} gap={12}>
              <View style={[styles.empty, { borderColor: t.ink3 }]}>
                <Icon name="user" size={18} color={t.ink3} />
              </View>
              {editable ? (
                <>
                  <TextInput
                    value={draft[p.id] ?? ''}
                    onChangeText={(v) => setDraft((d) => ({ ...d, [p.id]: v }))}
                    onSubmitEditing={() => saveName(p.id)}
                    placeholder={`Joueur ${i + 1}`}
                    placeholderTextColor={t.ink3}
                    returnKeyType="done"
                    accessibilityLabel={`Nom du joueur ${i + 1}`}
                    style={[styles.input, { color: t.ink, borderColor: t.line, backgroundColor: t.bg }]}
                  />
                  <Button title="Ajouter" small kind="secondary" onPress={() => saveName(p.id)} disabled={(draft[p.id] ?? '').trim().length < 2} />
                </>
              ) : (
                <Txt muted>Place libre</Txt>
              )}
            </Row>
          );
        }
        return (
          <Row key={p.id} gap={12}>
            <Avatar name={p.name} size={40} red={p.me} />
            <View style={{ flex: 1 }}>
              <Txt variant="label">{p.me ? `${p.name} (vous)` : p.name}</Txt>
              <Txt variant="caption" muted>
                {joined
                  ? p.name === b.organizer
                    ? 'Organise le match'
                    : `${eur(share)} à l'accueil`
                  : p.me
                    ? b.payment === 'card'
                      ? `A payé le terrain, ${eur(b.price)}`
                      : `${eur(share)} à l'accueil`
                    : tracksPayment
                      ? p.paid
                        ? `A remboursé ${eur(share)}`
                        : `Vous doit ${eur(share)}`
                      : `${eur(share)} à l'accueil`}
              </Txt>
            </View>
            {tracksPayment && !p.me && editable && (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: p.paid }}
                accessibilityLabel={`${p.name} a payé`}
                onPress={() => {
                  tap();
                  updateParticipant(b.id, p.id, { paid: !p.paid });
                }}
                style={[
                  styles.paid,
                  { borderColor: p.paid ? t.red : t.line, backgroundColor: p.paid ? t.red : 'transparent' },
                ]}>
                {p.paid && <Icon name="check" size={16} color={t.onRed} strokeWidth={2.6} />}
                <Txt variant="caption" color={p.paid ? t.onRed : t.ink2}>
                  {p.paid ? 'Payé' : 'Pas encore'}
                </Txt>
              </Pressable>
            )}
          </Row>
        );
      })}
      {tracksPayment && editable && unpaid.length > 0 && (
        <Button title={`Relancer ${unpaid.length === 1 ? unpaid[0].name!.split(' ')[0] : `${unpaid.length} joueurs`}`} icon="share" kind="ghost" small onPress={remind} />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minWidth: 0, height: 40, borderRadius: radius.field, borderWidth: 1, paddingHorizontal: 12, fontSize: 15 },
  paid: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 10, borderRadius: radius.pill, borderWidth: 1 },
});

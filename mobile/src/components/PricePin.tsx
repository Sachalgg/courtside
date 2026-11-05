import { StyleSheet, Text, View } from 'react-native';

import { eur } from '@/lib/availability';
import { useTheme } from '@/theme';

/** Price bubble used as a map marker on every platform. */
export function PricePin({ price, selected }: { price: number; selected: boolean }) {
  const t = useTheme();
  const bg = selected ? t.red : t.card;
  const fg = selected ? t.onRed : t.ink;
  return (
    <View style={styles.wrap} collapsable={false}>
      <View style={[styles.bubble, { backgroundColor: bg, borderColor: selected ? t.red : t.line }]}>
        <Text style={[styles.text, { color: fg }]}>{Number.isFinite(price) ? eur(price) : '—'}</Text>
      </View>
      <View style={[styles.tip, { borderTopColor: selected ? t.red : t.card }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  bubble: {
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  text: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  tip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});

import { ReactNode } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';

import { radius, useTheme } from '@/theme';

import { Icon, IconName } from './Icon';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'mono';

const variants = StyleSheet.create({
  display: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  heading: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  body: { fontSize: 15, fontWeight: '500' },
  label: { fontSize: 14, fontWeight: '700' },
  caption: { fontSize: 12.5, fontWeight: '600' },
  mono: { fontSize: 15, fontWeight: '800', letterSpacing: 1.5, fontVariant: ['tabular-nums'] },
});

export function Txt({
  variant = 'body',
  muted,
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; muted?: boolean; color?: string }) {
  const t = useTheme();
  return <Text {...rest} style={[variants[variant], { color: color ?? (muted ? t.ink2 : t.ink) }, style]} />;
}

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  kind?: 'primary' | 'secondary' | 'ghost';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
};

export function Button({ title, kind = 'primary', icon, style, small, disabled, ...rest }: ButtonProps) {
  const t = useTheme();
  const bg = kind === 'primary' ? t.red : kind === 'secondary' ? t.card : 'transparent';
  const fg = kind === 'primary' ? t.onRed : kind === 'secondary' ? t.ink : t.red;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, borderColor: kind === 'secondary' ? t.line : 'transparent' },
        disabled && { opacity: 0.4 },
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
        style,
      ]}>
      {icon && <Icon name={icon} size={small ? 17 : 19} color={fg} />}
      <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  icon,
  onPress,
}: {
  label: string;
  active?: boolean;
  icon?: IconName;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: active ? t.ink : t.card, borderColor: active ? t.ink : t.line },
        pressed && { opacity: 0.75 },
      ]}>
      {icon && <Icon name={icon} size={16} color={active ? t.bg : t.ink} />}
      <Text style={[variants.label, { color: active ? t.bg : t.ink, fontSize: 13.5 }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.card, borderColor: t.line }, style]}>{children}</View>;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: t.line2 }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && { backgroundColor: t.card, shadowOpacity: 0.08 }]}>
            {o.icon && <Icon name={o.icon} size={16} color={active ? t.red : t.ink2} />}
            <Text style={[variants.label, { color: active ? t.ink : t.ink2, fontSize: 13.5 }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Avatar({ name, size = 44, red }: { name: string; size?: number; red?: boolean }) {
  const t = useTheme();
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: red ? t.red : t.ink,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: red ? t.onRed : t.bg, fontWeight: '800', fontSize: size * 0.36 }}>{initials || '?'}</Text>
    </View>
  );
}

export function Field({ label, error, ...rest }: TextInputProps & { label: string; error?: string | null }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="caption" muted>
        {label}
      </Txt>
      <TextInput
        placeholderTextColor={t.ink3}
        {...rest}
        style={[
          styles.field,
          { backgroundColor: t.card, color: t.ink, borderColor: error ? t.red : t.line },
        ]}
      />
      {error ? (
        <Txt variant="caption" color={t.red}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: t.redWash }]}>
        <Icon name={icon} size={28} color={t.red} />
      </View>
      <Txt variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </Txt>
      <Txt muted style={{ textAlign: 'center', maxWidth: 280 }}>
        {body}
      </Txt>
      {action}
    </View>
  );
}

export function Row({ children, style, gap = 8 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.line, marginVertical: 4 }} />;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  buttonSmall: { minHeight: 40, paddingHorizontal: 16 },
  buttonText: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  card: { borderRadius: radius.card, borderWidth: 1, padding: 16 },
  segmented: { flexDirection: 'row', borderRadius: radius.pill, padding: 4 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    shadowOpacity: 0,
  },
  field: { height: 52, borderRadius: radius.field, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});

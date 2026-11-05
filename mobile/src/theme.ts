import { useColorScheme } from 'react-native';

// Same identity as the Courtside web prototype: black carries hierarchy, white gives
// space, red is kept for actions and the active state. No other hue.

export const palettes = {
  light: {
    bg: '#f6f6f7',
    card: '#ffffff',
    ink: '#0a0a0b',
    ink2: '#6b6b72',
    ink3: '#a1a1a8',
    line: '#e9e9ec',
    line2: '#f1f1f3',
    red: '#ee1c34',
    redDeep: '#c00f24',
    redWash: '#fdecee',
    onRed: '#ffffff',
    hero: '#0a0a0b',
    onHero: '#ffffff',
    mapLand: '#eeeef0',
    mapWater: '#dcdce2',
  },
  dark: {
    bg: '#08080a',
    card: '#141416',
    ink: '#f6f6f8',
    ink2: '#9b9ba3',
    ink3: '#6a6a73',
    line: '#26262b',
    line2: '#1c1c20',
    red: '#ff3b52',
    redDeep: '#ff5c70',
    redWash: '#2a0f14',
    onRed: '#ffffff',
    hero: '#f6f6f8',
    onHero: '#0a0a0b',
    mapLand: '#18181b',
    mapWater: '#26262b',
  },
};

export type Palette = typeof palettes.light;

export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? palettes.dark : palettes.light;
}

export const radius = { hero: 30, card: 22, field: 16, pill: 999 };
export const space = (n: number) => n * 4;

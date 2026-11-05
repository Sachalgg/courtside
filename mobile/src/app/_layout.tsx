import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LocationProvider } from '@/state/location';
import { StoreProvider, useStore } from '@/state/store';
import { palettes } from '@/theme';

function Gate() {
  const { ready } = useStore();
  const scheme = useColorScheme();
  const t = scheme === 'dark' ? palettes.dark : palettes.light;
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.red} />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="club/[id]" />
      <Stack.Screen name="book" />
      <Stack.Screen name="match/[id]" />
      <Stack.Screen name="booking/[id]" />
      <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const t = scheme === 'dark' ? palettes.dark : palettes.light;
  return (
    <SafeAreaProvider>
      <ThemeProvider value={{ ...base, colors: { ...base.colors, primary: t.red, background: t.bg, card: t.card, text: t.ink, border: t.line } }}>
        <StoreProvider>
          <LocationProvider>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <Gate />
          </LocationProvider>
        </StoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

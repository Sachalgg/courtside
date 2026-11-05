import { Tabs } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { isUpcoming } from '@/lib/availability';
import { useNow, useStore } from '@/state/store';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { bookings } = useStore();
  const now = useNow();
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && isUpcoming(b, now)).length;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.red,
        tabBarInactiveTintColor: t.ink3,
        tabBarStyle: {
          backgroundColor: t.card,
          borderTopColor: t.line,
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11, lineHeight: 14, flexShrink: 0 },
        tabBarItemStyle: { paddingVertical: 0 },
        sceneStyle: { backgroundColor: t.bg },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Explorer', tabBarIcon: ({ color }) => <Icon name="map" color={color} /> }}
      />
      <Tabs.Screen
        name="play"
        options={{ title: 'Jouer', tabBarIcon: ({ color }) => <Icon name="ball" color={color} /> }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Réservations',
          tabBarIcon: ({ color }) => <Icon name="calendar" color={color} />,
          tabBarBadge: upcoming || undefined,
          tabBarBadgeStyle: { backgroundColor: t.red, color: t.onRed, fontWeight: '800' },
        }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Compte', tabBarIcon: ({ color }) => <Icon name="user" color={color} /> }}
      />
    </Tabs>
  );
}

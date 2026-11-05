import * as Location from 'expo-location';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { BRUSSELS_CENTER } from '@/lib/clubs';
import type { LatLng } from '@/lib/geo';

type LocationState = {
  /** The device position once shared, otherwise null. */
  located: LatLng | null;
  /** Position used for distances: the device position, or the Grand-Place. */
  origin: LatLng;
  status: 'idle' | 'asking' | 'granted' | 'denied' | 'error';
  request: () => Promise<void>;
};

const Ctx = createContext<LocationState | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [located, setLocated] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<LocationState['status']>('idle');

  const request = useCallback(async () => {
    setStatus('asking');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setStatus('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocated({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setStatus('granted');
    } catch {
      setStatus('error');
    }
  }, []);

  const value = useMemo(
    () => ({ located, origin: located ?? BRUSSELS_CENTER, status, request }),
    [located, status, request],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocation(): LocationState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLocation must be used inside LocationProvider');
  return ctx;
}

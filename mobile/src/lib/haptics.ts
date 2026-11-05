import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const on = Platform.OS !== 'web';

export const tap = () => {
  if (on) Haptics.selectionAsync().catch(() => {});
};

export const success = () => {
  if (on) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

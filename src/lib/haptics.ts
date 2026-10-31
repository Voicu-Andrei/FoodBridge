import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

export const haptics = {
  /** Light tick for chips, toggles and selections. */
  select: () => {
    if (enabled) Haptics.selectionAsync();
  },
  /** Soft bump when pressing cards and buttons. */
  tap: () => {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  success: () => {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
};

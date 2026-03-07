import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Provides platform-safe haptic feedback methods.
 * On web, all methods are no-ops.
 */
export function useHaptics() {
  const selection = useCallback(async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
  }, []);

  const impact = useCallback(async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(style);
    }
  }, []);

  const notification = useCallback(async (type: Haptics.NotificationFeedbackType) => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(type);
    }
  }, []);

  return { selection, impact, notification };
}

// Re-export feedback types for convenience
export { NotificationFeedbackType, ImpactFeedbackStyle } from 'expo-haptics';

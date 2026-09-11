/**
 * Notifications store for managing push notification settings
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationsState {
  // Push token
  expoPushToken: string | null;

  // Device registration status
  isRegistered: boolean;
  registeredAt: number | null;

  // Notification preferences
  enabled: boolean;

  // Actions
  setExpoPushToken: (token: string | null) => void;
  setRegistered: (registered: boolean) => void;
  setEnabled: (enabled: boolean) => void;
  clearRegistration: () => void;
}

const notificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      expoPushToken: null,
      isRegistered: false,
      registeredAt: null,
      enabled: true,

      setExpoPushToken: (token: string | null) => {
        set({
          expoPushToken: token,
          isRegistered: !!token,
          registeredAt: token ? Date.now() : null,
        });
      },

      setRegistered: (registered: boolean) => {
        set({ isRegistered: registered });
      },

      setEnabled: (enabled: boolean) => {
        set({ enabled });
      },

      clearRegistration: () => {
        set({
          expoPushToken: null,
          isRegistered: false,
          registeredAt: null,
        });
      },
    }),
    {
      name: 'weathrs-notifications',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        expoPushToken: state.expoPushToken,
        isRegistered: state.isRegistered,
        registeredAt: state.registeredAt,
        enabled: state.enabled,
      }),
    }
  )
);

// Main hook for backwards compatibility and actions
export const useNotificationsStore = notificationsStore;

// Atomic selectors for optimized re-renders
export const useExpoPushToken = () => notificationsStore((s) => s.expoPushToken);
export const useIsNotificationsRegistered = () => notificationsStore((s) => s.isRegistered);
export const useNotificationsEnabled = () => notificationsStore((s) => s.enabled);

// Action selectors (stable references)
export const useNotificationsActions = () => notificationsStore((s) => ({
  setExpoPushToken: s.setExpoPushToken,
  setRegistered: s.setRegistered,
  setEnabled: s.setEnabled,
  clearRegistration: s.clearRegistration,
}));

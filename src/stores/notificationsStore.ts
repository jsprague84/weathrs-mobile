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
  dailyForecastEnabled: boolean;
  alertsEnabled: boolean;

  // Actions
  setExpoPushToken: (token: string | null) => void;
  setRegistered: (registered: boolean) => void;
  setEnabled: (enabled: boolean) => void;
  setDailyForecastEnabled: (enabled: boolean) => void;
  setAlertsEnabled: (enabled: boolean) => void;
  clearRegistration: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      expoPushToken: null,
      isRegistered: false,
      registeredAt: null,
      enabled: true,
      dailyForecastEnabled: true,
      alertsEnabled: true,

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

      setDailyForecastEnabled: (enabled: boolean) => {
        set({ dailyForecastEnabled: enabled });
      },

      setAlertsEnabled: (enabled: boolean) => {
        set({ alertsEnabled: enabled });
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
        dailyForecastEnabled: state.dailyForecastEnabled,
        alertsEnabled: state.alertsEnabled,
      }),
    }
  )
);

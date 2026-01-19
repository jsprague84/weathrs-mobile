/**
 * Settings store using Zustand with AsyncStorage persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Units } from '@/types';
import api from '@/services/api';

interface SettingsState {
  // API Configuration
  apiUrl: string;
  setApiUrl: (url: string) => void;

  // Weather preferences
  defaultCity: string;
  setDefaultCity: (city: string) => void;

  units: Units;
  setUnits: (units: Units) => void;

  // Initialization
  isHydrated: boolean;
  initialize: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // API Configuration
      apiUrl: 'https://weathrs.js-node.cc',
      setApiUrl: (url: string) => {
        api.setBaseUrl(url);
        set({ apiUrl: url });
      },

      // Weather preferences
      defaultCity: '',
      setDefaultCity: (city: string) => set({ defaultCity: city }),

      units: 'imperial',
      setUnits: (units: Units) => set({ units }),

      // Initialization
      isHydrated: false,
      initialize: () => {
        const { apiUrl, isHydrated } = get();
        if (!isHydrated) {
          api.setBaseUrl(apiUrl);
          set({ isHydrated: true });
        }
      },
    }),
    {
      name: 'weathrs-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        apiUrl: state.apiUrl,
        defaultCity: state.defaultCity,
        units: state.units,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          api.setBaseUrl(state.apiUrl);
          state.isHydrated = true;
        }
      },
    }
  )
);

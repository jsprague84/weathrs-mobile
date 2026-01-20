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

const settingsStore = create<SettingsState>()(
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

// Main hook for backwards compatibility and actions
export const useSettingsStore = settingsStore;

// Atomic selectors for optimized re-renders
export const useApiUrl = () => settingsStore((s) => s.apiUrl);
export const useDefaultCity = () => settingsStore((s) => s.defaultCity);
export const useUnits = () => settingsStore((s) => s.units);
export const useIsHydrated = () => settingsStore((s) => s.isHydrated);

// Action selectors (stable references)
export const useSettingsActions = () => settingsStore((s) => ({
  setApiUrl: s.setApiUrl,
  setDefaultCity: s.setDefaultCity,
  setUnits: s.setUnits,
  initialize: s.initialize,
}));

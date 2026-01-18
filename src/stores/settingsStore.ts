/**
 * Settings store using Zustand with persistence
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

  // App preferences
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Initialization
  isInitialized: boolean;
  initialize: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // API Configuration
      apiUrl: 'http://localhost:3000',
      setApiUrl: (url: string) => {
        api.setBaseUrl(url);
        set({ apiUrl: url });
      },

      // Weather preferences
      defaultCity: '',
      setDefaultCity: (city: string) => set({ defaultCity: city }),

      units: 'imperial',
      setUnits: (units: Units) => set({ units }),

      // App preferences
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      // Initialization
      isInitialized: false,
      initialize: () => {
        const { apiUrl } = get();
        api.setBaseUrl(apiUrl);
        set({ isInitialized: true });
      },
    }),
    {
      name: 'weathrs-settings',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // After rehydration, update the API client
        if (state) {
          api.setBaseUrl(state.apiUrl);
          state.isInitialized = true;
        }
      },
    }
  )
);

/**
 * Settings store using Zustand (without persistence for now)
 */

import { create } from 'zustand';
import type { Units } from '@/types';
import api from '@/services/api';

interface SettingsState {
  apiUrl: string;
  setApiUrl: (url: string) => void;
  defaultCity: string;
  setDefaultCity: (city: string) => void;
  units: Units;
  setUnits: (units: Units) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  apiUrl: 'http://localhost:3000',
  setApiUrl: (url: string) => {
    api.setBaseUrl(url);
    set({ apiUrl: url });
  },
  defaultCity: '',
  setDefaultCity: (city: string) => set({ defaultCity: city }),
  units: 'imperial',
  setUnits: (units: Units) => set({ units }),
}));

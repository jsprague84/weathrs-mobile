/**
 * Cities store for managing saved locations
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedCity {
  id: string;
  name: string;
  displayName?: string; // Optional custom display name
  addedAt: number;
}

interface CitiesState {
  // Saved cities
  cities: SavedCity[];
  selectedCityId: string | null;

  // Actions
  addCity: (name: string, displayName?: string) => void;
  removeCity: (id: string) => void;
  selectCity: (id: string) => void;
  updateCityDisplayName: (id: string, displayName: string) => void;
  reorderCities: (cities: SavedCity[]) => void;

  // Computed
  getSelectedCity: () => SavedCity | null;
  getCityById: (id: string) => SavedCity | undefined;
}

function generateId(): string {
  return `city_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const citiesStore = create<CitiesState>()(
  persist(
    (set, get) => ({
      cities: [],
      selectedCityId: null,

      addCity: (name: string, displayName?: string) => {
        const newCity: SavedCity = {
          id: generateId(),
          name: name.trim(),
          displayName: displayName?.trim() || undefined,
          addedAt: Date.now(),
        };

        set((state) => {
          // Check if city already exists
          const exists = state.cities.some(
            (c) => c.name.toLowerCase() === name.trim().toLowerCase()
          );
          if (exists) return state;

          const updatedCities = [...state.cities, newCity];
          return {
            cities: updatedCities,
            // Auto-select if it's the first city
            selectedCityId: state.selectedCityId || newCity.id,
          };
        });
      },

      removeCity: (id: string) => {
        set((state) => {
          const updatedCities = state.cities.filter((c) => c.id !== id);
          let newSelectedId = state.selectedCityId;

          // If we removed the selected city, select the first remaining city
          if (state.selectedCityId === id) {
            newSelectedId = updatedCities.length > 0 ? updatedCities[0].id : null;
          }

          return {
            cities: updatedCities,
            selectedCityId: newSelectedId,
          };
        });
      },

      selectCity: (id: string) => {
        set({ selectedCityId: id });
      },

      updateCityDisplayName: (id: string, displayName: string) => {
        set((state) => ({
          cities: state.cities.map((c) =>
            c.id === id ? { ...c, displayName: displayName.trim() || undefined } : c
          ),
        }));
      },

      reorderCities: (cities: SavedCity[]) => {
        set({ cities });
      },

      getSelectedCity: () => {
        const { cities, selectedCityId } = get();
        return cities.find((c) => c.id === selectedCityId) || null;
      },

      getCityById: (id: string) => {
        return get().cities.find((c) => c.id === id);
      },
    }),
    {
      name: 'weathrs-cities',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cities: state.cities,
        selectedCityId: state.selectedCityId,
      }),
    }
  )
);

// Main hook for backwards compatibility and actions
export const useCitiesStore = citiesStore;

// Atomic selectors for optimized re-renders
export const useCities = () => citiesStore((s) => s.cities);
export const useSelectedCityId = () => citiesStore((s) => s.selectedCityId);
export const useSelectedCity = () => citiesStore((s) => s.getSelectedCity());

// Action selectors (stable references)
export const useCitiesActions = () => citiesStore((s) => ({
  addCity: s.addCity,
  removeCity: s.removeCity,
  selectCity: s.selectCity,
  updateCityDisplayName: s.updateCityDisplayName,
  reorderCities: s.reorderCities,
  getCityById: s.getCityById,
}));

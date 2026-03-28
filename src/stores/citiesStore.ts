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
  lat: number;
  lon: number;
  country: string;
  state?: string;
  addedAt: number;
}

interface CitiesState {
  // Saved cities
  cities: SavedCity[];
  selectedCityId: string | null;

  // Actions
  addCity: (location: { name: string; lat: number; lon: number; country: string; state?: string }, displayName?: string) => void;
  removeCity: (id: string) => void;
  selectCity: (id: string) => void;
  updateCityDisplayName: (id: string, displayName: string) => void;
  reorderCities: (cities: SavedCity[]) => void;
  migrateCity: (id: string, location: { lat: number; lon: number; country: string; state?: string; name: string }) => void;

  // Computed
  getSelectedCity: () => SavedCity | null;
  getCityById: (id: string) => SavedCity | undefined;
  needsMigration: () => boolean;
}

function generateId(): string {
  return `city_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const citiesStore = create<CitiesState>()(
  persist(
    (set, get) => ({
      cities: [],
      selectedCityId: null,

      addCity: (location, displayName) => {
        const newCity: SavedCity = {
          id: generateId(),
          name: location.name,
          displayName: displayName?.trim() || undefined,
          lat: location.lat,
          lon: location.lon,
          country: location.country,
          state: location.state,
          addedAt: Date.now(),
        };

        set((state) => {
          // Check for duplicate by coordinates
          const exists = state.cities.some(
            (c) => c.lat === location.lat && c.lon === location.lon
          );
          if (exists) return state;

          const updatedCities = [...state.cities, newCity];
          return {
            cities: updatedCities,
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

      migrateCity: (id: string, location: { lat: number; lon: number; country: string; state?: string; name: string }) => {
        set((state) => {
          // Check if another city already has these coordinates
          const duplicate = state.cities.find(
            (c) => c.id !== id && c.lat === location.lat && c.lon === location.lon
          );

          if (duplicate) {
            // Remove the current city and select the duplicate if needed
            const updatedCities = state.cities.filter((c) => c.id !== id);
            return {
              cities: updatedCities,
              selectedCityId: state.selectedCityId === id ? duplicate.id : state.selectedCityId,
            };
          }

          // Update the city with coordinates
          return {
            cities: state.cities.map((c) =>
              c.id === id
                ? { ...c, lat: location.lat, lon: location.lon, country: location.country, state: location.state, name: location.name }
                : c
            ),
          };
        });
      },

      needsMigration: () => {
        return get().cities.some((c) => (c as any).lat === undefined || (c as any).lon === undefined);
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
  migrateCity: s.migrateCity,
}));

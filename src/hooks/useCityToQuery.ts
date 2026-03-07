import { useSettingsStore } from '@/stores/settingsStore';
import { useCitiesStore } from '@/stores/citiesStore';

interface CityToQueryResult {
  /** City name for API queries */
  cityToQuery: string;
  /** Display name for the UI (displayName if set, otherwise cityToQuery) */
  cityDisplayName: string;
}

/**
 * Returns the city to use for API queries and display.
 * Prefers the selected city from the cities store, falls back to the default city from settings.
 */
export function useCityToQuery(): string;
export function useCityToQuery(options: { withDisplay: true }): CityToQueryResult;
export function useCityToQuery(options?: { withDisplay: true }): string | CityToQueryResult {
  const { defaultCity } = useSettingsStore();
  const selectedCity = useCitiesStore((s) => s.getSelectedCity());
  const cityToQuery = selectedCity?.name || defaultCity;

  if (options?.withDisplay) {
    return {
      cityToQuery,
      cityDisplayName: selectedCity?.displayName || cityToQuery,
    };
  }

  return cityToQuery;
}

import { useSettingsStore } from '@/stores/settingsStore';
import { useCitiesStore } from '@/stores/citiesStore';

interface CityQueryResult {
  cityToQuery: string;
  cityDisplayName: string;
  lat: number | null;
  lon: number | null;
}

export function useCityToQuery(): string;
export function useCityToQuery(options: { withDisplay: true }): CityQueryResult;
export function useCityToQuery(options?: { withDisplay: true }): string | CityQueryResult {
  const { defaultCity } = useSettingsStore();
  const selectedCity = useCitiesStore((s) => s.getSelectedCity());
  const cityToQuery = selectedCity?.name || defaultCity;

  if (options?.withDisplay) {
    return {
      cityToQuery,
      cityDisplayName: selectedCity?.displayName || cityToQuery,
      lat: selectedCity?.lat ?? null,
      lon: selectedCity?.lon ?? null,
    };
  }

  return cityToQuery;
}

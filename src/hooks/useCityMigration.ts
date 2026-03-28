import { useEffect, useRef } from 'react';
import { useCitiesStore } from '@/stores/citiesStore';
import { resolveLocation } from '@/services/location';

/**
 * One-time migration hook: resolves saved cities that lack coordinates.
 * Runs on first launch after the update that adds coordinate fields.
 */
export function useCityMigration() {
  const hasRun = useRef(false);
  const cities = useCitiesStore((s) => s.cities);
  const migrateCity = useCitiesStore((s) => s.migrateCity);

  useEffect(() => {
    if (hasRun.current) return;

    const citiesToMigrate = cities.filter(
      (c) => (c as any).lat === undefined || (c as any).lon === undefined
    );

    if (citiesToMigrate.length === 0) return;

    hasRun.current = true;

    (async () => {
      for (const city of citiesToMigrate) {
        try {
          const resolved = await resolveLocation(city.name);
          migrateCity(city.id, {
            name: resolved.name,
            lat: resolved.lat,
            lon: resolved.lon,
            country: resolved.country,
            state: resolved.state ?? undefined,
          });
        } catch (error) {
          console.warn(`Failed to migrate city "${city.name}":`, error);
        }
      }
    })();
  }, [cities, migrateCity]);
}

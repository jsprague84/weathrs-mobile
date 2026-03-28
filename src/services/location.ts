import api from './api';
import type { GeocodedLocation } from '@/types';

/**
 * Round a coordinate to 2 decimal places for canonical keying.
 */
export function roundCoord(val: number): number {
  return Math.round(val * 100) / 100;
}

/**
 * Generate a location_key from coordinates.
 */
export function makeLocationKey(lat: number, lon: number): string {
  return `${roundCoord(lat).toFixed(2)},${roundCoord(lon).toFixed(2)}`;
}

/**
 * Resolve any location input (city name, ZIP code, or "lat,lon" string)
 * to a canonical GeocodedLocation with rounded coordinates.
 */
export async function resolveLocation(input: string): Promise<GeocodedLocation> {
  const result = await api.geocode(input);
  return {
    ...result,
    lat: roundCoord(result.lat),
    lon: roundCoord(result.lon),
    location_key: makeLocationKey(result.lat, result.lon),
  };
}

/**
 * Resolve GPS coordinates to a canonical GeocodedLocation.
 * Sends coordinates as "lat,lon" string to the geocode endpoint.
 */
export async function resolveCoordinates(
  lat: number,
  lon: number,
): Promise<GeocodedLocation> {
  return resolveLocation(`${lat},${lon}`);
}

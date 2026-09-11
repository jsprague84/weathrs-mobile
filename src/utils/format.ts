/**
 * Shared display formatting helpers.
 */
import type { Units } from '@/types';

export function getTemperatureUnit(units: Units): string {
  switch (units) {
    case 'imperial':
      return '°F';
    case 'metric':
      return '°C';
    default:
      return 'K';
  }
}

export function formatTemperature(value: number, units: Units): string {
  return Math.round(value) + getTemperatureUnit(units);
}

export function getWindSpeedUnit(units: Units): string {
  return units === 'imperial' ? 'mph' : 'm/s';
}

export function formatWindSpeed(value: number, units: Units): string {
  return Math.round(value) + ' ' + getWindSpeedUnit(units);
}

/** Precipitation totals from the API are millimeters; render to one decimal. */
export function formatPrecipitation(millimeters: number): string {
  return Math.round(millimeters * 10) / 10 + 'mm';
}

/** Format a YYYY-MM-DD date string as e.g. Mar 5. */
export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

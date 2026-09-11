import {
  getTemperatureUnit,
  formatTemperature,
  getWindSpeedUnit,
  formatWindSpeed,
  formatPrecipitation,
  formatShortDate,
} from '@/utils/format';

describe('format helpers', () => {
  it('maps measurement systems to temperature units', () => {
    expect(getTemperatureUnit('imperial')).toBe('°F');
    expect(getTemperatureUnit('metric')).toBe('°C');
    expect(getTemperatureUnit('standard')).toBe('K');
  });

  it('rounds temperatures before appending the unit', () => {
    expect(formatTemperature(72.6, 'imperial')).toBe('73°F');
    expect(formatTemperature(-0.4, 'metric')).toBe('0°C');
  });

  it('maps measurement systems to wind speed units', () => {
    expect(getWindSpeedUnit('imperial')).toBe('mph');
    expect(getWindSpeedUnit('metric')).toBe('m/s');
    expect(getWindSpeedUnit('standard')).toBe('m/s');
  });

  it('formats wind speed', () => {
    expect(formatWindSpeed(12.4, 'imperial')).toBe('12 mph');
  });

  it('formats precipitation to one decimal in millimetres', () => {
    expect(formatPrecipitation(3.14159)).toBe('3.1mm');
    expect(formatPrecipitation(0)).toBe('0mm');
  });

  it('formats an ISO date as a short label', () => {
    expect(formatShortDate('2024-03-05')).toBe('Mar 5');
  });
});

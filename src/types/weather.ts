/**
 * Weather data types matching the weathrs API responses
 */

export interface CurrentWeather {
  city: string;
  country: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  description: string;
  icon: string;
  visibility?: number;
  units?: Units;
}

export interface DailyForecast {
  timestamp: number;
  sunrise: number;
  sunset: number;
  moon_phase: number;
  summary: string;
  temp_min: number;
  temp_max: number;
  temp_day: number;
  temp_night: number;
  temp_morning: number;
  temp_evening: number;
  feels_like_day: number;
  feels_like_night: number;
  humidity: number;
  pressure: number;
  uv_index: number;
  clouds: number;
  wind_speed: number;
  wind_direction: number;
  precipitation_probability: number;
  rain_volume?: number;
  snow_volume?: number;
  description: string;
  icon: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  pop: number;
}

export interface Forecast {
  city: string;
  country: string;
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  units: Units;
}

export interface WeatherAlert {
  event: string;
  sender: string;
  start: string;
  end: string;
  description: string;
}

export type Units = 'metric' | 'imperial' | 'standard';

export interface SchedulerJob {
  id: string;
  name: string;
  city: string;
  units: Units;
  cron: string;
  enabled: boolean;
  include_daily: boolean;
  include_hourly: boolean;
}

export interface SchedulerStatus {
  running: boolean;
  job_count: number;
}

export interface TriggerResponse {
  status: 'success' | 'error';
  message: string;
}

// API Error response
export interface ApiError {
  error: string;
  message: string;
}

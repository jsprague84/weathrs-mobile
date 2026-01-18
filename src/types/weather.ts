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
  units: Units;
}

export interface DailyForecast {
  date: string;
  temperature: {
    min: number;
    max: number;
    day: number;
    night: number;
  };
  feels_like: {
    day: number;
    night: number;
  };
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  pop: number; // Probability of precipitation
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

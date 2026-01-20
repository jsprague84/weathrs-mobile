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
  // Extended fields from /forecast endpoint
  timestamp?: number;
  uv_index?: number;
  clouds?: number;
  wind_direction?: number;
  sunrise?: number;
  sunset?: number;
}

// Full current weather from /forecast endpoint
export interface FullCurrentWeather {
  timestamp: number;
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  uv_index: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_direction: number;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
}

// Full forecast response from /forecast endpoint
export interface FullForecast {
  location: {
    city: string;
    country: string;
    lat: number;
    lon: number;
  };
  timezone: string;
  current: FullCurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
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
  timestamp: number;
  temperature: number;
  feels_like: number;
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

// Device registration for push notifications
export interface DeviceRegistration {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
  appVersion?: string;
  cities?: string[];
  units?: Units;
  enabled?: boolean;
}

export interface DeviceRegistrationResponse {
  success: boolean;
  deviceId?: string;
  message?: string;
}

// Scheduler job types
export interface NotifyConfig {
  onRun: boolean;
  onAlert: boolean;
  onPrecipitation: boolean;
  coldThreshold?: number;
  heatThreshold?: number;
}

export interface SchedulerJob {
  id: string;
  name: string;
  city: string;
  units: Units;
  cron: string;
  /** IANA timezone (e.g., "America/Chicago"). Defaults to UTC if not specified. */
  timezone: string;
  includeDaily: boolean;
  includeHourly: boolean;
  enabled: boolean;
  notify: NotifyConfig;
}

export interface CreateJobRequest {
  name: string;
  city: string;
  units?: Units;
  cron: string;
  /** IANA timezone (e.g., "America/Chicago"). Defaults to UTC if not specified. */
  timezone?: string;
  includeDaily?: boolean;
  includeHourly?: boolean;
  enabled?: boolean;
  notify?: Partial<NotifyConfig>;
}

export interface UpdateJobRequest {
  name?: string;
  city?: string;
  units?: Units;
  cron?: string;
  /** IANA timezone (e.g., "America/Chicago") */
  timezone?: string;
  includeDaily?: boolean;
  includeHourly?: boolean;
  enabled?: boolean;
  notify?: Partial<NotifyConfig>;
}

export interface JobResponse {
  success: boolean;
  job?: SchedulerJob;
  message?: string;
}

export interface JobListResponse {
  jobs: SchedulerJob[];
  count: number;
}

/**
 * API client for the weathrs backend
 */

import type {
  CurrentWeather,
  Forecast,
  FullForecast,
  DailyForecast,
  HourlyForecast,
  SchedulerJob,
  SchedulerStatus,
  TriggerResponse,
  Units,
  DeviceRegistration,
  DeviceRegistrationResponse,
  CreateJobRequest,
  UpdateJobRequest,
  JobResponse,
  JobListResponse,
  HistoryResponse,
  DailyHistoryResponse,
  TrendResponse,
  HistoryPeriod,
} from '@/types';

/** Per-endpoint timeout presets (ms) */
const TIMEOUT = {
  FAST: 10_000,      // Weather, health
  STANDARD: 15_000,  // Default
  FORECAST: 20_000,  // Forecast endpoints
  HEAVY: 30_000,     // History, trends
} as const;

class WeathrsApi {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  /**
   * Set the API key for device endpoints that require authentication
   */
  setApiKey(key: string | null) {
    this.apiKey = key;
  }

  private async request<T>(endpoint: string, options?: RequestInit & { useApiKey?: boolean; timeout?: number }): Promise<T> {
    // API v1 routes are prefixed with /api/v1
    const isApiV1 = !endpoint.startsWith('/health') && endpoint !== '/';
    const url = `${this.baseUrl}${isApiV1 ? '/api/v1' : ''}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    // Add API key for device endpoints if configured
    if (options?.useApiKey && this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const controller = new AbortController();
    const timeoutMs = options?.timeout ?? TIMEOUT.STANDARD;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `API Error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Health check
  async health(): Promise<{ status: string }> {
    return this.request('/health', { timeout: TIMEOUT.FAST });
  }

  // Current weather
  async getCurrentWeather(city?: string, units?: Units): Promise<CurrentWeather> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (units) params.append('units', units);
    const query = params.toString();
    return this.request(`/weather${query ? `?${query}` : ''}`, { timeout: TIMEOUT.FAST });
  }

  async getCurrentWeatherByCity(city: string): Promise<CurrentWeather> {
    return this.request(`/weather/${encodeURIComponent(city)}`, { timeout: TIMEOUT.FAST });
  }

  // Full forecast (includes current, hourly, daily)
  async getFullForecast(city?: string, units?: Units): Promise<FullForecast> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (units) params.append('units', units);
    const query = params.toString();
    return this.request(`/forecast${query ? `?${query}` : ''}`, { timeout: TIMEOUT.FORECAST });
  }

  async getFullForecastByCity(city: string): Promise<FullForecast> {
    return this.request(`/forecast/${encodeURIComponent(city)}`, { timeout: TIMEOUT.FORECAST });
  }

  async getDailyForecast(city?: string, units?: Units): Promise<{ daily: DailyForecast[] }> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (units) params.append('units', units);
    const query = params.toString();
    return this.request(`/forecast/daily${query ? `?${query}` : ''}`, { timeout: TIMEOUT.FORECAST });
  }

  async getDailyForecastByCity(city: string): Promise<{ daily: DailyForecast[] }> {
    return this.request(`/forecast/daily/${encodeURIComponent(city)}`, { timeout: TIMEOUT.FORECAST });
  }

  async getHourlyForecast(city?: string, units?: Units): Promise<{ hourly: HourlyForecast[] }> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (units) params.append('units', units);
    const query = params.toString();
    return this.request(`/forecast/hourly${query ? `?${query}` : ''}`, { timeout: TIMEOUT.FORECAST });
  }

  async getHourlyForecastByCity(city: string): Promise<{ hourly: HourlyForecast[] }> {
    return this.request(`/forecast/hourly/${encodeURIComponent(city)}`, { timeout: TIMEOUT.FORECAST });
  }

  // Scheduler
  async getSchedulerStatus(): Promise<SchedulerStatus> {
    return this.request('/scheduler/status', { timeout: TIMEOUT.FAST });
  }

  async getSchedulerJobs(): Promise<JobListResponse> {
    return this.request('/scheduler/jobs');
  }

  async getSchedulerJob(id: string): Promise<JobResponse> {
    return this.request(`/scheduler/jobs/${encodeURIComponent(id)}`);
  }

  async createSchedulerJob(job: CreateJobRequest): Promise<JobResponse> {
    return this.request('/scheduler/jobs', {
      method: 'POST',
      body: JSON.stringify(job),
    });
  }

  async updateSchedulerJob(id: string, updates: UpdateJobRequest): Promise<JobResponse> {
    return this.request(`/scheduler/jobs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSchedulerJob(id: string): Promise<JobResponse> {
    return this.request(`/scheduler/jobs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async triggerForecast(city?: string): Promise<TriggerResponse> {
    const endpoint = city
      ? `/scheduler/trigger/${encodeURIComponent(city)}`
      : '/scheduler/trigger';
    return this.request(endpoint, { method: 'POST' });
  }

  // History & Trends
  async getWeatherHistory(city: string, start: number, end: number, units?: Units): Promise<HistoryResponse> {
    const params = new URLSearchParams();
    params.append('start', start.toString());
    params.append('end', end.toString());
    if (units) params.append('units', units);
    return this.request(`/history/${encodeURIComponent(city)}?${params.toString()}`, { timeout: TIMEOUT.HEAVY });
  }

  async getDailyHistory(city: string, start: number, end: number, units?: Units): Promise<DailyHistoryResponse> {
    const params = new URLSearchParams();
    params.append('start', start.toString());
    params.append('end', end.toString());
    if (units) params.append('units', units);
    return this.request(`/history/${encodeURIComponent(city)}/daily?${params.toString()}`, { timeout: TIMEOUT.HEAVY });
  }

  async getWeatherTrends(
    city: string,
    period: HistoryPeriod,
    units?: Units,
    start?: number,
    end?: number,
  ): Promise<TrendResponse> {
    const params = new URLSearchParams();
    if (period === 'custom' && start != null && end != null) {
      params.append('start', start.toString());
      params.append('end', end.toString());
    } else {
      params.append('period', period);
    }
    if (units) params.append('units', units);
    return this.request(`/history/${encodeURIComponent(city)}/trends?${params.toString()}`, { timeout: TIMEOUT.HEAVY });
  }

  // Device registration for push notifications
  async registerDevice(registration: DeviceRegistration): Promise<DeviceRegistrationResponse> {
    return this.request('/devices/register', {
      method: 'POST',
      body: JSON.stringify(registration),
      useApiKey: true,
    });
  }

  async unregisterDevice(token: string): Promise<{ success: boolean }> {
    return this.request('/devices/unregister', {
      method: 'POST',
      body: JSON.stringify({ token }),
      useApiKey: true,
    });
  }

  async updateDeviceSettings(
    token: string,
    settings: { enabled?: boolean; cities?: string[]; units?: Units }
  ): Promise<DeviceRegistrationResponse> {
    return this.request('/devices/settings', {
      method: 'PUT',
      body: JSON.stringify({ token, ...settings }),
      useApiKey: true,
    });
  }

  // Send test notification to device
  async sendTestNotification(token: string): Promise<TriggerResponse> {
    return this.request('/devices/test', {
      method: 'POST',
      body: JSON.stringify({ token }),
      useApiKey: true,
    });
  }
}

// Default instance - URL will be configured from settings
export const api = new WeathrsApi('https://weathrs.js-node.cc');

// Configure API key from environment if available
// Set EXPO_PUBLIC_WEATHRS_API_KEY in .env or EAS build config
const apiKey = process.env.EXPO_PUBLIC_WEATHRS_API_KEY;
if (apiKey) {
  api.setApiKey(apiKey);
}

export default api;

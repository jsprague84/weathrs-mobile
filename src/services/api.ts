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
} from '@/types';

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

  private async request<T>(endpoint: string, options?: RequestInit & { useApiKey?: boolean }): Promise<T> {
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

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // Health check
  async health(): Promise<{ status: string }> {
    return this.request('/health');
  }

  // Current weather
  async getCurrentWeather(city?: string, units?: Units): Promise<CurrentWeather> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (units) params.append('units', units);
    const query = params.toString();
    return this.request(`/weather${query ? `?${query}` : ''}`);
  }

  async getCurrentWeatherByCity(city: string): Promise<CurrentWeather> {
    return this.request(`/weather/${encodeURIComponent(city)}`);
  }

  // Full forecast (includes current, hourly, daily)
  async getFullForecast(city?: string, units?: Units): Promise<FullForecast> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (units) params.append('units', units);
    const query = params.toString();
    return this.request(`/forecast${query ? `?${query}` : ''}`);
  }

  async getFullForecastByCity(city: string): Promise<FullForecast> {
    return this.request(`/forecast/${encodeURIComponent(city)}`);
  }

  async getDailyForecast(city?: string, units?: Units): Promise<{ daily: DailyForecast[] }> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (units) params.append('units', units);
    const query = params.toString();
    return this.request(`/forecast/daily${query ? `?${query}` : ''}`);
  }

  async getDailyForecastByCity(city: string): Promise<{ daily: DailyForecast[] }> {
    return this.request(`/forecast/daily/${encodeURIComponent(city)}`);
  }

  async getHourlyForecast(city?: string, units?: Units): Promise<{ hourly: HourlyForecast[] }> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (units) params.append('units', units);
    const query = params.toString();
    return this.request(`/forecast/hourly${query ? `?${query}` : ''}`);
  }

  async getHourlyForecastByCity(city: string): Promise<{ hourly: HourlyForecast[] }> {
    return this.request(`/forecast/hourly/${encodeURIComponent(city)}`);
  }

  // Scheduler
  async getSchedulerStatus(): Promise<SchedulerStatus> {
    return this.request('/scheduler/status');
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

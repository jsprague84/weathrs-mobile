/**
 * React Query hooks for weather data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Units, HistoryPeriod } from '@/types';

// Query keys
export const weatherKeys = {
  all: ['weather'] as const,
  current: (city?: string) => [...weatherKeys.all, 'current', city] as const,
  forecast: (city?: string) => [...weatherKeys.all, 'forecast', city] as const,
  daily: (city?: string) => [...weatherKeys.all, 'daily', city] as const,
  hourly: (city?: string) => [...weatherKeys.all, 'hourly', city] as const,
  history: (city?: string) => [...weatherKeys.all, 'history', city] as const,
  dailyHistory: (city?: string, period?: string) => [...weatherKeys.all, 'dailyHistory', city, period] as const,
  trends: (city?: string, period?: string) => [...weatherKeys.all, 'trends', city, period] as const,
  scheduler: ['scheduler'] as const,
  schedulerStatus: () => [...weatherKeys.scheduler, 'status'] as const,
  schedulerJobs: () => [...weatherKeys.scheduler, 'jobs'] as const,
};

// Current weather hook
export function useCurrentWeather(city?: string) {
  const { defaultCity, units } = useSettingsStore();
  const queryCity = city || defaultCity;

  return useQuery({
    queryKey: weatherKeys.current(queryCity),
    queryFn: () => api.getCurrentWeather(queryCity || undefined, units),
    enabled: !!queryCity,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });
}

// Full forecast hook
export function useForecast(city?: string) {
  const { defaultCity, units } = useSettingsStore();
  const queryCity = city || defaultCity;

  return useQuery({
    queryKey: weatherKeys.forecast(queryCity),
    queryFn: () => api.getFullForecast(queryCity || undefined, units),
    enabled: !!queryCity,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

// Daily forecast hook
export function useDailyForecast(city?: string) {
  const { defaultCity, units } = useSettingsStore();
  const queryCity = city || defaultCity;

  return useQuery({
    queryKey: weatherKeys.daily(queryCity),
    queryFn: () => api.getDailyForecast(queryCity || undefined, units),
    enabled: !!queryCity,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

// Hourly forecast hook
export function useHourlyForecast(city?: string) {
  const { defaultCity, units } = useSettingsStore();
  const queryCity = city || defaultCity;

  return useQuery({
    queryKey: weatherKeys.hourly(queryCity),
    queryFn: () => api.getHourlyForecast(queryCity || undefined, units),
    enabled: !!queryCity,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

// Weather history hook
export function useWeatherHistory(city?: string, period: HistoryPeriod = '7d') {
  const { defaultCity, units } = useSettingsStore();
  const queryCity = city || defaultCity;
  const now = Math.floor(Date.now() / 1000);
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const start = now - days * 86400;

  return useQuery({
    queryKey: weatherKeys.history(queryCity),
    queryFn: () => api.getWeatherHistory(queryCity!, start, now, units),
    enabled: !!queryCity,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

// Daily history hook
export function useDailyHistory(city?: string, period: HistoryPeriod = '7d') {
  const { defaultCity, units } = useSettingsStore();
  const queryCity = city || defaultCity;
  const now = Math.floor(Date.now() / 1000);
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const start = now - days * 86400;

  return useQuery({
    queryKey: weatherKeys.dailyHistory(queryCity, period),
    queryFn: () => api.getDailyHistory(queryCity!, start, now, units),
    enabled: !!queryCity,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

// Weather trends hook
export function useWeatherTrends(city?: string, period: HistoryPeriod = '7d') {
  const { defaultCity, units } = useSettingsStore();
  const queryCity = city || defaultCity;

  return useQuery({
    queryKey: weatherKeys.trends(queryCity, period),
    queryFn: () => api.getWeatherTrends(queryCity!, period, units),
    enabled: !!queryCity,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

// Scheduler status hook
export function useSchedulerStatus() {
  return useQuery({
    queryKey: weatherKeys.schedulerStatus(),
    queryFn: () => api.getSchedulerStatus(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Scheduler jobs hook
export function useSchedulerJobs() {
  return useQuery({
    queryKey: weatherKeys.schedulerJobs(),
    queryFn: () => api.getSchedulerJobs(),
    staleTime: 60 * 1000, // 1 minute
  });
}

// Trigger forecast mutation
export function useTriggerForecast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (city?: string) => api.triggerForecast(city),
    onSuccess: () => {
      // Invalidate weather queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: weatherKeys.all });
    },
  });
}

// Refetch all weather data
export function useRefreshWeather() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: weatherKeys.all });
  };
}

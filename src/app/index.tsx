/**
 * Home screen - Current weather display
 */

import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useCurrentWeather, useTriggerForecast } from '@/hooks';
import { useSettingsStore } from '@/stores/settingsStore';
import { WeatherCard } from '@/components';
import { useState } from 'react';

export default function HomeScreen() {
  const { defaultCity, units, apiUrl } = useSettingsStore();
  const { data: weather, isLoading, error, refetch, isRefetching } = useCurrentWeather();
  const triggerMutation = useTriggerForecast();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleTrigger = async () => {
    try {
      await triggerMutation.mutateAsync(defaultCity || undefined);
    } catch (err) {
      console.error('Failed to trigger forecast:', err);
    }
  };

  // Show setup prompt if no city configured
  if (!defaultCity) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>Welcome to Weathrs</Text>
          <Text style={styles.subtitle}>
            Configure your API server and default city in Settings to get started.
          </Text>
          <Text style={styles.hint}>
            Current API: {apiUrl}
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading && !weather) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loading}>Loading weather...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.error}>Failed to load weather</Text>
          <Text style={styles.errorDetail}>
            {error instanceof Error ? error.message : 'Unknown error'}
          </Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing || isRefetching} onRefresh={onRefresh} />
      }
    >
      {weather && <WeatherCard weather={weather} units={units} />}

      <View style={styles.actions}>
        <Pressable
          style={[styles.triggerButton, triggerMutation.isPending && styles.buttonDisabled]}
          onPress={handleTrigger}
          disabled={triggerMutation.isPending}
        >
          <Text style={styles.triggerText}>
            {triggerMutation.isPending ? 'Triggering...' : 'Trigger Notification'}
          </Text>
        </Pressable>

        {triggerMutation.isSuccess && (
          <Text style={styles.successText}>Notification sent!</Text>
        )}
        {triggerMutation.isError && (
          <Text style={styles.errorText}>
            Failed: {triggerMutation.error instanceof Error ? triggerMutation.error.message : 'Unknown error'}
          </Text>
        )}
      </View>

      <Text style={styles.lastUpdated}>
        Pull down to refresh
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 24,
  },
  loading: {
    fontSize: 16,
    color: '#666',
  },
  error: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f44336',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  triggerButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  triggerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successText: {
    color: '#4CAF50',
    marginTop: 8,
    fontSize: 14,
  },
  errorText: {
    color: '#f44336',
    marginTop: 8,
    fontSize: 14,
  },
  lastUpdated: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 24,
  },
});

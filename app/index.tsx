/**
 * Home screen - Current weather display
 */

import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/settingsStore';
import api from '@/services/api';
import { WeatherCard } from '@/components';

export default function HomeScreen() {
  const { defaultCity, units, apiUrl } = useSettingsStore();
  const queryClient = useQueryClient();

  const { data: weather, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['weather', defaultCity, units],
    queryFn: () => api.getCurrentWeather(defaultCity, units),
    enabled: !!defaultCity,
    staleTime: 5 * 60 * 1000,
  });

  const triggerMutation = useMutation({
    mutationFn: () => api.triggerForecast(defaultCity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weather'] });
    },
  });

  if (!defaultCity) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>Welcome to Weathrs</Text>
          <Text style={styles.subtitle}>
            Go to Settings to configure your API server and default city.
          </Text>
          <Text style={styles.hint}>Current API: {apiUrl}</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loading}>Loading weather for {defaultCity}...</Text>
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
            {error instanceof Error ? error.message : 'Check your API server'}
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
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
    >
      {weather && <WeatherCard weather={weather} units={units} />}

      <View style={styles.actions}>
        <Pressable
          style={[styles.triggerButton, triggerMutation.isPending && styles.buttonDisabled]}
          onPress={() => triggerMutation.mutate()}
          disabled={triggerMutation.isPending}
        >
          <Text style={styles.triggerText}>
            {triggerMutation.isPending ? 'Sending...' : 'Send Notification'}
          </Text>
        </Pressable>

        {triggerMutation.isSuccess && (
          <Text style={styles.successText}>Notification triggered!</Text>
        )}
        {triggerMutation.isError && (
          <Text style={styles.errorText}>Failed to send notification</Text>
        )}
      </View>

      <Text style={styles.pullHint}>Pull down to refresh</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 32 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  hint: { fontSize: 12, color: '#999', marginTop: 24 },
  loading: { fontSize: 16, color: '#666', marginTop: 16 },
  error: { fontSize: 18, fontWeight: '600', color: '#f44336', marginBottom: 8 },
  errorDetail: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#2196F3', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  actions: { alignItems: 'center', marginTop: 16, paddingHorizontal: 16 },
  triggerButton: { backgroundColor: '#4CAF50', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8 },
  buttonDisabled: { opacity: 0.6 },
  triggerText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  successText: { color: '#4CAF50', marginTop: 8, fontSize: 14 },
  errorText: { color: '#f44336', marginTop: 8, fontSize: 14 },
  pullHint: { textAlign: 'center', color: '#999', fontSize: 12, marginTop: 24 },
});

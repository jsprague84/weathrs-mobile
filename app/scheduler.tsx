/**
 * Scheduler screen - View and manage notification schedules
 */

import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform, Pressable } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCitiesStore } from '@/stores/citiesStore';
import { useTheme } from '@/theme';
import api from '@/services/api';
import { Card, Button, Loading, ErrorDisplay, NotificationSettings } from '@/components';
import type { SchedulerJob } from '@/types';

function formatCron(cron: string): string {
  // Simple cron format parser for display
  const parts = cron.split(' ');
  if (parts.length < 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Check for common patterns
  if (dayOfMonth === '*' && month === '*') {
    if (dayOfWeek === '*') {
      // Daily
      if (hour !== '*' && minute !== '*') {
        const h = parseInt(hour);
        const m = parseInt(minute);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `Daily at ${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
      }
    } else {
      // Weekly
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayIndex = parseInt(dayOfWeek);
      if (!isNaN(dayIndex) && dayIndex >= 0 && dayIndex <= 6) {
        const h = parseInt(hour);
        const m = parseInt(minute);
        if (!isNaN(h) && !isNaN(m)) {
          const ampm = h >= 12 ? 'PM' : 'AM';
          const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
          return `${days[dayIndex]}s at ${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
        }
      }
    }
  }

  return cron;
}

function JobCard({ job }: { job: SchedulerJob }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.jobCard, { backgroundColor: isDark ? colors.surface : colors.background, borderColor: colors.border }]}>
      <View style={styles.jobHeader}>
        <View style={styles.jobNameRow}>
          <Ionicons
            name={job.enabled ? 'notifications' : 'notifications-off-outline'}
            size={20}
            color={job.enabled ? colors.success : colors.textMuted}
          />
          <Text style={[styles.jobName, { color: colors.text }]}>{job.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: job.enabled ? colors.success + '20' : colors.textMuted + '20' }]}>
          <Text style={[styles.statusText, { color: job.enabled ? colors.success : colors.textMuted }]}>
            {job.enabled ? 'Active' : 'Disabled'}
          </Text>
        </View>
      </View>

      <View style={styles.jobDetails}>
        <View style={styles.jobRow}>
          <Text style={[styles.jobLabel, { color: colors.textMuted }]}>City:</Text>
          <Text style={[styles.jobValue, { color: colors.text }]}>{job.city}</Text>
        </View>
        <View style={styles.jobRow}>
          <Text style={[styles.jobLabel, { color: colors.textMuted }]}>Schedule:</Text>
          <Text style={[styles.jobValue, { color: colors.text }]}>{formatCron(job.cron)}</Text>
        </View>
        <View style={styles.jobRow}>
          <Text style={[styles.jobLabel, { color: colors.textMuted }]}>Units:</Text>
          <Text style={[styles.jobValue, { color: colors.text }]}>
            {job.units === 'imperial' ? 'Fahrenheit' : job.units === 'metric' ? 'Celsius' : 'Kelvin'}
          </Text>
        </View>
        <View style={styles.jobRow}>
          <Text style={[styles.jobLabel, { color: colors.textMuted }]}>Includes:</Text>
          <Text style={[styles.jobValue, { color: colors.text }]}>
            {[
              job.include_daily && 'Daily',
              job.include_hourly && 'Hourly',
            ].filter(Boolean).join(', ') || 'Current only'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function SchedulerScreen() {
  const { defaultCity, units } = useSettingsStore();
  const { getSelectedCity } = useCitiesStore();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();

  const selectedCity = getSelectedCity();
  const cityToQuery = selectedCity?.name || defaultCity;

  const statusQuery = useQuery({
    queryKey: ['scheduler', 'status'],
    queryFn: () => api.getSchedulerStatus(),
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });

  const jobsQuery = useQuery({
    queryKey: ['scheduler', 'jobs'],
    queryFn: () => api.getSchedulerJobs(),
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });

  const triggerMutation = useMutation({
    mutationFn: (city?: string) => api.triggerForecast(city),
    onSuccess: async () => {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: async () => {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
  });

  const isRefetching = statusQuery.isRefetching || jobsQuery.isRefetching;

  const handleRefresh = () => {
    statusQuery.refetch();
    jobsQuery.refetch();
  };

  const handleTrigger = async (city?: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    triggerMutation.mutate(city);
  };

  if (statusQuery.isLoading) {
    return <Loading message="Loading scheduler status..." />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Push Notification Settings */}
      <NotificationSettings />

      {/* Status Card */}
      <Card>
        <View style={styles.statusHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Scheduler Status</Text>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: statusQuery.data?.running ? colors.success : colors.error }
          ]} />
        </View>

        {statusQuery.error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={24} color={colors.warning} />
            <Text style={[styles.errorText, { color: colors.warning }]}>
              Unable to connect to scheduler
            </Text>
            <Text style={[styles.errorHint, { color: colors.textMuted }]}>
              Check your API server configuration
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Status:</Text>
              <Text style={[styles.statusValue, { color: statusQuery.data?.running ? colors.success : colors.error }]}>
                {statusQuery.data?.running ? 'Running' : 'Stopped'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Active Jobs:</Text>
              <Text style={[styles.statusValue, { color: colors.text }]}>
                {statusQuery.data?.job_count ?? 0}
              </Text>
            </View>
          </>
        )}
      </Card>

      {/* Manual Trigger */}
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Manual Trigger</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Send a weather notification immediately without waiting for the schedule.
        </Text>

        <View style={styles.triggerButtons}>
          <Button
            title={triggerMutation.isPending ? 'Sending...' : 'Send Default'}
            onPress={() => handleTrigger()}
            variant="primary"
            disabled={triggerMutation.isPending}
            loading={triggerMutation.isPending}
            fullWidth
          />

          {cityToQuery && (
            <Button
              title={triggerMutation.isPending ? 'Sending...' : `Send for ${selectedCity?.displayName || cityToQuery}`}
              onPress={() => handleTrigger(cityToQuery)}
              variant="secondary"
              disabled={triggerMutation.isPending}
              fullWidth
            />
          )}
        </View>

        {triggerMutation.isSuccess && (
          <View style={[styles.resultBanner, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.resultText, { color: colors.success }]}>
              Notification sent successfully!
            </Text>
          </View>
        )}

        {triggerMutation.isError && (
          <View style={[styles.resultBanner, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="close-circle" size={20} color={colors.error} />
            <Text style={[styles.resultText, { color: colors.error }]}>
              Failed to send notification
            </Text>
          </View>
        )}
      </Card>

      {/* Scheduled Jobs */}
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Scheduled Jobs</Text>

        {jobsQuery.isLoading ? (
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading jobs...</Text>
        ) : jobsQuery.error ? (
          <Text style={[styles.errorText, { color: colors.warning }]}>
            Unable to load scheduled jobs
          </Text>
        ) : jobsQuery.data?.jobs && jobsQuery.data.jobs.length > 0 ? (
          <View style={styles.jobsList}>
            {jobsQuery.data.jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyJobs}>
            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No scheduled jobs configured
            </Text>
            <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
              Jobs are configured on the server via the API
            </Text>
          </View>
        )}
      </Card>

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Pull down to refresh
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  triggerButtons: {
    gap: 12,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  jobsList: {
    gap: 12,
  },
  jobCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  jobDetails: {
    gap: 6,
  },
  jobRow: {
    flexDirection: 'row',
    gap: 8,
  },
  jobLabel: {
    fontSize: 13,
    width: 70,
  },
  jobValue: {
    fontSize: 13,
    flex: 1,
  },
  emptyJobs: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});

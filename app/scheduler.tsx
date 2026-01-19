/**
 * Scheduler screen - View and manage notification schedules
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Pressable,
  Modal,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCitiesStore } from '@/stores/citiesStore';
import { useTheme } from '@/theme';
import api from '@/services/api';
import { Card, Button, Loading, NotificationSettings } from '@/components';
import type { SchedulerJob, CreateJobRequest, UpdateJobRequest, Units } from '@/types';

// Common cron presets
const CRON_PRESETS = [
  { label: '6:00 AM Daily', value: '0 6 * * *', description: 'Every day at 6 AM' },
  { label: '7:00 AM Daily', value: '0 7 * * *', description: 'Every day at 7 AM' },
  { label: '8:00 AM Daily', value: '0 8 * * *', description: 'Every day at 8 AM' },
  { label: '6:00 PM Daily', value: '0 18 * * *', description: 'Every day at 6 PM' },
  { label: 'Every 6 hours', value: '0 */6 * * *', description: 'At minute 0 past every 6th hour' },
  { label: 'Every 12 hours', value: '0 */12 * * *', description: 'At minute 0 past every 12th hour' },
];

function formatCron(cron: string): string {
  // Check against presets first
  const preset = CRON_PRESETS.find(p => p.value === cron);
  if (preset) return preset.label;

  // Simple cron format parser for display
  const parts = cron.split(' ');
  if (parts.length < 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  if (dayOfMonth === '*' && month === '*') {
    if (dayOfWeek === '*') {
      if (hour !== '*' && minute !== '*') {
        const h = parseInt(hour);
        const m = parseInt(minute);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `Daily at ${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
      }
    }
  }

  return cron;
}

interface JobFormData {
  name: string;
  city: string;
  units: Units;
  cron: string;
  includeDaily: boolean;
  includeHourly: boolean;
  enabled: boolean;
  onRun: boolean;
  onAlert: boolean;
  onPrecipitation: boolean;
}

const defaultFormData: JobFormData = {
  name: '',
  city: '',
  units: 'imperial',
  cron: '0 7 * * *',
  includeDaily: true,
  includeHourly: false,
  enabled: true,
  onRun: true,
  onAlert: true,
  onPrecipitation: false,
};

function JobFormModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  isEditing,
  isSubmitting,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: JobFormData) => void;
  initialData?: JobFormData;
  isEditing: boolean;
  isSubmitting: boolean;
}) {
  const { colors, isDark } = useTheme();
  const [formData, setFormData] = useState<JobFormData>(initialData || defaultFormData);
  const [showCronPresets, setShowCronPresets] = useState(false);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a job name');
      return;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'Please enter a city');
      return;
    }
    onSubmit(formData);
  };

  const handleCronPresetSelect = (value: string) => {
    setFormData(prev => ({ ...prev, cron: value }));
    setShowCronPresets(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {isEditing ? 'Edit Job' : 'New Job'}
          </Text>
          <Pressable onPress={handleSubmit} disabled={isSubmitting} hitSlop={8}>
            <Text style={[styles.modalSave, { color: isSubmitting ? colors.textMuted : colors.primary }]}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
          {/* Basic Info */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Job Name</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: isDark ? colors.surface : colors.card, color: colors.text, borderColor: colors.border }]}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Morning Weather Report"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.text }]}>City</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: isDark ? colors.surface : colors.card, color: colors.text, borderColor: colors.border }]}
              value={formData.city}
              onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
              placeholder="New York"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Schedule */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Schedule</Text>
            <Pressable
              style={[styles.formInput, styles.selectInput, { backgroundColor: isDark ? colors.surface : colors.card, borderColor: colors.border }]}
              onPress={() => setShowCronPresets(!showCronPresets)}
            >
              <Text style={[styles.selectText, { color: colors.text }]}>{formatCron(formData.cron)}</Text>
              <Ionicons name={showCronPresets ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
            </Pressable>

            {showCronPresets && (
              <View style={[styles.presetsContainer, { backgroundColor: isDark ? colors.surface : colors.card, borderColor: colors.border }]}>
                {CRON_PRESETS.map((preset) => (
                  <Pressable
                    key={preset.value}
                    style={[styles.presetItem, formData.cron === preset.value && { backgroundColor: colors.primary + '20' }]}
                    onPress={() => handleCronPresetSelect(preset.value)}
                  >
                    <Text style={[styles.presetLabel, { color: colors.text }]}>{preset.label}</Text>
                    <Text style={[styles.presetDescription, { color: colors.textMuted }]}>{preset.description}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={[styles.formHint, { color: colors.textMuted }]}>
              Cron: {formData.cron}
            </Text>
          </View>

          {/* Units */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Temperature Units</Text>
            <View style={styles.unitsRow}>
              {(['imperial', 'metric', 'standard'] as Units[]).map((unit) => (
                <Pressable
                  key={unit}
                  style={[
                    styles.unitOption,
                    { backgroundColor: isDark ? colors.surface : colors.card, borderColor: formData.units === unit ? colors.primary : colors.border },
                    formData.units === unit && { backgroundColor: colors.primary + '20' },
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, units: unit }))}
                >
                  <Text style={[styles.unitText, { color: formData.units === unit ? colors.primary : colors.text }]}>
                    {unit === 'imperial' ? 'F' : unit === 'metric' ? 'C' : 'K'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Include Options */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Forecast Data</Text>
            <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Include Daily Forecast</Text>
              <Switch
                value={formData.includeDaily}
                onValueChange={(value) => setFormData(prev => ({ ...prev, includeDaily: value }))}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={formData.includeDaily ? colors.primary : colors.textMuted}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Include Hourly Forecast</Text>
              <Switch
                value={formData.includeHourly}
                onValueChange={(value) => setFormData(prev => ({ ...prev, includeHourly: value }))}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={formData.includeHourly ? colors.primary : colors.textMuted}
              />
            </View>
          </View>

          {/* Notification Settings */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Notifications</Text>
            <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Notify on Every Run</Text>
              <Switch
                value={formData.onRun}
                onValueChange={(value) => setFormData(prev => ({ ...prev, onRun: value }))}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={formData.onRun ? colors.primary : colors.textMuted}
              />
            </View>
            <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Notify on Weather Alerts</Text>
              <Switch
                value={formData.onAlert}
                onValueChange={(value) => setFormData(prev => ({ ...prev, onAlert: value }))}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={formData.onAlert ? colors.primary : colors.textMuted}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Notify on Precipitation</Text>
              <Switch
                value={formData.onPrecipitation}
                onValueChange={(value) => setFormData(prev => ({ ...prev, onPrecipitation: value }))}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={formData.onPrecipitation ? colors.primary : colors.textMuted}
              />
            </View>
          </View>

          {/* Enabled */}
          <View style={styles.formSection}>
            <View style={[styles.toggleRow, { backgroundColor: isDark ? colors.surface : colors.card, padding: 16, borderRadius: 8 }]}>
              <View>
                <Text style={[styles.toggleLabel, { color: colors.text, fontWeight: '600' }]}>Job Enabled</Text>
                <Text style={[styles.toggleHint, { color: colors.textMuted }]}>
                  {formData.enabled ? 'Job will run on schedule' : 'Job is paused'}
                </Text>
              </View>
              <Switch
                value={formData.enabled}
                onValueChange={(value) => setFormData(prev => ({ ...prev, enabled: value }))}
                trackColor={{ false: colors.border, true: colors.success + '80' }}
                thumbColor={formData.enabled ? colors.success : colors.textMuted}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function JobCard({
  job,
  onEdit,
  onDelete,
  onToggle,
}: {
  job: SchedulerJob;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
}) {
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
        <View style={styles.jobActions}>
          <Pressable onPress={onEdit} hitSlop={8} style={styles.actionButton}>
            <Ionicons name="pencil-outline" size={18} color={colors.primary} />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </Pressable>
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
      </View>

      <View style={[styles.jobFooter, { borderTopColor: colors.border }]}>
        <Switch
          value={job.enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.success + '80' }}
          thumbColor={job.enabled ? colors.success : colors.textMuted}
        />
        <Text style={[styles.enabledLabel, { color: job.enabled ? colors.success : colors.textMuted }]}>
          {job.enabled ? 'Active' : 'Paused'}
        </Text>
      </View>
    </View>
  );
}

export default function SchedulerScreen() {
  const { defaultCity, units } = useSettingsStore();
  const { getSelectedCity } = useCitiesStore();
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingJob, setEditingJob] = useState<SchedulerJob | null>(null);

  const selectedCity = getSelectedCity();
  const cityToQuery = selectedCity?.name || defaultCity;

  const statusQuery = useQuery({
    queryKey: ['scheduler', 'status'],
    queryFn: () => api.getSchedulerStatus(),
    staleTime: 30 * 1000,
    retry: 1,
  });

  const jobsQuery = useQuery({
    queryKey: ['scheduler', 'jobs'],
    queryFn: () => api.getSchedulerJobs(),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateJobRequest) => api.createSchedulerJob(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scheduler'] });
      setIsFormVisible(false);
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: async (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create job');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobRequest }) => api.updateSchedulerJob(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scheduler'] });
      setIsFormVisible(false);
      setEditingJob(null);
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: async (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update job');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSchedulerJob(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['scheduler'] });
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: async (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete job');
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
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

  const handleAddJob = () => {
    setEditingJob(null);
    setIsFormVisible(true);
  };

  const handleEditJob = (job: SchedulerJob) => {
    setEditingJob(job);
    setIsFormVisible(true);
  };

  const handleDeleteJob = (job: SchedulerJob) => {
    Alert.alert(
      'Delete Job',
      `Are you sure you want to delete "${job.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(job.id),
        },
      ]
    );
  };

  const handleToggleJob = async (job: SchedulerJob, enabled: boolean) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    updateMutation.mutate({ id: job.id, data: { enabled } });
  };

  const handleFormSubmit = (data: JobFormData) => {
    const jobData: CreateJobRequest = {
      name: data.name,
      city: data.city,
      units: data.units,
      cron: data.cron,
      includeDaily: data.includeDaily,
      includeHourly: data.includeHourly,
      enabled: data.enabled,
      notify: {
        onRun: data.onRun,
        onAlert: data.onAlert,
        onPrecipitation: data.onPrecipitation,
      },
    };

    if (editingJob) {
      updateMutation.mutate({ id: editingJob.id, data: jobData });
    } else {
      createMutation.mutate(jobData);
    }
  };

  const handleFormClose = () => {
    setIsFormVisible(false);
    setEditingJob(null);
  };

  const getInitialFormData = (): JobFormData | undefined => {
    if (!editingJob) return undefined;
    return {
      name: editingJob.name,
      city: editingJob.city,
      units: editingJob.units,
      cron: editingJob.cron,
      includeDaily: editingJob.includeDaily,
      includeHourly: editingJob.includeHourly,
      enabled: editingJob.enabled,
      onRun: editingJob.notify?.onRun ?? true,
      onAlert: editingJob.notify?.onAlert ?? true,
      onPrecipitation: editingJob.notify?.onPrecipitation ?? false,
    };
  };

  if (statusQuery.isLoading) {
    return <Loading message="Loading scheduler status..." />;
  }

  return (
    <>
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
                  {jobsQuery.data?.count ?? 0}
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
          <View style={styles.jobsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Scheduled Jobs</Text>
            <Pressable
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddJob}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </Pressable>
          </View>

          {jobsQuery.isLoading ? (
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading jobs...</Text>
          ) : jobsQuery.error ? (
            <Text style={[styles.errorText, { color: colors.warning }]}>
              Unable to load scheduled jobs
            </Text>
          ) : jobsQuery.data?.jobs && jobsQuery.data.jobs.length > 0 ? (
            <View style={styles.jobsList}>
              {jobsQuery.data.jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onEdit={() => handleEditJob(job)}
                  onDelete={() => handleDeleteJob(job)}
                  onToggle={(enabled) => handleToggleJob(job, enabled)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyJobs}>
              <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No scheduled jobs
              </Text>
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                Tap + to create your first job
              </Text>
            </View>
          )}
        </Card>

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Pull down to refresh
        </Text>
      </ScrollView>

      <JobFormModal
        visible={isFormVisible}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        initialData={getInitialFormData()}
        isEditing={!!editingJob}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    marginTop: 8,
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
  jobsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    flex: 1,
  },
  jobName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  jobActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
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
  jobFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  enabledLabel: {
    fontSize: 13,
    fontWeight: '500',
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
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalCancel: {
    fontSize: 16,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  formHint: {
    fontSize: 12,
    marginTop: 8,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 16,
  },
  presetsContainer: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  presetItem: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  presetDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  unitsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unitOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  unitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: {
    fontSize: 15,
  },
  toggleHint: {
    fontSize: 12,
    marginTop: 2,
  },
});

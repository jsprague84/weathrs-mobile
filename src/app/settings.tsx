/**
 * Settings screen - Configure app settings
 */

import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Switch } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSchedulerStatus } from '@/hooks';
import { useState, useEffect } from 'react';
import type { Units } from '@/types';

export default function SettingsScreen() {
  const {
    apiUrl,
    setApiUrl,
    defaultCity,
    setDefaultCity,
    units,
    setUnits,
    darkMode,
    toggleDarkMode,
  } = useSettingsStore();

  const { data: schedulerStatus, refetch: refetchStatus } = useSchedulerStatus();

  // Local state for editing
  const [localApiUrl, setLocalApiUrl] = useState(apiUrl);
  const [localCity, setLocalCity] = useState(defaultCity);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalApiUrl(apiUrl);
    setLocalCity(defaultCity);
  }, [apiUrl, defaultCity]);

  useEffect(() => {
    setHasChanges(localApiUrl !== apiUrl || localCity !== defaultCity);
  }, [localApiUrl, localCity, apiUrl, defaultCity]);

  const handleSave = () => {
    setApiUrl(localApiUrl);
    setDefaultCity(localCity);
    refetchStatus();
  };

  const handleUnitChange = (newUnits: Units) => {
    setUnits(newUnits);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* API Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Configuration</Text>

        <Text style={styles.label}>Server URL</Text>
        <TextInput
          style={styles.input}
          value={localApiUrl}
          onChangeText={setLocalApiUrl}
          placeholder="http://localhost:3000"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.label}>Default City / Zip Code</Text>
        <TextInput
          style={styles.input}
          value={localCity}
          onChangeText={setLocalCity}
          placeholder="Enter city or zip code"
          autoCapitalize="words"
        />

        {hasChanges && (
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </Pressable>
        )}
      </View>

      {/* Units Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Temperature Units</Text>

        <View style={styles.unitsContainer}>
          <Pressable
            style={[styles.unitButton, units === 'imperial' && styles.unitButtonActive]}
            onPress={() => handleUnitChange('imperial')}
          >
            <Text style={[styles.unitButtonText, units === 'imperial' && styles.unitButtonTextActive]}>
              °F (Imperial)
            </Text>
          </Pressable>

          <Pressable
            style={[styles.unitButton, units === 'metric' && styles.unitButtonActive]}
            onPress={() => handleUnitChange('metric')}
          >
            <Text style={[styles.unitButtonText, units === 'metric' && styles.unitButtonTextActive]}>
              °C (Metric)
            </Text>
          </Pressable>

          <Pressable
            style={[styles.unitButton, units === 'standard' && styles.unitButtonActive]}
            onPress={() => handleUnitChange('standard')}
          >
            <Text style={[styles.unitButtonText, units === 'standard' && styles.unitButtonTextActive]}>
              K (Standard)
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#ddd', true: '#81b0ff' }}
            thumbColor={darkMode ? '#2196F3' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Scheduler Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scheduler Status</Text>

        {schedulerStatus ? (
          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={[styles.statusIndicator, schedulerStatus.running ? styles.statusRunning : styles.statusStopped]}>
                <Text style={styles.statusText}>
                  {schedulerStatus.running ? 'Running' : 'Stopped'}
                </Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Scheduled Jobs:</Text>
              <Text style={styles.statusValue}>{schedulerStatus.job_count}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.statusError}>Unable to connect to server</Text>
        )}
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.infoText}>Weathrs Mobile v1.0.0</Text>
        <Text style={styles.infoText}>A companion app for the weathrs weather API</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  unitsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unitButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#666',
  },
  unitButtonTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  statusContainer: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusRunning: {
    backgroundColor: '#e8f5e9',
  },
  statusStopped: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusError: {
    fontSize: 14,
    color: '#f44336',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

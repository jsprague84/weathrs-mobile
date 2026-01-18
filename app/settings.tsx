/**
 * Settings screen - Configure app settings
 */

import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Units } from '@/types';

export default function SettingsScreen() {
  const { apiUrl, setApiUrl, defaultCity, setDefaultCity, units, setUnits } = useSettingsStore();

  const [localApiUrl, setLocalApiUrl] = useState(apiUrl);
  const [localCity, setLocalCity] = useState(defaultCity);

  useEffect(() => {
    setLocalApiUrl(apiUrl);
    setLocalCity(defaultCity);
  }, [apiUrl, defaultCity]);

  const hasChanges = localApiUrl !== apiUrl || localCity !== defaultCity;

  const handleSave = () => {
    setApiUrl(localApiUrl);
    setDefaultCity(localCity);
    Alert.alert('Saved', 'Settings have been updated');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
        />

        <Text style={styles.label}>Default City / Zip Code</Text>
        <TextInput
          style={styles.input}
          value={localCity}
          onChangeText={setLocalCity}
          placeholder="Enter city or zip code (e.g., 52726)"
        />

        <Pressable
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!hasChanges}
        >
          <Text style={styles.saveButtonText}>
            {hasChanges ? 'Save Changes' : 'No Changes'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Temperature Units</Text>
        <View style={styles.unitsContainer}>
          {(['imperial', 'metric', 'standard'] as Units[]).map((unit) => (
            <Pressable
              key={unit}
              style={[styles.unitButton, units === unit && styles.unitButtonActive]}
              onPress={() => setUnits(unit)}
            >
              <Text style={[styles.unitButtonText, units === unit && styles.unitButtonTextActive]}>
                {unit === 'imperial' ? '°F' : unit === 'metric' ? '°C' : 'K'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Settings</Text>
        <Text style={styles.infoText}>API: {apiUrl}</Text>
        <Text style={styles.infoText}>City: {defaultCity || '(not set)'}</Text>
        <Text style={styles.infoText}>Units: {units}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.infoText}>Weathrs Mobile v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 48 },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  label: { fontSize: 14, color: '#666', marginBottom: 8 },
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
  saveButtonDisabled: { backgroundColor: '#ccc' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  unitsContainer: { flexDirection: 'row', gap: 8 },
  unitButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unitButtonActive: { borderColor: '#2196F3', backgroundColor: '#e3f2fd' },
  unitButtonText: { fontSize: 16, color: '#666' },
  unitButtonTextActive: { color: '#2196F3', fontWeight: '600' },
  infoText: { fontSize: 14, color: '#666', marginBottom: 4 },
});

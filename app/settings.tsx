/**
 * Settings screen - Configure app settings
 */

import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTheme } from '@/theme';
import { Button, Card } from '@/components';
import type { Units } from '@/types';

export default function SettingsScreen() {
  const { apiUrl, setApiUrl, defaultCity, setDefaultCity, units, setUnits } = useSettingsStore();
  const { colors, isDark } = useTheme();

  const [localApiUrl, setLocalApiUrl] = useState(apiUrl);
  const [localCity, setLocalCity] = useState(defaultCity);

  useEffect(() => {
    setLocalApiUrl(apiUrl);
    setLocalCity(defaultCity);
  }, [apiUrl, defaultCity]);

  const hasChanges = localApiUrl !== apiUrl || localCity !== defaultCity;

  const handleSave = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setApiUrl(localApiUrl);
    setDefaultCity(localCity);
    Alert.alert('Saved', 'Settings have been updated');
  };

  const handleUnitChange = async (unit: Units) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setUnits(unit);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>API Configuration</Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Server URL</Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: isDark ? colors.surface : colors.background,
            color: colors.text,
            borderColor: colors.border,
          }]}
          value={localApiUrl}
          onChangeText={setLocalApiUrl}
          placeholder="http://localhost:3000"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Default City / Zip Code</Text>
        <TextInput
          style={[styles.input, {
            backgroundColor: isDark ? colors.surface : colors.background,
            color: colors.text,
            borderColor: colors.border,
          }]}
          value={localCity}
          onChangeText={setLocalCity}
          placeholder="Enter city or zip code (e.g., 52726)"
          placeholderTextColor={colors.textMuted}
        />

        <Button
          title={hasChanges ? 'Save Changes' : 'No Changes'}
          onPress={handleSave}
          disabled={!hasChanges}
          fullWidth
        />
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Temperature Units</Text>
        <View style={styles.unitsContainer}>
          {(['imperial', 'metric', 'standard'] as Units[]).map((unit) => (
            <Pressable
              key={unit}
              style={[
                styles.unitButton,
                {
                  backgroundColor: isDark ? colors.surface : colors.background,
                  borderColor: units === unit ? colors.primary : 'transparent',
                },
                units === unit && { backgroundColor: isDark ? colors.primaryLight : '#E3F2FD' },
              ]}
              onPress={() => handleUnitChange(unit)}
            >
              <Text
                style={[
                  styles.unitButtonText,
                  { color: units === unit ? colors.primary : colors.textSecondary },
                  units === unit && styles.unitButtonTextActive,
                ]}
              >
                {unit === 'imperial' ? '°F' : unit === 'metric' ? '°C' : 'K'}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Settings</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>API: {apiUrl}</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          City: {defaultCity || '(not set)'}
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>Units: {units}</Text>
      </Card>

      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>Weathrs Mobile v1.0.0</Text>
        <Text style={[styles.infoText, { color: colors.textMuted }]}>
          A companion app for the weathrs weather API
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48, gap: 0 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: { fontSize: 14, marginBottom: 8 },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  unitsContainer: { flexDirection: 'row', gap: 8 },
  unitButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  unitButtonText: { fontSize: 16 },
  unitButtonTextActive: { fontWeight: '600' },
  infoText: { fontSize: 14, marginBottom: 4 },
});

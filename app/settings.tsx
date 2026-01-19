/**
 * Settings screen - Configure app settings and manage saved cities
 */

import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/stores/settingsStore';
import { useCitiesStore } from '@/stores/citiesStore';
import { useTheme } from '@/theme';
import { useLocation, reverseGeocode, formatLocationQuery } from '@/hooks/useLocation';
import { Button, Card } from '@/components';
import type { Units } from '@/types';

export default function SettingsScreen() {
  const { apiUrl, setApiUrl, defaultCity, setDefaultCity, units, setUnits } = useSettingsStore();
  const { cities, addCity, removeCity, selectCity, selectedCityId } = useCitiesStore();
  const { colors, isDark } = useTheme();
  const { requestLocation, loading: locationLoading, hasPermission } = useLocation();

  const [localApiUrl, setLocalApiUrl] = useState(apiUrl);
  const [newCityName, setNewCityName] = useState('');
  const [isAddingLocation, setIsAddingLocation] = useState(false);

  useEffect(() => {
    setLocalApiUrl(apiUrl);
  }, [apiUrl]);

  const hasApiChanges = localApiUrl !== apiUrl;

  const handleSaveApi = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setApiUrl(localApiUrl);
    Alert.alert('Saved', 'API settings have been updated');
  };

  const handleUnitChange = async (unit: Units) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setUnits(unit);
  };

  const handleAddCity = async () => {
    const cityName = newCityName.trim();
    if (!cityName) {
      Alert.alert('Error', 'Please enter a city name or zip code');
      return;
    }

    // Check if city already exists
    const exists = cities.some(
      (c) => c.name.toLowerCase() === cityName.toLowerCase()
    );
    if (exists) {
      Alert.alert('Error', 'This city is already saved');
      return;
    }

    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    addCity(cityName);
    setNewCityName('');

    // Also set as default city for legacy compatibility
    if (!defaultCity) {
      setDefaultCity(cityName);
    }
  };

  const handleUseLocation = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }

    setIsAddingLocation(true);

    try {
      const location = await requestLocation();

      if (!location) {
        setIsAddingLocation(false);
        return;
      }

      const { latitude, longitude } = location;

      // Try to get the city name via reverse geocoding
      const cityName = await reverseGeocode(latitude, longitude);

      if (cityName) {
        // Check if city already exists
        const exists = cities.some(
          (c) => c.name.toLowerCase() === cityName.toLowerCase()
        );

        if (exists) {
          // Find and select the existing city
          const existingCity = cities.find(
            (c) => c.name.toLowerCase() === cityName.toLowerCase()
          );
          if (existingCity) {
            selectCity(existingCity.id);
            setDefaultCity(existingCity.name);
          }
          if (Platform.OS !== 'web') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          Alert.alert('Location Found', `Selected "${cityName}" as your current location.`);
        } else {
          // Add new city with display name "My Location"
          addCity(cityName, 'My Location');
          setDefaultCity(cityName);
          if (Platform.OS !== 'web') {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          Alert.alert('Location Added', `Added "${cityName}" as "My Location".`);
        }
      } else {
        // Fall back to coordinates if reverse geocoding fails
        const coordQuery = formatLocationQuery(latitude, longitude);
        addCity(coordQuery, 'My Location');
        setDefaultCity(coordQuery);
        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert('Location Added', 'Added your current location.');
      }
    } catch (error) {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    }

    setIsAddingLocation(false);
  };

  const handleRemoveCity = async (cityId: string, cityName: string) => {
    Alert.alert(
      'Remove City',
      `Are you sure you want to remove "${cityName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            removeCity(cityId);
          },
        },
      ]
    );
  };

  const handleSelectCity = async (cityId: string, cityName: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    selectCity(cityId);
    // Also update default city for legacy compatibility
    setDefaultCity(cityName);
  };

  const isGettingLocation = locationLoading || isAddingLocation;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Saved Cities Section */}
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Saved Cities</Text>

        {/* Use My Location Button */}
        <Pressable
          style={[
            styles.locationButton,
            { backgroundColor: colors.primary },
            isGettingLocation && { opacity: 0.7 },
          ]}
          onPress={handleUseLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="navigate" size={20} color="#FFF" />
          )}
          <Text style={styles.locationButtonText}>
            {isGettingLocation ? 'Getting Location...' : 'Use My Location'}
          </Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>or add manually</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        {/* Add New City */}
        <View style={styles.addCityRow}>
          <TextInput
            style={[styles.addCityInput, {
              backgroundColor: isDark ? colors.surface : colors.background,
              color: colors.text,
              borderColor: colors.border,
            }]}
            value={newCityName}
            onChangeText={setNewCityName}
            placeholder="City name or zip code"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={handleAddCity}
            returnKeyType="done"
          />
          <Pressable
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddCity}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </Pressable>
        </View>

        {/* City List */}
        {cities.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No saved cities. Use your location or add a city above.
          </Text>
        ) : (
          <View style={styles.cityList}>
            {cities.map((city) => (
              <View
                key={city.id}
                style={[
                  styles.cityItem,
                  { borderBottomColor: colors.border },
                  city.id === selectedCityId && {
                    backgroundColor: isDark ? colors.primaryLight : '#E3F2FD',
                  },
                ]}
              >
                <Pressable
                  style={styles.cityInfo}
                  onPress={() => handleSelectCity(city.id, city.name)}
                >
                  <View style={styles.cityNameRow}>
                    {city.id === selectedCityId && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={styles.checkIcon} />
                    )}
                    <View>
                      <Text
                        style={[
                          styles.cityName,
                          { color: colors.text },
                          city.id === selectedCityId && { color: colors.primary, fontWeight: '600' },
                        ]}
                      >
                        {city.displayName || city.name}
                      </Text>
                      {city.displayName && (
                        <Text style={[styles.citySubtext, { color: colors.textMuted }]}>
                          {city.name}
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleRemoveCity(city.id, city.displayName || city.name)}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Tap a city to select it. Use the city selector on the Home and Forecast screens to quickly switch.
        </Text>
      </Card>

      {/* API Configuration */}
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

        <Button
          title={hasApiChanges ? 'Save Changes' : 'No Changes'}
          onPress={handleSaveApi}
          disabled={!hasApiChanges}
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
          Selected City: {cities.find(c => c.id === selectedCityId)?.name || defaultCity || '(not set)'}
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Saved Cities: {cities.length}
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
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  locationButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
  },
  addCityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addCityInput: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityList: {
    marginBottom: 12,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  cityInfo: {
    flex: 1,
  },
  cityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 8,
  },
  cityName: {
    fontSize: 16,
  },
  citySubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    marginVertical: 16,
    fontStyle: 'italic',
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
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

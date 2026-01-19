/**
 * City selector component for quick switching between saved cities
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useCitiesStore, type SavedCity } from '@/stores/citiesStore';

interface CitySelectorProps {
  onAddCity?: () => void;
}

export function CitySelector({ onAddCity }: CitySelectorProps) {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const { cities, selectedCityId, selectCity, getSelectedCity } = useCitiesStore();

  const selectedCity = getSelectedCity();

  const handleOpenModal = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setModalVisible(true);
  };

  const handleSelectCity = async (city: SavedCity) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    selectCity(city.id);
    setModalVisible(false);
  };

  const handleAddCity = () => {
    setModalVisible(false);
    onAddCity?.();
  };

  if (cities.length === 0) {
    return null;
  }

  return (
    <>
      <Pressable
        style={[styles.selector, { backgroundColor: isDark ? colors.surface : colors.card }]}
        onPress={handleOpenModal}
      >
        <Ionicons name="location" size={16} color={colors.primary} />
        <Text style={[styles.selectorText, { color: colors.text }]} numberOfLines={1}>
          {selectedCity?.displayName || selectedCity?.name || 'Select City'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select City</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={styles.cityList}>
              {cities.map((city) => (
                <Pressable
                  key={city.id}
                  style={[
                    styles.cityItem,
                    { borderBottomColor: colors.border },
                    city.id === selectedCityId && {
                      backgroundColor: isDark ? colors.primaryLight : '#E3F2FD',
                    },
                  ]}
                  onPress={() => handleSelectCity(city)}
                >
                  <View style={styles.cityInfo}>
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
                  {city.id === selectedCityId && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>

            {onAddCity && (
              <Pressable
                style={[styles.addButton, { borderTopColor: colors.border }]}
                onPress={handleAddCity}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>
                  Add New City
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 6,
    alignSelf: 'center',
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: 200,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cityList: {
    maxHeight: 300,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
  },
  citySubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

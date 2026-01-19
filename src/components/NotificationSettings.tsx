/**
 * Notification settings component for managing push notifications
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, Platform, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Device from 'expo-device';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useNotifications, scheduleLocalNotification } from '@/hooks/useNotifications';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useCitiesStore } from '@/stores/citiesStore';
import { useSettingsStore } from '@/stores/settingsStore';
import api from '@/services/api';
import { Card, Button } from '@/components';

export function NotificationSettings() {
  const { colors, isDark } = useTheme();
  const {
    registerForPushNotifications,
    loading: permissionLoading,
    hasPermission,
    isPushSupported,
    isExpoGo,
  } = useNotifications();
  const {
    expoPushToken,
    isRegistered,
    enabled,
    dailyForecastEnabled,
    alertsEnabled,
    setExpoPushToken,
    setEnabled,
    setDailyForecastEnabled,
    setAlertsEnabled,
    clearRegistration,
  } = useNotificationsStore();
  const { cities } = useCitiesStore();
  const { units } = useSettingsStore();

  const [isRegistering, setIsRegistering] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleRegister = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }

    setIsRegistering(true);
    setRegistrationError(null);

    try {
      // Get push token
      const token = await registerForPushNotifications();

      if (!token) {
        setIsRegistering(false);
        return;
      }

      // Register with backend
      try {
        const cityNames = cities.map((c) => c.name);
        await api.registerDevice({
          token,
          platform: Platform.OS as 'ios' | 'android' | 'web',
          deviceName: Device.deviceName || undefined,
          cities: cityNames,
          units,
          enabled: true,
        });
      } catch (apiError) {
        // Backend registration failed, but we still have the token
        console.warn('Backend registration failed:', apiError);
      }

      setExpoPushToken(token);

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Registration failed';
      setRegistrationError(errorMsg);
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    setIsRegistering(false);
  };

  const handleUnregister = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }

    if (expoPushToken) {
      try {
        await api.unregisterDevice(expoPushToken);
      } catch (error) {
        console.warn('Backend unregistration failed:', error);
      }
    }

    clearRegistration();

    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleToggleEnabled = async (value: boolean) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setEnabled(value);

    // Update backend if registered
    if (expoPushToken) {
      try {
        await api.updateDeviceSettings(expoPushToken, { enabled: value });
      } catch (error) {
        console.warn('Failed to update backend settings:', error);
      }
    }
  };

  const handleToggleDailyForecast = async (value: boolean) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setDailyForecastEnabled(value);
  };

  const handleToggleAlerts = async (value: boolean) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setAlertsEnabled(value);
  };

  const handleSendTestNotification = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      // Try to send via backend first
      if (expoPushToken) {
        try {
          const response = await api.sendTestNotification(expoPushToken);
          setTestResult({ success: response.status === 'success', message: response.message });
          setIsSendingTest(false);
          return;
        } catch (error) {
          // Backend test failed, fall back to local notification
          console.warn('Backend test notification failed, using local:', error);
        }
      }

      // Fall back to local notification
      await scheduleLocalNotification(
        'Test Notification',
        'This is a test notification from Weathrs!',
        { type: 'test' },
        1
      );

      setTestResult({ success: true, message: 'Local test notification scheduled!' });

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send test notification';
      setTestResult({ success: false, message: errorMsg });
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    setIsSendingTest(false);
  };

  const isLoading = permissionLoading || isRegistering;

  return (
    <Card>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Push Notifications</Text>

      {/* Expo Go Android Warning */}
      {!isPushSupported && Platform.OS === 'android' && (
        <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20' }]}>
          <Ionicons name="warning-outline" size={20} color={colors.warning} />
          <View style={styles.warningTextContainer}>
            <Text style={[styles.warningTitle, { color: colors.warning }]}>
              Development Build Required
            </Text>
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              Push notifications are not available in Expo Go on Android (SDK 53+).
              Create a development build to enable push notifications.
            </Text>
          </View>
        </View>
      )}

      {/* Registration Status */}
      {!isRegistered ? (
        <View style={styles.registrationContainer}>
          <View style={styles.registrationInfo}>
            <Ionicons name="notifications-off-outline" size={32} color={colors.textMuted} />
            <Text style={[styles.registrationText, { color: colors.textSecondary }]}>
              {isPushSupported
                ? 'Enable push notifications to receive weather updates directly on your device.'
                : 'Push notifications require a development build. You can still test local notifications below.'}
            </Text>
          </View>

          {isPushSupported ? (
            <Button
              title={isLoading ? 'Registering...' : 'Enable Notifications'}
              onPress={handleRegister}
              variant="primary"
              disabled={isLoading}
              loading={isLoading}
              fullWidth
            />
          ) : (
            <Button
              title={isSendingTest ? 'Sending...' : 'Test Local Notification'}
              onPress={handleSendTestNotification}
              variant="secondary"
              disabled={isSendingTest}
              loading={isSendingTest}
              fullWidth
            />
          )}

          {registrationError && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {registrationError}
            </Text>
          )}

          {testResult && !isPushSupported && (
            <View style={[
              styles.testResult,
              { backgroundColor: testResult.success ? colors.success + '20' : colors.error + '20' }
            ]}>
              <Ionicons
                name={testResult.success ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={testResult.success ? colors.success : colors.error}
              />
              <Text style={[
                styles.testResultText,
                { color: testResult.success ? colors.success : colors.error }
              ]}>
                {testResult.message}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.settingsContainer}>
          {/* Registered Status */}
          <View style={[styles.statusBanner, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.success }]}>
              Notifications enabled
            </Text>
          </View>

          {/* Token Display (truncated) */}
          {expoPushToken && (
            <View style={styles.tokenContainer}>
              <Text style={[styles.tokenLabel, { color: colors.textMuted }]}>Device Token:</Text>
              <Text style={[styles.tokenValue, { color: colors.textSecondary }]} numberOfLines={1}>
                {expoPushToken.substring(0, 30)}...
              </Text>
            </View>
          )}

          {/* Notification Toggles */}
          <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Notifications</Text>
              <Text style={[styles.toggleDescription, { color: colors.textMuted }]}>
                Receive all notifications
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={enabled ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Daily Forecast</Text>
              <Text style={[styles.toggleDescription, { color: colors.textMuted }]}>
                Morning weather summary
              </Text>
            </View>
            <Switch
              value={dailyForecastEnabled && enabled}
              onValueChange={handleToggleDailyForecast}
              disabled={!enabled}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={dailyForecastEnabled && enabled ? colors.primary : colors.textMuted}
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomColor: 'transparent' }]}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Weather Alerts</Text>
              <Text style={[styles.toggleDescription, { color: colors.textMuted }]}>
                Severe weather warnings
              </Text>
            </View>
            <Switch
              value={alertsEnabled && enabled}
              onValueChange={handleToggleAlerts}
              disabled={!enabled}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={alertsEnabled && enabled ? colors.primary : colors.textMuted}
            />
          </View>

          {/* Test Notification Button */}
          <View style={styles.testContainer}>
            <Button
              title={isSendingTest ? 'Sending...' : 'Send Test Notification'}
              onPress={handleSendTestNotification}
              variant="secondary"
              disabled={isSendingTest}
              loading={isSendingTest}
              fullWidth
            />

            {testResult && (
              <View style={[
                styles.testResult,
                { backgroundColor: testResult.success ? colors.success + '20' : colors.error + '20' }
              ]}>
                <Ionicons
                  name={testResult.success ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={testResult.success ? colors.success : colors.error}
                />
                <Text style={[
                  styles.testResultText,
                  { color: testResult.success ? colors.success : colors.error }
                ]}>
                  {testResult.message}
                </Text>
              </View>
            )}
          </View>

          {/* Unregister Button */}
          <Pressable
            style={styles.unregisterButton}
            onPress={handleUnregister}
          >
            <Text style={[styles.unregisterText, { color: colors.error }]}>
              Disable Notifications
            </Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  registrationContainer: {
    gap: 16,
  },
  registrationInfo: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  registrationText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
  },
  settingsContainer: {
    gap: 4,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tokenContainer: {
    marginBottom: 16,
  },
  tokenLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
  },
  toggleDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  testContainer: {
    marginTop: 16,
    gap: 12,
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  testResultText: {
    fontSize: 13,
    flex: 1,
  },
  unregisterButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  unregisterText: {
    fontSize: 14,
  },
});

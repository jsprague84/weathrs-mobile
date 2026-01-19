/**
 * Hook for managing push notifications with Expo
 *
 * Note: As of SDK 53, push notifications are not available in Expo Go on Android.
 * A development build is required for push notifications on Android.
 * Local notifications still work in Expo Go.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Check if we're running in Expo Go (as opposed to a development build or standalone app)
 */
function isRunningInExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/**
 * Check if push notifications are supported in the current environment
 * SDK 53+ removed push notification support from Expo Go on Android
 */
export function isPushNotificationsSupported(): boolean {
  // Push notifications work on iOS Expo Go, development builds, and standalone apps
  // They do NOT work on Android Expo Go as of SDK 53
  if (Platform.OS === 'android' && isRunningInExpoGo()) {
    return false;
  }
  return true;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationState {
  expoPushToken: string | null;
  permissionStatus: Notifications.PermissionStatus | null;
  loading: boolean;
  error: string | null;
}

interface UseNotificationsReturn extends NotificationState {
  registerForPushNotifications: () => Promise<string | null>;
  hasPermission: boolean;
  notification: Notifications.Notification | null;
  /** Whether push notifications are supported in the current environment */
  isPushSupported: boolean;
  /** Whether running in Expo Go (useful for showing informational messages) */
  isExpoGo: boolean;
}

export function useNotifications(): UseNotificationsReturn {
  const [state, setState] = useState<NotificationState>({
    expoPushToken: null,
    permissionStatus: null,
    loading: false,
    error: null,
  });

  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Set up notification listeners
  useEffect(() => {
    // Listen for incoming notifications when app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listen for user interaction with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      // Handle notification tap - could navigate to specific screen based on data
      console.log('Notification response:', data);
    });

    // Check current permission status
    checkPermissionStatus();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setState((prev) => ({ ...prev, permissionStatus: status }));
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  };

  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Check if push notifications are supported in current environment
      if (!isPushNotificationsSupported()) {
        const errorMsg = 'Push notifications require a development build on Android. They are not available in Expo Go as of SDK 53.';
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }));
        Alert.alert(
          'Development Build Required',
          'Push notifications are not available in Expo Go on Android.\n\nTo test push notifications, create a development build using:\n\nnpx expo run:android\n\nLocal notifications still work for testing.',
          [{ text: 'OK' }]
        );
        return null;
      }

      // Check if we're on a physical device (required for push notifications)
      if (!Device.isDevice) {
        const errorMsg = 'Push notifications require a physical device';
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }));
        Alert.alert('Not Supported', errorMsg);
        return null;
      }

      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setState((prev) => ({ ...prev, permissionStatus: finalStatus }));

      if (finalStatus !== 'granted') {
        const errorMsg = 'Permission for push notifications was denied';
        setState((prev) => ({ ...prev, loading: false, error: errorMsg }));
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive weather alerts.',
          [{ text: 'OK' }]
        );
        return null;
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      if (!projectId) {
        // For development without EAS, use a placeholder
        console.warn('No EAS project ID found, using development mode');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      const token = tokenData.data;

      setState((prev) => ({
        ...prev,
        expoPushToken: token,
        loading: false,
        error: null,
      }));

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('weather', {
          name: 'Weather Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2196F3',
          sound: 'default',
        });
      }

      return token;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to register for push notifications';
      setState((prev) => ({ ...prev, loading: false, error: errorMsg }));
      console.error('Push notification registration error:', error);
      return null;
    }
  }, []);

  const hasPermission = state.permissionStatus === 'granted';
  const isPushSupported = isPushNotificationsSupported();
  const isExpoGo = isRunningInExpoGo();

  return {
    ...state,
    registerForPushNotifications,
    hasPermission,
    notification,
    isPushSupported,
    isExpoGo,
  };
}

// Helper to schedule a local notification (for testing)
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  seconds: number = 1
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

// Helper to cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get all scheduled notifications
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

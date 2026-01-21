/**
 * Root layout with providers and tab navigation
 */

import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { ThemeProvider, useTheme } from '@/theme';
import { useSettingsStore } from '@/stores/settingsStore';

// Configure QueryClient with persistence-friendly settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (for persistence)
    },
  },
});

// Create async storage persister for React Query cache
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'weathrs-query-cache',
});

/**
 * Hook to handle push notification taps and navigate to the appropriate screen
 */
function useNotificationObserver() {
  useEffect(() => {
    let isMounted = true;

    function redirect(notification: Notifications.Notification) {
      const data = notification.request.content.data;
      const url = data?.url as string | undefined;

      if (url) {
        console.log('Navigating to:', url);
        // Use type assertion for dynamic URL from notification data
        router.push(url as `/forecast?city=${string}`);
      }
    }

    // Handle the notification that opened the app (if any)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) {
        return;
      }
      redirect(response.notification);
    });

    // Listen for notification taps while app is running
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirect(response.notification);
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}

function TabsNavigator() {
  const { colors, isDark } = useTheme();
  const initializeSettings = useSettingsStore((state) => state.initialize);

  // Handle notification taps for deep linking
  useNotificationObserver();

  // Initialize settings on mount
  useEffect(() => {
    initializeSettings();
  }, [initializeSettings]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabBarInactive,
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.border,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Weather',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="partly-sunny" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="forecast"
          options={{
            title: 'Forecast',
            tabBarLabel: 'Forecast',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="charts"
          options={{
            title: 'Charts',
            tabBarLabel: 'Charts',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="scheduler"
          options={{
            title: 'Scheduler',
            tabBarLabel: 'Notify',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="notifications-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      }}
    >
      <ThemeProvider>
        <TabsNavigator />
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}

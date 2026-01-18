/**
 * Root layout with providers and tab navigation
 */

import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSettingsStore } from '@/stores/settingsStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutNav() {
  const { darkMode, initialize } = useSettingsStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2196F3',
          headerStyle: {
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
          },
          headerTintColor: darkMode ? '#ffffff' : '#000000',
          tabBarStyle: {
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Weather',
            tabBarLabel: 'Home',
          }}
        />
        <Tabs.Screen
          name="forecast"
          options={{
            title: '7-Day Forecast',
            tabBarLabel: 'Forecast',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
          }}
        />
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <RootLayoutNav />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

/**
 * Root layout with providers and tab navigation
 */

import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2196F3',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#000000',
          tabBarStyle: { backgroundColor: '#ffffff' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Weather', tabBarLabel: 'Home' }}
        />
        <Tabs.Screen
          name="forecast"
          options={{ title: '7-Day Forecast', tabBarLabel: 'Forecast' }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: 'Settings', tabBarLabel: 'Settings' }}
        />
      </Tabs>
    </QueryClientProvider>
  );
}

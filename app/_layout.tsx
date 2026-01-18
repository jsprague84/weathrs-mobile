/**
 * Root layout with tab navigation
 */

import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#2196F3',
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#000000',
          tabBarStyle: {
            backgroundColor: '#ffffff',
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

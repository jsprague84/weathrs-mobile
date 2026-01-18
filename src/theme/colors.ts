/**
 * Color palette for the app
 */

export const Colors = {
  light: {
    // Primary colors
    primary: '#2196F3',
    primaryDark: '#1976D2',
    primaryLight: '#BBDEFB',

    // Background colors
    background: '#F5F5F5',
    surface: '#FFFFFF',
    card: '#FFFFFF',

    // Text colors
    text: '#333333',
    textSecondary: '#666666',
    textMuted: '#999999',

    // Status colors
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',

    // Border colors
    border: '#E0E0E0',
    divider: '#EEEEEE',

    // Tab bar
    tabBar: '#FFFFFF',
    tabBarInactive: '#999999',
  },
  dark: {
    // Primary colors
    primary: '#64B5F6',
    primaryDark: '#1976D2',
    primaryLight: '#1E3A5F',

    // Background colors
    background: '#121212',
    surface: '#1E1E1E',
    card: '#2C2C2C',

    // Text colors
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textMuted: '#808080',

    // Status colors
    success: '#81C784',
    error: '#E57373',
    warning: '#FFB74D',

    // Border colors
    border: '#404040',
    divider: '#333333',

    // Tab bar
    tabBar: '#1E1E1E',
    tabBarInactive: '#808080',
  },
} as const;

export type ColorScheme = keyof typeof Colors;

// Use a more flexible type that accepts any string color values
export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  error: string;
  warning: string;
  border: string;
  divider: string;
  tabBar: string;
  tabBarInactive: string;
}

/**
 * Color palette for the app
 *
 * Modern slate-tinted palette inspired by Tailwind/shadcn design system.
 * Blue-gray neutrals create an atmospheric, cohesive feel for a weather app.
 */

export const Colors = {
  light: {
    // Primary colors
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#DBEAFE',

    // Background colors
    background: '#F8FAFC',
    surface: '#FFFFFF',
    card: '#FFFFFF',

    // Text colors
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',

    // Status colors
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',

    // Border colors
    border: '#E2E8F0',
    divider: '#F1F5F9',

    // Tab bar
    tabBar: '#FFFFFF',
    tabBarInactive: '#94A3B8',

    // Data visualization
    chartRed: '#EF4444',
    chartBlue: '#3B82F6',
    chartGreen: '#22C55E',
    chartPurple: '#8B5CF6',
    chartOrange: '#F59E0B',
    chartYellow: '#EAB308',
  },
  dark: {
    // Primary colors
    primary: '#60A5FA',
    primaryDark: '#2563EB',
    primaryLight: '#1E3A5F',

    // Background colors — blue-tinted slate for modern atmospheric feel
    background: '#0F172A',
    surface: '#1E293B',
    card: '#334155',

    // Text colors
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',

    // Status colors
    success: '#4ADE80',
    error: '#F87171',
    warning: '#FBBF24',

    // Border colors
    border: '#475569',
    divider: '#334155',

    // Tab bar
    tabBar: '#1E293B',
    tabBarInactive: '#64748B',

    // Data visualization
    chartRed: '#F87171',
    chartBlue: '#60A5FA',
    chartGreen: '#4ADE80',
    chartPurple: '#A78BFA',
    chartOrange: '#FBBF24',
    chartYellow: '#FDE047',
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
  chartRed: string;
  chartBlue: string;
  chartGreen: string;
  chartPurple: string;
  chartOrange: string;
  chartYellow: string;
}

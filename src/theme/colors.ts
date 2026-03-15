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
    // Primary colors — Ayu warm golden accent
    primary: '#E6B450',
    primaryDark: '#FF8F40',
    primaryLight: '#1A1F29',

    // Background colors — Ayu Dark
    background: '#0B0E14',
    surface: '#0D1017',
    card: '#131721',

    // Text colors — Ayu Dark
    text: '#BFBDB6',
    textSecondary: '#ACB6BF',
    textMuted: '#565B66',

    // Status colors — Ayu Dark
    success: '#7FD962',
    error: '#D95757',
    warning: '#E6B450',

    // Border colors — Ayu Dark
    border: '#1C2433',
    divider: '#151A25',

    // Tab bar
    tabBar: '#0B0E14',
    tabBarInactive: '#565B66',

    // Data visualization — Ayu Dark accents
    chartRed: '#D95757',
    chartBlue: '#59C2FF',
    chartGreen: '#7FD962',
    chartPurple: '#D2A6FF',
    chartOrange: '#FF8F40',
    chartYellow: '#E6B450',
  },
  midnight: {
    // Primary colors — Moonlight blue
    primary: '#82AAFF',
    primaryDark: '#65A0F7',
    primaryLight: '#2F334D',

    // Background colors — Moonlight II
    background: '#222436',
    surface: '#1E2030',
    card: '#2F334D',

    // Text colors — Moonlight
    text: '#C8D3F5',
    textSecondary: '#B4C2F0',
    textMuted: '#636DA6',

    // Status colors — Moonlight
    success: '#C3E88D',
    error: '#FF757F',
    warning: '#FFC777',

    // Border colors
    border: '#383E5C',
    divider: '#2F334D',

    // Tab bar
    tabBar: '#1E2030',
    tabBarInactive: '#636DA6',

    // Data visualization — Moonlight accents
    chartRed: '#FF757F',
    chartBlue: '#82AAFF',
    chartGreen: '#C3E88D',
    chartPurple: '#C099FF',
    chartOrange: '#FFC777',
    chartYellow: '#FFC777',
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

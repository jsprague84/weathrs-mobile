/**
 * Theme context for dark mode support
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeMode } from '@/stores/settingsStore';
import { Colors, type ThemeColors } from './colors';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  colorScheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const themeMode = useThemeMode();

  const resolvedScheme = themeMode === 'system'
    ? (systemColorScheme ?? 'light')
    : themeMode === 'midnight'
      ? 'midnight'
      : themeMode;
  // For the theme context, both 'dark' and 'midnight' are dark modes
  const colorScheme = resolvedScheme === 'midnight' ? 'dark' : resolvedScheme;
  const isDark = resolvedScheme === 'dark' || resolvedScheme === 'midnight';
  const paletteKey = resolvedScheme as keyof typeof Colors;

  const value = useMemo(
    () => ({
      colors: Colors[paletteKey],
      isDark,
      colorScheme: colorScheme as 'light' | 'dark',
    }),
    [paletteKey, isDark, colorScheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for creating themed styles
export function useThemedStyles<T>(
  styleCreator: (colors: ThemeColors, isDark: boolean) => T
): T {
  const { colors, isDark } = useTheme();
  return useMemo(() => styleCreator(colors, isDark), [colors, isDark, styleCreator]);
}

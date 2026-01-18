/**
 * Reusable Card component with theme support
 */

import { View, StyleSheet, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '@/theme';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'filled';
}

export function Card({ children, style, variant = 'elevated' }: CardProps) {
  const { colors, isDark } = useTheme();

  const getCardStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...base,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'outlined':
        return {
          ...base,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          ...base,
          backgroundColor: isDark ? colors.surface : colors.background,
        };
      default:
        return base;
    }
  };

  return <View style={[styles.card, getCardStyle(), style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
});

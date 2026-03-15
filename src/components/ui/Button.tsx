/**
 * Reusable Button component with haptic feedback
 */

import { Pressable, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '@/theme';
import { useHaptics } from '@/hooks/useHaptics';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  const { impact } = useHaptics();

  const handlePress = async () => {
    if (disabled || loading) return;
    await impact();
    onPress();
  };

  const getBackgroundColor = (pressed: boolean): string => {
    if (disabled) return colors.border;

    const variantColors: Record<ButtonVariant, { normal: string; pressed: string }> = {
      primary: { normal: colors.primary, pressed: colors.primaryDark },
      secondary: { normal: isDark ? colors.surface : colors.primaryLight, pressed: colors.primaryDark + '33' },
      success: { normal: colors.success, pressed: colors.chartGreen },
      danger: { normal: colors.error, pressed: colors.chartRed },
      ghost: { normal: 'transparent', pressed: isDark ? colors.surface : colors.background },
    };

    return pressed ? variantColors[variant].pressed : variantColors[variant].normal;
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textMuted;

    const textColors: Record<ButtonVariant, string> = {
      primary: '#FFFFFF',
      secondary: colors.primary,
      success: '#FFFFFF',
      danger: '#FFFFFF',
      ghost: colors.primary,
    };

    return textColors[variant];
  };

  const sizeStyles: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
    small: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
    medium: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 },
    large: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18 },
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: getBackgroundColor(pressed),
          paddingVertical: sizeStyles[size].paddingVertical,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          opacity: loading ? 0.7 : 1,
        },
        fullWidth && styles.fullWidth,
        variant === 'ghost' && { borderWidth: 1, borderColor: colors.primary },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: getTextColor(), fontSize: sizeStyles[size].fontSize },
          textStyle,
        ]}
      >
        {loading ? 'Loading...' : title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
  },
});

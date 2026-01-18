/**
 * Reusable Button component with haptic feedback
 */

import { Pressable, Text, StyleSheet, type ViewStyle, type TextStyle, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';

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

  const handlePress = async () => {
    if (disabled || loading) return;

    // Haptic feedback on press (iOS and Android)
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress();
  };

  const getBackgroundColor = (pressed: boolean): string => {
    if (disabled) return colors.border;

    const variantColors: Record<ButtonVariant, { normal: string; pressed: string }> = {
      primary: { normal: colors.primary, pressed: colors.primaryDark },
      secondary: { normal: isDark ? colors.surface : '#E3F2FD', pressed: colors.primaryLight },
      success: { normal: colors.success, pressed: '#388E3C' },
      danger: { normal: colors.error, pressed: '#D32F2F' },
      ghost: { normal: 'transparent', pressed: isDark ? colors.surface : '#F5F5F5' },
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

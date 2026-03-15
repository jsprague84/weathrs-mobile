import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonBase({ width = '100%', height = 16, borderRadius = 4, style }: SkeletonProps) {
  const { colors, isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: isDark ? colors.surface : colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

function Line({ width = '100%', height = 14, style }: SkeletonProps) {
  return <SkeletonBase width={width} height={height} borderRadius={4} style={style} />;
}

function Circle({ size = 40, style }: { size?: number; style?: ViewStyle }) {
  return <SkeletonBase width={size} height={size} borderRadius={size / 2} style={style} />;
}

function WeatherCardSkeleton() {
  return (
    <View style={skeletonStyles.card}>
      <View style={skeletonStyles.cardHeader}>
        <Circle size={48} />
        <View style={skeletonStyles.cardHeaderText}>
          <Line width={120} height={28} />
          <Line width={80} height={14} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Line width="60%" height={18} style={{ marginTop: 16 }} />
      <View style={skeletonStyles.cardGrid}>
        <Line width="45%" height={40} />
        <Line width="45%" height={40} />
        <Line width="45%" height={40} />
        <Line width="45%" height={40} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    padding: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
});

export const Skeleton = {
  Line,
  Circle,
  Card: WeatherCardSkeleton,
};

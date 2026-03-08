/**
 * Banner indicating data is stale / from cache (offline mode)
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface StaleDataBannerProps {
  dataUpdatedAt: number;
}

function getRelativeTime(timestampMs: number): string {
  const diffMs = Date.now() - timestampMs;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Updated just now';
  if (diffMin < 60) return `Updated ${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Updated ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Updated yesterday';
  return `Updated ${diffDays} days ago`;
}

export function StaleDataBanner({ dataUpdatedAt }: StaleDataBannerProps) {
  const { colors } = useTheme();

  const diffMin = (Date.now() - dataUpdatedAt) / 60000;
  const isVeryStale = diffMin > 10;

  return (
    <View style={[styles.banner, {
      backgroundColor: isVeryStale ? 'rgba(255, 193, 7, 0.15)' : 'rgba(158, 158, 158, 0.12)',
    }]}>
      <Ionicons
        name="cloud-offline-outline"
        size={16}
        color={isVeryStale ? '#F9A825' : colors.textMuted}
      />
      <Text style={[styles.text, {
        color: isVeryStale ? '#F9A825' : colors.textMuted,
      }]}>
        {getRelativeTime(dataUpdatedAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
});

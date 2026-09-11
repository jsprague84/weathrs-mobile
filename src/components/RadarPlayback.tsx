import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

interface RadarPlaybackProps {
  /** Unix timestamp (seconds) of the currently displayed radar frame. */
  currentTimestamp: number;
}

function formatTimeAgo(timestamp: number): string {
  const diffMinutes = Math.round((Date.now() / 1000 - timestamp) / 60);
  if (diffMinutes <= 0) return 'Updated just now';
  if (diffMinutes === 1) return 'Updated 1 min ago';
  if (diffMinutes < 60) return 'Updated ' + diffMinutes + ' min ago';
  const hours = Math.floor(diffMinutes / 60);
  return 'Updated ' + hours + 'h ' + (diffMinutes % 60) + 'm ago';
}

export function RadarPlayback({ currentTimestamp }: RadarPlaybackProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
      <Text style={[styles.liveLabel, { color: colors.text }]}>Live</Text>
      <Text style={[styles.timestamp, { color: colors.textMuted }]}>
        {formatTimeAgo(currentTimestamp)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 'auto',
  },
});

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface RadarPlaybackProps {
  /** Unix timestamp of the currently displayed frame */
  currentTimestamp: number;
  /** Whether animation is playing (for future use) */
  isPlaying: boolean;
  /** Toggle play/pause (for future use) */
  onTogglePlay: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diffMinutes = Math.round((now - timestamp) / 60);

  if (diffMinutes <= 0) return 'Now';
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const hours = Math.floor(diffMinutes / 60);
  return `${hours}h ${diffMinutes % 60}m ago`;
}

export function RadarPlayback({
  currentTimestamp,
  isPlaying,
  onTogglePlay,
}: RadarPlaybackProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onTogglePlay}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause radar animation' : 'Play radar animation'}
        style={styles.playButton}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={20}
          color={colors.text}
        />
      </Pressable>

      <View style={styles.timeline}>
        {/* Progress bar */}
        <View style={[styles.track, { backgroundColor: colors.card }]}>
          {/* For single-frame (free tier), show full bar */}
          <View
            style={[
              styles.progress,
              { width: '100%', backgroundColor: colors.primary },
            ]}
          />
          {/* Scrubber handle */}
          <View style={[styles.handle, { left: '100%' }]} />
        </View>

        {/* Timestamp labels */}
        <View style={styles.labels}>
          <Text style={[styles.labelText, { color: colors.textMuted }]}>
            {formatTimeAgo(currentTimestamp)}
          </Text>
          <Text style={[styles.labelText, { color: colors.text, fontWeight: '500' }]}>
            Live
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  playButton: {
    padding: 4,
  },
  timeline: {
    flex: 1,
  },
  track: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  progress: {
    height: '100%',
    borderRadius: 2,
  },
  handle: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    transform: [{ translateX: -6 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  labelText: {
    fontSize: 9,
  },
});

/**
 * Weather alert banner for displaying active weather warnings
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import type { WeatherAlert } from '@/types';

interface AlertBannerProps {
  alerts: WeatherAlert[];
}

const RED_KEYWORDS = ['Warning', 'Tornado', 'Hurricane', 'Tsunami', 'Emergency'];
const ORANGE_KEYWORDS = ['Watch', 'Advisory'];

function getSeverityColors(event: string): { bg: string; text: string } {
  if (RED_KEYWORDS.some((kw) => event.includes(kw))) {
    return { bg: '#D32F2F', text: '#FFFFFF' };
  }
  if (ORANGE_KEYWORDS.some((kw) => event.includes(kw))) {
    return { bg: '#F57C00', text: '#FFFFFF' };
  }
  return { bg: '#FFF176', text: '#212121' };
}

function formatAlertTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function AlertItem({ alert }: { alert: WeatherAlert }) {
  const [expanded, setExpanded] = useState(false);
  const severity = getSeverityColors(alert.event);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded(!expanded)}
      style={[styles.alertItem, { backgroundColor: severity.bg }]}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertInfo}>
          <Text style={[styles.eventName, { color: severity.text }]}>
            {alert.event}
          </Text>
          <Text style={[styles.senderName, { color: severity.text, opacity: 0.8 }]}>
            {alert.sender}
          </Text>
          <Text style={[styles.timeRange, { color: severity.text, opacity: 0.8 }]}>
            Until {formatAlertTime(alert.end)}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={severity.text}
        />
      </View>
      {expanded && (
        <Text style={[styles.alertDescription, { color: severity.text, opacity: 0.9 }]}>
          {alert.description}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  const { colors } = useTheme();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alerts.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {alerts.length > 1 && (
          <Text style={[styles.countBadge, { color: colors.textSecondary }]}>
            {alerts.length} active alerts
          </Text>
        )}
        <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={8} style={styles.dismissButton}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {alerts.length === 1 ? (
        <AlertItem alert={alerts[0]} />
      ) : (
        <FlatList
          data={alerts}
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <AlertItem alert={item} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  dismissButton: {
    padding: 4,
  },
  alertItem: {
    borderRadius: 12,
    padding: 14,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  alertInfo: {
    flex: 1,
    marginRight: 8,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  senderName: {
    fontSize: 12,
    marginTop: 2,
  },
  timeRange: {
    fontSize: 12,
    marginTop: 4,
  },
  alertDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  listContent: {
    gap: 10,
  },
  listItem: {
    width: 300,
  },
});

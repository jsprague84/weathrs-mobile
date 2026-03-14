/**
 * Displays the current date and time, updating every minute.
 */

import { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

function formatDateTime(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function CurrentDateTime() {
  const { colors } = useTheme();
  const [dateTime, setDateTime] = useState(formatDateTime);

  useEffect(() => {
    // Update at the start of the next minute, then every 60s
    const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000;
    const timeout = setTimeout(() => {
      setDateTime(formatDateTime());
      const interval = setInterval(() => setDateTime(formatDateTime()), 60_000);
      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Text style={[styles.dateTime, { color: colors.textSecondary }]}>
      {dateTime}
    </Text>
  );
}

const styles = StyleSheet.create({
  dateTime: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
});

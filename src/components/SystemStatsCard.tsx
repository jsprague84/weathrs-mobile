/**
 * System statistics dashboard card.
 */

import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { useStats } from '@/hooks/useWeather';
import { api } from '@/services/api';
import { Card } from './ui/Card';

export function SystemStatsCard() {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const stats = useStats();

  return (
    <Card>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>System Stats</Text>
        {stats.isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : stats.data ? (
          <View style={{ gap: 16 }}>
            {/* API Budget */}
            <View>
              <Text style={[styles.statsLabel, { color: colors.text }]}>API Budget</Text>
              <View style={[styles.progressBarBg, { backgroundColor: isDark ? colors.surface : colors.border }]}>
                <View style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min((stats.data.apiBudget.usedToday / stats.data.apiBudget.dailyLimit) * 100, 100)}%`,
                    backgroundColor: stats.data.apiBudget.usedToday / stats.data.apiBudget.dailyLimit < 0.5
                      ? colors.success
                      : stats.data.apiBudget.usedToday / stats.data.apiBudget.dailyLimit < 0.8
                        ? colors.chartYellow
                        : colors.error,
                  },
                ]} />
              </View>
              <Text style={[styles.statsValue, { color: colors.textSecondary }]}>
                {stats.data.apiBudget.usedToday} / {stats.data.apiBudget.dailyLimit} calls today ({stats.data.apiBudget.remainingToday} remaining)
              </Text>
            </View>

            {/* Tile Usage */}
            {stats.data.tileUsage && (
              <View>
                <Text style={[styles.statsLabel, { color: colors.text }]}>Tile Usage</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={[styles.statsCityName, { color: colors.text }]}>OWM Tiles</Text>
                  <Text style={[styles.statsValue, { color: colors.textSecondary, marginTop: 0 }]}>
                    {stats.data.tileUsage.owmTiles.usedToday} / {stats.data.tileUsage.owmTiles.dailyLimit}
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? colors.surface : colors.border }]}>
                  <View style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min((stats.data.tileUsage.owmTiles.usedToday / stats.data.tileUsage.owmTiles.dailyLimit) * 100, 100)}%`,
                      backgroundColor:
                        stats.data.tileUsage.owmTiles.usedToday / stats.data.tileUsage.owmTiles.dailyLimit < 0.5
                          ? colors.success
                          : stats.data.tileUsage.owmTiles.usedToday / stats.data.tileUsage.owmTiles.dailyLimit < 0.8
                            ? colors.chartYellow
                            : colors.error,
                    },
                  ]} />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, marginTop: 10 }}>
                  <Text style={[styles.statsCityName, { color: colors.text }]}>Google Maps</Text>
                  <Text style={[styles.statsValue, { color: colors.textSecondary, marginTop: 0 }]}>
                    {stats.data.tileUsage.googleMapsTiles.usedToday} / {stats.data.tileUsage.googleMapsTiles.dailyLimit}
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? colors.surface : colors.border }]}>
                  <View style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min((stats.data.tileUsage.googleMapsTiles.usedToday / stats.data.tileUsage.googleMapsTiles.dailyLimit) * 100, 100)}%`,
                      backgroundColor:
                        stats.data.tileUsage.googleMapsTiles.usedToday / stats.data.tileUsage.googleMapsTiles.dailyLimit < 0.5
                          ? colors.success
                          : stats.data.tileUsage.googleMapsTiles.usedToday / stats.data.tileUsage.googleMapsTiles.dailyLimit < 0.8
                            ? colors.chartYellow
                            : colors.error,
                    },
                  ]} />
                </View>
              </View>
            )}

            {/* History Coverage */}
            {stats.data.history.cities.length > 0 && (
              <View>
                <Text style={[styles.statsLabel, { color: colors.text }]}>
                  History ({stats.data.history.totalRecords.toLocaleString()} records)
                </Text>
                {stats.data.history.cities.map((cityStat) => {
                  const earliest = new Date(cityStat.earliestTimestamp * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  const latest = new Date(cityStat.latestTimestamp * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  const statusColor = cityStat.missingDays === 0 ? colors.success : cityStat.missingDays < 30 ? colors.chartYellow : colors.error;
                  return (
                    <View key={cityStat.city} style={styles.statsCityRow}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.statsCityName, { color: colors.text }]}>{cityStat.city}</Text>
                        <Text style={{ fontSize: 10, color: colors.textMuted }}>{cityStat.locationKey}</Text>
                        <Text style={[styles.statsCityDetail, { color: colors.textMuted }]}>
                          {earliest} — {latest} | {cityStat.recordCount.toLocaleString()} records | {cityStat.missingDays} missing days
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          Alert.alert(
                            'Delete History',
                            `Delete all history for ${cityStat.city}? ${cityStat.recordCount} records will be permanently removed.`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    await api.deleteHistory(cityStat.locationKey);
                                    queryClient.invalidateQueries({ queryKey: ['stats'] });
                                  } catch {
                                    Alert.alert('Error', 'Failed to delete history');
                                  }
                                },
                              },
                            ]
                          );
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete history for ${cityStat.city}`}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </Pressable>
                    </View>
                  );
                })}

                <Pressable
                  onPress={async () => {
                    try {
                      const result = await api.cleanupHistory();
                      Alert.alert('Cleanup Complete', `Updated ${result.updated} records`);
                      queryClient.invalidateQueries({ queryKey: ['stats'] });
                    } catch {
                      Alert.alert('Error', 'Cleanup failed');
                    }
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 10,
                    marginTop: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Clean up duplicate location records"
                >
                  <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 13, marginLeft: 6 }}>Clean Up Duplicates</Text>
                </Pressable>
              </View>
            )}

            {/* Backfill Progress */}
            {stats.data.backfill && (
              <View>
                <Text style={[styles.statsLabel, { color: colors.text }]}>
                  Backfill ({stats.data.backfill.enabled ? 'Enabled' : 'Disabled'})
                </Text>
                <Text style={[styles.statsValue, { color: colors.textSecondary }]}>
                  Target: {stats.data.backfill.maxYears} years | Budget: {stats.data.backfill.dailyBudget}/day | Cron: {stats.data.backfill.cron}
                </Text>
                {stats.data.history.cities.map((city) => {
                  const totalDays = stats.data!.backfill.maxYears * 365;
                  const covered = Math.max(totalDays - city.missingDays, 0);
                  const pct = totalDays > 0 ? Math.round((covered / totalDays) * 100) : 0;
                  return (
                    <Text key={`bf-${city.city}`} style={[styles.statsCityDetail, { color: colors.textMuted, marginTop: 4 }]}>
                      {city.city}: {pct}% ({covered.toLocaleString()} / {totalDays.toLocaleString()} days)
                    </Text>
                  );
                })}
              </View>
            )}

            {/* Devices & Scheduler */}
            <View style={styles.statsRow}>
              <Text style={[styles.statsValue, { color: colors.textSecondary }]}>
                Devices: {stats.data.devices.total} ({stats.data.devices.enabled} enabled)
                {Object.entries(stats.data.devices.byPlatform).map(([p, c]) => ` | ${p}: ${c}`).join('')}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={[styles.statsValue, { color: colors.textSecondary }]}>
                Jobs: {stats.data.scheduler.totalJobs} ({stats.data.scheduler.enabledJobs} enabled)
              </Text>
            </View>

            {/* Database & Cache */}
            <View>
              <Text style={[styles.statsLabel, { color: colors.text }]}>Database</Text>
              <Text style={[styles.statsValue, { color: colors.textSecondary }]}>
                Size: {stats.data.database.sizeHuman} | Cache: 15m forecast, 5m weather
              </Text>
            </View>

            {/* Last Updated */}
            {stats.dataUpdatedAt > 0 && (
              <Text style={[styles.statsTimestamp, { color: colors.textMuted }]}>
                Updated {new Date(stats.dataUpdatedAt).toLocaleTimeString()}
              </Text>
            )}
          </View>
        ) : stats.error ? (
          <Text style={[styles.statsValue, { color: colors.error }]}>Failed to load stats</Text>
        ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  statsValue: { fontSize: 13, marginTop: 4 },
  statsRow: {},
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' as const },
  progressBarFill: { height: '100%', borderRadius: 4 },
  statsCityRow: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, gap: 8, marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  statsCityName: { fontSize: 14, fontWeight: '500' },
  statsCityDetail: { fontSize: 11, marginTop: 2 },
  statsTimestamp: { fontSize: 11, textAlign: 'center' as const, marginTop: 4 },
});

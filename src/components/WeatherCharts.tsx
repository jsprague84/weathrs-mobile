/**
 * Weather charts component for visualizing forecast data
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Pressable, Platform } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import type { HourlyForecast, DailyForecast, Units } from '@/types';

type ChartType = 'temperature' | 'precipitation' | 'humidity' | 'wind';

interface WeatherChartsProps {
  hourlyData?: HourlyForecast[];
  dailyData?: DailyForecast[];
  units?: Units;
}

function getTemperatureUnit(units: Units): string {
  switch (units) {
    case 'imperial':
      return '°F';
    case 'metric':
      return '°C';
    default:
      return 'K';
  }
}

function getSpeedUnit(units: Units): string {
  return units === 'imperial' ? 'mph' : 'm/s';
}

function formatHour(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
  }).replace(' ', '');
}

function formatDay(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
  });
}

export function WeatherCharts({ hourlyData, dailyData, units = 'imperial' }: WeatherChartsProps) {
  const { colors, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [activeChart, setActiveChart] = useState<ChartType>('temperature');

  // Calculate chart width based on current screen width (updates on rotation)
  const chartWidth = windowWidth - 64; // Account for padding

  const handleChartChange = async (chart: ChartType) => {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
    setActiveChart(chart);
  };

  // Use first 24 hours for hourly charts, 7 days for daily
  const hourlySlice = hourlyData?.slice(0, 24) || [];
  const dailySlice = dailyData?.slice(0, 7) || [];

  if (hourlySlice.length === 0 && dailySlice.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No data available for charts
        </Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      const hex = colors.primary.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    labelColor: () => colors.textSecondary,
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  const precipChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue for precipitation
  };

  const humidityChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for humidity
  };

  const windChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`, // Purple for wind
  };

  // Show labels every 2 hours to prevent chart from being too wide
  const hourlyLabels = hourlySlice.map((h, i) =>
    i % 2 === 0 ? formatHour(h.timestamp) : ''
  );

  // Temperature data (hourly)
  const tempData = {
    labels: hourlyLabels,
    datasets: [
      {
        data: hourlySlice.map((h) => Math.round(h.temperature)),
        color: (opacity = 1) => {
          const hex = colors.primary.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        },
        strokeWidth: 2,
      },
      {
        data: hourlySlice.map((h) => Math.round(h.feels_like)),
        color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`, // Orange for feels like
        strokeWidth: 2,
      },
    ],
    legend: [`Temperature (${getTemperatureUnit(units)})`, 'Feels Like'],
  };

  // Precipitation probability data (hourly, bar chart)
  const precipData = {
    labels: hourlyLabels,
    datasets: [
      {
        data: hourlySlice.map((h) => Math.round(h.precipitation_probability * 100)),
      },
    ],
  };

  // Humidity data (hourly)
  const humidityData = {
    labels: hourlyLabels,
    datasets: [
      {
        data: hourlySlice.map((h) => h.humidity),
        strokeWidth: 2,
      },
    ],
  };

  // Wind speed data (hourly)
  const windData = {
    labels: hourlyLabels,
    datasets: [
      {
        data: hourlySlice.map((h) => Math.round(h.wind_speed)),
        strokeWidth: 2,
      },
    ],
  };

  // Daily temperature range data
  const dailyTempData = {
    labels: dailySlice.map((d) => formatDay(d.timestamp)),
    datasets: [
      {
        data: dailySlice.map((d) => Math.round(d.temp_max)),
        color: (opacity = 1) => `rgba(244, 67, 54, ${opacity})`, // Red for high
        strokeWidth: 2,
      },
      {
        data: dailySlice.map((d) => Math.round(d.temp_min)),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue for low
        strokeWidth: 2,
      },
    ],
    legend: [`High (${getTemperatureUnit(units)})`, `Low (${getTemperatureUnit(units)})`],
  };

  // Daily precipitation data
  const dailyPrecipData = {
    labels: dailySlice.map((d) => formatDay(d.timestamp)),
    datasets: [
      {
        data: dailySlice.map((d) => Math.round(d.precipitation_probability * 100)),
      },
    ],
  };

  // Daily humidity data
  const dailyHumidityData = {
    labels: dailySlice.map((d) => formatDay(d.timestamp)),
    datasets: [
      {
        data: dailySlice.map((d) => d.humidity),
        strokeWidth: 2,
      },
    ],
  };

  // Daily wind data
  const dailyWindData = {
    labels: dailySlice.map((d) => formatDay(d.timestamp)),
    datasets: [
      {
        data: dailySlice.map((d) => Math.round(d.wind_speed)),
        strokeWidth: 2,
      },
    ],
  };

  const chartButtons: { type: ChartType; label: string }[] = [
    { type: 'temperature', label: 'Temp' },
    { type: 'precipitation', label: 'Precip' },
    { type: 'humidity', label: 'Humidity' },
    { type: 'wind', label: 'Wind' },
  ];

  return (
    <View style={styles.container}>
      {/* Chart Type Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollView}
        contentContainerStyle={styles.tabContainer}
      >
        {chartButtons.map(({ type, label }) => (
          <Pressable
            key={type}
            style={[
              styles.tabButton,
              {
                backgroundColor: activeChart === type
                  ? (isDark ? colors.primaryLight : '#E3F2FD')
                  : (isDark ? colors.surface : colors.background),
                borderColor: activeChart === type ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleChartChange(type)}
          >
            <Text
              style={[
                styles.tabButtonText,
                {
                  color: activeChart === type ? colors.primary : colors.textSecondary,
                },
                activeChart === type && styles.tabButtonTextActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Charts */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          {activeChart === 'temperature' && (
            <>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                24-Hour Temperature
              </Text>
              <LineChart
                data={tempData}
                width={Math.max(chartWidth, hourlySlice.length * 20)}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={false}
                fromZero={false}
              />

              <Text style={[styles.chartTitle, { color: colors.text, marginTop: 24 }]}>
                7-Day Temperature Range
              </Text>
              <LineChart
                data={dailyTempData}
                width={Math.max(chartWidth, dailySlice.length * 60)}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={false}
                fromZero={false}
              />
            </>
          )}

          {activeChart === 'precipitation' && (
            <>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                24-Hour Precipitation Chance
              </Text>
              <BarChart
                data={precipData}
                width={Math.max(chartWidth, hourlySlice.length * 20)}
                height={220}
                chartConfig={precipChartConfig}
                style={styles.chart}
                yAxisSuffix="%"
                yAxisLabel=""
                fromZero
                showValuesOnTopOfBars
              />

              <Text style={[styles.chartTitle, { color: colors.text, marginTop: 24 }]}>
                7-Day Precipitation Chance
              </Text>
              <BarChart
                data={dailyPrecipData}
                width={Math.max(chartWidth, dailySlice.length * 60)}
                height={220}
                chartConfig={precipChartConfig}
                style={styles.chart}
                yAxisSuffix="%"
                yAxisLabel=""
                fromZero
                showValuesOnTopOfBars
              />
            </>
          )}

          {activeChart === 'humidity' && (
            <>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                24-Hour Humidity
              </Text>
              <LineChart
                data={humidityData}
                width={Math.max(chartWidth, hourlySlice.length * 20)}
                height={220}
                chartConfig={humidityChartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={false}
                yAxisSuffix="%"
                fromZero
              />

              <Text style={[styles.chartTitle, { color: colors.text, marginTop: 24 }]}>
                7-Day Humidity
              </Text>
              <LineChart
                data={dailyHumidityData}
                width={Math.max(chartWidth, dailySlice.length * 60)}
                height={220}
                chartConfig={humidityChartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={false}
                yAxisSuffix="%"
                fromZero
              />
            </>
          )}

          {activeChart === 'wind' && (
            <>
              <Text style={[styles.chartTitle, { color: colors.text }]}>
                24-Hour Wind Speed
              </Text>
              <LineChart
                data={windData}
                width={Math.max(chartWidth, hourlySlice.length * 20)}
                height={220}
                chartConfig={windChartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={false}
                yAxisSuffix={` ${getSpeedUnit(units)}`}
                fromZero
              />

              <Text style={[styles.chartTitle, { color: colors.text, marginTop: 24 }]}>
                7-Day Wind Speed
              </Text>
              <LineChart
                data={dailyWindData}
                width={Math.max(chartWidth, dailySlice.length * 60)}
                height={220}
                chartConfig={windChartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={false}
                yAxisSuffix={` ${getSpeedUnit(units)}`}
                fromZero
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  tabScrollView: {
    marginBottom: 12,
  },
  tabContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabButtonText: {
    fontSize: 14,
  },
  tabButtonTextActive: {
    fontWeight: '600',
  },
  chartCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
    marginVertical: 4,
  },
  chartLegend: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
});

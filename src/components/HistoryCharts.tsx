/**
 * History charts component for visualizing historical weather trends
 * Uses react-native-gifted-charts for rendering
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { useTheme } from '@/theme';
import type { DailyHistorySummary, Units } from '@/types';

type HistoryChartType = 'temperature' | 'precipitation' | 'humidity' | 'wind';

interface HistoryChartsProps {
  data: DailyHistorySummary[];
  chartType: HistoryChartType;
  units?: Units;
}

function getTemperatureUnit(units: Units): string {
  switch (units) {
    case 'imperial':
      return '\u00B0F';
    case 'metric':
      return '\u00B0C';
    default:
      return 'K';
  }
}

/**
 * Compute y-axis scaling props that handle both positive and negative values.
 * gifted-charts requires: maxValue = noOfSections * stepValue
 * and: mostNegativeValue = noOfSectionsBelowXAxis * stepValue
 */
function getYAxisProps(datasets: { value: number }[][]) {
  const allValues = datasets.flat().map((d) => d.value);
  if (allValues.length === 0) return {};

  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);

  // Add padding so data points aren't clipped at edges
  const padding = Math.max(Math.ceil((maxVal - minVal) * 0.1), 1);
  const paddedMax = maxVal + padding;
  const paddedMin = minVal - padding;

  // Pick a nice step value for ~5 sections across the full range
  const range = paddedMax - Math.min(paddedMin, 0);
  const rawStep = range / 5;
  // Round step to a "nice" number (1, 2, 5, 10, 20, 25, 50, ...)
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const niceStep = magnitude * (residual <= 1.5 ? 1 : residual <= 3.5 ? 2.5 : residual <= 7.5 ? 5 : 10);
  const stepValue = Math.max(Math.ceil(niceStep), 1);

  const noOfSections = Math.ceil(paddedMax / stepValue);
  const computedMax = noOfSections * stepValue;

  if (paddedMin >= 0) {
    return { maxValue: computedMax, noOfSections, stepValue };
  }

  const noOfSectionsBelowXAxis = Math.ceil(Math.abs(paddedMin) / stepValue);
  const mostNegativeValue = noOfSectionsBelowXAxis * stepValue;

  return {
    maxValue: computedMax,
    noOfSections,
    stepValue,
    mostNegativeValue,
    noOfSectionsBelowXAxis,
    // Push x-axis labels below the negative region so they don't overlap the chart
    xAxisLabelsVerticalShift: noOfSectionsBelowXAxis * 30,
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function HistoryCharts({ data, chartType, units = 'imperial' }: HistoryChartsProps) {
  const { colors } = useTheme();

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No history data available
        </Text>
      </View>
    );
  }

  const commonLineProps = {
    thickness: 2,
    hideRules: true,
    yAxisTextStyle: { color: colors.textSecondary, fontSize: 10 },
    xAxisLabelTextStyle: { color: colors.textSecondary, fontSize: 9, width: 40, textAlign: 'center' as const },
    hideDataPoints: false,
    dataPointsRadius: 3,
    spacing: data.length > 14 ? 25 : 40,
    initialSpacing: 10,
    endSpacing: 10,
    yAxisColor: 'transparent',
    xAxisColor: colors.border,
    isAnimated: true,
    animationDuration: 500,
    curved: true,
    height: 200,
  };

  // Show labels every N items to avoid crowding
  const labelInterval = data.length > 14 ? 3 : data.length > 7 ? 2 : 1;

  if (chartType === 'temperature') {
    const highData = data.map((d, i) => ({
      value: Math.round(d.temp_max),
      label: i % labelInterval === 0 ? formatDate(d.date) : '',
    }));

    const lowData = data.map((d, i) => ({
      value: Math.round(d.temp_min),
      label: i % labelInterval === 0 ? formatDate(d.date) : '',
    }));

    const avgData = data.map((d, i) => ({
      value: Math.round(d.temp_avg),
      label: i % labelInterval === 0 ? formatDate(d.date) : '',
    }));

    return (
      <View>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Temperature Trend ({getTemperatureUnit(units)})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={highData}
            data2={lowData}
            data3={avgData}
            {...commonLineProps}
            {...getYAxisProps([highData, lowData, avgData])}
            color="#F44336"
            color2="#2196F3"
            color3={colors.primary}
            dataPointsColor="#F44336"
            dataPointsColor2="#2196F3"
            dataPointsColor3={colors.primary}
            areaChart
            startFillColor="rgba(244, 67, 54, 0.1)"
            endFillColor="rgba(33, 150, 243, 0.1)"
            startOpacity={0.3}
            endOpacity={0.05}
          />
        </ScrollView>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>High</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Avg</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Low</Text>
          </View>
        </View>
      </View>
    );
  }

  if (chartType === 'precipitation') {
    const precipData = data.map((d, i) => ({
      value: Math.round(d.precipitation_total * 10) / 10,
      label: i % labelInterval === 0 ? formatDate(d.date) : '',
      frontColor: 'rgba(33, 150, 243, 0.7)',
    }));

    return (
      <View>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Daily Precipitation (mm)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={precipData}
            barWidth={data.length > 14 ? 14 : 24}
            spacing={data.length > 14 ? 12 : 18}
            initialSpacing={10}
            height={200}
            yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 9, width: 40, textAlign: 'center' as const }}
            yAxisColor="transparent"
            xAxisColor={colors.border}
            hideRules
            isAnimated
          />
        </ScrollView>
      </View>
    );
  }

  if (chartType === 'humidity') {
    const humidityData = data.map((d, i) => ({
      value: Math.round(d.humidity_avg),
      label: i % labelInterval === 0 ? formatDate(d.date) : '',
    }));

    return (
      <View>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Average Humidity (%)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={humidityData}
            {...commonLineProps}
            color="#4CAF50"
            dataPointsColor="#4CAF50"
            maxValue={100}
            noOfSections={5}
            stepValue={20}
            yAxisLabelSuffix="%"
            areaChart
            startFillColor="rgba(76, 175, 80, 0.2)"
            endFillColor="rgba(76, 175, 80, 0.02)"
            startOpacity={0.4}
            endOpacity={0.05}
          />
        </ScrollView>
      </View>
    );
  }

  if (chartType === 'wind') {
    const windData = data.map((d, i) => ({
      value: Math.round(d.wind_speed_avg * 10) / 10,
      label: i % labelInterval === 0 ? formatDate(d.date) : '',
    }));

    return (
      <View>
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Average Wind Speed ({units === 'imperial' ? 'mph' : 'm/s'})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={windData}
            {...commonLineProps}
            {...getYAxisProps([windData])}
            color="#9C27B0"
            dataPointsColor="#9C27B0"
            areaChart
            startFillColor="rgba(156, 39, 176, 0.15)"
            endFillColor="rgba(156, 39, 176, 0.02)"
            startOpacity={0.3}
            endOpacity={0.05}
          />
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
});

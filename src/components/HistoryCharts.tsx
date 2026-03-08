/**
 * History charts component for visualizing historical weather trends
 * Uses react-native-gifted-charts for rendering
 */

import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
function getYAxisProps(datasets: { value: number }[][], chartHeight: number) {
  const allValues = datasets.flat().map((d) => d.value);
  if (allValues.length === 0) return {};

  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);

  // Add padding so data points aren't clipped at edges
  const padding = Math.max(Math.ceil((maxVal - minVal) * 0.15), 2);
  const paddedMax = maxVal + padding;
  const paddedMin = minVal - padding;

  // Pick a nice step value for ~5 sections across the full range
  const range = paddedMax - Math.min(paddedMin, 0);
  const rawStep = range / 5;
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

  const stepHeight = chartHeight / noOfSections;

  return {
    maxValue: computedMax,
    noOfSections,
    stepValue,
    mostNegativeValue,
    noOfSectionsBelowXAxis,
    xAxisLabelsVerticalShift: Math.ceil(noOfSectionsBelowXAxis * stepHeight),
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function HistoryCharts({ data, chartType, units = 'imperial' }: HistoryChartsProps) {
  const { colors } = useTheme();

  const labelInterval = data.length > 14 ? 3 : data.length > 7 ? 2 : 1;

  const makeLabels = (d: DailyHistorySummary, i: number) =>
    i % labelInterval === 0 ? formatDate(d.date) : '';

  const highData = useMemo(() => data.map((d, i) => ({
    value: Math.round(d.temp_max),
    label: makeLabels(d, i),
  })), [data, labelInterval]);

  const lowData = useMemo(() => data.map((d, i) => ({
    value: Math.round(d.temp_min),
    label: makeLabels(d, i),
  })), [data, labelInterval]);

  const avgData = useMemo(() => data.map((d, i) => ({
    value: Math.round(d.temp_avg),
    label: makeLabels(d, i),
  })), [data, labelInterval]);

  const precipData = useMemo(() => data.map((d, i) => ({
    value: Math.round(d.precipitation_total * 10) / 10,
    label: makeLabels(d, i),
    frontColor: 'rgba(33, 150, 243, 0.7)',
  })), [data, labelInterval]);

  const humidityData = useMemo(() => data.map((d, i) => ({
    value: Math.round(d.humidity_avg),
    label: makeLabels(d, i),
  })), [data, labelInterval]);

  const windData = useMemo(() => data.map((d, i) => ({
    value: Math.round(d.wind_speed_avg * 10) / 10,
    label: makeLabels(d, i),
  })), [data, labelInterval]);

  const tempYAxisProps = useMemo(() => getYAxisProps([highData, lowData, avgData], 200), [highData, lowData, avgData]);
  const windYAxisProps = useMemo(() => getYAxisProps([windData], 200), [windData]);

  // Temperature chart uses dataSet API for reliable multi-line rendering
  const tempDataSet = useMemo(() => [
    {
      data: highData,
      color: '#F44336',
      dataPointsColor: '#F44336',
      areaChart: true,
      startFillColor: 'rgba(244, 67, 54, 0.15)',
      endFillColor: 'rgba(244, 67, 54, 0.01)',
      startOpacity: 0.3,
      endOpacity: 0.05,
    },
    {
      data: avgData,
      color: colors.primary,
      dataPointsColor: colors.primary,
    },
    {
      data: lowData,
      color: '#2196F3',
      dataPointsColor: '#2196F3',
      areaChart: true,
      startFillColor: 'rgba(33, 150, 243, 0.15)',
      endFillColor: 'rgba(33, 150, 243, 0.01)',
      startOpacity: 0.3,
      endOpacity: 0.05,
    },
  ], [highData, lowData, avgData, colors.primary]);

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No history data available
        </Text>
      </View>
    );
  }

  const spacing = data.length > 14 ? 25 : 40;

  const commonLineProps = {
    thickness: 2,
    hideRules: true,
    yAxisTextStyle: { color: colors.textSecondary, fontSize: 10 },
    xAxisLabelTextStyle: { color: colors.textSecondary, fontSize: 9, width: 40, textAlign: 'center' as const },
    hideDataPoints: false,
    dataPointsRadius: 3,
    spacing,
    initialSpacing: 10,
    endSpacing: 10,
    yAxisColor: 'transparent',
    xAxisColor: colors.border,
    isAnimated: true,
    animationDuration: 500,
    curved: true,
    height: 200,
    showScrollIndicator: true,
  };

  if (chartType === 'temperature') {
    return (
      <View accessibilityLabel={`Temperature trend chart for ${data.length} days`} accessibilityRole="summary">
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Temperature Trend ({getTemperatureUnit(units)})
        </Text>
        <LineChart
          dataSet={tempDataSet}
          {...commonLineProps}
          {...tempYAxisProps}
        />
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
    return (
      <View accessibilityLabel={`Precipitation chart for ${data.length} days`} accessibilityRole="summary">
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Daily Precipitation (mm)
        </Text>
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
          showScrollIndicator
        />
      </View>
    );
  }

  if (chartType === 'humidity') {
    return (
      <View accessibilityLabel={`Humidity chart for ${data.length} days`} accessibilityRole="summary">
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Average Humidity (%)
        </Text>
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
      </View>
    );
  }

  if (chartType === 'wind') {
    return (
      <View accessibilityLabel={`Wind speed chart for ${data.length} days`} accessibilityRole="summary">
        <Text style={[styles.chartTitle, { color: colors.text }]}>
          Average Wind Speed ({units === 'imperial' ? 'mph' : 'm/s'})
        </Text>
        <LineChart
          data={windData}
          {...commonLineProps}
          {...windYAxisProps}
          color="#9C27B0"
          dataPointsColor="#9C27B0"
          areaChart
          startFillColor="rgba(156, 39, 176, 0.15)"
          endFillColor="rgba(156, 39, 176, 0.02)"
          startOpacity={0.3}
          endOpacity={0.05}
        />
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

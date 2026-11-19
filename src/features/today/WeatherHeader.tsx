import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { DayContext } from '../../domain/types';
import type { AdviceLine, HeaderTemperatures, SkyLine, WeatherLines } from '../../domain/weather';
import { Icon, type IconName } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { useTheme } from '../../ui/theme';
import { radius, size, spacing, typography } from '../../ui/tokens';
import { formatAdvice, formatSky } from '../weather/formatLines';
import { formatDegrees } from './formatHeader';
import {
  HEADER_LINES_MAX_MULTIPLIER,
  HEADER_TOP_MAX_MULTIPLIER,
  temperaturesWidth,
  temperatureScale,
  topRowScale,
  weatherLinesScale,
} from './headerFit';
import { ProgramChip, programChipFixedWidth } from './ProgramChip';

const TOP_ROW = 44;
const WEATHER_ROW = 70;
const LINE_ICON = 16;
const RULE = 2;
// Smaller than `temperature-range`: on a narrow screen the weather lines need
// the room (Candice, S6).
const RANGE_FONT_SIZE = 18;
// iOS crops what rises above the tight line height of `temperature`: this
// room above the line lets the digits show, without moving them.
const TEMPERATURE_HEADROOM = 24;
// iOS sets a tight line higher than Android: same distance to the rule.
const TEMPERATURE_DROP = Platform.OS === 'ios' ? 12 : 0;
const MAX_LINES_PER_TEXT = 2;
const LINES_MIN_WIDTH = 132;
export const WEATHER_HEADER_HEIGHT = TOP_ROW + spacing.space8 + WEATHER_ROW + spacing.space8 + RULE;
// Four rows of text at their design size: 2 pt into the gap above the row.
const LINES_MAX_HEIGHT = WEATHER_ROW + 2;
const MEASURE_WIDTH = 1000;

// Icon of each line (design-system "Iconographie", météo).
function skyIcon(sky: SkyLine): IconName {
  switch (sky.kind) {
    case 'rain':
      return 'rainCloud';
    case 'snow':
      return 'snowflake';
    case 'cloudy':
      return 'cloud';
    case 'sunnyAllDay':
    case 'clearSky':
      return 'sun';
    default: {
      const unknown: never = sky;
      throw new Error(`Unknown sky line: ${String(unknown)}`);
    }
  }
}

function adviceIcon(advice: AdviceLine): IconName {
  switch (advice.kind) {
    case 'umbrella':
      return 'umbrella';
    case 'frost':
      return 'snowflake';
    case 'glovesAndScarf':
    case 'heat':
    case 'maxTemperature':
      return 'thermometer';
    default: {
      const unknown: never = advice;
      throw new Error(`Unknown advice line: ${String(unknown)}`);
    }
  }
}

interface WeatherHeaderProps {
  width: number;
  date: string;
  context: DayContext;
  // Null while the forecast is unknown.
  temperatures: HeaderTemperatures | null;
  lines: WeatherLines | null;
}

/** Today's header: date, program, settings, temperatures, weather lines, rule. */
export function WeatherHeader({ width, date, context, temperatures, lines }: WeatherHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const current = temperatures ? formatDegrees(temperatures.current) : '';
  const max = temperatures
    ? t('today.maxTemperature', { value: formatDegrees(temperatures.max) })
    : '';
  const temperatureFit = {
    width,
    reserved: LINES_MIN_WIDTH + spacing.space14,
    current,
    max,
    currentSize: typography.temperature.fontSize,
    currentTracking: typography.temperature.letterSpacing,
    maxSize: RANGE_FONT_SIZE,
    maxTracking: typography.temperatureRange.letterSpacing,
    gap: spacing.space6,
  };
  const scale = temperatureScale(temperatureFit);
  const weatherLines = lines
    ? [
        { icon: skyIcon(lines.sky), text: formatSky(lines.sky, t) },
        { icon: adviceIcon(lines.advice), text: formatAdvice(lines.advice, t) },
      ]
    : [];
  const { fontScale } = useWindowDimensions();
  const linesWidth =
    width - (temperatures ? temperaturesWidth(temperatureFit) * scale + spacing.space14 : 0);
  const lineTextScale = Math.min(fontScale, HEADER_LINES_MAX_MULTIPLIER);
  const lineFit = weatherLinesScale({
    texts: weatherLines.map((line) => line.text),
    width: linesWidth - LINE_ICON - spacing.space6,
    fontSize: typography.weatherLine.fontSize * lineTextScale,
    lineHeight: typography.weatherLine.lineHeight * lineTextScale,
    fixedHeight: spacing.space6 + spacing.space2,
    maxHeight: LINES_MAX_HEIGHT,
  });
  const program = t(`usages.activity.${context.activity}`);
  const [dateWidth, setDateWidth] = useState(0);
  const [labelWidth, setLabelWidth] = useState(0);
  const topRowReady = dateWidth > 0 && labelWidth > 0;
  const topScale = topRowReady
    ? topRowScale({
        width,
        fixedWidth: size.sizeTap + 2 * spacing.space8 + programChipFixedWidth(context),
        dateWidth,
        labelWidth,
      })
    : 1;
  return (
    <View style={styles.header}>
      {/* The full width of the two texts, whatever the room left on screen. */}
      <View
        style={styles.measure}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text
          testID="measure-date"
          maxFontSizeMultiplier={HEADER_TOP_MAX_MULTIPLIER}
          style={typography.date}
          onLayout={(event) => setDateWidth(event.nativeEvent.layout.width)}
        >
          {date}
        </Text>
        <Text
          testID="measure-program"
          maxFontSizeMultiplier={HEADER_TOP_MAX_MULTIPLIER}
          style={typography.chip}
          onLayout={(event) => setLabelWidth(event.nativeEvent.layout.width)}
        >
          {program}
        </Text>
      </View>
      <View style={[styles.topRow, { opacity: topRowReady ? 1 : 0 }]}>
        <Text
          testID="header-date"
          accessibilityRole="header"
          maxFontSizeMultiplier={HEADER_TOP_MAX_MULTIPLIER}
          style={[
            typography.date,
            styles.date,
            {
              color: colors.ink,
              fontSize: typography.date.fontSize * topScale,
              lineHeight: typography.date.lineHeight * topScale,
            },
          ]}
          numberOfLines={1}
        >
          {date}
        </Text>
        {/* Choosing the day's program comes with the settings (S9). */}
        <ProgramChip
          context={context}
          label={program}
          labelScale={topScale}
          onPress={() => undefined}
        />
        <IconButton
          icon="settings"
          accessibilityLabel={t('today.settings')}
          onPress={() => undefined}
        />
      </View>
      <View style={styles.weatherRow}>
        {temperatures ? (
          <View
            style={[
              styles.temperatures,
              { gap: spacing.space6 * scale, marginBottom: -TEMPERATURE_DROP * scale },
            ]}
            pointerEvents="none"
          >
            {/* Already large: they follow the screen, not the system text size. */}
            <Text
              allowFontScaling={false}
              style={[
                typography.temperature,
                {
                  color: colors.ink,
                  fontSize: typography.temperature.fontSize * scale,
                  lineHeight: typography.temperature.lineHeight * scale,
                  letterSpacing: typography.temperature.letterSpacing * scale,
                  paddingTop: TEMPERATURE_HEADROOM,
                  marginTop: -TEMPERATURE_HEADROOM,
                },
              ]}
            >
              {current}
            </Text>
            <Text
              allowFontScaling={false}
              style={[
                typography.temperatureRange,
                {
                  color: colors.inkAccent,
                  fontSize: RANGE_FONT_SIZE * scale,
                  lineHeight: RANGE_FONT_SIZE * scale,
                  letterSpacing: typography.temperatureRange.letterSpacing * scale,
                },
              ]}
            >
              {max}
            </Text>
          </View>
        ) : null}
        <View style={styles.lines}>
          {weatherLines.map((line) => (
            <View key={line.icon + line.text} style={styles.line}>
              <Icon name={line.icon} size={LINE_ICON} color={colors.inkSecondary} />
              <Text
                maxFontSizeMultiplier={HEADER_LINES_MAX_MULTIPLIER}
                numberOfLines={lineFit.clamped ? MAX_LINES_PER_TEXT : undefined}
                style={[
                  typography.weatherLine,
                  styles.lineText,
                  {
                    color: colors.inkSecondary,
                    fontSize: typography.weatherLine.fontSize * lineFit.scale,
                    lineHeight: typography.weatherLine.lineHeight * lineFit.scale,
                  },
                ]}
              >
                {line.text}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View style={[styles.rule, { backgroundColor: colors.rule }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.space8 },
  topRow: { height: TOP_ROW, flexDirection: 'row', alignItems: 'center', gap: spacing.space8 },
  measure: {
    position: 'absolute',
    width: MEASURE_WIDTH,
    flexDirection: 'row',
    alignItems: 'flex-start',
    opacity: 0,
  },
  date: { flex: 1, minWidth: 0 },
  weatherRow: {
    height: WEATHER_ROW,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.space14,
  },
  temperatures: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  lines: { flex: 1, minWidth: 0, gap: spacing.space6, paddingBottom: spacing.space2 },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.space6 },
  lineText: { flex: 1 },
  rule: { height: RULE, borderRadius: radius.radiusRule },
});

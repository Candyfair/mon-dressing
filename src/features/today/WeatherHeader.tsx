import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { DayContext } from '../../domain/types';
import type { AdviceLine, HeaderTemperatures, SkyLine, WeatherLines } from '../../domain/weather';
import { Icon, type IconName } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { useTheme } from '../../ui/theme';
import { radius, spacing, typography } from '../../ui/tokens';
import { formatAdvice, formatSky } from '../weather/formatLines';
import { formatDegrees } from './formatHeader';
import { ProgramChip } from './ProgramChip';

const TOP_ROW = 44;
const WEATHER_ROW = 70;
const LINE_ICON = 16;
const RULE = 2;

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
  date: string;
  context: DayContext;
  // Null while the forecast is unknown.
  temperatures: HeaderTemperatures | null;
  lines: WeatherLines | null;
}

/** Today's header: date, program, settings, temperatures, weather lines, rule. */
export function WeatherHeader({ date, context, temperatures, lines }: WeatherHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const weatherLines = lines
    ? [
        { icon: skyIcon(lines.sky), text: formatSky(lines.sky, t) },
        { icon: adviceIcon(lines.advice), text: formatAdvice(lines.advice, t) },
      ]
    : [];
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <Text
          accessibilityRole="header"
          style={[typography.date, styles.date, { color: colors.ink }]}
          numberOfLines={1}
        >
          {date}
        </Text>
        {/* Choosing the day's program comes with the settings (S9). */}
        <ProgramChip context={context} onPress={() => undefined} />
        <IconButton
          icon="settings"
          accessibilityLabel={t('today.settings')}
          onPress={() => undefined}
        />
      </View>
      <View style={styles.weatherRow}>
        {temperatures ? (
          <View style={styles.temperatures}>
            <Text style={[typography.temperature, { color: colors.ink }]}>
              {formatDegrees(temperatures.current)}
            </Text>
            <Text style={[typography.temperatureRange, { color: colors.inkAccent }]}>
              {t('today.maxTemperature', { value: formatDegrees(temperatures.max) })}
            </Text>
          </View>
        ) : null}
        <View style={styles.lines}>
          {weatherLines.map((line) => (
            <View key={line.icon + line.text} style={styles.line}>
              <Icon name={line.icon} size={LINE_ICON} color={colors.inkSecondary} />
              <Text
                style={[typography.weatherLine, styles.lineText, { color: colors.inkSecondary }]}
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
  date: { flex: 1, minWidth: 0 },
  weatherRow: {
    height: WEATHER_ROW,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.space14,
  },
  temperatures: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.space6 },
  lines: { flex: 1, minWidth: 0, gap: spacing.space6, paddingBottom: spacing.space2 },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.space6 },
  lineText: { flex: 1 },
  rule: { height: RULE, borderRadius: radius.radiusRule },
});

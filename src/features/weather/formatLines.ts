import type { TFunction } from 'i18next';

import type { LocalTime } from '../../domain/time';
import type { AdviceLine, SkyLine, WeatherLines } from '../../domain/weather';

/** « 18 h », « 12 h 30 ». */
export function formatTime(time: LocalTime, t: TFunction): string {
  const [hour, minute] = time.split(':');
  return minute === '00'
    ? t('weather.time.hour', { hour: Number(hour) })
    : t('weather.time.hourMinute', { hour: Number(hour), minute });
}

export function formatSky(sky: SkyLine, t: TFunction): string {
  switch (sky.kind) {
    case 'rain':
      return t('weather.sky.rain', {
        probability: sky.probability,
        time: formatTime(sky.at, t),
      });
    case 'snow':
    case 'sunnyAllDay':
    case 'cloudy':
    case 'clearSky':
      return t(`weather.sky.${sky.kind}`);
    default: {
      const exhaustive: never = sky;
      return exhaustive;
    }
  }
}

export function formatAdvice(advice: AdviceLine, t: TFunction): string {
  switch (advice.kind) {
    case 'umbrella':
      return t('weather.advice.umbrella', { time: formatTime(advice.at, t) });
    case 'frost':
      return t('weather.advice.frost', { time: formatTime(advice.until, t) });
    case 'glovesAndScarf':
      return t('weather.advice.glovesAndScarf');
    case 'heat':
      return t('weather.advice.heat', { time: formatTime(advice.at, t) });
    case 'maxTemperature':
      return t('weather.advice.maxTemperature', {
        value: advice.value,
        time: formatTime(advice.at, t),
      });
    default: {
      const exhaustive: never = advice;
      return exhaustive;
    }
  }
}

/** The two lines under the temperature, as displayed. */
export function formatWeatherLines(lines: WeatherLines, t: TFunction): [string, string] {
  return [formatSky(lines.sky, t), formatAdvice(lines.advice, t)];
}

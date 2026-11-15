import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { db } from '../../db/client';
import { loadEngineGarments, yesterdayOutfit } from '../../db/repositories/engineInputs';
import {
  getActiveWardrobe,
  getSettings,
  setWardrobeLocation,
} from '../../db/repositories/wardrobes';
import { garments as garmentsTable } from '../../db/schema';
import {
  type OutfitSelection,
  ROW_SLOTS,
  type RowSlot,
  type Suggestion,
  suggest,
} from '../../domain/engine';
import {
  runScenario,
  SCENARIO_SETTINGS,
  SCENARIOS,
  type ScenarioKey,
  withScenarioStates,
} from '../../domain/engine/__fixtures__/scenarios';
import { simulateWorn } from '../../domain/engine/__fixtures__/simulateDays';
import { referenceWardrobe } from '../../domain/engine/__fixtures__/wardrobe';
import { addDays, localDate } from '../../domain/time';
import {
  ACTIVITIES,
  type Activity,
  COMMUTE_MODES,
  type CommuteMode,
  OCCASIONS,
  type Occasion,
  ROTATION_PACES,
  type RotationPace,
} from '../../domain/types';
import {
  activeDayWindow,
  constrainingWindows,
  type DayWeather,
  evaluateDay,
  weatherLines,
  type WeatherLines,
} from '../../domain/weather';
import { Button } from '../../ui/Button';
import { useTheme } from '../../ui/theme';
import { fontFamilies, radius, size, spacing } from '../../ui/tokens';
import { photoUri } from '../add/photos/photoStore';
import { formatWeatherLines } from '../weather/formatLines';
import { type City, searchCities } from '../weather/geocoding';
import { useForecast } from '../weather/useForecast';
import { DevGarmentDetailsSheet } from './DevGarmentDetailsSheet';

const TILE = 64;

type Source = 'today' | ScenarioKey;

interface EngineRun {
  weather: DayWeather | null;
  lines: WeatherLines | null;
  suggestion: Suggestion;
}

/**
 * Development screen (S4): runs the engine on the real or the reference
 * wardrobe, with today's real forecast or one of the 10 reference scenarios,
 * so Candice can rate each proposal on device (SPEC §3 R3, R4). Not designed.
 */
export function DevEngineScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const settings = useMemo(() => getSettings(db), []);
  const [wardrobe, setWardrobe] = useState(() => getActiveWardrobe(db));
  const [now] = useState(() => new Date());
  const today = localDate(now, wardrobe.timeZone);

  const [source, setSource] = useState<Source>('today');
  const [useReference, setUseReference] = useState(false);
  const [activity, setActivity] = useState<Activity>('office');
  const [commuteModes, setCommuteModes] = useState<readonly CommuteMode[]>(
    settings.commuteModes.length > 0 ? settings.commuteModes : ['walking'],
  );
  const [occasion, setOccasion] = useState<Occasion>('everyday');
  const [lunch, setLunch] = useState(settings.lunchOutingEnabled);
  const [pace, setPace] = useState<RotationPace>(settings.rotationPace);
  const [cityQuery, setCityQuery] = useState('');
  const [citySearch, setCitySearch] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  // Simulated days: outfits "worn" from today on, in memory only.
  const [history, setHistory] = useState<readonly OutfitSelection[]>([]);

  const coordinates =
    wardrobe.latitude !== null && wardrobe.longitude !== null
      ? { latitude: wardrobe.latitude, longitude: wardrobe.longitude }
      : null;
  const forecast = useForecast(coordinates, today);
  const cities = useQuery({
    queryKey: ['cities', citySearch],
    queryFn: () => searchCities(citySearch ?? '', i18n.language),
    enabled: citySearch !== null,
  });

  // Read again after a garment's details are saved.
  const [realGarments, setRealGarments] = useState(() => loadEngineGarments(db, wardrobe.id));
  const pieces = useMemo(
    () =>
      new Map(
        db
          .select({
            id: garmentsTable.id,
            subtype: garmentsTable.subtype,
            original: garmentsTable.photoOriginalPath,
            cutout: garmentsTable.photoCutoutPath,
          })
          .from(garmentsTable)
          .all()
          .map((row) => [
            row.id,
            { photo: row.cutout ?? row.original, label: t(`subtypes.${row.subtype}`) },
          ]),
      ),
    [t],
  );
  const labelOf = (id: string) => pieces.get(id)?.label ?? id;

  const run = useMemo((): EngineRun | null => {
    const rotation = { dryingRackCountsAsStorage: settings.dryingRackCountsAsStorage };
    if (source !== 'today') {
      const scenario = SCENARIOS.find((candidate) => candidate.key === source);
      if (!scenario) return null;
      const garments = useReference
        ? withScenarioStates(scenario, referenceWardrobe(), wardrobe.timeZone)
        : realGarments;
      return runScenario(scenario, garments, {
        timeZone: wardrobe.timeZone,
        settings: { ...SCENARIO_SETTINGS, ...rotation, rotationPace: pace },
      });
    }
    const context = { activity, commuteModes, occasion };
    // Today's weather is kept for the simulated days (the forecast stops tomorrow).
    const day = { date: today, timeZone: wardrobe.timeZone };
    const windowSettings = { ...settings, lunchOutingEnabled: lunch };
    const windows = constrainingWindows(day, context, windowSettings);
    const activeDay = activeDayWindow(day, windowSettings);
    const data = forecast.data;
    const weather = data ? evaluateDay(data, windows, activeDay) : null;
    return {
      weather,
      lines: data
        ? weatherLines({
            forecast: data,
            windows,
            activeDay,
            context,
            timeZone: wardrobe.timeZone,
          })
        : null,
      suggestion: suggest({
        date: addDays(today, history.length),
        timeZone: wardrobe.timeZone,
        garments: simulateWorn(
          useReference ? referenceWardrobe() : realGarments,
          history,
          today,
          wardrobe.timeZone,
        ),
        context,
        weather,
        settings: { ...rotation, rotationPace: pace },
        yesterday:
          history.at(-1) ?? (useReference ? null : yesterdayOutfit(db, wardrobe.id, today)),
      }),
    };
  }, [
    source,
    useReference,
    realGarments,
    activity,
    commuteModes,
    occasion,
    lunch,
    pace,
    settings,
    today,
    wardrobe,
    forecast.data,
    history,
  ]);

  const changeSource = (next: Source) => {
    setSource(next);
    setHistory([]);
  };
  const changeWardrobe = (reference: boolean) => {
    setUseReference(reference);
    setHistory([]);
  };
  const wearAndContinue = () => {
    const outfit = run?.suggestion.outfit;
    if (outfit) setHistory((days) => [...days, outfit]);
  };

  const chooseCity = (city: City) => {
    setWardrobeLocation(db, wardrobe.id, {
      cityName: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
    });
    setWardrobe(getActiveWardrobe(db));
    setCitySearch(null);
    setCityQuery('');
  };

  const toggleCommute = (mode: CommuteMode) =>
    setCommuteModes((modes) =>
      modes.includes(mode) ? modes.filter((value) => value !== mode) : [...modes, mode],
    );

  const textStyle = [styles.text, { color: colors.ink }];
  const secondaryStyle = [styles.small, { color: colors.inkSecondary }];

  const chip = (key: string, label: string, selected: boolean, onPress: () => void) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected
          ? { borderColor: colors.select, backgroundColor: colors.optionOn }
          : { borderColor: colors.optionEdge },
      ]}
    >
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );

  const chipRow = (children: ReactNode) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
    >
      {children}
    </ScrollView>
  );

  const outfitIds = new Set(Object.values(run?.suggestion.outfit ?? {}));
  const rowProposed = (slot: RowSlot): boolean => {
    if (!run) return false;
    if (slot === 'midLayer' || slot === 'outerLayer') return run.suggestion.suggestedLayers[slot];
    if (slot === 'shoes') return run.suggestion.shoesSuggested;
    return true;
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.ground }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.space16,
            paddingBottom: insets.bottom + spacing.space40,
          },
        ]}
      >
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.ink }]}>
            {t('dev.engine.title')}
          </Text>
          <Button label={t('dev.engine.back')} variant="link" onPress={() => router.back()} />
        </View>

        <Text style={textStyle}>
          {wardrobe.cityName
            ? t('dev.engine.city', { name: wardrobe.cityName })
            : t('dev.engine.noCity')}
        </Text>
        <View style={styles.search}>
          <TextInput
            value={cityQuery}
            onChangeText={setCityQuery}
            placeholder={t('dev.engine.citySearch')}
            placeholderTextColor={colors.inkSecondary}
            style={[styles.input, textStyle, { borderColor: colors.optionEdge }]}
          />
          <Button
            label={t('dev.engine.search')}
            variant="outline"
            disabled={cityQuery.trim().length < 2}
            onPress={() => setCitySearch(cityQuery.trim())}
          />
        </View>
        {cities.data?.map((city) => (
          <Pressable
            key={`${city.latitude},${city.longitude}`}
            accessibilityRole="button"
            onPress={() => chooseCity(city)}
            style={styles.cityRow}
          >
            <Text style={textStyle}>{city.name}</Text>
            <Text style={secondaryStyle}>{city.region}</Text>
          </Pressable>
        ))}

        {chipRow([
          chip('today', t('dev.engine.today'), source === 'today', () => changeSource('today')),
          ...SCENARIOS.map((scenario, index) =>
            chip(
              scenario.key,
              t('dev.engine.scenario', { number: index + 1 }),
              source === scenario.key,
              () => changeSource(scenario.key),
            ),
          ),
        ])}
        {chipRow([
          chip('real', t('dev.engine.realWardrobe'), !useReference, () => changeWardrobe(false)),
          chip('reference', t('dev.engine.referenceWardrobe'), useReference, () =>
            changeWardrobe(true),
          ),
          ...ROTATION_PACES.map((value) =>
            chip(value, t(`dev.engine.rotationPace.${value}`), pace === value, () =>
              setPace(value),
            ),
          ),
        ])}

        {source === 'today' && (
          <>
            {chipRow(
              ACTIVITIES.map((value) =>
                chip(value, t(`usages.activity.${value}`), activity === value, () =>
                  setActivity(value),
                ),
              ),
            )}
            {chipRow(
              COMMUTE_MODES.map((value) =>
                chip(value, t(`usages.commute.${value}`), commuteModes.includes(value), () =>
                  toggleCommute(value),
                ),
              ),
            )}
            {chipRow([
              ...OCCASIONS.map((value) =>
                chip(value, t(`usages.occasion.${value}`), occasion === value, () =>
                  setOccasion(value),
                ),
              ),
              chip('lunch', t('dev.engine.lunch'), lunch, () => setLunch((value) => !value)),
            ])}
            <View style={styles.search}>
              <Text style={[textStyle, styles.grow]}>
                {t('dev.engine.day', { count: history.length })}
              </Text>
              <Button label={t('dev.engine.nextDay')} variant="outline" onPress={wearAndContinue} />
              {history.length > 0 && (
                <Button
                  label={t('dev.engine.restart')}
                  variant="link"
                  onPress={() => setHistory([])}
                />
              )}
            </View>
            {history.map((outfit, index) => (
              <Text key={index} style={secondaryStyle}>
                {t('dev.engine.worn', {
                  day: index + 1,
                  pieces: Object.values(outfit).map(labelOf).join(', '),
                })}
              </Text>
            ))}
          </>
        )}

        <View style={[styles.block, { borderColor: colors.divider }]}>
          {source === 'today' && coordinates && forecast.isPending ? (
            <Text style={secondaryStyle}>{t('dev.engine.loading')}</Text>
          ) : run?.weather ? (
            <>
              <Text style={textStyle}>
                {t('dev.engine.conditions', {
                  conditions: run.weather.conditions
                    .map((condition) => t(`usages.weather.${condition}`))
                    .join(' + '),
                  felt: Math.round(run.weather.minFelt),
                })}
              </Text>
              {run.weather.indoorOnly && (
                <Text style={secondaryStyle}>{t('dev.engine.indoor')}</Text>
              )}
              {run.weather.windows.map((window) => (
                <Text key={window.kind} style={secondaryStyle}>
                  {t('dev.engine.window', {
                    kind: t(`dev.engine.windowKind.${window.kind}`),
                    felt: Math.round(window.minFelt),
                    rain: window.maxRainProbability,
                  })}
                </Text>
              ))}
              {run.lines &&
                formatWeatherLines(run.lines, t).map((line) => (
                  <Text key={line} style={textStyle}>
                    {line}
                  </Text>
                ))}
            </>
          ) : (
            <Text style={secondaryStyle}>{t('dev.engine.weatherUnknown')}</Text>
          )}
          {run?.suggestion.coordinationBroken && (
            <Text style={textStyle}>{t('dev.engine.broken')}</Text>
          )}
        </View>

        {run &&
          ROW_SLOTS.map((slot) => (
            <View key={slot} style={styles.row}>
              <Text style={textStyle}>
                {t('dev.engine.rowLabel', {
                  row: t(`dev.engine.rows.${slot}`),
                  state: rowProposed(slot) ? t('dev.engine.proposed') : t('dev.engine.notProposed'),
                })}
              </Text>
              {run.suggestion.rows[slot].length === 0 ? (
                <Text style={secondaryStyle}>{t('dev.engine.emptyRow')}</Text>
              ) : (
                <ScrollView horizontal contentContainerStyle={styles.tiles}>
                  {run.suggestion.rows[slot].map((id) => {
                    const photo = pieces.get(id)?.photo;
                    return (
                      <Pressable
                        key={id}
                        accessibilityRole="button"
                        accessibilityLabel={labelOf(id)}
                        disabled={useReference}
                        onPress={() => setEditing(id)}
                        style={[
                          styles.tile,
                          {
                            borderColor: outfitIds.has(id) ? colors.select : colors.optionEdge,
                            borderWidth: outfitIds.has(id) ? 3 : 1,
                          },
                        ]}
                      >
                        {photo ? (
                          <Image
                            source={{ uri: photoUri(photo) }}
                            style={styles.photo}
                            contentFit="contain"
                            accessible={false}
                          />
                        ) : (
                          <Text style={secondaryStyle} numberOfLines={3}>
                            {id}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          ))}
      </ScrollView>
      {editing && (
        <DevGarmentDetailsSheet
          garmentId={editing}
          title={labelOf(editing)}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setRealGarments(loadEngineGarments(db, wardrobe.id));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  grow: { flex: 1 },
  content: { paddingHorizontal: spacing.space16, gap: spacing.space10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.space10 },
  title: { flex: 1, fontFamily: fontFamilies.display, fontWeight: '600', fontSize: 24 },
  text: { fontFamily: fontFamilies.text, fontSize: 14.5 },
  small: { fontFamily: fontFamilies.text, fontSize: 13 },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.space10 },
  input: {
    flex: 1,
    minHeight: size.sizeTap,
    borderWidth: 1,
    borderRadius: radius.radiusTypeTile,
    paddingHorizontal: spacing.space14,
  },
  cityRow: { paddingVertical: spacing.space8 },
  chips: { gap: spacing.space8 },
  chip: {
    minHeight: size.sizeChip,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.radiusFull,
    paddingHorizontal: spacing.space14,
  },
  block: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: spacing.space10,
    gap: spacing.space6,
  },
  row: { gap: spacing.space6 },
  tiles: { gap: spacing.space8 },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: radius.radiusTypeTile,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: spacing.space2,
  },
  photo: { width: '100%', height: '100%' },
});

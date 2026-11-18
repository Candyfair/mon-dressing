import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DevTodayTools } from '../dev/DevTodayTools';
import { GlassStage } from '../../ui/GlassStage';
import { Icon } from '../../ui/Icon';
import { motion } from '../../ui/motion';
import { tabBarBottom } from '../../ui/TabBar';
import { useTheme } from '../../ui/theme';
import { fontFamilies, size, spacing } from '../../ui/tokens';
import { ConfirmOutfitButton } from './ConfirmOutfitButton';
import { formatShortDate } from './formatHeader';
import { widenRows } from './outfitChoice';
import { TodayBackground } from './TodayBackground';
import { OUTFIT_HEIGHT, OUTFIT_WIDTH, TodayOutfit } from './TodayOutfit';
import { useToday } from './useToday';
import { WeatherHeader } from './WeatherHeader';

// Vertical layout of the 375 × 812 pt reference (DESIGN-SYSTEM "L'écran
// Aujourd'hui"): header 6 pt under the status bar (50 pt), outfit 12 pt under
// the header (194 pt), 16 pt above the menu (684 pt).
const HEADER_GAP = spacing.space6;
const HEADER_HEIGHT = 132;
const OUTFIT_GAP_TOP = 12;
const OUTFIT_GAP_BOTTOM = spacing.space16;
// The note sits at the bottom left, on the line of the confirm button.
const INDICATOR_LINE = 16;
const INDICATOR_ICON = 16;
// Room taken from the outfit zone by the two-line "Voir les autres ?" hint.
const HINT_HEIGHT = 44;
const DEV_TOOLS_HEIGHT = 34;

/** Today (design specs 01 and 02): the day's weather and the outfit to wear. */
export function TodayScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const today = useToday();

  // The outfit zone keeps its proportions and shrinks on smaller screens.
  const headerTop = insets.top + HEADER_GAP;
  const hintTop = headerTop + HEADER_HEIGHT + spacing.space6;
  const hasHint = today.widenableRows.length > 0;
  const outfitTop = hasHint ? hintTop + HINT_HEIGHT : headerTop + HEADER_HEIGHT + OUTFIT_GAP_TOP;
  const menuTop = height - tabBarBottom(insets.bottom) - size.tabbarHeight;
  const scale = Math.min(
    1,
    (menuTop - OUTFIT_GAP_BOTTOM - outfitTop) / OUTFIT_HEIGHT,
    (width - 2 * spacing.space16) / OUTFIT_WIDTH,
  );
  const outfitBottom = outfitTop + OUTFIT_HEIGHT * scale;

  return (
    <GlassStage behind={<TodayBackground ambience={today.weather.ambience} />}>
      <View style={[styles.header, { top: headerTop }]}>
        <WeatherHeader
          date={formatShortDate(today.date, t)}
          context={today.context}
          temperatures={today.temperatures}
          lines={today.weather.lines}
        />
      </View>

      <View style={[styles.outfit, { top: outfitTop }]}>
        <TodayOutfit
          suggestion={today.plan.suggestion}
          pieces={today.pieces}
          choice={today.choice}
          onChoiceChange={today.setChoice}
          emptyRows={today.emptyRows}
          onAddPiece={() => router.push('/add')}
          scale={scale}
          // The layer sheet comes in the next step.
          onLayerPress={() => undefined}
        />
      </View>

      {hasHint ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLiveRegion="polite"
          onPress={() => today.setChoice((choice) => widenRows(choice, today.widenableRows))}
          style={[styles.hint, { top: hintTop }]}
        >
          <Text style={[styles.indicatorText, { color: colors.inkSecondary }]}>
            {t('today.noneToday')}
            {'. '}
            <Text style={[styles.seeOthers, { color: colors.inkAccent }]}>
              {t('today.seeOthers')}
            </Text>
          </Text>
        </Pressable>
      ) : today.twoStatements ? (
        <Animated.View
          entering={FadeIn.duration(motion.carousel.crossFade.duration)}
          exiting={FadeOut.duration(motion.carousel.crossFade.duration)}
          accessibilityLiveRegion="polite"
          style={[styles.indicator, { top: outfitBottom - INDICATOR_LINE / 2 }]}
        >
          <Icon name="statementPiece" size={INDICATOR_ICON} color={colors.inkSecondary} />
          <Text style={[styles.indicatorText, { color: colors.inkSecondary }]}>
            {t('today.twoStatements')}
          </Text>
        </Animated.View>
      ) : null}

      <View style={[styles.confirm, { top: outfitBottom - size.sizeCta / 2 }]}>
        {/* Validating and freezing the outfit come in S7. */}
        <ConfirmOutfitButton missing={today.missing} onPress={() => undefined} />
      </View>

      {__DEV__ ? (
        <View
          style={[
            styles.devTools,
            { top: outfitBottom - INDICATOR_LINE / 2 - spacing.space6 - DEV_TOOLS_HEIGHT },
          ]}
        >
          <DevTodayTools />
        </View>
      ) : null}
    </GlassStage>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', left: spacing.space16, right: spacing.space16 },
  outfit: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  indicator: {
    position: 'absolute',
    left: spacing.space16,
    right: spacing.space40 + size.sizeCta + spacing.space8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.space6,
  },
  indicatorText: {
    fontFamily: fontFamilies.text,
    fontSize: 13.5,
    lineHeight: 16,
    fontWeight: '500',
  },
  hint: {
    position: 'absolute',
    left: spacing.space16,
    right: spacing.space16,
    height: HINT_HEIGHT,
    justifyContent: 'center',
  },
  seeOthers: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  confirm: { position: 'absolute', right: spacing.space40 },
  devTools: { position: 'absolute', left: spacing.space16 },
});

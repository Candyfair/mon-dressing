import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import type { Ambience } from '../domain/weather/ambience';
import { GlassBlur } from './GlassBlur';
import { Icon, type IconName } from './Icon';
import { type Theme, useTheme } from './theme';
import { fontFamilies, radius, size, spacing, typography } from './tokens';
import { useGlassFill } from './useGlassFill';

export type TabName = 'laundry' | 'today' | 'wardrobe';

// Silhouette from the TabBar mockup, in a tabbar-width × tabbar-height box:
// a 64 pt bar with round ends and a 24 pt hump in the middle.
const SHAPE =
  'M32 24 H91.5 C111.5 24 109.5 0 147.5 0 C185.5 0 183.5 24 203.5 24 H263 A32 32 0 0 1 263 88 H32 A32 32 0 0 1 32 24 Z';
// The same, inset by half the 1 pt edge so the stroke stays inside.
const EDGE =
  'M32 24.5 H91.5 C111.5 24.5 109.5 0.5 147.5 0.5 C185.5 0.5 183.5 24.5 203.5 24.5 H263 A31.5 31.5 0 0 1 263 87.5 H32 A31.5 31.5 0 0 1 32 24.5 Z';
const HUMP = 24;
const BAR_HEIGHT = size.tabbarHeight - HUMP;
// Side tabs sit on the centre of the round ends (x = 40 and 255 pt).
const SIDE_CENTRE = 40;
const SIDE_TAB = { width: 56, height: 52 };
const CAPSULE = { width: 72, height: 56 };
const SIDE_ICON = 22;
// Today, in the hump.
const TODAY_BOX = { left: 95.5, top: 6, width: 104, height: 78 };
const TODAY_ICON_ACTIVE = 28;
const TODAY_ICON = 42;
const TODAY_ICON_STROKE = 1.5;
// "Quand Aujourd'hui n'est pas actif : cintre 42 pt et libellé 15 pt".
const TODAY_LABEL_SIZE = 15;
// Android draws its navigation (gesture bar or buttons) under the app: the
// menu stays clear of it. iOS keeps the mockup's position over the indicator.
const ANDROID_NAV_GAP = spacing.space8;

const SIDE_TABS = {
  laundry: { icon: 'washingMachine', centre: SIDE_CENTRE },
  wardrobe: { icon: 'wardrobe', centre: size.tabbarWidth - SIDE_CENTRE },
} as const satisfies Record<Exclude<TabName, 'today'>, { icon: IconName; centre: number }>;

interface TabBarProps {
  active: TabName;
  onSelect: (tab: TabName) => void;
  // The day's weather ambience tints the menu in the dark theme; null until
  // the forecast is known.
  ambience: Ambience | null;
}

/**
 * Floating bottom menu (design-system TabBar): Laundry, Today in the hump,
 * Wardrobe. Glass silhouette with a weather tint in the dark theme.
 */
export function TabBar({ active, onSelect, ambience }: TabBarProps) {
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const { blur, fill } = useGlassFill(menuTint(colors, ambience));
  const bottom =
    Platform.OS === 'android'
      ? Math.max(spacing.space24, insets.bottom + ANDROID_NAV_GAP)
      : spacing.space24;

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={t('tabs.nav')}
      style={[styles.menu, { bottom }]}
    >
      <View
        style={[styles.bar, { boxShadow: shadows.shadowTabbar }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
      {blur ? (
        <>
          <GlassBlur kind="surface" style={styles.bar} />
          <GlassBlur kind="surface" style={styles.hump} />
        </>
      ) : null}
      <Svg
        width={size.tabbarWidth}
        height={size.tabbarHeight}
        viewBox={`0 0 ${size.tabbarWidth} ${size.tabbarHeight}`}
        style={StyleSheet.absoluteFill}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <Path d={SHAPE} fill={fill} />
        <Path d={EDGE} fill="none" stroke={colors.tabbarEdge} strokeWidth={1} />
      </Svg>

      <SideTab tab="laundry" active={active} onSelect={onSelect} />
      <TodayTab active={active === 'today'} onSelect={onSelect} />
      <SideTab tab="wardrobe" active={active} onSelect={onSelect} />
    </View>
  );
}

// Light: the same sage for every weather (the three roles are equal).
function menuTint(colors: Theme['colors'], ambience: Ambience | null): string {
  switch (ambience) {
    case 'rain':
      return colors.tabbarPluie;
    case 'sun':
      return colors.tabbarSoleil;
    case 'cold':
      return colors.tabbarFroid;
    case null:
      return colors.tabbarGlass;
    default: {
      const unknown: never = ambience;
      throw new Error(`Unknown ambience: ${String(unknown)}`);
    }
  }
}

interface SideTabProps {
  tab: Exclude<TabName, 'today'>;
  active: TabName;
  onSelect: (tab: TabName) => void;
}

function SideTab({ tab, active, onSelect }: SideTabProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const selected = active === tab;
  const { icon, centre } = SIDE_TABS[tab];
  const box = selected ? CAPSULE : SIDE_TAB;
  const ink = selected ? colors.forestDeep : colors.tabInk;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={t(`tabs.${tab}`)}
      onPress={() => onSelect(tab)}
      style={[
        styles.sideTab,
        {
          left: centre - box.width / 2,
          top: HUMP + (BAR_HEIGHT - box.height) / 2,
          width: box.width,
          height: box.height,
        },
        selected && [
          styles.capsule,
          { backgroundColor: colors.pastille, borderColor: colors.pastilleEdge },
        ],
      ]}
    >
      <Icon name={icon} size={SIDE_ICON} color={ink} />
      <Text
        style={[typography.tabLabel, { color: ink }, selected && styles.sideLabelActive]}
        numberOfLines={1}
      >
        {t(`tabs.${tab}`)}
      </Text>
    </Pressable>
  );
}

interface TodayTabProps {
  active: boolean;
  onSelect: (tab: TabName) => void;
}

function TodayTab({ active, onSelect }: TodayTabProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={t('tabs.today')}
      onPress={() => onSelect('today')}
      style={[styles.today, active ? styles.todayActive : styles.todayIdle]}
    >
      {active ? (
        <View
          style={[
            styles.pastille,
            { backgroundColor: colors.pastille, borderColor: colors.pastilleEdge },
          ]}
        >
          <Icon name="hanger" size={TODAY_ICON_ACTIVE} color={colors.forestDeep} />
        </View>
      ) : (
        <Icon
          name="hanger"
          size={TODAY_ICON}
          color={colors.tabInk}
          strokeWidth={TODAY_ICON_STROKE}
        />
      )}
      <Text
        style={
          active
            ? [typography.tabActive, { color: colors.ink }]
            : [styles.todayLabel, { color: colors.tabInk }]
        }
        numberOfLines={1}
      >
        {t('tabs.today')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    alignSelf: 'center',
    width: size.tabbarWidth,
    height: size.tabbarHeight,
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: HUMP,
    width: size.tabbarWidth,
    height: BAR_HEIGHT,
    borderRadius: radius.radiusTabbar,
    overflow: 'hidden',
  },
  // The blur under the hump: a circle inside the curve, so no blur shows
  // past the silhouette; the tint covers the rest of the hump.
  hump: {
    position: 'absolute',
    left: size.tabbarWidth / 2 - HUMP,
    top: 0,
    width: HUMP * 2,
    height: HUMP * 2,
    borderRadius: HUMP,
    overflow: 'hidden',
  },
  sideTab: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.space2,
  },
  capsule: {
    borderRadius: CAPSULE.height / 2,
    borderWidth: 1,
  },
  sideLabelActive: { fontWeight: '600' },
  today: {
    position: 'absolute',
    ...TODAY_BOX,
    alignItems: 'center',
  },
  todayActive: { justifyContent: 'flex-start', gap: 3 },
  todayIdle: { justifyContent: 'flex-end', gap: 1, paddingBottom: 9 },
  pastille: {
    width: size.sizePastille,
    height: size.sizePastille,
    borderRadius: size.sizePastille / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayLabel: {
    fontFamily: fontFamilies.display,
    fontSize: TODAY_LABEL_SIZE,
    lineHeight: TODAY_LABEL_SIZE * 1.2,
    fontWeight: '500',
  },
});

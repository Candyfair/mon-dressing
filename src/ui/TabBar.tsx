import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import type { Ambience } from '../domain/weather/ambience';
import { GlassBlur } from './GlassBlur';
import { Icon, type IconName } from './Icon';
import { useMotion } from './motionStore';
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
const CAPSULE = { width: 72, height: 56 };
const SIDE_ICON = 22;
// Today, in the hump.
const TODAY_BOX = { left: 95.5, top: 6, width: 104, height: 78 };
const TODAY_ICON_ACTIVE = 28;
const TODAY_ICON = 42;
const TODAY_ICON_STROKE = 1.5;
// "Quand Aujourd'hui n'est pas actif : cintre 42 pt et libellé 15 pt".
const TODAY_LABEL_SIZE = 15;
const TODAY_IDLE_BOTTOM = 9;
// Centre of the hanger in the Today tab, active (pastille) and idle: it moves
// and grows from one to the other.
const TODAY_ACTIVE_CENTRE = size.sizePastille / 2;
const TODAY_IDLE_CENTRE =
  TODAY_BOX.height - TODAY_IDLE_BOTTOM - TODAY_LABEL_SIZE * 1.2 - 1 - TODAY_ICON / 2;
// The bubble keeps its volume: stretched it gets thinner, squeezed it swells.
const BUBBLE_HEIGHT_RANGE = [0.8, 1.12] as const;
// Its rebound never gets smaller than the pastille around the hanger.
const BUBBLE_MIN_SIZE = size.sizePastille;
const CAPSULE_TOP = HUMP + (BAR_HEIGHT - CAPSULE.height) / 2;
// Android draws its navigation (gesture bar or buttons) under the app: the
// menu stays clear of it. iOS keeps the mockup's position over the indicator.
const ANDROID_NAV_GAP = spacing.space8;

const SIDE_TABS = {
  laundry: { icon: 'washingMachine', centre: SIDE_CENTRE },
  wardrobe: { icon: 'wardrobe', centre: size.tabbarWidth - SIDE_CENTRE },
} as const satisfies Record<Exclude<TabName, 'today'>, { icon: IconName; centre: number }>;

// Where the selection sits: a capsule on a side tab, the pastille on Today.
function selectionPlace(tab: TabName) {
  if (tab === 'today') {
    return {
      left: TODAY_BOX.left + (TODAY_BOX.width - size.sizePastille) / 2,
      top: TODAY_BOX.top,
      width: size.sizePastille,
      height: size.sizePastille,
    };
  }
  return {
    left: SIDE_TABS[tab].centre - CAPSULE.width / 2,
    top: CAPSULE_TOP,
    width: CAPSULE.width,
    height: CAPSULE.height,
  };
}

// Between Today and a side tab, the bubble leans along its path: the angle
// between the tab and the pastille, in degrees.
const todayPlace = selectionPlace('today');
const laundryPlace = selectionPlace('laundry');
const BUBBLE_TILT =
  (Math.atan2(
    laundryPlace.top + laundryPlace.height / 2 - (todayPlace.top + todayPlace.height / 2),
    todayPlace.left + todayPlace.width / 2 - (laundryPlace.left + laundryPlace.width / 2),
  ) *
    180) /
  Math.PI;

/** Distance from the screen bottom to the menu, for screens laying out above it. */
export function tabBarBottom(bottomInset: number): number {
  return Platform.OS === 'android'
    ? Math.max(spacing.space24, bottomInset + ANDROID_NAV_GAP)
    : spacing.space24;
}

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
  const bottom = tabBarBottom(insets.bottom);

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

      <SelectionIndicator active={active} />
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

// 1 when the tab is selected, 0 otherwise, moving between the two.
function useSelection(selected: boolean): SharedValue<number> {
  const motion = useMotion();
  const selection = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    selection.set(withTiming(selected ? 1 : 0, motion.tabs.select));
  }, [selected, selection, motion.tabs.select]);
  return selection;
}

// One soft bubble travels from tab to tab, and becomes the pastille on Today.
function SelectionIndicator({ active }: { active: TabName }) {
  const motion = useMotion();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const place = useMemo(() => selectionPlace(active), [active]);
  const left = useSharedValue(place.left);
  const right = useSharedValue(place.left + place.width);
  const restWidth = useSharedValue(place.width);
  const restHeight = useSharedValue(place.height);
  const restTop = useSharedValue(place.top);
  const previous = useRef(active);
  // Signed lean of a trip to or from Today, and how far along it is.
  const tilt = useSharedValue(0);
  const tiltTrip = useSharedValue(0);

  useEffect(() => {
    const { bubbleFront, bubbleBack, bubbleCentre, bubbleSettle } = motion.tabs;
    const targetRight = place.left + place.width;
    if (reducedMotion) {
      left.set(place.left);
      right.set(targetRight);
      restWidth.set(place.width);
      restHeight.set(place.height);
      restTop.set(place.top);
      tilt.set(0);
      return;
    }
    const from = previous.current;
    previous.current = active;
    const movingRight = place.left > left.get();
    // A trip with Today follows the line between the tab and the pastille.
    const sideTab = active === 'today' ? from : from === 'today' ? active : null;
    if (sideTab !== null && sideTab !== 'today') {
      tilt.set(sideTab === 'laundry' ? -BUBBLE_TILT : BUBBLE_TILT);
      tiltTrip.set(0);
      tiltTrip.set(withSpring(1, bubbleCentre));
    } else {
      tilt.set(0);
    }
    const shape = active === 'today' ? bubbleCentre : bubbleSettle;
    left.set(withSpring(place.left, movingRight ? bubbleBack : bubbleFront));
    right.set(withSpring(targetRight, movingRight ? bubbleFront : bubbleBack));
    restWidth.set(withSpring(place.width, shape));
    restHeight.set(withSpring(place.height, shape));
    // Height follows the bubble's centre, so every trip with Today is diagonal.
    restTop.set(withSpring(place.top, sideTab === null ? bubbleSettle : bubbleCentre));
  }, [
    active,
    place,
    reducedMotion,
    left,
    right,
    restWidth,
    restHeight,
    restTop,
    tilt,
    tiltTrip,
    motion.tabs,
  ]);

  const bubble = useAnimatedStyle(() => {
    const width = Math.max(right.get() - left.get(), BUBBLE_MIN_SIZE);
    const [thinnest, widest] = BUBBLE_HEIGHT_RANGE;
    const squeeze = Math.min(widest, Math.max(thinnest, restWidth.get() / width));
    const height = Math.max(restHeight.get() * squeeze, BUBBLE_MIN_SIZE);
    // Upright when leaving and arriving, leaning most halfway.
    const trip = Math.min(1, Math.max(0, tiltTrip.get()));
    const rotate = tilt.get() * Math.sin(Math.PI * trip);
    return {
      left: (left.get() + right.get() - width) / 2,
      width,
      height,
      top: restTop.get() + (restHeight.get() - height) / 2,
      borderRadius: Math.min(width, height) / 2,
      transform: [{ rotate: `${rotate}deg` }],
    };
  });
  return (
    <Animated.View
      style={[
        styles.selection,
        { backgroundColor: colors.pastille, borderColor: colors.pastilleEdge },
        bubble,
      ]}
    />
  );
}

function SideTab({ tab, active, onSelect }: SideTabProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const selected = active === tab;
  const { icon, centre } = SIDE_TABS[tab];
  const ink = selected ? colors.forestDeep : colors.tabInk;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={t(`tabs.${tab}`)}
      onPress={() => onSelect(tab)}
      style={[styles.sideTab, { left: centre - CAPSULE.width / 2 }]}
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

// The active and idle looks are two layers that cross-fade while the hanger
// travels and changes size between them.
function TodayTab({ active, onSelect }: TodayTabProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const selection = useSelection(active);
  const activeLayer = useAnimatedStyle(() => ({ opacity: selection.get() }));
  const idleLayer = useAnimatedStyle(() => ({ opacity: 1 - selection.get() }));
  const travel = TODAY_IDLE_CENTRE - TODAY_ACTIVE_CENTRE;
  const growth = TODAY_ICON / TODAY_ICON_ACTIVE;
  const activeHanger = useAnimatedStyle(() => {
    if (reducedMotion) return {};
    const idle = 1 - selection.get();
    return { transform: [{ translateY: travel * idle }, { scale: 1 + (growth - 1) * idle }] };
  });
  const idleHanger = useAnimatedStyle(() => {
    if (reducedMotion) return {};
    const shown = selection.get();
    return {
      transform: [{ translateY: -travel * shown }, { scale: 1 + (1 / growth - 1) * shown }],
    };
  });
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={t('tabs.today')}
      onPress={() => onSelect('today')}
      style={styles.today}
    >
      <Animated.View style={[styles.todayLayer, styles.todayIdle, idleLayer]}>
        <Animated.View style={idleHanger}>
          <Icon
            name="hanger"
            size={TODAY_ICON}
            color={colors.tabInk}
            strokeWidth={TODAY_ICON_STROKE}
          />
        </Animated.View>
        <Text style={[styles.todayLabel, { color: colors.tabInk }]} numberOfLines={1}>
          {t('tabs.today')}
        </Text>
      </Animated.View>
      <Animated.View style={[styles.todayLayer, styles.todayActive, activeLayer]}>
        <Animated.View style={[styles.pastille, activeHanger]}>
          <Icon name="hanger" size={TODAY_ICON_ACTIVE} color={colors.forestDeep} />
        </Animated.View>
        <Text style={[typography.tabActive, { color: colors.ink }]} numberOfLines={1}>
          {t('tabs.today')}
        </Text>
      </Animated.View>
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
    top: CAPSULE_TOP,
    width: CAPSULE.width,
    height: CAPSULE.height,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.space2,
  },
  selection: { position: 'absolute', borderWidth: 1 },
  sideLabelActive: { fontWeight: '600' },
  today: {
    position: 'absolute',
    ...TODAY_BOX,
  },
  todayLayer: { ...StyleSheet.absoluteFill, alignItems: 'center' },
  todayActive: { justifyContent: 'flex-start', gap: 3 },
  todayIdle: { justifyContent: 'flex-end', gap: 1, paddingBottom: TODAY_IDLE_BOTTOM },
  pastille: {
    width: size.sizePastille,
    height: size.sizePastille,
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

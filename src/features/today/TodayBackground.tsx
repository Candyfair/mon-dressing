import { StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Mask,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import type { Ambience } from '../../domain/weather';
import { splitAlpha } from '../../ui/color';
import { type Theme, themeNameFor, useTheme } from '../../ui/theme';

// The mockups are drawn on a 375 pt wide screen; the background scales with
// the width, the top shapes hang from the top and the others from the bottom.
const DESIGN_WIDTH = 375;
const TOP_HEIGHT = 360;
const BOTTOM_HEIGHT = 312;

type Colors = Theme['colors'];

interface TodayBackgroundProps {
  // Null until the forecast is known: the plain ground, without weather.
  ambience: Ambience | null;
}

/**
 * Today's background (design-system WeatherBackground and NightBackground):
 * linen with weather halos in the light theme, night with a tinted twilight
 * and a lamp glow in the dark one. Pre-computed radial gradients replace the
 * mockups' live blur, on both platforms.
 */
export function TodayBackground({ ambience }: TodayBackgroundProps) {
  const { colors } = useTheme();
  const dark = themeNameFor(useColorScheme()) === 'soir';
  const { width } = useWindowDimensions();
  const scale = width / DESIGN_WIDTH;
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: dark ? colors.night : colors.linen }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      {ambience === null ? null : dark ? (
        <NightShapes colors={colors} ambience={ambience} scale={scale} />
      ) : (
        <Halos colors={colors} ambience={ambience} scale={scale} />
      )}
    </View>
  );
}

interface ShapesProps {
  colors: Colors;
  ambience: Ambience;
  scale: number;
}

// Halo colours per weather (design-system "La météo et ses couleurs").
function haloColors(colors: Colors, ambience: Ambience) {
  switch (ambience) {
    case 'rain':
      return { a: colors.eucalyptus, b: colors.sage, c: colors.eucalyptus, d: colors.sage };
    case 'sun':
      return { a: colors.sun, b: colors.ochre, c: colors.sun, d: colors.apricot };
    case 'cold':
      return { a: colors.plumMist, b: colors.palePlum, c: colors.palePlum, d: colors.plumHaze };
    default: {
      const unknown: never = ambience;
      throw new Error(`Unknown ambience: ${String(unknown)}`);
    }
  }
}

function Halos({ colors, ambience, scale }: ShapesProps) {
  const halo = haloColors(colors, ambience);
  return (
    <>
      {/* Top halo, masked so it dies out before the outfit. */}
      <Svg
        width={DESIGN_WIDTH * scale}
        height={TOP_HEIGHT * scale}
        viewBox={`0 0 ${DESIGN_WIDTH} ${TOP_HEIGHT}`}
        style={styles.top}
      >
        <Defs>
          <RadialGradient id="a" cx="160" cy="40" rx="396" ry="297" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={halo.a} />
            <Stop offset="0.35" stopColor={halo.a} stopOpacity={0.6} />
            <Stop offset="0.7" stopColor={halo.a} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="b" cx="345" cy="110" rx="255" ry="255" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={halo.b} />
            <Stop offset="0.66" stopColor={halo.b} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="290" gradientUnits="userSpaceOnUse">
            <Stop offset="0.45" stopColor="#fff" />
            <Stop offset="1" stopColor="#fff" stopOpacity={0} />
          </LinearGradient>
          <Mask id="topMask">
            <Rect x="0" y="0" width={DESIGN_WIDTH} height="290" fill="url(#fade)" />
          </Mask>
        </Defs>
        <Rect x="0" y="0" width={DESIGN_WIDTH} height="290" fill="url(#a)" mask="url(#topMask)" />
        <Rect x="0" y="0" width={DESIGN_WIDTH} height="290" fill="url(#b)" mask="url(#topMask)" />
      </Svg>
      {/* Bottom left patch and bottom right corner; nothing behind the menu centre. */}
      <Svg
        width={DESIGN_WIDTH * scale}
        height={BOTTOM_HEIGHT * scale}
        viewBox={`0 500 ${DESIGN_WIDTH} ${BOTTOM_HEIGHT}`}
        style={styles.bottom}
      >
        <Defs>
          <RadialGradient id="c" cx="0" cy="790" rx="170" ry="190" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={halo.c} />
            <Stop offset="0.5" stopColor={halo.c} stopOpacity={0.5} />
            <Stop offset="1" stopColor={halo.c} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="d" cx="390" cy="840" rx="140" ry="120" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={halo.d} />
            <Stop offset="0.5" stopColor={halo.d} stopOpacity={0.5} />
            <Stop offset="1" stopColor={halo.d} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx="0" cy="790" rx="170" ry="190" fill="url(#c)" />
        <Ellipse cx="390" cy="840" rx="140" ry="120" fill="url(#d)" />
      </Svg>
    </>
  );
}

function twilight(colors: Colors, ambience: Ambience) {
  switch (ambience) {
    case 'rain':
      return { high: colors.twilightPluie, low: colors.twilightPluieLow };
    case 'sun':
      return { high: colors.twilightSoleil, low: colors.twilightSoleilLow };
    case 'cold':
      return { high: colors.twilightFroid, low: colors.twilightFroidLow };
    default: {
      const unknown: never = ambience;
      throw new Error(`Unknown ambience: ${String(unknown)}`);
    }
  }
}

function NightShapes({ colors, ambience, scale }: ShapesProps) {
  const tint = twilight(colors, ambience);
  const lamp = splitAlpha(colors.lampGlow);
  return (
    <>
      {/* Twilight over the top 360 pt, and the lamp glow behind the outfit. */}
      <Svg
        width={DESIGN_WIDTH * scale}
        height={690 * scale}
        viewBox={`0 0 ${DESIGN_WIDTH} 690`}
        style={styles.top}
      >
        <Defs>
          <LinearGradient
            id="sky"
            x1="0"
            y1="0"
            x2="0"
            y2={TOP_HEIGHT}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={tint.high} />
            <Stop offset="0.45" stopColor={tint.high} stopOpacity={0.55} />
            <Stop offset="1" stopColor={tint.high} stopOpacity={0} />
          </LinearGradient>
          <RadialGradient
            id="lamp"
            cx="187.5"
            cy="450"
            rx="167.5"
            ry="240"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={lamp.color} stopOpacity={lamp.opacity} />
            <Stop offset="1" stopColor={lamp.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={DESIGN_WIDTH} height={TOP_HEIGHT} fill="url(#sky)" />
        <Ellipse cx="187.5" cy="450" rx="167.5" ry="240" fill="url(#lamp)" />
      </Svg>
      {/* Echo from the bottom left corner. */}
      <Svg
        width={DESIGN_WIDTH * scale}
        height={300 * scale}
        viewBox={`0 512 ${DESIGN_WIDTH} 300`}
        style={styles.bottom}
      >
        <Defs>
          <RadialGradient
            id="echo"
            cx="0"
            cy="812"
            rx="319"
            ry="300"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={tint.low} />
            <Stop offset="1" stopColor={tint.low} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="512" width={DESIGN_WIDTH} height="300" fill="url(#echo)" />
      </Svg>
    </>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0 },
  bottom: { position: 'absolute', bottom: 0, left: 0 },
});

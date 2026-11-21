import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Mask,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { motion } from '../../ui/motion';
import { seededRandom } from '../../ui/seededRandom';
import { useTheme } from '../../ui/theme';
import { fontFamilies } from '../../ui/tokens';

// The frame of assets/frog-stamp.svg (viewBox 300 × 180): frog head on the
// top line, double line, eyes and smile. The text is written by the app.
const FRAME =
  'M 30 62 H 96 C 100 44 104 30 110 22 C 115 14 124 10 131 14 C 136 17 137 24 137 30 L 137 33 Q 137 37 141 37 H 159 Q 163 37 163 33 L 163 30 C 163 24 164 17 169 14 C 176 10 185 14 190 22 C 196 30 200 44 204 62 H 270 A 18 18 0 0 1 288 80 V 150 A 18 18 0 0 1 270 168 H 30 A 18 18 0 0 1 12 150 V 80 A 18 18 0 0 1 30 62 Z';
const INNER =
  'M 30 68.5 H 101.5 C 105.5 50 109 37 114.5 29 C 118.5 22.5 124 19.5 128 21.5 C 130 22.5 130.5 26 130.5 30 L 130.5 37 Q 130.5 43.5 137 43.5 H 163 Q 169.5 43.5 169.5 37 L 169.5 30 C 169.5 26 170 22.5 172 21.5 C 176 19.5 181.5 22.5 185.5 29 C 191 37 194.5 50 198.5 68.5 H 270 A 11.5 11.5 0 0 1 281.5 80 V 150 A 11.5 11.5 0 0 1 270 161.5 H 30 A 11.5 11.5 0 0 1 18.5 150 V 80 A 11.5 11.5 0 0 1 30 68.5 Z';
const SMILE = 'M 142 52 Q 150 59 158 52';
const VIEW_BOX = { width: 300, height: 180 };

// Placed as in the 375 × 812 pt prototype: 290 × 174 pt, centred, its top at
// 318 pt, tilted by -8°.
const STAMP = { width: 290, height: 174, top: 318 / 812, tilt: -8 };
// The drop: -14° → -8°, 2.6 → 0.94 → 1; it lands at 62 % of the drop.
const DROP = { tilt: -14, scale: 2.6, landed: 0.62, squashed: 0.94 };
const RING = { scale: 1.22, opacity: 0.5 };
const OUT_SCALE = 1.04;
// The pieces shake down and back at the impact (0, 2.5, -2, 1, 0 pt).
const SHAKE = [2.5, -2, 1, 0];
// The veil, a radial gradient: 66 % × 28 % of the screen, centred.
const VEIL = { width: 0.66, height: 0.28 };

// The ink texture: specks where the ink did not take, drawn once from a fixed
// seed (a pre-rendered noise, design spec 01).
const SPECKS = (() => {
  const random = seededRandom(3);
  return Array.from({ length: 140 }, () => ({
    x: random() * VIEW_BOX.width,
    y: 10 + random() * (VIEW_BOX.height - 10),
    r: 0.35 + random() * 0.9,
    opacity: 0.35 + random() * 0.55,
  }));
})();

interface ValidationStampProps {
  // Today's date as the header writes it, in capitals.
  date: string;
  // The outfit's offset, shaken at the impact.
  shake: SharedValue<number>;
  // A new number plays the stamp once; null hides it at once (undone).
  play: number | null;
}

/**
 * The « Tenue du jour validée » stamp that falls on the outfit when it is
 * validated (design spec 01, ValidationStamp), over a veil, for about 2 s.
 * It stays mounted, hidden: drawing it on the tap would hold the screen
 * while the button's burst plays. Decorative: the validation is announced
 * once by Today. Reduced motion: it only fades in and out.
 */
export function ValidationStamp({ date, shake, play }: ValidationStampProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const { validation } = motion;

  const veil = useSharedValue(0);
  // 0 → 1: the drop; then 0 → 1: the fade out.
  const drop = useSharedValue(0);
  const out = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    for (const value of [veil, drop, out, ring]) cancelAnimation(value);
    veil.set(0);
    drop.set(0);
    out.set(0);
    ring.set(0);
    if (play === null) return;
    veil.set(
      withSequence(
        withTiming(1, validation.veilIn),
        withDelay(
          validation.stampHold - validation.veilIn.duration,
          withTiming(0, validation.veilOut),
        ),
      ),
    );
    if (reducedMotion) {
      drop.set(1);
      out.set(-1);
      out.set(
        withSequence(
          withTiming(0, validation.stampFade),
          withDelay(
            validation.stampHold - validation.stampFade.duration,
            withTiming(1, validation.stampFade),
          ),
        ),
      );
      return;
    }
    drop.set(withTiming(1, validation.stampDrop));
    out.set(withDelay(validation.stampHold, withTiming(1, validation.stampOut)));
    ring.set(withDelay(validation.impact, withTiming(1, validation.stampRing)));
    const step = validation.shake.duration / SHAKE.length;
    shake.set(
      withDelay(
        validation.impact,
        withSequence(...SHAKE.map((offset) => withTiming(offset, { duration: step }))),
      ),
    );
    // Plays for a new validation only, not when the theme or motion change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.get() }));
  const stampStyle = useAnimatedStyle(() => {
    const progress = drop.get();
    const landing = Math.min(1, progress / DROP.landed);
    const settling = Math.max(0, (progress - DROP.landed) / (1 - DROP.landed));
    const dropScale =
      progress < DROP.landed
        ? DROP.scale + (DROP.squashed - DROP.scale) * landing
        : DROP.squashed + (1 - DROP.squashed) * settling;
    // Reduced motion: `out` goes from -1 (hidden) to 0 (shown) to 1 (gone).
    const fadeOut = Math.abs(out.get());
    return {
      opacity: landing * (1 - fadeOut),
      transform: [
        { rotate: `${DROP.tilt + (STAMP.tilt - DROP.tilt) * landing}deg` },
        { scale: dropScale * (reducedMotion ? 1 : 1 + (OUT_SCALE - 1) * Math.max(0, out.get())) },
      ],
    };
  });
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.get() > 0 && ring.get() < 1 ? RING.opacity * (1 - ring.get()) : 0,
    transform: [{ rotate: `${STAMP.tilt}deg` }, { scale: 1 + (RING.scale - 1) * ring.get() }],
  }));

  const place = {
    left: (width - STAMP.width) / 2,
    top: height * STAMP.top,
    width: STAMP.width,
    height: STAMP.height,
  };
  const viewBox = `0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}`;
  const text = {
    fill: colors.action,
    fontFamily: fontFamilies.display,
    textAnchor: 'middle' as const,
  };

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[StyleSheet.absoluteFill, veilStyle]}>
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient
              id="veil"
              gradientUnits="userSpaceOnUse"
              cx={width / 2}
              cy={height / 2}
              rx={width * VEIL.width}
              ry={height * VEIL.height}
            >
              <Stop offset={0} stopColor={colors.veil} stopOpacity={1} />
              <Stop offset={1} stopColor={colors.veil} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={width} height={height} fill="url(#veil)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.absolute, place, stampStyle]}>
        <Svg width={STAMP.width} height={STAMP.height} viewBox={viewBox}>
          <Defs>
            <Mask id="ink" maskUnits="userSpaceOnUse" x={0} y={0} width={300} height={180}>
              <Rect width={VIEW_BOX.width} height={VIEW_BOX.height} fill="white" />
              {SPECKS.map((speck, index) => (
                <Circle
                  key={index}
                  cx={speck.x}
                  cy={speck.y}
                  r={speck.r}
                  fill="black"
                  opacity={speck.opacity}
                />
              ))}
            </Mask>
          </Defs>
          <Path d={FRAME} fill={colors.veil} />
          <G mask="url(#ink)">
            <Path
              d={FRAME}
              fill="none"
              stroke={colors.action}
              strokeWidth={3.5}
              strokeLinejoin="round"
            />
            <Path
              d={INNER}
              fill="none"
              stroke={colors.action}
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
            <Ellipse cx={119} cy={46} rx={3.2} ry={4.3} fill={colors.action} />
            <Ellipse cx={181} cy={46} rx={3.2} ry={4.3} fill={colors.action} />
            <Path
              d={SMILE}
              fill="none"
              stroke={colors.action}
              strokeWidth={2.6}
              strokeLinecap="round"
            />
            <SvgText {...text} x={150} y={94} fontSize={13} fontWeight="600" letterSpacing={2.4}>
              {t('today.stamp.title')}
            </SvgText>
            <SvgText {...text} x={150} y={139} fontSize={44} fontWeight="700" letterSpacing={1.6}>
              {t('today.stamp.validated')}
            </SvgText>
            <SvgText {...text} x={150} y={157} fontSize={11.5} fontWeight="600" letterSpacing={1.6}>
              {date}
            </SvgText>
          </G>
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.absolute, place, ringStyle]}>
        <Svg width={STAMP.width} height={STAMP.height} viewBox={viewBox}>
          <Path
            d={FRAME}
            fill="none"
            stroke={colors.action}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: 'absolute' },
});

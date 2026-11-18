import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { splitAlpha } from '../../ui/color';
import { Icon } from '../../ui/Icon';
import { useTheme } from '../../ui/theme';
import { size, spacing } from '../../ui/tokens';
import { photoUri } from '../add/photos/photoStore';
import type { TodayPiece } from './useToday';

// Contact shadow: a 12 pt ellipse, about 55 % of the frame wide, under the
// visible bottom of the piece (photos keep a margin under the garment).
const SHADOW_HEIGHT = 12;
const SHADOW_WIDTH = 0.55;
const SHADOW_TOP = 0.88;
// A one-piece fills its taller frame: the shadow sits right under it (AP4).
const TALL_SHADOW_TOP = 0.965;
const BADGE_ICON = 15;
// The statement piece badge borrows the favourite colours until it is designed.
// Placeholder tile of the reference wardrobe (development only).
const PLACEHOLDER = 0.7;

interface OutfitPieceProps {
  piece: TodayPiece;
  // Side of the invisible square frame (garment-* sizes, scaled).
  frame: number;
  // Taller than wide for a one-piece, which spans the top and the bottom.
  height?: number;
  // The location badge sits against the right shoulder.
  showBadge?: boolean;
}

/**
 * One piece of the outfit, without a frame, on its contact shadow
 * (design-system OutfitPiece). Decorative: the row or button holding it
 * carries the accessible name.
 */
export function OutfitPiece({ piece, frame, height = frame, showBadge = true }: OutfitPieceProps) {
  const { colors } = useTheme();
  const shadowWidth = frame * SHADOW_WIDTH;
  const shadow = splitAlpha(colors.contactShadow);
  const badge =
    piece.location === 'airing'
      ? 'airing'
      : piece.location === 'onDryingRack'
        ? 'dryingRack'
        : null;
  return (
    <View style={{ width: frame, height }}>
      <Svg
        width={shadowWidth}
        height={SHADOW_HEIGHT}
        style={[
          styles.shadow,
          {
            left: (frame - shadowWidth) / 2,
            top: height * (height > frame ? TALL_SHADOW_TOP : SHADOW_TOP),
          },
        ]}
      >
        <Defs>
          <RadialGradient id="contact" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={shadow.color} stopOpacity={shadow.opacity} />
            <Stop offset="0.7" stopColor={shadow.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={shadowWidth / 2}
          cy={SHADOW_HEIGHT / 2}
          rx={shadowWidth / 2}
          ry={SHADOW_HEIGHT / 2}
          fill="url(#contact)"
        />
      </Svg>
      {piece.photo === null ? (
        <View
          style={[
            styles.placeholder,
            {
              width: frame * PLACEHOLDER,
              height: frame * PLACEHOLDER,
              marginHorizontal: (frame * (1 - PLACEHOLDER)) / 2,
              marginVertical: (height - frame * PLACEHOLDER) / 2,
              backgroundColor: colors.tileFill,
              borderColor: colors.tileEdge,
            },
          ]}
        >
          <Text style={{ color: colors.ink }}>{piece.label}</Text>
        </View>
      ) : (
        <Image
          source={{ uri: photoUri(piece.photo) }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          accessible={false}
        />
      )}
      {(showBadge && badge !== null) || piece.statementPiece ? (
        <View style={styles.badges}>
          {showBadge && badge !== null ? (
            <View style={[styles.badge, { backgroundColor: colors.locationTint }]}>
              <Icon name={badge} size={BADGE_ICON} color={colors.locationInk} />
            </View>
          ) : null}
          {piece.statementPiece ? (
            <View style={[styles.badge, { backgroundColor: colors.statusFavoriBg }]}>
              <Icon name="statementPiece" size={BADGE_ICON} color={colors.statusFavori} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute' },
  placeholder: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Against the right shoulder, one under the other.
  badges: { position: 'absolute', right: -1, top: spacing.space6, gap: spacing.space6 },
  badge: {
    width: size.sizeBadge,
    height: size.sizeBadge,
    borderRadius: size.sizeBadge / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

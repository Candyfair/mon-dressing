import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { db } from '../../db/client';
import { loadEngineGarments } from '../../db/repositories/engineInputs';
import { garmentThumbnails } from '../../db/repositories/garments';
import { getActiveWardrobe } from '../../db/repositories/wardrobes';
import { type RowSlot, rowOf } from '../../domain/engine';
import { referenceWardrobe } from '../../domain/engine/__fixtures__/wardrobe';
import { Glass } from '../../ui/Glass';
import { DEFAULT_GLASS_MODE, type GlassMode } from '../../ui/glassContext';
import { GlassStage } from '../../ui/GlassStage';
import { LoopingCarousel } from '../../ui/LoopingCarousel';
import { useTheme } from '../../ui/theme';
import { fontFamilies, opacity, radius, size, spacing } from '../../ui/tokens';
import { photoUri } from '../add/photos/photoStore';
import { DevRadialPieces } from './DevRadialPieces';

interface Piece {
  id: string;
  label: string;
  // Null for the reference wardrobe (no photos): a labelled tile stands in.
  photo: string | null;
}

// Today's rows (one column), a two-column lane and the layer sheet carousel.
const ROW_PIECE = 150;
const RADIAL_TILE = 100;
const ROW_STEP = 115;
const LANE_WIDTH = 210;
const SHEET_STEP = 190;
const SHEET_NEIGHBOUR_SCALE = 150 / size.garmentSheet;
const GLASS_BAR_HEIGHT = 64;

/**
 * Development screen (S6): the shared looping carousel on the real
 * wardrobe, to check on device that a swipe stays in its row, loops, bounces
 * on a single piece and stays smooth. Not designed; removed in S7.
 */
export function DevGesturesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [swiping, setSwiping] = useState(false);
  const [glassMode, setGlassMode] = useState<GlassMode>(DEFAULT_GLASS_MODE);

  const rows = useMemo(() => {
    const wardrobe = getActiveWardrobe(db);
    const photos = new Map(
      garmentThumbnails(db, wardrobe.id).map((piece) => [piece.id, piece] as const),
    );
    const byRow: Record<RowSlot, Piece[]> = {
      top: [],
      bottom: [],
      midLayer: [],
      outerLayer: [],
      shoes: [],
    };
    const real = loadEngineGarments(db, wardrobe.id);
    // An empty wardrobe (fresh emulator) falls back to the reference one.
    for (const garment of real.length > 0 ? real : referenceWardrobe()) {
      const thumbnail = photos.get(garment.id);
      byRow[rowOf(garment)].push({
        id: garment.id,
        label: thumbnail ? t(`subtypes.${thumbnail.subtype}`) : garment.id,
        photo: thumbnail?.photoPath ?? null,
      });
    }
    return byRow;
  }, [t]);

  const renderPiece = (dimension: number) =>
    function PiecePhoto(piece: Piece) {
      if (piece.photo === null) {
        return <PlaceholderTile label={piece.label} dimension={dimension} />;
      }
      return (
        <Image
          source={{ uri: photoUri(piece.photo) }}
          style={{ width: dimension, height: dimension }}
          contentFit="contain"
          accessible={false}
        />
      );
    };

  return (
    <GlassStage
      mode={glassMode}
      behind={
        <ScrollView
          style={{ backgroundColor: colors.ground }}
          contentContainerStyle={{
            paddingTop: insets.top + spacing.space16,
            paddingBottom: insets.bottom + GLASS_BAR_HEIGHT + spacing.space40,
            gap: spacing.space24,
          }}
        >
          <Text style={[styles.status, { color: colors.inkSecondary }]}>
            {t(swiping ? 'dev.gestures.swiping' : 'dev.gestures.idle')}
          </Text>

          <Section title={t('dev.gestures.radial')}>
            <DevRadialPieces
              pieces={rows.top}
              renderTile={renderPiece(RADIAL_TILE)}
              renderLarge={renderPiece(ROW_PIECE)}
            />
          </Section>

          <Section title={t('dev.gestures.oneColumn')}>
            {(['top', 'bottom', 'shoes'] as const).map((row) => (
              <Row
                key={row}
                pieces={rows[row]}
                renderItem={renderPiece(row === 'shoes' ? 96 : ROW_PIECE)}
                step={ROW_STEP}
                height={row === 'shoes' ? 100 : ROW_PIECE}
                label={t(`dev.gestures.rows.${row}`)}
                onSwipeActiveChange={setSwiping}
              />
            ))}
          </Section>

          <Section title={t('dev.gestures.lane')}>
            <View style={styles.twoColumns}>
              <View style={[styles.layers, { borderColor: colors.divider }]}>
                <Text style={{ color: colors.inkSecondary }}>
                  {t('dev.gestures.rows.midLayer')}
                </Text>
              </View>
              <View style={{ width: LANE_WIDTH }}>
                <Row
                  pieces={rows.top}
                  renderItem={renderPiece(ROW_PIECE)}
                  step={ROW_STEP}
                  height={ROW_PIECE}
                  label={t('dev.gestures.rows.top')}
                  edgeFade
                />
                <Row
                  pieces={rows.bottom}
                  renderItem={renderPiece(ROW_PIECE)}
                  step={ROW_STEP}
                  height={ROW_PIECE}
                  label={t('dev.gestures.rows.bottom')}
                  edgeFade
                />
              </View>
            </View>
          </Section>

          <Section title={t('dev.gestures.sheet')}>
            <Row
              pieces={[...rows.midLayer, ...rows.outerLayer]}
              renderItem={renderPiece(size.garmentSheet)}
              step={SHEET_STEP}
              height={size.garmentSheet}
              label={t('dev.gestures.rows.midLayer')}
              neighbourOpacity={opacity.neighbourOpacity}
              neighbourScale={SHEET_NEIGHBOUR_SCALE}
            />
          </Section>
        </ScrollView>
      }
    >
      {/* Floating glass over moving content, like the tab bar: blur or tint. */}
      <Glass
        kind="surface"
        tint={colors.tabbarGlass}
        style={[styles.glassBar, { bottom: insets.bottom + spacing.space24 }]}
      >
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: glassMode === 'blur' }}
          onPress={() => setGlassMode((mode) => (mode === 'blur' ? 'tint' : 'blur'))}
          style={styles.glassToggle}
        >
          <Text style={[styles.title, { color: colors.tabInk }]}>
            {t(glassMode === 'blur' ? 'dev.gestures.glassBlur' : 'dev.gestures.glassTint')}
          </Text>
        </Pressable>
      </Glass>
    </GlassStage>
  );
}

function PlaceholderTile({ label, dimension }: { label: string; dimension: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.tile,
        {
          width: dimension * 0.8,
          height: dimension * 0.8,
          backgroundColor: colors.tileFill,
          borderColor: colors.tileEdge,
        },
      ]}
    >
      <Text style={{ color: colors.ink }}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
      {children}
    </View>
  );
}

interface RowProps {
  pieces: readonly Piece[];
  renderItem: (piece: Piece) => React.ReactNode;
  step: number;
  height: number;
  label: string;
  neighbourOpacity?: number;
  neighbourScale?: number;
  edgeFade?: boolean;
  onSwipeActiveChange?: (active: boolean) => void;
}

function Row({ pieces, label, ...carousel }: RowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const current = pieces[index];
  return (
    <View>
      <LoopingCarousel
        items={pieces}
        index={index}
        onIndexChange={setIndex}
        accessibilityLabel={`${label} : ${current?.label ?? ''}`}
        {...carousel}
      />
      <Text style={[styles.caption, { color: colors.inkSecondary }]}>
        {current
          ? t('dev.gestures.position', {
              label: current.label,
              index: index + 1,
              count: pieces.length,
            })
          : t('dev.gestures.empty')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.space10 },
  title: {
    fontFamily: fontFamilies.text,
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: spacing.space16,
  },
  status: { fontFamily: fontFamilies.text, fontSize: 13, paddingHorizontal: spacing.space16 },
  caption: { fontFamily: fontFamilies.text, fontSize: 12, textAlign: 'center' },
  twoColumns: { flexDirection: 'row', justifyContent: 'center', gap: spacing.space10 },
  glassBar: {
    position: 'absolute',
    alignSelf: 'center',
    height: GLASS_BAR_HEIGHT,
    borderRadius: radius.radiusTabbar,
  },
  glassToggle: {
    flex: 1,
    paddingHorizontal: spacing.space24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layers: {
    width: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

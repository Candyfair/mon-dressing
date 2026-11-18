import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import type { RowSlot, Suggestion } from '../../domain/engine';
import { LoopingCarousel } from '../../ui/LoopingCarousel';
import { motion } from '../../ui/motion';
import { size } from '../../ui/tokens';
import { AddLayerButton } from './AddLayerButton';
import { EmptySlot } from './EmptySlot';
import {
  addLayer,
  chosenGarment,
  moveTo,
  nextLayer,
  type OutfitChoice,
  type OutfitRow,
  rowGarments,
  shownLayers,
  wearsOnePiece,
} from './outfitChoice';
import { OutfitPiece } from './OutfitPiece';
import { pieceDescription } from './pieceDescription';
import type { TodayPiece } from './useToday';

// The outfit zone of the mockups: 343 × 490 pt, under the header.
export const OUTFIT_WIDTH = 343;
export const OUTFIT_HEIGHT = 490;

// Frames placed as in the mockups (01-aujourdhui J2, J1). Neighbouring
// frames overlap where the photos keep an empty margin; each row's swipe
// area stops halfway through the overlap, so two rows never share a touch.
interface RowPlace {
  // Centred in its row (one column) or in the lane (two columns).
  frame: number;
  frameTop: number;
  // Swipe area, top and bottom.
  band: [number, number];
}

const ONE_COLUMN: Record<OutfitRow, RowPlace> = {
  top: { frame: size.garmentTop, frameTop: 21, band: [21, 205] },
  bottom: { frame: size.garmentBottom, frameTop: 189, band: [205, 366] },
  shoes: { frame: size.garmentShoes, frameTop: 342.5, band: [366, 458.5] },
};
const ADD_LAYER = { left: 18, top: 95 };

// Two columns of equal width (Candice, S6): layers on the left, the right
// column swipes in its lane. A layer has the size of the top and sits level
// with the top, then with the bottom.
const COLUMN = OUTFIT_WIDTH / 2;
const LANE = { left: COLUMN, width: COLUMN };
const TWO_COLUMN: Record<OutfitRow, RowPlace> = {
  top: { frame: COLUMN, frameTop: 20, band: [20, 185] },
  bottom: { frame: COLUMN, frameTop: 178.5, band: [185, 338] },
  shoes: { frame: size.garmentShoes, frameTop: 326.5, band: [338, 442.5] },
};
const LAYER = {
  left: 0,
  firstTop: TWO_COLUMN.top.frameTop,
  step: TWO_COLUMN.bottom.frameTop - TWO_COLUMN.top.frameTop,
};

// A one-piece replaces the top and the bottom: the top's width, 320 pt high
// for a 200 pt frame (AP4 mockup), centred on the two places (Candice, S6).
const ONE_PIECE_HEIGHT_RATIO = 1.6;

// The right column's distance between two pieces: the next one arrives
// close, as in the AP2 mockup (out at −70, in at +58 for 194 pt).
const STEP_RATIO = 0.66;

interface TodayOutfitProps {
  suggestion: Suggestion;
  pieces: ReadonlyMap<string, TodayPiece>;
  choice: OutfitChoice;
  onChoiceChange: (update: (choice: OutfitChoice) => OutfitChoice) => void;
  // Rows drawn as dashed silhouettes, and what touching one does.
  emptyRows: readonly OutfitRow[];
  onAddPiece: () => void;
  // Outfit zone scale: 1 on the 375 × 812 pt reference screen.
  scale: number;
  onLayerPress: (row: 'midLayer' | 'outerLayer') => void;
}

/** The outfit of the day: one column, or layers on the left and a lane. */
export function TodayOutfit({
  suggestion,
  pieces,
  choice,
  onChoiceChange,
  emptyRows,
  onAddPiece,
  scale,
  onLayerPress,
}: TodayOutfitProps) {
  const { t } = useTranslation();
  const [swiping, setSwiping] = useState(false);
  const layers = shownLayers(choice);
  const twoColumns = layers.length > 0;
  const places = twoColumns ? TWO_COLUMN : ONE_COLUMN;
  const underDress = wearsOnePiece(choice, suggestion, pieces);
  const layerToAdd = nextLayer(choice, suggestion);

  const currentPiece = (row: RowSlot) => {
    const ids = rowGarments(choice, suggestion, row);
    return pieces.get(ids[choice.index[row] % ids.length] ?? '');
  };
  const describe = (row: RowSlot, slot: string): string => {
    const piece = currentPiece(row);
    return piece ? t('today.piece', { slot, description: pieceDescription(piece, t) }) : slot;
  };

  const rows = (['top', 'bottom', 'shoes'] as const).filter(
    (row) =>
      choice.shown[row] &&
      !(row === 'bottom' && underDress) &&
      rowGarments(choice, suggestion, row).length > 0,
  );
  const columnLeft = twoColumns ? LANE.left * scale : 0;
  const columnWidth = (twoColumns ? LANE.width : OUTFIT_WIDTH) * scale;
  // The add button waits for a top; it then takes the next layer's place.
  const hasTop = chosenGarment(choice, suggestion, pieces, 'top') !== null;
  const addLayerPlace = twoColumns
    ? {
        left: LAYER.left + (COLUMN - size.sizeTap) / 2,
        top: LAYER.firstTop + layers.length * LAYER.step + (COLUMN - size.sizeTap) / 2,
      }
    : ADD_LAYER;

  return (
    <View
      accessibilityLabel={t('today.outfit')}
      style={{ width: OUTFIT_WIDTH * scale, height: OUTFIT_HEIGHT * scale }}
    >
      {layers.map((row, position) => {
        const piece = currentPiece(row);
        if (!piece) return null;
        const frame = COLUMN * scale;
        return (
          <Pressable
            key={row}
            accessibilityRole="button"
            accessibilityLabel={t('today.piece', {
              slot: t('today.slots.layer', { number: position + 1 }),
              description: pieceDescription(piece, t),
            })}
            onPress={() => onLayerPress(row)}
            style={[
              styles.absolute,
              { left: LAYER.left * scale, top: (LAYER.firstTop + position * LAYER.step) * scale },
            ]}
          >
            <OutfitPiece piece={piece} frame={frame} />
          </Pressable>
        );
      })}

      {rows.map((row) => {
        const place = places[row];
        const frame = place.frame * scale;
        const [bandTop] = place.band;
        // Under a one-piece, the top row also swipes over the bottom's area.
        const bandBottom = row === 'top' && underDress ? places.bottom.band[1] : place.band[1];
        const bandHeight = (bandBottom - bandTop) * scale;
        // The band centres its content: pieces are moved from there.
        const bandCentre = (bandTop + bandBottom) / 2;
        const frameCentre = place.frameTop + place.frame / 2;
        const onePieceCentre =
          (places.top.frameTop + places.bottom.frameTop + places.bottom.frame) / 2;
        return (
          <Animated.View
            key={row}
            entering={FadeIn.duration(motion.carousel.crossFade.duration)}
            exiting={FadeOut.duration(motion.carousel.crossFade.duration)}
            style={[
              styles.absolute,
              { left: columnLeft, top: bandTop * scale, width: columnWidth },
              (row === 'bottom' || (row === 'top' && underDress)) && styles.overShoes,
            ]}
          >
            <LoopingCarousel
              items={rowGarments(choice, suggestion, row)}
              index={choice.index[row]}
              onIndexChange={(index) => onChoiceChange((current) => moveTo(current, row, index))}
              renderItem={(id) => {
                const piece = pieces.get(id);
                if (!piece) return null;
                const onePiece = piece.slot === 'onePiece';
                const height = (onePiece ? ONE_PIECE_HEIGHT_RATIO : 1) * frame;
                const centre = onePiece ? onePieceCentre : frameCentre;
                return (
                  <View style={{ transform: [{ translateY: (centre - bandCentre) * scale }] }}>
                    <OutfitPiece piece={piece} frame={frame} height={height} />
                  </View>
                );
              }}
              step={place.frame * STEP_RATIO * scale}
              height={bandHeight}
              edgeFade={twoColumns}
              onSwipeActiveChange={setSwiping}
              accessibilityLabel={describe(row, t(`today.slots.${row}`))}
            />
          </Animated.View>
        );
      })}

      {emptyRows.map((row) => {
        const place = places[row];
        const frame = place.frame * scale;
        return (
          <View
            key={row}
            style={[
              styles.absolute,
              {
                left: columnLeft + (columnWidth - frame) / 2,
                top: place.frameTop * scale,
              },
              row === 'bottom' && styles.overShoes,
            ]}
          >
            <EmptySlot row={row} frame={frame} onPress={onAddPiece} />
          </View>
        );
      })}

      {layerToAdd !== null && hasTop ? (
        <View
          style={[
            styles.absolute,
            {
              left: addLayerPlace.left * scale,
              top: addLayerPlace.top * scale,
              opacity: swiping ? 0 : 1,
            },
          ]}
        >
          <AddLayerButton
            onPress={() => onChoiceChange((current) => addLayer(current, suggestion, layerToAdd))}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: 'absolute' },
  // Trousers and dresses run down over the shoes, not under them.
  overShoes: { zIndex: 1 },
});

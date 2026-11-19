import { type ComponentRef, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import type { LayerSlot, RowSlot, Suggestion } from '../../domain/engine';
import { loopIndex } from '../../ui/loopIndex';
import { LoopingCarousel } from '../../ui/LoopingCarousel';
import { motion } from '../../ui/motion';
import { size, spacing } from '../../ui/tokens';
import { AddLayerButton } from './AddLayerButton';
import { EmptySlot } from './EmptySlot';
import { LayerSheet } from './LayerSheet';
import {
  addLayer,
  chosenGarment,
  currentGarment,
  moveTo,
  nextLayer,
  onePieceShare,
  type OutfitChoice,
  type OutfitRow,
  rowGarments,
  showRow,
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
// for a 200 pt frame (AP4 mockup). In one column it starts level with the
// tops; in two columns it is centred on the two places (Candice, S6).
const ONE_PIECE_HEIGHT_RATIO = 1.6;

// Empty space between two pieces of a row while swiping (Candice, S6).
const PIECE_GAP = spacing.space16;

// Leaves the modal time to go before the focus returns to the touched layer.
const FOCUS_RETURN_DELAY = 150;

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
}: TodayOutfitProps) {
  const { t } = useTranslation();
  const [swiping, setSwiping] = useState(false);
  const [openLayer, setOpenLayer] = useState<LayerSlot | null>(null);
  const layerButtons = useRef<Partial<Record<LayerSlot, ComponentRef<typeof View> | null>>>({});
  const layers = shownLayers(choice);
  const twoColumns = layers.length > 0;
  const places = twoColumns ? TWO_COLUMN : ONE_COLUMN;
  const underDress = wearsOnePiece(choice, suggestion, pieces);
  const layerToAdd = nextLayer(choice, suggestion);

  const currentPiece = (row: RowSlot) => {
    return pieces.get(currentGarment(choice, suggestion, row) ?? '');
  };
  const describe = (row: RowSlot, slot: string): string => {
    const piece = currentPiece(row);
    return piece ? t('today.piece', { slot, description: pieceDescription(piece, t) }) : slot;
  };

  // A removed layer has no button left: the focus then stays where it falls.
  const closeLayerSheet = (layer: LayerSlot) => {
    setOpenLayer(null);
    setTimeout(() => {
      const button = layerButtons.current[layer];
      if (button) AccessibilityInfo.sendAccessibilityEvent(button, 'focus');
    }, FOCUS_RETURN_DELAY);
  };
  // A layer hidden by a new suggestion closes its sheet for good.
  if (openLayer !== null && !layers.includes(openLayer)) {
    setOpenLayer(null);
  }
  const sheetLayer = openLayer !== null && layers.includes(openLayer) ? openLayer : null;
  const sheetGarments = sheetLayer ? rowGarments(choice, suggestion, sheetLayer) : [];

  // The bottom stays mounted under a dress: it fades with the top row's swipe
  // and comes back the same way.
  const topPosition = useSharedValue(choice.index.top);
  const topOnePieces = choice.shown.top
    ? rowGarments(choice, suggestion, 'top').map((id) => pieces.get(id)?.slot === 'onePiece')
    : [];
  const bottomFade = useAnimatedStyle(() => ({
    opacity: 1 - onePieceShare(topPosition.get(), topOnePieces),
  }));

  const rows = (['top', 'bottom', 'shoes'] as const).filter(
    (row) => choice.shown[row] && rowGarments(choice, suggestion, row).length > 0,
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
            ref={(button) => {
              layerButtons.current[row] = button;
            }}
            accessibilityRole="button"
            accessibilityLabel={t('today.piece', {
              slot: t('today.slots.layer', { number: position + 1 }),
              description: pieceDescription(piece, t),
            })}
            onPress={() => setOpenLayer(row)}
            style={[
              styles.absolute,
              styles.overPieces,
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
        const hiddenByDress = row === 'bottom' && underDress;
        const bandBottom = row === 'top' && underDress ? places.bottom.band[1] : place.band[1];
        const bandHeight = (bandBottom - bandTop) * scale;
        // The band centres its content: pieces are moved from there.
        const bandCentre = (bandTop + bandBottom) / 2;
        const frameCentre = place.frameTop + place.frame / 2;
        const onePieceCentre = twoColumns
          ? (places.top.frameTop + places.bottom.frameTop + places.bottom.frame) / 2
          : place.frameTop + (place.frame * ONE_PIECE_HEIGHT_RATIO) / 2;
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
            <Animated.View
              style={row === 'bottom' ? bottomFade : undefined}
              pointerEvents={hiddenByDress ? 'none' : 'auto'}
              accessibilityElementsHidden={hiddenByDress}
              importantForAccessibility={hiddenByDress ? 'no-hide-descendants' : 'auto'}
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
                      <OutfitPiece
                        piece={piece}
                        frame={frame}
                        height={height}
                        alignTop={row === 'bottom' || (onePiece && !twoColumns)}
                      />
                    </View>
                  );
                }}
                step={(place.frame + PIECE_GAP) * scale}
                position={row === 'top' ? topPosition : undefined}
                height={bandHeight}
                edgeFade={twoColumns}
                onSwipeActiveChange={setSwiping}
                accessibilityLabel={describe(row, t(`today.slots.${row}`))}
              />
            </Animated.View>
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
            styles.overPieces,
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

      {sheetLayer && sheetGarments.length > 0 ? (
        <LayerSheet
          layerNumber={layers.indexOf(sheetLayer) + 1}
          garments={sheetGarments}
          pieces={pieces}
          index={loopIndex(choice.index[sheetLayer], sheetGarments.length)}
          onIndexChange={(index) => onChoiceChange((current) => moveTo(current, sheetLayer, index))}
          onRemove={() => {
            onChoiceChange((current) => showRow(current, sheetLayer, false));
            closeLayerSheet(sheetLayer);
          }}
          onClose={() => closeLayerSheet(sheetLayer)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: 'absolute' },
  // Trousers and dresses run down over the shoes, not under them.
  overShoes: { zIndex: 1 },
  // Layers and the add button: the right column's pieces slide under them,
  // and a dress's swipe area leaves the button touchable.
  overPieces: { zIndex: 2 },
});

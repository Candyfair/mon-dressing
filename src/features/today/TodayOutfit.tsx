import { type ComponentRef, useLayoutEffect, useRef, useState } from 'react';
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
import { LaundrySlot } from './LaundrySlot';
import { LayerSheet } from './LayerSheet';
import { OUTFIT_ROWS } from '../../domain/catalogue/outfitRows';
import { LockedOutline, OUTLINE_MARGIN, type OutlineBounds } from './LockedOutline';
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
  type RowStatuses,
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
  // What each row shows: garments, a dashed silhouette or the laundry slot.
  rowStatus: RowStatuses;
  // Touching a silhouette, and the laundry slot's link.
  onAddPiece: (row: OutfitRow) => void;
  onSortLaundry: () => void;
  // Validated outfit: nothing swipes, no layer to add or change.
  locked?: boolean;
  // Outfit zone scale: 1 on the 375 × 812 pt reference screen.
  scale: number;
  // Where the bottom line of the validation outline is, in the outfit
  // zone's points: the « Portée aujourd’hui » pill sits astride it.
  onOutlineBottom?: (bottom: number) => void;
}

/** The outfit of the day: one column, or layers on the left and a lane. */
export function TodayOutfit({
  suggestion,
  pieces,
  choice,
  onChoiceChange,
  rowStatus,
  onAddPiece,
  onSortLaundry,
  locked = false,
  scale,
  onOutlineBottom,
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
  // and comes back the same way. The top row's position is only followed
  // once a swipe has started on this suggestion: after a new one (an undone
  // validation), the carousel moves its pieces after the render, and reading
  // the old position against the new row would flash the bottom.
  const topPosition = useSharedValue(choice.index.top);
  const [swipedSuggestion, setSwipedSuggestion] = useState(suggestion);
  const followsSwipe = swipedSuggestion === suggestion;
  const topOnePieces = choice.shown.top
    ? rowGarments(choice, suggestion, 'top').map((id) => pieces.get(id)?.slot === 'onePiece')
    : [];
  const bottomFade = useAnimatedStyle(() => ({
    opacity: followsSwipe ? 1 - onePieceShare(topPosition.get(), topOnePieces) : underDress ? 0 : 1,
  }));

  const rows = OUTFIT_ROWS.filter(
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

  // The outline goes around the pieces as they stand when the outfit locks,
  // and keeps that place while it is erased.
  const bounds = piecesBounds(rows, layers.length, places, twoColumns, underDress, scale);
  const [outlineBounds, setOutlineBounds] = useState(bounds);
  if (locked && !sameBounds(bounds, outlineBounds)) {
    setOutlineBounds(bounds);
  }
  const outlineBottom = outlineBounds.y + outlineBounds.height + OUTLINE_MARGIN;
  // Before the paint: a validated outfit opens with the pill already on it.
  useLayoutEffect(() => onOutlineBottom?.(outlineBottom), [onOutlineBottom, outlineBottom]);

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
            accessibilityRole={locked ? undefined : 'button'}
            accessibilityLabel={t('today.piece', {
              slot: t('today.slots.layer', { number: position + 1 }),
              description: pieceDescription(piece, t),
            })}
            onPress={locked ? undefined : () => setOpenLayer(row)}
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
                locked={locked}
                onSwipeActiveChange={(active) => {
                  setSwiping(active);
                  if (active && row === 'top') setSwipedSuggestion(suggestion);
                }}
                accessibilityLabel={describe(row, t(`today.slots.${row}`))}
              />
            </Animated.View>
          </Animated.View>
        );
      })}

      {OUTFIT_ROWS.map((row) => {
        const status = rowStatus[row];
        const place = places[row];
        const frame = place.frame * scale;
        switch (status) {
          case 'filled':
          case 'notProposed':
            return null;
          case 'neverAdded':
          case 'empty':
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
                <EmptySlot row={row} frame={frame} onPress={() => onAddPiece(row)} />
              </View>
            );
          case 'inLaundry': {
            // Centred in the row's swipe area, which stops where the next row's
            // starts: on two lines in the narrow lane, it stays clear of the shoes.
            const [bandTop, bandBottom] = place.band;
            return (
              <View
                key={row}
                style={[
                  styles.absolute,
                  styles.laundry,
                  {
                    left: columnLeft,
                    top: bandTop * scale,
                    width: columnWidth,
                    height: (bandBottom - bandTop) * scale,
                  },
                ]}
              >
                <LaundrySlot row={row} width={columnWidth} onSortLaundry={onSortLaundry} />
              </View>
            );
          }
          default: {
            const unknown: never = status;
            throw new Error(`Unknown row status ${String(unknown)}`);
          }
        }
      })}

      {layerToAdd !== null && hasTop && !locked ? (
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

      <LockedOutline bounds={locked ? bounds : outlineBounds} visible={locked} />

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

/** The box of the pieces shown, in the outfit zone's points. */
function piecesBounds(
  rows: readonly OutfitRow[],
  layerCount: number,
  places: Record<OutfitRow, RowPlace>,
  twoColumns: boolean,
  underDress: boolean,
  scale: number,
): OutlineBounds {
  const boxes = rows
    .filter((row) => !(row === 'bottom' && underDress))
    .map((row) => {
      const place = places[row];
      const left =
        (twoColumns ? LANE.left : 0) + ((twoColumns ? LANE.width : OUTFIT_WIDTH) - place.frame) / 2;
      if (row === 'top' && underDress) {
        const height = place.frame * ONE_PIECE_HEIGHT_RATIO;
        const top = twoColumns
          ? (places.top.frameTop + places.bottom.frameTop + places.bottom.frame) / 2 - height / 2
          : place.frameTop;
        return { left, top, right: left + place.frame, bottom: top + height };
      }
      return {
        left,
        top: place.frameTop,
        right: left + place.frame,
        bottom: place.frameTop + place.frame,
      };
    });
  for (let position = 0; position < layerCount; position++) {
    const top = LAYER.firstTop + position * LAYER.step;
    boxes.push({ left: LAYER.left, top, right: LAYER.left + COLUMN, bottom: top + COLUMN });
  }
  if (boxes.length === 0) {
    return { x: 0, y: 0, width: OUTFIT_WIDTH * scale, height: OUTFIT_HEIGHT * scale };
  }
  const left = Math.min(...boxes.map((box) => box.left));
  const top = Math.min(...boxes.map((box) => box.top));
  const right = Math.max(...boxes.map((box) => box.right));
  const bottom = Math.max(...boxes.map((box) => box.bottom));
  return {
    x: left * scale,
    y: top * scale,
    width: (right - left) * scale,
    height: (bottom - top) * scale,
  };
}

function sameBounds(a: OutlineBounds, b: OutlineBounds): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

const styles = StyleSheet.create({
  absolute: { position: 'absolute' },
  laundry: { justifyContent: 'center' },
  // Trousers and dresses run down over the shoes, not under them.
  overShoes: { zIndex: 1 },
  // Layers and the add button: the right column's pieces slide under them,
  // and a dress's swipe area leaves the button touchable.
  overPieces: { zIndex: 2 },
});

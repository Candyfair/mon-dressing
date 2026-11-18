import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Button } from '../../ui/Button';
import { Dots } from '../../ui/Dots';
import { LoopingCarousel } from '../../ui/LoopingCarousel';
import { Sheet } from '../../ui/Sheet';
import { opacity, size, spacing } from '../../ui/tokens';
import { OutfitPiece } from './OutfitPiece';
import { pieceDescription } from './pieceDescription';
import type { TodayPiece } from './useToday';

// AP3 mockup: neighbours of 150 pt, here with empty space around the current
// piece (Candice, S6).
const NEIGHBOUR = 150;
const STEP = (size.garmentSheet + NEIGHBOUR) / 2 + spacing.space16;

interface LayerSheetProps {
  // Place of the layer in the left column, from 1.
  layerNumber: number;
  garments: readonly string[];
  pieces: ReadonlyMap<string, TodayPiece>;
  index: number;
  onIndexChange: (index: number) => void;
  onRemove: () => void;
  onClose: () => void;
}

/**
 * Choosing a layer (design spec 02, AP3): swiping changes the outfit behind
 * the sheet. In a modal, because the sheet and its scrim cover the tab bar.
 */
export function LayerSheet({
  layerNumber,
  garments,
  pieces,
  index,
  onIndexChange,
  onRemove,
  onClose,
}: LayerSheetProps) {
  const { t } = useTranslation();
  const count = garments.length;
  const position = index + 1;
  const current = pieces.get(garments[index] ?? '');
  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <Sheet
          accessibilityLabel={t('today.layerSheet.title', {
            layer: t('today.slots.layer', { number: layerNumber }),
          })}
          onClose={onClose}
        >
          <LoopingCarousel
            items={garments}
            index={index}
            onIndexChange={onIndexChange}
            renderItem={(id) => {
              const piece = pieces.get(id);
              return piece ? <OutfitPiece piece={piece} frame={size.garmentSheet} /> : null;
            }}
            step={STEP}
            height={size.garmentSheet}
            neighbourOpacity={opacity.neighbourOpacity}
            neighbourScale={NEIGHBOUR / size.garmentSheet}
            accessibilityLabel={t('today.layerSheet.piece', {
              description: current ? pieceDescription(current, t) : '',
              position,
              count,
            })}
            style={styles.carousel}
          />
          <View style={styles.centred}>
            <Dots
              count={count}
              index={index}
              accessibilityLabel={t('today.layerSheet.position', { position, count })}
            />
          </View>
          <View style={[styles.centred, styles.remove]}>
            <Button label={t('today.layerSheet.remove')} variant="secondary" onPress={onRemove} />
          </View>
        </Sheet>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  carousel: { marginTop: spacing.space6 },
  centred: { alignItems: 'center', marginTop: spacing.space10 },
  remove: { marginTop: spacing.space16 },
});

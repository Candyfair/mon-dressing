import { type ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { LoopingCarousel } from '../../ui/LoopingCarousel';
import type { RadialAction } from '../../ui/radialMenuContext';
import { RadialMenuTarget } from '../../ui/RadialMenuTarget';
import { useTheme } from '../../ui/theme';
import { fontFamilies, spacing } from '../../ui/tokens';

const TILE_COUNT = 3;
const CAROUSEL_HEIGHT = 150;
const CAROUSEL_STEP = 166;
const EVENING_PIECE = 2;

interface DevRadialPiecesProps<Piece> {
  pieces: readonly Piece[];
  renderTile: (piece: Piece) => ReactNode;
  renderLarge: (piece: Piece) => ReactNode;
}

/**
 * Pieces with the radial menu: three at different places on screen and a
 * carousel, to check that a long press and a swipe do not get mixed up. The
 * chosen action is only displayed: nothing is written before S7 and S8.
 */
export function DevRadialPieces<Piece extends { id: string }>({
  pieces,
  renderTile,
  renderLarge,
}: DevRadialPiecesProps<Piece>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [chosen, setChosen] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const actions = useMemo<RadialAction[]>(
    () => [
      {
        id: 'favorite',
        label: t('garmentActions.favorite'),
        icon: 'favorite',
        status: 'Favori',
        active: true,
        fillWhenActive: true,
      },
      { id: 'air', label: t('garmentActions.air'), icon: 'airing', status: 'Balcon' },
      { id: 'dirty', label: t('garmentActions.dirty'), icon: 'washingMachine', status: 'Sale' },
      { id: 'putAway', label: t('garmentActions.putAway'), icon: 'wardrobe' },
      { id: 'toDry', label: t('garmentActions.toDry'), icon: 'toDry', status: 'Secher' },
      {
        id: 'onRack',
        label: t('garmentActions.onRack'),
        icon: 'dryingRack',
        status: 'Etendoir',
      },
      { id: 'toIron', label: t('garmentActions.toIron'), icon: 'ironSteam', status: 'Repasser' },
    ],
    [t],
  );
  const current = pieces[index];
  // Evening sort, in the order of the X2 mockup: nothing active yet.
  const evening = useMemo<RadialAction[]>(
    () => [
      { id: 'favorite', label: t('garmentActions.favorite'), icon: 'favorite' },
      { id: 'air', label: t('garmentActions.airShort'), icon: 'airing' },
      { id: 'dirty', label: t('garmentActions.dirty'), icon: 'washingMachine' },
      { id: 'putAway', label: t('garmentActions.putAway'), icon: 'wardrobe' },
    ],
    [t],
  );
  const eveningRecommendation = {
    actionId: 'air',
    label: t('garmentActions.recommended', {
      action: t('garmentActions.airShort').toLocaleLowerCase('fr'),
    }),
  };
  const recommendation = {
    actionId: 'dirty',
    label: t('garmentActions.recommended', {
      action: t('garmentActions.dirty').toLocaleLowerCase('fr'),
    }),
  };
  const onSelect = (id: string) => {
    setChosen([...actions, ...evening].find((action) => action.id === id)?.label ?? null);
  };

  return (
    <View style={styles.root}>
      <Text style={[styles.status, { color: colors.inkSecondary }]}>
        {chosen ? t('dev.gestures.radialChosen', { action: chosen }) : t('dev.gestures.radialIdle')}
      </Text>
      <View style={styles.tiles}>
        {pieces.slice(0, TILE_COUNT).map((piece, position) => (
          <RadialMenuTarget
            key={piece.id}
            actions={position === EVENING_PIECE ? evening : actions}
            recommendation={
              position === EVENING_PIECE
                ? eveningRecommendation
                : position === 1
                  ? undefined
                  : recommendation
            }
            onSelect={onSelect}
            accessibilityLabel={t('dev.gestures.radialPiece', { number: position + 1 })}
          >
            {renderTile(piece)}
          </RadialMenuTarget>
        ))}
      </View>
      <RadialMenuTarget
        actions={actions}
        recommendation={recommendation}
        onSelect={onSelect}
        piece={current ? renderLarge(current) : null}
      >
        <LoopingCarousel
          items={pieces}
          index={index}
          onIndexChange={setIndex}
          step={CAROUSEL_STEP}
          height={CAROUSEL_HEIGHT}
          accessibilityLabel={t('dev.gestures.rows.top')}
          extraActions={actions.map(({ id, label }) => ({ name: id, label }))}
          onExtraAction={onSelect}
          renderItem={renderLarge}
        />
      </RadialMenuTarget>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.space10 },
  status: { fontFamily: fontFamilies.text, fontSize: 13, paddingHorizontal: spacing.space16 },
  tiles: { flexDirection: 'row', justifyContent: 'space-between' },
});

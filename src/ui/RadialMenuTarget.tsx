import { type ReactNode, useState } from 'react';
import { type AccessibilityActionEvent, type StyleProp, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { motion } from './motion';
import { type RadialLayout, radialItemAt, radialLayout, type RadialPoint } from './radialLayout';
import { type RadialAction, type RadialRecommendation, useRadialMenu } from './radialMenuContext';

interface RadialMenuTargetProps {
  actions: readonly RadialAction[];
  recommendation?: RadialRecommendation;
  onSelect: (actionId: string) => void;
  // Names the target and carries the actions. Left out around a carousel,
  // which is already an accessible element and takes the actions itself.
  accessibilityLabel?: string;
  // What rises above the scrim, centred on the target. Defaults to `children`;
  // needed around a carousel, whose touchable area is the whole row.
  piece?: ReactNode;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

/**
 * A piece that opens the radial menu: long press, slide to a disc, release.
 * Moving before the long press leaves the touch to the carousel or the scroll
 * around it. The same actions are offered as accessibility actions.
 */
export function RadialMenuTarget({
  actions,
  recommendation,
  onSelect,
  accessibilityLabel,
  children,
  piece = children,
  style,
}: RadialMenuTargetProps) {
  const { bounds, hovered, show, hide } = useRadialMenu();
  const [pieceSize, setPieceSize] = useState({ width: 0, height: 0 });
  const discs = useSharedValue<RadialPoint[]>([]);
  const isOpen = useSharedValue(false);
  const count = actions.length;

  const open = (anchor: RadialPoint, left: number, top: number, layout: RadialLayout) => {
    show({
      actions,
      recommendation,
      anchor,
      layout,
      piece,
      pieceFrame: { left, top, ...pieceSize },
    });
  };
  const choose = (index: number) => {
    const action = actions[index];
    if (action) onSelect(action.id);
  };

  const gesture = Gesture.Pan()
    .activateAfterLongPress(motion.radial.longPress)
    .maxPointers(1)
    .onStart((event) => {
      const anchor = { x: event.absoluteX, y: event.absoluteY };
      const layout = radialLayout(anchor, count, bounds);
      discs.set(layout.discs);
      isOpen.set(true);
      hovered.set(-1);
      // The touch gives the piece's place in the coordinates of the overlay.
      scheduleOnRN(open, anchor, anchor.x - event.x, anchor.y - event.y, layout);
    })
    .onUpdate((event) => {
      const item = radialItemAt(discs.get(), { x: event.absoluteX, y: event.absoluteY });
      if (item !== hovered.get()) hovered.set(item);
    })
    .onEnd((_event, success) => {
      const item = hovered.get();
      if (success && item >= 0) scheduleOnRN(choose, item);
    })
    .onFinalize(() => {
      if (!isOpen.get()) return;
      isOpen.set(false);
      hovered.set(-1);
      scheduleOnRN(hide);
    });

  return (
    <GestureDetector gesture={gesture}>
      <View
        collapsable={false}
        {...(accessibilityLabel === undefined
          ? {}
          : {
              accessible: true,
              accessibilityLabel,
              accessibilityActions: actions.map(({ id, label }) => ({ name: id, label })),
              onAccessibilityAction: (event: AccessibilityActionEvent) =>
                onSelect(event.nativeEvent.actionName),
            })}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setPieceSize({ width, height });
        }}
        style={style}
      >
        {children}
      </View>
    </GestureDetector>
  );
}

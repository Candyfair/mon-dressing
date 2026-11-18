import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RadialMenu } from './RadialMenu';
import { RadialMenuContext, type RadialMenuRequest } from './radialMenuContext';

/**
 * Hosts the radial menu above every screen. It is a plain overlay and not a
 * Modal: opening a Modal on Android would cancel the finger that is still
 * down, and the menu is used by sliding that finger.
 */
export function RadialMenuProvider({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hovered = useSharedValue(-1);
  const [request, setRequest] = useState<RadialMenuRequest | null>(null);
  const [open, setOpen] = useState(false);

  const show = useCallback((next: RadialMenuRequest) => {
    setRequest(next);
    setOpen(true);
  }, []);
  const hide = useCallback(() => setOpen(false), []);
  const onClosed = useCallback(() => setRequest(null), []);

  const controls = useMemo(
    () => ({
      bounds: {
        left: insets.left,
        top: insets.top,
        right: width - insets.right,
        bottom: height - insets.bottom,
      },
      hovered,
      show,
      hide,
    }),
    [width, height, insets, hovered, show, hide],
  );

  return (
    <RadialMenuContext.Provider value={controls}>
      {children}
      {request ? (
        <RadialMenu request={request} open={open} hovered={hovered} onClosed={onClosed} />
      ) : null}
    </RadialMenuContext.Provider>
  );
}

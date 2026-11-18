import { createContext, type ReactNode, useContext } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import type { IconName } from './Icon';
import type { RadialBounds, RadialLayout, RadialPoint } from './radialLayout';

// Suffix of the theme's `status…` and `status…Bg` colours.
export type RadialStatus = 'Favori' | 'Balcon' | 'Sale' | 'Secher' | 'Etendoir' | 'Repasser';

export interface RadialAction {
  id: string;
  label: string;
  icon: IconName;
  // The tint of the disc while this status is active.
  status?: RadialStatus;
  active?: boolean;
  fillWhenActive?: boolean;
}

export interface RadialRecommendation {
  actionId: string;
  // The whole sentence, e.g. "Conseillé : au sale".
  label: string;
}

export interface RadialMenuRequest {
  actions: readonly RadialAction[];
  recommendation?: RadialRecommendation;
  anchor: RadialPoint;
  layout: RadialLayout;
  // The touched piece, drawn again above the scrim at the same place.
  piece: ReactNode;
  pieceFrame: { left: number; top: number; width: number; height: number };
}

export interface RadialMenuControls {
  bounds: RadialBounds;
  // Index of the disc under the finger, -1 for none (UI thread).
  hovered: SharedValue<number>;
  // Where the finger is, in the overlay's coordinates (UI thread).
  finger: SharedValue<RadialPoint>;
  show: (request: RadialMenuRequest) => void;
  hide: () => void;
}

export const RadialMenuContext = createContext<RadialMenuControls | null>(null);

export function useRadialMenu(): RadialMenuControls {
  const controls = useContext(RadialMenuContext);
  if (!controls) throw new Error('useRadialMenu needs a RadialMenuProvider');
  return controls;
}

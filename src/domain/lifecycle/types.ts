import type { EventSource, Location, Slot } from '../types';

// The four lifecycle columns of `garments` (DATA_MODEL.md §4).
export interface LifecycleState {
  location: Location;
  locationSince: Date;
  toIron: boolean;
  wearCount: number;
}

// What the state machine needs to know about a garment.
export interface LifecycleGarment extends LifecycleState {
  id: string;
  slot: Slot;
  needsIroning: boolean;
}

declare const lifecyclePatchBrand: unique symbol;

/**
 * Changed lifecycle columns. The brand is type-only and is attached solely by
 * this module, so code outside src/domain/lifecycle/ can write a patch but
 * never build one.
 */
export type LifecyclePatch = Readonly<Partial<LifecycleState>> & {
  readonly [lifecyclePatchBrand]: true;
};

/** A complete branded state, for a garment being created. */
export type InitialLifecycle = Readonly<LifecycleState> & LifecyclePatch;

// A `garmentEvents` row without its id, garmentId and occurredAt.
export type LifecycleEventDraft =
  | {
      type: 'locationChanged';
      source: EventSource;
      fromLocation: Location;
      toLocation: Location;
      outfitId: string | null;
    }
  | { type: 'ironingChanged'; source: EventSource; toIron: boolean; outfitId: string | null }
  | { type: 'worn'; source: EventSource; outfitId: string };

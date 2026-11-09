import type { Location } from '../types';

// Statuses offered by the Wardrobe long press (SPEC §8.4): a location, or the
// "to iron" flag which is independent from the location.
export type WardrobeStatus = Location | 'toIron';

export type SortDestination = 'airing' | 'dirty' | 'stored';

export type LifecycleCommand =
  // Outfit validated on Today, or probable outfit sorted in the evening (SPEC §8.2, §8.5).
  | { type: 'wear'; outfitId: string; source: 'today' | 'eveningSort' }
  // Evening sort of a worn piece (SPEC §8.5).
  | { type: 'sort'; to: SortDestination; outfitId: string }
  // Laundry actions (SPEC §8.4, design/specs/06-linge.md).
  | { type: 'washDone' }
  | { type: 'markDry'; source: 'laundry' | 'automatic' }
  | { type: 'putAway' }
  | { type: 'ironed' }
  // Wardrobe long press: set any status, or release an active one.
  | { type: 'setStatus'; status: WardrobeStatus }
  | { type: 'clearStatus'; status: WardrobeStatus };

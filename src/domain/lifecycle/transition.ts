// Garment lifecycle state machine (SPEC §8, DATA_MODEL.md §4). Pure: the
// garment and `now` are injected; it never reads the clock or the database.
import type { EventSource, Location } from '../types';
import type { LifecycleCommand } from './commands';
import type {
  InitialLifecycle,
  LifecycleEventDraft,
  LifecycleGarment,
  LifecyclePatch,
  LifecycleState,
} from './types';

export type TransitionResult =
  | { ok: true; patch: LifecyclePatch; events: LifecycleEventDraft[] }
  | { ok: false; reason: 'notAllowed' | 'unchanged' };

// Where a command sends the garment, before the cross-cutting rules.
interface Target {
  location: Location;
  toIron: boolean;
  // Outfit the garment is worn in, for a wear; null otherwise.
  wornIn: string | null;
  // Starts a new period at the target location even when it is the current
  // one: airing a piece again after wearing it avoids another wash.
  renewsLocation: boolean;
}

// A worn piece was available, hence in one of these locations.
const WORN_FROM: readonly Location[] = ['stored', 'airing', 'onDryingRack'];

const NOT_ALLOWED = { ok: false, reason: 'notAllowed' } as const;
const UNCHANGED = { ok: false, reason: 'unchanged' } as const;

export function transition(
  garment: LifecycleGarment,
  command: LifecycleCommand,
  now: Date,
): TransitionResult {
  const target = targetOf(garment, command);
  if (target === null || breaksShoeRule(garment, target)) {
    return NOT_ALLOWED;
  }

  const entersDrying = target.location === 'drying' && garment.location !== 'drying';
  const next = {
    location: target.location,
    // Washing resets the counter and sets "to iron" for pieces that need it.
    toIron: entersDrying ? garment.needsIroning : target.toIron,
    wearCount: entersDrying ? 0 : garment.wearCount + (target.wornIn === null ? 0 : 1),
  };

  const source = sourceOf(command);
  const outfitId = outfitIdOf(command);
  const patch: Partial<LifecycleState> = {};
  const events: LifecycleEventDraft[] = [];

  if (target.wornIn !== null) {
    events.push({ type: 'worn', source, outfitId: target.wornIn });
  }
  if (next.location !== garment.location || target.renewsLocation) {
    patch.location = next.location;
    patch.locationSince = now;
    events.push({
      type: 'locationChanged',
      source,
      fromLocation: garment.location,
      toLocation: next.location,
      outfitId,
    });
  }
  if (next.toIron !== garment.toIron) {
    patch.toIron = next.toIron;
    events.push({ type: 'ironingChanged', source, toIron: next.toIron, outfitId });
  }
  if (next.wearCount !== garment.wearCount) {
    patch.wearCount = next.wearCount;
  }

  if (Object.keys(patch).length === 0) {
    return UNCHANGED;
  }
  return { ok: true, patch: brand(patch), events };
}

/** Lifecycle of a garment being created: stored, clean, not to iron. No event. */
export function initialLifecycle(now: Date): InitialLifecycle {
  return brand({ location: 'stored', locationSince: now, toIron: false, wearCount: 0 });
}

function targetOf(garment: LifecycleGarment, command: LifecycleCommand): Target | null {
  const unchanged: Target = {
    location: garment.location,
    toIron: garment.toIron,
    wornIn: null,
    renewsLocation: false,
  };
  const moveFrom = (from: Location, to: Location): Target | null =>
    garment.location === from ? { ...unchanged, location: to } : null;

  switch (command.type) {
    case 'wear':
      return WORN_FROM.includes(garment.location)
        ? { ...unchanged, wornIn: command.outfitId }
        : null;
    case 'sort':
      return WORN_FROM.includes(garment.location)
        ? { ...unchanged, location: command.to, renewsLocation: command.to === 'airing' }
        : null;
    case 'washDone':
      return moveFrom('dirty', 'drying');
    case 'markDry':
      return moveFrom('drying', 'onDryingRack');
    case 'putAway':
      return moveFrom('onDryingRack', 'stored');
    case 'ironed':
      return garment.toIron ? { ...unchanged, toIron: false } : null;
    case 'setStatus':
      return command.status === 'toIron'
        ? { ...unchanged, toIron: true }
        : { ...unchanged, location: command.status };
    case 'clearStatus':
      if (command.status === 'toIron') {
        return garment.toIron ? { ...unchanged, toIron: false } : null;
      }
      return moveFrom(command.status, 'stored');
    default: {
      const unreachable: never = command;
      return unreachable;
    }
  }
}

// Shoes are never sorted: always stored, never to iron (SPEC §8.1).
function breaksShoeRule(garment: LifecycleGarment, target: Target): boolean {
  return garment.slot === 'shoes' && (target.location !== 'stored' || target.toIron);
}

function sourceOf(command: LifecycleCommand): EventSource {
  switch (command.type) {
    case 'wear':
    case 'markDry':
      return command.source;
    case 'sort':
      return 'eveningSort';
    case 'washDone':
    case 'putAway':
    case 'ironed':
      return 'laundry';
    case 'setStatus':
    case 'clearStatus':
      return 'wardrobe';
    default: {
      const unreachable: never = command;
      return unreachable;
    }
  }
}

function outfitIdOf(command: LifecycleCommand): string | null {
  return command.type === 'wear' || command.type === 'sort' ? command.outfitId : null;
}

// The only place a LifecyclePatch is created.
function brand<T extends Partial<LifecycleState>>(patch: T): T & LifecyclePatch {
  return patch as T & LifecyclePatch;
}

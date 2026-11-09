import { LOCATIONS, type Location } from '../types';
import type { LifecycleCommand } from './commands';
import { initialLifecycle, transition } from './transition';
import type { LifecycleGarment } from './types';

const BEFORE = new Date('2026-11-08T20:00:00.000Z');
const NOW = new Date('2026-11-09T20:00:00.000Z');

function garment(overrides: Partial<LifecycleGarment> = {}): LifecycleGarment {
  return {
    id: 'garment-1',
    slot: 'top',
    needsIroning: false,
    location: 'stored',
    locationSince: BEFORE,
    toIron: false,
    wearCount: 1,
    ...overrides,
  };
}

// Hand-written transition table (SPEC §8.4). `from` lists the locations a
// command accepts; `to` is where it sends the garment ('same' = stays).
interface Row {
  label: string;
  command: LifecycleCommand;
  from: readonly Location[];
  to: Location | 'same';
  toIron?: boolean; // new flag value, before the drying rule
  requiresToIron?: boolean;
  wears?: true;
  renewsLocation?: true; // records the move even when the location stays the same
}

const WORN_FROM = ['stored', 'airing', 'onDryingRack'] as const;

const TABLE: Row[] = [
  {
    label: 'wear',
    command: { type: 'wear', outfitId: 'outfit-1', source: 'today' },
    from: WORN_FROM,
    to: 'same',
    wears: true,
  },
  ...(['airing', 'dirty', 'stored'] as const).map((to): Row => ({
    label: `sort → ${to}`,
    command: { type: 'sort', to, outfitId: 'outfit-1' },
    from: WORN_FROM,
    to,
    ...(to === 'airing' ? { renewsLocation: true as const } : {}),
  })),
  { label: 'washDone', command: { type: 'washDone' }, from: ['dirty'], to: 'drying' },
  {
    label: 'markDry',
    command: { type: 'markDry', source: 'laundry' },
    from: ['drying'],
    to: 'onDryingRack',
  },
  { label: 'putAway', command: { type: 'putAway' }, from: ['onDryingRack'], to: 'stored' },
  {
    label: 'ironed',
    command: { type: 'ironed' },
    from: LOCATIONS,
    to: 'same',
    toIron: false,
    requiresToIron: true,
  },
  ...LOCATIONS.map((status): Row => ({
    label: `setStatus ${status}`,
    command: { type: 'setStatus', status },
    from: LOCATIONS,
    to: status,
  })),
  {
    label: 'setStatus toIron',
    command: { type: 'setStatus', status: 'toIron' },
    from: LOCATIONS,
    to: 'same',
    toIron: true,
  },
  ...LOCATIONS.map((status): Row => ({
    label: `clearStatus ${status}`,
    command: { type: 'clearStatus', status },
    from: [status],
    to: 'stored',
  })),
  {
    label: 'clearStatus toIron',
    command: { type: 'clearStatus', status: 'toIron' },
    from: LOCATIONS,
    to: 'same',
    toIron: false,
    requiresToIron: true,
  },
];

interface Case {
  name: string;
  row: Row;
  start: LifecycleGarment;
}

// Every command × location × toIron × needsIroning for a top; shoes only
// exist stored and not to iron.
const CASES: Case[] = TABLE.flatMap((row) => [
  ...LOCATIONS.flatMap((location) =>
    [false, true].flatMap((toIron) =>
      [false, true].map((needsIroning) => ({
        name: `${row.label} | top ${location}, toIron ${toIron}, needsIroning ${needsIroning}`,
        row,
        start: garment({ location, toIron, needsIroning }),
      })),
    ),
  ),
  { name: `${row.label} | shoes stored`, row, start: garment({ slot: 'shoes' }) },
]);

function expectedOutcome({ row, start }: Case) {
  const allowed = row.from.includes(start.location) && (!row.requiresToIron || start.toIron);
  if (!allowed) {
    return 'notAllowed' as const;
  }
  const location = row.to === 'same' ? start.location : row.to;
  const entersDrying = location === 'drying' && start.location !== 'drying';
  const toIron = entersDrying ? start.needsIroning : (row.toIron ?? start.toIron);
  if (start.slot === 'shoes' && (location !== 'stored' || toIron)) {
    return 'notAllowed' as const;
  }
  const wearCount = entersDrying ? 0 : start.wearCount + (row.wears ? 1 : 0);
  const moved = location !== start.location || row.renewsLocation === true;
  const changed = moved || toIron !== start.toIron || wearCount !== start.wearCount;
  return changed ? { location, toIron, wearCount, moved } : ('unchanged' as const);
}

describe('transition table', () => {
  it.each(CASES)('$name', (testCase) => {
    const expected = expectedOutcome(testCase);
    const result = transition(testCase.start, testCase.row.command, NOW);

    if (typeof expected === 'string') {
      expect(result).toEqual({ ok: false, reason: expected });
      return;
    }
    if (!result.ok) {
      throw new Error(`expected a transition, got ${result.reason}`);
    }
    const state = { ...testCase.start, ...result.patch };
    const { moved, ...expectedState } = expected;
    expect({
      location: state.location,
      toIron: state.toIron,
      wearCount: state.wearCount,
    }).toEqual(expectedState);

    // locationSince moves exactly when a move is recorded.
    expect(state.locationSince).toEqual(moved ? NOW : BEFORE);

    // One event per changed field, plus `worn` for a wear.
    expect(result.events.map((event) => event.type).sort()).toEqual(
      [
        ...(testCase.row.wears ? ['worn'] : []),
        ...(moved ? ['locationChanged'] : []),
        ...(expected.toIron !== testCase.start.toIron ? ['ironingChanged'] : []),
      ].sort(),
    );
  });
});

describe('transition events', () => {
  it('tags a validation with its outfit and the today source', () => {
    const result = transition(
      garment(),
      { type: 'wear', outfitId: 'outfit-1', source: 'today' },
      NOW,
    );

    expect(result).toEqual({
      ok: true,
      patch: { wearCount: 2 },
      events: [{ type: 'worn', source: 'today', outfitId: 'outfit-1' }],
    });
  });

  it('records an evening-sort move with its outfit', () => {
    const result = transition(garment(), { type: 'sort', to: 'airing', outfitId: 'outfit-1' }, NOW);

    expect(result).toEqual({
      ok: true,
      patch: { location: 'airing', locationSince: NOW },
      events: [
        {
          type: 'locationChanged',
          source: 'eveningSort',
          fromLocation: 'stored',
          toLocation: 'airing',
          outfitId: 'outfit-1',
        },
      ],
    });
  });

  it('records airing again a piece that was worn from the balcony', () => {
    const aired = garment({ location: 'airing' });

    const result = transition(aired, { type: 'sort', to: 'airing', outfitId: 'outfit-2' }, NOW);

    expect(result).toEqual({
      ok: true,
      patch: { location: 'airing', locationSince: NOW },
      events: [
        {
          type: 'locationChanged',
          source: 'eveningSort',
          fromLocation: 'airing',
          toLocation: 'airing',
          outfitId: 'outfit-2',
        },
      ],
    });
  });

  it('resets the counter and sets "to iron" when a shirt is washed', () => {
    const shirt = garment({ location: 'dirty', needsIroning: true, wearCount: 3 });

    const result = transition(shirt, { type: 'washDone' }, NOW);

    expect(result).toEqual({
      ok: true,
      patch: { location: 'drying', locationSince: NOW, toIron: true, wearCount: 0 },
      events: [
        {
          type: 'locationChanged',
          source: 'laundry',
          fromLocation: 'dirty',
          toLocation: 'drying',
          outfitId: null,
        },
        { type: 'ironingChanged', source: 'laundry', toIron: true, outfitId: null },
      ],
    });
  });

  it('keeps the source of an automatic drying', () => {
    const result = transition(
      garment({ location: 'drying' }),
      { type: 'markDry', source: 'automatic' },
      NOW,
    );

    expect(result.ok && result.events[0].source).toBe('automatic');
  });

  it('attributes Wardrobe long-press changes to the wardrobe', () => {
    const result = transition(garment(), { type: 'setStatus', status: 'toIron' }, NOW);

    expect(result.ok && result.events).toEqual([
      { type: 'ironingChanged', source: 'wardrobe', toIron: true, outfitId: null },
    ]);
  });
});

describe('initialLifecycle', () => {
  it('starts stored, clean and not to iron', () => {
    expect(initialLifecycle(NOW)).toEqual({
      location: 'stored',
      locationSince: NOW,
      toIron: false,
      wearCount: 0,
    });
  });
});

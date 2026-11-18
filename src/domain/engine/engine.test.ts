import type { DayContext, WeatherUsage } from '../types';
import type { DayWeather } from '../weather';
import { makeGarment, wornDaysAgo } from './__fixtures__/makeGarment';
import { resolveDayContext } from './context';
import { isAvailable, isWithinWearLimit } from './eligibility';
import { suggestedLayers } from './layers';
import { rotationScore } from './rotation';
import { statementConflict, suggest } from './suggest';
import type { EngineGarment, SuggestInput } from './types';
import { matchUsages } from './usageFilter';

const DATE = '2026-11-16';
const TZ = 'Europe/Paris';
const OFFICE_BIKE: DayContext = {
  activity: 'office',
  commuteModes: ['bike'],
  occasion: 'everyday',
};

function weather(
  category: DayWeather['category'],
  options: { rain?: boolean; indoorOnly?: boolean } = {},
): DayWeather {
  const rain = options.rain ?? false;
  const conditions: WeatherUsage[] = rain ? [category, 'rain'] : [category];
  return {
    category,
    rain,
    indoorOnly: options.indoorOnly ?? false,
    minFelt: 0,
    windows: [],
    conditions,
  };
}

function input(garments: EngineGarment[], overrides: Partial<SuggestInput> = {}): SuggestInput {
  return {
    date: DATE,
    timeZone: TZ,
    garments,
    context: OFFICE_BIKE,
    weather: weather('mild'),
    indoorDay: false,
    settings: { dryingRackCountsAsStorage: true, rotationPace: 'long' },
    yesterday: null,
    ...overrides,
  };
}

describe('eligibility', () => {
  const settings = { dryingRackCountsAsStorage: true };

  it('keeps stored garments and drops dirty, drying and to-iron ones', () => {
    expect(isAvailable(makeGarment({ id: 'a', slot: 'top' }), DATE, TZ, settings)).toBe(true);
    for (const location of ['dirty', 'drying'] as const) {
      expect(isAvailable(makeGarment({ id: 'a', slot: 'top', location }), DATE, TZ, settings)).toBe(
        false,
      );
    }
    expect(
      isAvailable(makeGarment({ id: 'a', slot: 'top', toIron: true }), DATE, TZ, settings),
    ).toBe(false);
  });

  it('makes an airing garment available from the morning after', () => {
    const airedLastNight = makeGarment({
      id: 'a',
      slot: 'top',
      location: 'airing',
      locationSince: new Date('2026-11-15T20:30:00.000Z'), // 21:30 in Paris
    });
    expect(isAvailable(airedLastNight, DATE, TZ, settings)).toBe(true);
    const airedThisMorning = {
      ...airedLastNight,
      locationSince: new Date('2026-11-16T06:00:00.000Z'),
    };
    expect(isAvailable(airedThisMorning, DATE, TZ, settings)).toBe(false);
  });

  it('follows the drying-rack setting', () => {
    const onRack = makeGarment({ id: 'a', slot: 'top', location: 'onDryingRack' });
    expect(isAvailable(onRack, DATE, TZ, { dryingRackCountsAsStorage: true })).toBe(true);
    expect(isAvailable(onRack, DATE, TZ, { dryingRackCountsAsStorage: false })).toBe(false);
  });

  it('drops a garment at its wear limit; shoes have none', () => {
    expect(isWithinWearLimit(makeGarment({ id: 'a', slot: 'top', wearCount: 3 }))).toBe(true);
    expect(isWithinWearLimit(makeGarment({ id: 'a', slot: 'top', wearCount: 4 }))).toBe(false);
    expect(isWithinWearLimit(makeGarment({ id: 'a', slot: 'shoes', wearCount: 99 }))).toBe(true);
  });
});

describe('matchUsages', () => {
  it('lets a garment without usage through every case', () => {
    expect(matchUsages([], OFFICE_BIKE, ['cold', 'rain'])).toEqual({
      passes: true,
      contextMatches: 0,
      weatherMatch: false,
    });
  });

  it('matches one of today’s weather conditions', () => {
    expect(matchUsages(['weather.cold'], OFFICE_BIKE, ['mild']).passes).toBe(false);
    expect(matchUsages(['weather.cold', 'weather.rain'], OFFICE_BIKE, ['cool', 'rain'])).toEqual({
      passes: true,
      contextMatches: 0,
      weatherMatch: true,
    });
    // Unknown weather: the Weather group passes.
    expect(matchUsages(['weather.cold'], OFFICE_BIKE, null).passes).toBe(true);
  });

  it('requires the garment to cover every commute mode of the day', () => {
    const bikeAndTrain: DayContext = { ...OFFICE_BIKE, commuteModes: ['bike', 'publicTransport'] };
    expect(matchUsages(['commute.bike'], bikeAndTrain, ['mild']).passes).toBe(false);
    expect(
      matchUsages(['commute.bike', 'commute.publicTransport'], bikeAndTrain, ['mild']),
    ).toEqual({ passes: true, contextMatches: 1, weatherMatch: false });
    // No commute today: the group does not apply.
    const remote: DayContext = { activity: 'remote', commuteModes: [], occasion: 'everyday' };
    expect(matchUsages(['commute.car'], remote, ['mild'])).toEqual({
      passes: true,
      contextMatches: 0,
      weatherMatch: false,
    });
  });

  it('filters on the activity and the occasion, and counts explicit matches', () => {
    expect(matchUsages(['activity.sport'], OFFICE_BIKE, ['mild']).passes).toBe(false);
    expect(matchUsages(['occasion.evening'], OFFICE_BIKE, ['mild']).passes).toBe(false);
    expect(
      matchUsages(['activity.office', 'occasion.everyday', 'commute.bike'], OFFICE_BIKE, ['mild']),
    ).toEqual({ passes: true, contextMatches: 3, weatherMatch: false });
  });
});

describe('suggestedLayers', () => {
  it('follows the approved rule', () => {
    expect(suggestedLayers(weather('hot'), false)).toEqual({ midLayer: false, outerLayer: false });
    expect(suggestedLayers(weather('mild'), false)).toEqual({ midLayer: false, outerLayer: false });
    expect(suggestedLayers(weather('cool'), false)).toEqual({ midLayer: true, outerLayer: false });
    expect(suggestedLayers(weather('cold'), false)).toEqual({ midLayer: true, outerLayer: true });
    expect(suggestedLayers(weather('mild', { rain: true }), false)).toEqual({
      midLayer: false,
      outerLayer: true,
    });
  });

  it('never suggests layer 2 indoors, nor any layer when the weather is unknown', () => {
    expect(suggestedLayers(weather('cold', { indoorOnly: true }), true)).toEqual({
      midLayer: true,
      outerLayer: false,
    });
    expect(suggestedLayers(null, false)).toEqual({ midLayer: false, outerLayer: false });
    // The indoor day alone decides, whatever the weather object says.
    expect(suggestedLayers(weather('cold'), true)).toEqual({ midLayer: true, outerLayer: false });
    expect(suggestedLayers(weather('cold', { indoorOnly: true }), false).outerLayer).toBe(true);
  });
});

describe('rotationScore', () => {
  it('counts days since last worn up to the cap, plus the favourite bonus', () => {
    const top = makeGarment({ id: 'a', slot: 'top', lastWornAt: wornDaysAgo(5) });
    expect(rotationScore(top, DATE, TZ, 'long')).toBe(5);
    expect(rotationScore({ ...top, isFavorite: true }, DATE, TZ, 'long')).toBe(8);
    expect(rotationScore({ ...top, lastWornAt: wornDaysAgo(30) }, DATE, TZ, 'long')).toBe(14);
    expect(rotationScore({ ...top, lastWornAt: null }, DATE, TZ, 'short')).toBe(10);
    expect(rotationScore({ ...top, isFavorite: true }, DATE, TZ, 'short')).toBe(7);
  });
});

describe('resolveDayContext', () => {
  it('uses the weekly program, the office commute and the everyday occasion', () => {
    expect(resolveDayContext('office', null, ['bike'])).toEqual(OFFICE_BIKE);
    expect(resolveDayContext('remote', null, ['bike'])).toEqual({
      activity: 'remote',
      commuteModes: [],
      occasion: 'everyday',
    });
  });

  it('lets the override win, field by field', () => {
    expect(
      resolveDayContext('office', { activity: 'remote', commuteModes: null, occasion: 'evening' }, [
        'bike',
      ]),
    ).toEqual({ activity: 'remote', commuteModes: [], occasion: 'evening' });
    expect(
      resolveDayContext('remote', { activity: null, commuteModes: ['car'], occasion: null }, []),
    ).toEqual({ activity: 'remote', commuteModes: ['car'], occasion: 'everyday' });
  });

  it('returns null before onboarding', () => {
    expect(resolveDayContext(null, null, [])).toBeNull();
  });
});

describe('suggest — rows', () => {
  it('orders by rotation, favourites ahead, yesterday’s pieces last', () => {
    const garments = [
      makeGarment({ id: 'recent', slot: 'top', lastWornAt: wornDaysAgo(2) }),
      makeGarment({ id: 'old', slot: 'top', lastWornAt: wornDaysAgo(9) }),
      makeGarment({ id: 'fav', slot: 'top', lastWornAt: wornDaysAgo(7), isFavorite: true }),
      makeGarment({ id: 'yesterday', slot: 'top', lastWornAt: wornDaysAgo(1), isFavorite: true }),
    ];
    expect(suggest(input(garments)).rows.top).toEqual(['fav', 'old', 'recent', 'yesterday']);
  });

  it('puts explicit matches first, then rotates within them', () => {
    const garments = [
      makeGarment({ id: 'any', slot: 'top' }),
      makeGarment({
        id: 'bikeWorn',
        slot: 'top',
        usages: ['commute.bike'],
        lastWornAt: wornDaysAgo(3),
      }),
      makeGarment({ id: 'bikeOld', slot: 'top', usages: ['commute.bike'] }),
    ];
    expect(suggest(input(garments)).rows.top).toEqual(['bikeOld', 'bikeWorn', 'any']);
  });

  it('puts context matches (activity, commute, occasion) before weather matches', () => {
    const garments = [
      makeGarment({ id: 'mildTee', slot: 'top', usages: ['weather.mild'] }),
      makeGarment({ id: 'officeShirt', slot: 'top', usages: ['activity.office'] }),
      makeGarment({ id: 'any', slot: 'top', isFavorite: true }),
    ];
    expect(suggest(input(garments)).rows.top).toEqual(['officeShirt', 'mildTee', 'any']);
  });

  it('breaks ties by creation date, then id', () => {
    const garments = [
      makeGarment({ id: 'b', slot: 'top' }),
      makeGarment({ id: 'a', slot: 'top' }),
      makeGarment({ id: 'older', slot: 'top', createdAt: new Date('2026-01-01T00:00:00.000Z') }),
    ];
    expect(suggest(input(garments)).rows.top).toEqual(['older', 'a', 'b']);
  });

  it('interleaves one-pieces with tops and keeps every eligible layer one swipe away', () => {
    const garments = [
      makeGarment({ id: 'dress', slot: 'onePiece', lastWornAt: wornDaysAgo(10) }),
      makeGarment({ id: 'tee', slot: 'top', lastWornAt: wornDaysAgo(4) }),
      makeGarment({ id: 'sweater', slot: 'midLayer' }),
    ];
    const suggestion = suggest(input(garments));
    expect(suggestion.rows.top).toEqual(['dress', 'tee']);
    expect(suggestion.rows.midLayer).toEqual(['sweater']);
    expect(suggestion.outfit.midLayer).toBeUndefined();
  });
});

describe('suggest — closest pieces', () => {
  const top = (id: string, usages: EngineGarment['usages']) =>
    makeGarment({ id, slot: 'top', usages });

  it('offers what only the weather leaves out, nearest weather first', () => {
    const result = suggest(
      input(
        [
          top('hot', ['weather.hot']),
          top('rainOnly', ['weather.rain']),
          top('cool', ['weather.cool']),
          top('mildOrHot', ['weather.hot', 'weather.mild']),
        ],
        { weather: weather('cold') },
      ),
    );
    expect(result.rows.top).toEqual([]);
    expect(result.closest.top).toEqual(['cool', 'mildOrHot', 'hot', 'rainOnly']);
  });

  it('still respects the other usage groups and availability', () => {
    const result = suggest(
      input(
        [
          top('wrongActivity', ['weather.hot', 'activity.sport']),
          makeGarment({ id: 'dirty', slot: 'top', usages: ['weather.hot'], location: 'dirty' }),
        ],
        { weather: weather('cold') },
      ),
    );
    expect(result.closest.top).toEqual([]);
  });

  it('leaves out nothing eligible, and has nothing to offer without weather', () => {
    const garments = [top('cool', ['weather.cool']), top('cold', ['weather.cold'])];
    expect(suggest(input(garments, { weather: weather('cold') })).rows.top).toEqual(['cold']);
    expect(suggest(input(garments, { weather: null })).closest.top).toEqual([]);
  });
});

describe('suggest — default outfit', () => {
  const basics = [
    makeGarment({ id: 'tee', slot: 'top' }),
    makeGarment({ id: 'jeans', slot: 'bottom' }),
    makeGarment({ id: 'sneakers', slot: 'shoes' }),
    makeGarment({ id: 'sweater', slot: 'midLayer' }),
    makeGarment({ id: 'coat', slot: 'outerLayer' }),
  ];

  it('takes the first of each row, with the layers the weather calls for', () => {
    expect(suggest(input(basics, { weather: weather('cold') })).outfit).toEqual({
      top: 'tee',
      bottom: 'jeans',
      shoes: 'sneakers',
      midLayer: 'sweater',
      outerLayer: 'coat',
    });
    expect(suggest(input(basics)).outfit).toEqual({
      top: 'tee',
      bottom: 'jeans',
      shoes: 'sneakers',
    });
  });

  it('leaves the shoes out of an indoor day, keeping their row', () => {
    const indoor = { weather: weather('mild', { indoorOnly: true }), indoorDay: true };
    const suggestion = suggest(input(basics, indoor));
    expect(suggestion.proposedRows.shoes).toBe(false);
    expect(suggestion.outfit).toEqual({ top: 'tee', bottom: 'jeans' });
    expect(suggestion.rows.shoes).toEqual(['sneakers']);
  });

  it('knows an indoor day without forecast (offline): still no shoes', () => {
    const suggestion = suggest(input(basics, { weather: null, indoorDay: true }));
    expect(suggestion.outfit).toEqual({ top: 'tee', bottom: 'jeans' });
    expect(suggestion.rows.shoes).toEqual(['sneakers']);
    expect(suggest(input(basics, { weather: null })).outfit.shoes).toBe('sneakers');
  });

  it('leaves out the bottom when a one-piece leads the top row', () => {
    const garments = [...basics, makeGarment({ id: 'dress', slot: 'onePiece', isFavorite: true })];
    expect(suggest(input(garments)).outfit).toEqual({ onePiece: 'dress', shoes: 'sneakers' });
  });

  it('never proposes two statement pieces when it can avoid it', () => {
    const garments = [
      makeGarment({ id: 'loudTop', slot: 'top', statementPiece: true, isFavorite: true }),
      makeGarment({ id: 'plainTop', slot: 'top' }),
      makeGarment({ id: 'loudSkirt', slot: 'bottom', statementPiece: true, isFavorite: true }),
      makeGarment({ id: 'plainJeans', slot: 'bottom' }),
      makeGarment({ id: 'sneakers', slot: 'shoes' }),
    ];
    const suggestion = suggest(input(garments));
    expect(suggestion.outfit).toEqual({ top: 'loudTop', bottom: 'plainJeans', shoes: 'sneakers' });
    expect(suggestion.coordinationBroken).toBe(false);
  });

  it('hands the statement over when a later row only has statement pieces', () => {
    const garments = [
      makeGarment({ id: 'loudTop', slot: 'top', statementPiece: true, isFavorite: true }),
      makeGarment({ id: 'plainTop', slot: 'top' }),
      makeGarment({ id: 'loudSkirt', slot: 'bottom', statementPiece: true }),
    ];
    expect(suggest(input(garments)).outfit).toEqual({ top: 'plainTop', bottom: 'loudSkirt' });
  });

  it('flags the outfit when two statement pieces cannot be avoided', () => {
    const garments = [
      makeGarment({ id: 'loudTop', slot: 'top', statementPiece: true }),
      makeGarment({ id: 'loudSkirt', slot: 'bottom', statementPiece: true }),
    ];
    const suggestion = suggest(input(garments));
    expect(suggestion.outfit).toEqual({ top: 'loudTop', bottom: 'loudSkirt' });
    expect(suggestion.coordinationBroken).toBe(true);
  });

  it('avoids exactly yesterday’s outfit when another choice exists', () => {
    // Yesterday's probable outfit, not sorted: no `worn` event yet.
    const garments = [
      makeGarment({ id: 'tee', slot: 'top' }),
      makeGarment({ id: 'jeans', slot: 'bottom' }),
      makeGarment({ id: 'chinos', slot: 'bottom' }),
    ];
    const suggestion = suggest(input(garments, { yesterday: { top: 'tee', bottom: 'jeans' } }));
    expect(suggestion.rows.bottom).toEqual(['chinos', 'jeans']);
    expect(suggestion.outfit).toEqual({ top: 'tee', bottom: 'chinos' });
  });

  it('keeps yesterday’s outfit when nothing else is available', () => {
    const garments = [
      makeGarment({ id: 'tee', slot: 'top' }),
      makeGarment({ id: 'jeans', slot: 'bottom' }),
    ];
    expect(suggest(input(garments, { yesterday: { top: 'tee', bottom: 'jeans' } })).outfit).toEqual(
      { top: 'tee', bottom: 'jeans' },
    );
  });
});

describe('statementConflict', () => {
  it('flags more than one statement piece', () => {
    const byId = new Map([
      ['a', { statementPiece: true }],
      ['b', { statementPiece: true }],
      ['c', { statementPiece: false }],
    ]);
    expect(statementConflict({ top: 'a', bottom: 'c' }, byId)).toBe(false);
    expect(statementConflict({ top: 'a', bottom: 'b' }, byId)).toBe(true);
  });
});

import type { WeatherUsage } from '../types';
import type { AdviceLine, SkyLine } from '../weather';
import {
  runScenario,
  SCENARIOS,
  type ScenarioKey,
  withScenarioStates,
} from './__fixtures__/scenarios';
import { referenceWardrobe } from './__fixtures__/wardrobe';
import { statementConflict } from './suggest';
import type { LayerSlot, OutfitSelection } from './types';

// Expected results of the 10 reference scenarios on the reference wardrobe
// (SPEC §3 R3). Proposed on 2026-11-15, to be rated by Candice on the real
// wardrobe; a rating that changes a rule changes these expectations.
interface Expected {
  conditions: WeatherUsage[];
  indoorOnly?: boolean;
  layers: Record<LayerSlot, boolean>;
  sky: SkyLine['kind'];
  advice: AdviceLine['kind'];
  outfit: OutfitSelection;
}

const NO_LAYER = { midLayer: false, outerLayer: false };
const LAYER_1 = { midLayer: true, outerLayer: false };
const BOTH_LAYERS = { midLayer: true, outerLayer: true };

const EXPECTED: Record<ScenarioKey, Expected> = {
  officeBikeColdMorning: {
    conditions: ['cold'],
    layers: BOTH_LAYERS,
    sky: 'sunnyAllDay',
    advice: 'maxTemperature',
    outfit: {
      top: 'shirtOxford',
      bottom: 'woolTrousers',
      midLayer: 'merinoSweater',
      outerLayer: 'woolCoat',
      shoes: 'ankleBoots',
    },
  },
  officeRainEvening: {
    conditions: ['cool', 'rain'],
    layers: BOTH_LAYERS,
    sky: 'rain',
    advice: 'umbrella',
    outfit: {
      top: 'shirtOxford',
      bottom: 'woolTrousers',
      midLayer: 'merinoSweater',
      outerLayer: 'raincoat',
      shoes: 'ankleBoots',
    },
  },
  officeRainAfternoon: {
    conditions: ['mild'],
    layers: NO_LAYER,
    sky: 'rain',
    advice: 'umbrella',
    outfit: { top: 'shirtOxford', bottom: 'pleatedSkirt', shoes: 'whiteSneakers' },
  },
  remoteCoolIndoor: {
    conditions: ['cool'],
    indoorOnly: true,
    layers: LAYER_1,
    sky: 'rain',
    advice: 'maxTemperature',
    // Indoors, no outing planned: no shoes proposed.
    outfit: { onePiece: 'dungarees', midLayer: 'sweatshirt' },
  },
  remoteLunchRain: {
    conditions: ['cool', 'rain'],
    layers: BOTH_LAYERS,
    sky: 'rain',
    advice: 'umbrella',
    outfit: {
      onePiece: 'dungarees',
      midLayer: 'sweatshirt',
      outerLayer: 'raincoat',
      shoes: 'ankleBoots',
    },
  },
  relaxHeatwave: {
    conditions: ['hot'],
    layers: NO_LAYER,
    sky: 'sunnyAllDay',
    advice: 'heat',
    outfit: { onePiece: 'dungarees', shoes: 'sandals' },
  },
  sportMild: {
    conditions: ['mild'],
    layers: NO_LAYER,
    sky: 'sunnyAllDay',
    advice: 'maxTemperature',
    outfit: { top: 'sportTop', bottom: 'sportLeggings', shoes: 'runningShoes' },
  },
  officeEvening: {
    conditions: ['cool'],
    layers: LAYER_1,
    sky: 'cloudy',
    advice: 'maxTemperature',
    outfit: {
      top: 'shirtOxford',
      bottom: 'woolTrousers',
      midLayer: 'merinoSweater',
      shoes: 'ankleBoots',
    },
  },
  statementPieces: {
    conditions: ['mild'],
    layers: NO_LAYER,
    sky: 'sunnyAllDay',
    advice: 'maxTemperature',
    // The skirt leads the bottom row, but the blouse already is the statement.
    outfit: { top: 'blouseSilk', bottom: 'jeansBlue', shoes: 'whiteSneakers' },
  },
  onlyYesterday: {
    conditions: ['mild'],
    layers: NO_LAYER,
    sky: 'sunnyAllDay',
    advice: 'maxTemperature',
    // Nothing else is clean: repeating yesterday is the only choice.
    outfit: { top: 'teeWhite', bottom: 'jeansBlue', shoes: 'whiteSneakers' },
  },
};

const TZ = 'Europe/Paris';

describe.each(SCENARIOS.map((scenario) => [scenario.key, scenario] as const))(
  'scenario %s',
  (key, scenario) => {
    const expected = EXPECTED[key];
    const garments = withScenarioStates(scenario, referenceWardrobe(), TZ);
    const result = runScenario(scenario, garments, { timeZone: TZ });

    it('reads the weather of the day', () => {
      expect(result.weather?.conditions).toEqual(expected.conditions);
      expect(result.weather?.indoorOnly).toBe(expected.indoorOnly ?? false);
      expect(result.lines?.sky.kind).toBe(expected.sky);
      expect(result.lines?.advice.kind).toBe(expected.advice);
    });

    it('suggests the expected layers and default outfit', () => {
      expect(result.suggestion.proposedRows).toMatchObject(expected.layers);
      expect(result.suggestion.outfit).toEqual(expected.outfit);
    });

    it('never proposes two statement pieces', () => {
      const byId = new Map(garments.map((garment) => [garment.id, garment]));
      expect(statementConflict(result.suggestion.outfit, byId)).toBe(false);
      expect(result.suggestion.coordinationBroken).toBe(false);
    });
  },
);

describe('reference scenarios — SPEC §4 verification', () => {
  it('drops the Cold-only coat on a mild day and keeps it on a cold one', () => {
    const run = (key: ScenarioKey) => {
      const scenario = SCENARIOS.find((candidate) => candidate.key === key);
      if (!scenario) throw new Error(`Unknown scenario ${key}`);
      return runScenario(scenario, withScenarioStates(scenario, referenceWardrobe(), TZ), {
        timeZone: TZ,
      }).suggestion.rows.outerLayer;
    };
    expect(run('officeBikeColdMorning')).toContain('woolCoat');
    expect(run('sportMild')).not.toContain('woolCoat');
  });
});

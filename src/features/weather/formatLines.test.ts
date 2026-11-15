import i18n from '../../i18n';
import { formatTime, formatWeatherLines } from './formatLines';

const t = i18n.t.bind(i18n);
const NB = ' ';

describe('formatWeatherLines', () => {
  it('writes the design copy', () => {
    expect(
      formatWeatherLines(
        {
          sky: { kind: 'rain', probability: 70, at: '18:00' },
          advice: { kind: 'umbrella', at: '12:30' },
        },
        t,
      ),
    ).toEqual([`Pluie 70${NB}% vers 18${NB}h`, `Parapluie conseillé vers 12${NB}h${NB}30`]);
    expect(
      formatWeatherLines(
        {
          sky: { kind: 'sunnyAllDay' },
          advice: { kind: 'maxTemperature', value: 27, at: '16:00' },
        },
        t,
      ),
    ).toEqual(['Ensoleillé toute la journée', `Max. 27° vers 16${NB}h`]);
    expect(
      formatWeatherLines(
        { sky: { kind: 'clearSky' }, advice: { kind: 'frost', until: '10:00' } },
        t,
      ),
    ).toEqual(['Ciel dégagé', `Gel jusqu’à 10${NB}h`]);
  });

  it('drops the leading zero of morning hours', () => {
    expect(formatTime('08:30', t)).toBe(`8${NB}h${NB}30`);
  });
});

import { formatResultsCsv, type PhotoRun } from './formatResultsCsv';

describe('formatResultsCsv', () => {
  it('writes one row per photo with a rounded duration', () => {
    const runs: PhotoRun[] = [
      {
        name: 'shirt.jpg',
        status: 'done',
        durationMs: 812.6,
        cutoutUri: 'x',
        width: 900,
        height: 1200,
      },
      { name: 'scarf.jpg', status: 'failed', durationMs: 40.2, errorCode: 'ERR_NO_SUBJECT' },
      { name: 'coat.jpg', status: 'pending' },
    ];

    expect(formatResultsCsv(runs)).toBe(
      [
        'photo,status,duration_ms,width,height,error',
        'shirt.jpg,done,813,900,1200,',
        'scarf.jpg,failed,40,,,ERR_NO_SUBJECT',
        'coat.jpg,pending,,,,',
      ].join('\n'),
    );
  });

  it('escapes commas and quotes in photo names', () => {
    expect(formatResultsCsv([{ name: 'a,"b".jpg', status: 'running' }])).toContain(
      '"a,""b"".jpg",running',
    );
  });
});

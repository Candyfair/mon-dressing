export type PhotoRun = { name: string } & (
  | { status: 'pending' }
  | { status: 'running' }
  | { status: 'done'; durationMs: number; cutoutUri: string; width: number; height: number }
  | { status: 'failed'; durationMs: number; errorCode: string }
);

const HEADER = 'photo,status,duration_ms,width,height,error';

function escapeCsv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function toRow(run: PhotoRun): string {
  const name = escapeCsv(run.name);
  switch (run.status) {
    case 'pending':
    case 'running':
      return `${name},${run.status},,,,`;
    case 'done':
      return `${name},done,${Math.round(run.durationMs)},${run.width},${run.height},`;
    case 'failed':
      return `${name},failed,${Math.round(run.durationMs)},,,${escapeCsv(run.errorCode)}`;
    default: {
      const exhaustive: never = run;
      return exhaustive;
    }
  }
}

export function formatResultsCsv(runs: PhotoRun[]): string {
  return [HEADER, ...runs.map(toRow)].join('\n');
}

import type { SeriesPoint } from '@/domain/series';
import { buildStepPath } from '../stepPath';

const points: SeriesPoint[] = [
  { at: '2026-01-01T00:00:00.000Z', value: 4 },
  { at: '2026-01-02T00:00:00.000Z', value: 10 },
  { at: '2026-01-04T00:00:00.000Z', value: 10 },
];

describe('buildStepPath', () => {
  it('starts the path at the first point and steps horizontally-then-vertically to each later point', () => {
    const { line } = buildStepPath(points, 400, 100);
    expect(line.startsWith('M0.0 100.0')).toBe(true); // min value (4) sits at the bottom (y=height)
    expect(line).toMatch(/^M[\d.]+ [\d.]+( H[\d.]+ V[\d.]+)+$/);
  });

  it('closes the fill path down to the baseline and back to the start x', () => {
    const { line, fill } = buildStepPath(points, 400, 100);
    expect(fill).toBe(`${line} V100 H0.0 Z`);
  });

  it('places the end dot at the last point', () => {
    const { end } = buildStepPath(points, 400, 100);
    expect(end.x).toBe(400);
    expect(end.y).toBe(0); // max value (10) sits at the top (y=0)
  });

  it('reports the min and max values in the series', () => {
    const { min, max } = buildStepPath(points, 400, 100);
    expect(min).toBe(4);
    expect(max).toBe(10);
  });

  it('does not divide by zero for a flat, single-instant series', () => {
    const flat: SeriesPoint[] = [{ at: '2026-01-01T00:00:00.000Z', value: 3 }];
    const { line, end } = buildStepPath(flat, 400, 100);
    expect(line).toBe('M0.0 100.0');
    expect(end).toEqual({ x: 0, y: 100 });
  });
});

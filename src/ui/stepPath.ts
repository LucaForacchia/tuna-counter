import type { SeriesPoint } from '@/domain/series';

export interface StepPath {
  /** stroke-only path, e.g. "M0 84 H30 V95 ..." */
  line: string;
  /** `line` closed down to the baseline, for the fill area */
  fill: string;
  /** last point's pixel position, for the end dot */
  end: { x: number; y: number };
  min: number;
  max: number;
}

/**
 * Turns a domain series (docs/spec.md §3.3) into an SVG step-path string, the
 * same technique as design/mockups/03-history.html's hand-drawn chart: H/V
 * commands only, no curve smoothing.
 */
export function buildStepPath(points: readonly SeriesPoint[], width: number, height: number): StepPath {
  if (points.length === 0) {
    return { line: '', fill: '', end: { x: 0, y: height }, min: 0, max: 0 };
  }

  const times = points.map((p) => Date.parse(p.at));
  const values = points.map((p) => p.value);
  const minTime = times[0];
  const maxTime = times[times.length - 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const timeRange = maxTime - minTime || 1;
  const valueRange = max - min || 1;

  const x = (t: number) => ((t - minTime) / timeRange) * width;
  const y = (v: number) => height - ((v - min) / valueRange) * height;

  let line = `M${x(times[0]).toFixed(1)} ${y(values[0]).toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    line += ` H${x(times[i]).toFixed(1)} V${y(values[i]).toFixed(1)}`;
  }

  const x0 = x(times[0]).toFixed(1);
  const fill = `${line} V${height} H${x0} Z`;

  const lastIndex = points.length - 1;
  return { line, fill, end: { x: x(times[lastIndex]), y: y(values[lastIndex]) }, min, max };
}

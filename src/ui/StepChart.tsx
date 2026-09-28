import { Circle, Line, Path, Svg } from 'react-native-svg';

import type { SeriesPoint } from '@/domain/series';
import { buildStepPath } from './stepPath';
import { useThemeColors } from './theme';

export interface StepChartProps {
  points: readonly SeriesPoint[];
  width: number;
  height: number;
}

/** The History chart: a hand-drawn step path, no charting library — see docs/design.md's "History" section. */
export function StepChart({ points, width, height }: StepChartProps) {
  const colors = useThemeColors();
  const { line, fill, end } = buildStepPath(points, width, height);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Line x1={0} y1={height / 3} x2={width} y2={height / 3} stroke={colors.outlineSoft} strokeWidth={1} strokeDasharray="3 4" />
      <Line x1={0} y1={(height * 2) / 3} x2={width} y2={(height * 2) / 3} stroke={colors.outlineSoft} strokeWidth={1} strokeDasharray="3 4" />
      <Line x1={0} y1={height} x2={width} y2={height} stroke={colors.outline} strokeWidth={1} />
      <Path d={fill} fill={colors.accentSoft} opacity={0.6} />
      <Path d={line} fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinejoin="round" />
      <Circle cx={end.x} cy={end.y} r={5} fill={colors.accent} stroke={colors.surface} strokeWidth={2} />
    </Svg>
  );
}

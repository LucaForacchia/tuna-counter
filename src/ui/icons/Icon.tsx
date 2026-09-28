import type { ReactNode } from 'react';
import Svg from 'react-native-svg';

export interface IconProps {
  size?: number;
  color: string;
  strokeWidth?: number;
  children: ReactNode;
}

/**
 * Wraps the mockups' stroke-icon style (viewBox 0 0 24 24, fill none, round
 * caps/joins) so each icon only has to supply its <Path>/<Circle> children.
 */
export function Icon({ size = 22, color, strokeWidth = 1.8, children }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </Svg>
  );
}

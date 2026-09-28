import { Ellipse, Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Path copied from design/mockups/01-home.html's "Pantry" nav tab. */
export function PantryIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <Ellipse cx={12} cy={7} rx={8} ry={3} />
      <Path d="M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7" />
    </Icon>
  );
}

import { Circle, Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Not from a mockup — marks a History row entered well after it happened (see src/domain/backdated.ts). */
export function ClockIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </Icon>
  );
}

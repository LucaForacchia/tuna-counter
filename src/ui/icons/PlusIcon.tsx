import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Path copied from design/mockups/02-adjust-quantity.html's "Increase" stepper button. */
export function PlusIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <Path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Path copied from design/mockups/01-home.html's "History" nav tab. */
export function HistoryIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <Path d="M3 3v18h18" />
      <Path d="M7 15l4-4 3 3 5-6" />
    </Icon>
  );
}

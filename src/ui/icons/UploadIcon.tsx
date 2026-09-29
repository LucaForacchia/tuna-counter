import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Path copied from design/mockups/04-backup.html's Import card. */
export function UploadIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Path d="M17 8l-5-5-5 5" />
      <Path d="M12 3v12" />
    </Icon>
  );
}

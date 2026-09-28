import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Path copied from design/mockups/01-home.html's "Backup" nav tab (also used for Export in the Backup screen). */
export function DownloadIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Path d="M7 10l5 5 5-5" />
      <Path d="M12 15V3" />
    </Icon>
  );
}

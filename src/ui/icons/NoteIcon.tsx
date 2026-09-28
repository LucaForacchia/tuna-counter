import { Path } from 'react-native-svg';

import { Icon, type IconProps } from './Icon';

/** Path copied from design/mockups/03-history.html's note rows (a chat-bubble marker next to the note text). */
export function NoteIcon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <Path d="M4 4h16v12H8l-4 4z" />
    </Icon>
  );
}

import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type Colors } from './colors';

export function useThemeColors(): Colors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

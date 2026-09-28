import { DarkTheme, DefaultTheme } from 'expo-router';
import { useColorScheme } from 'react-native';

export function useThemeColors() {
  const colorScheme = useColorScheme();
  return (colorScheme === 'dark' ? DarkTheme : DefaultTheme).colors;
}

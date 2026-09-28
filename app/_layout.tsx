import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { fontFamilies } from '@/ui/fonts';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    [fontFamilies.displayMedium]: require('../design/fonts/ttf/bricolage_grotesque_medium.ttf'),
    [fontFamilies.displayBold]: require('../design/fonts/ttf/bricolage_grotesque_bold.ttf'),
    [fontFamilies.displayExtraBold]: require('../design/fonts/ttf/bricolage_grotesque_extrabold.ttf'),
    [fontFamilies.bodyRegular]: require('../design/fonts/ttf/figtree_regular.ttf'),
    [fontFamilies.bodyMedium]: require('../design/fonts/ttf/figtree_medium.ttf'),
    [fontFamilies.bodySemiBold]: require('../design/fonts/ttf/figtree_semibold.ttf'),
    [fontFamilies.bodyBold]: require('../design/fonts/ttf/figtree_bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="adjust" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

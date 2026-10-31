import { Fraunces_500Medium_Italic } from '@expo-google-fonts/fraunces/500Medium_Italic';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LiveBanner, useLiveMarket } from '@/components/live-banner';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/store/app-store';

SplashScreen.preventAutoHideAsync();

const SHEET = { presentation: 'formSheet', sheetGrabberVisible: true, sheetCornerRadius: 28 } as const;

export default function RootLayout() {
  const theme = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const hydrated = useAppStore((s) => s.hasHydrated);
  const onboarded = useAppStore((s) => s.onboarded);
  const ready = (fontsLoaded || fontError !== null) && hydrated;

  useLiveMarket();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.accent,
      background: theme.background,
      card: theme.surface,
      text: theme.ink,
      border: theme.line,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navigationTheme}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
          {/* The app itself, once a business has logged in or registered */}
          <Stack.Protected guard={onboarded}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="offer/[id]" />
            <Stack.Screen name="publish" options={{ presentation: 'modal' }} />
            <Stack.Screen
              name="reserved/[orderId]"
              options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }}
            />
            <Stack.Screen name="track/[orderId]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="order/[orderId]" options={{ ...SHEET, sheetAllowedDetents: [0.88] }} />
            <Stack.Screen name="switch-business" options={{ ...SHEET, sheetAllowedDetents: [0.7, 1] }} />
            <Stack.Screen name="top-up" options={{ ...SHEET, sheetAllowedDetents: [0.62] }} />
            <Stack.Screen name="presenter" options={{ ...SHEET, sheetAllowedDetents: [0.8, 1] }} />
          </Stack.Protected>

          {/* Onboarding and sign-in */}
          <Stack.Protected guard={!onboarded}>
            <Stack.Screen name="intro" />
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
        <LiveBanner />
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

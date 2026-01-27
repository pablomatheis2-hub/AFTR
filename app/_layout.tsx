import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { Analytics } from '@vercel/analytics/react';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WebContainer } from '@/components/WebContainer';
import { LoadingScreen } from '@/components/LoadingScreen';
import { BannedScreen } from '@/components/BannedScreen';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

const beRealTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000',
    card: '#0a0a0a',
    text: '#ffffff',
    border: '#262626',
    primary: '#ffffff',
    notification: '#ffffff',
  },
};

function RootLayoutNav() {
  const { session, user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (!user) {
      // Session exists but no user record - stay put
      return;
    } else if (!user.onboarding_complete) {
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/welcome');
      }
    } else {
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [session, user, loading, mounted, segments]);

  // Always render the same loading screen initially (for hydration)
  if (!mounted || loading) {
    return (
      <ThemeProvider value={beRealTheme}>
        <WebContainer>
          <LoadingScreen />
        </WebContainer>
      </ThemeProvider>
    );
  }

  if (user?.is_banned) {
    return (
      <ThemeProvider value={beRealTheme}>
        <WebContainer>
          <BannedScreen />
        </WebContainer>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={beRealTheme}>
      <WebContainer>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="event/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="party/[id]" options={{ presentation: 'card' }} />
        </Stack>
      </WebContainer>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
      {Platform.OS === 'web' && <Analytics />}
    </AuthProvider>
  );
}

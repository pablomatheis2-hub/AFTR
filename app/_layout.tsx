import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
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

function RootLayoutNav() {
  const { session, user, loading, userLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait for both auth and user data to finish loading
    if (loading || userLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!session) {
      // No session - redirect to login if not already there
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (user === null) {
      // Session exists but no user record yet (new signup)
      // Let them stay where they are until user record is created
      return;
    } else if (!user.onboarding_complete) {
      // User exists but hasn't completed onboarding
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/welcome');
      }
    } else {
      // Fully authenticated and onboarded user
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [session, user, loading, userLoading, segments]);

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

  // Show loading screen while auth state is being determined
  // This prevents child routes from rendering and fetching data prematurely
  if (loading || userLoading) {
    return (
      <ThemeProvider value={beRealTheme}>
        <WebContainer>
          <LoadingScreen />
        </WebContainer>
      </ThemeProvider>
    );
  }

  // Show banned screen if user is banned
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

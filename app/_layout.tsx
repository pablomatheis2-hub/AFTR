import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WebContainer } from '@/components/WebContainer';
import { LoadingScreen } from '@/components/LoadingScreen';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (!user?.onboarding_complete) {
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/welcome');
      }
    } else {
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [session, user, loading, segments]);

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
  if (loading) {
    return (
      <ThemeProvider value={beRealTheme}>
        <WebContainer>
          <LoadingScreen />
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
    </AuthProvider>
  );
}

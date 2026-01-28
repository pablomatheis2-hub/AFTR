import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import 'react-native-reanimated';

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

// Only call on native - web handles splash differently
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

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

  useEffect(() => {
    if (loading) return;

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
  }, [session, user, loading, segments]);

  if (loading) {
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

// Simple black screen for SSR/initial render
function InitialLoadingScreen() {
  return <View style={styles.initialLoading} />;
}

const styles = StyleSheet.create({
  initialLoading: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default function RootLayout() {
  const [mounted, setMounted] = useState(false);
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Track client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && Platform.OS !== 'web') {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Always render the same thing on server and first client render
  // This prevents hydration mismatch
  if (!mounted || !loaded) {
    return <InitialLoadingScreen />;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

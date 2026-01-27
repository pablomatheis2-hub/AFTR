import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            if (type === 'recovery') {
              router.replace('/profile');
            } else {
              router.replace('/');
            }
            return;
          }
        }
      }

      router.replace('/login');
    };

    handleCallback();
  }, [router]);

  return <LoadingScreen />;
}

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const appState = useRef(AppState.currentState);

  const fetchUser = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }
    return data as User | null;
  };

  const refreshUser = async () => {
    if (session?.user?.id) {
      const userData = await fetchUser(session.user.id);
      setUser(userData);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        setSession(session);
        if (session?.user?.id) {
          setUserLoading(true);
          const userData = await fetchUser(session.user.id);
          if (isMounted) {
            setUser(userData);
            setUserLoading(false);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return;
        
        setSession(session);
        if (session?.user?.id) {
          setUserLoading(true);
          const userData = await fetchUser(session.user.id);
          if (isMounted) {
            setUser(userData);
            setUserLoading(false);
          }
        } else {
          setUser(null);
          setUserLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Refresh user data when app comes back to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (session?.user?.id) {
          refreshUser();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [session?.user?.id]);

  const signUp = async (email: string, password: string) => {
    const isWeb = typeof window !== 'undefined' && Platform.OS === 'web';
    const redirectUrl = isWeb
      ? `${window.location.origin}/auth/callback`
      : 'aftr://auth/callback';

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const isWeb = typeof window !== 'undefined' && Platform.OS === 'web';
    const redirectUrl = isWeb
      ? `${window.location.origin}/auth/callback`
      : 'aftr://auth/callback';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error: error as Error | null };
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!session?.user?.id) {
      return { error: new Error('No user logged in') };
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', session.user.id);

    if (!error) {
      await refreshUser();
    }

    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        userLoading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

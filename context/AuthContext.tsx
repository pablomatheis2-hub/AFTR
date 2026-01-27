import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
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

  const fetchUser = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user:', error.message);
        return null;
      }
      return data as User | null;
    } catch (err) {
      console.error('Error fetching user:', err);
      return null;
    }
  };

  const refreshUser = async () => {
    if (session?.user?.id) {
      const userData = await fetchUser(session.user.id);
      setUser(userData);
    }
  };

  useEffect(() => {
    // Skip on server
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    let active = true;

    const init = async () => {
      // Timeout to prevent infinite loading if Supabase is slow
      const timeout = setTimeout(() => {
        if (active) {
          console.warn('Auth initialization timed out');
          setLoading(false);
        }
      }, 10000);

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        clearTimeout(timeout);
        if (!active) return;

        setSession(currentSession);
        if (currentSession?.user?.id) {
          const userData = await fetchUser(currentSession.user.id);
          if (active) setUser(userData);
        }
        setLoading(false);
      } catch (error) {
        clearTimeout(timeout);
        // Ignore AbortError - happens during component remount in React 19
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Auth initialization error:', error);
        if (active) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!active) return;
        try {
          setSession(newSession);
          if (newSession?.user?.id) {
            const userData = await fetchUser(newSession.user.id);
            if (active) setUser(userData);
          } else {
            setUser(null);
          }
        } catch (error) {
          // Ignore AbortError
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          console.error('Auth state change error:', error);
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

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

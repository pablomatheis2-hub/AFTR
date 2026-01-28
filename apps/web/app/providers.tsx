"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@aftr/shared/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseContext = {
  supabase: SupabaseClient<any>;
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user:", error.message);
      return null;
    }
    return data;
  };

  const refreshUser = async () => {
    if (session?.user?.id) {
      const userData = await fetchUser(session.user.id);
      setUser(userData);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        setSession(currentSession);

        if (currentSession?.user?.id) {
          const userData = await fetchUser(currentSession.user.id);
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user?.id) {
        const userData = await fetchUser(newSession.user.id);
        setUser(userData);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    return { error: error as Error | null };
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!session?.user?.id) {
      return { error: new Error("No user logged in") };
    }

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", session.user.id);

    if (!error) {
      await refreshUser();
    }

    return { error: error as Error | null };
  };

  return (
    <Context.Provider
      value={{
        supabase,
        session,
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useSupabase() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSupabase must be used within Providers");
  }
  return context;
}

export function useAuth() {
  const { session, user, loading, signIn, signUp, signOut, resetPassword, updateProfile, refreshUser } =
    useSupabase();
  return { session, user, loading, signIn, signUp, signOut, resetPassword, updateProfile, refreshUser };
}

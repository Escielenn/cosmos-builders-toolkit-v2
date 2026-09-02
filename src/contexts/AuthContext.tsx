import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

type OAuthProvider = 'google' | 'github' | 'discord' | 'apple' | 'notion';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  /** True when the initial session check timed out / failed (backend unreachable). */
  connectionError: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

/** Guards a promise so a hung network call can never freeze the app. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("auth_timeout")), ms),
    ),
  ]);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data as Profile | null;
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session — guarded so an unreachable backend
    // can't leave the app spinning forever (the paused-DB failure mode).
    withTimeout(supabase.auth.getSession(), 10_000)
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).then(setProfile);
        }
        setConnectionError(false);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Auth session check failed:", err);
        setConnectionError(true);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [retryNonce]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const signInWithOAuth = async (provider: OAuthProvider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "LOGOUT FAILED.",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error("No user logged in") };
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      return { error };
    }

    // Refresh profile
    const newProfile = await fetchProfile(user.id);
    setProfile(newProfile);
    
    return { error: null };
  };

  // Backend unreachable on first load → show a branded, retryable overlay
  // instead of an infinite spinner (the paused-DB failure mode).
  if (connectionError && !session) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[hsl(var(--sf-void-hsl))] px-6">
        <div className="max-w-md border border-sf-border bg-sf-surface/90 p-8 text-center">
          <div className="mb-4 font-mono text-[12px] uppercase tracking-[3px] text-sf-crimson">
            {"// connection lost"}
          </div>
          <h1 className="mb-3 font-display text-2xl font-light tracking-[0.04em] text-t1">
            Can't reach the forge
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-t3">
            StellarForge couldn't reach its servers. This is usually a brief
            network hiccup, not your worlds — they're safe. Give it a moment,
            then try again.
          </p>
          <button
            onClick={() => {
              setConnectionError(false);
              setLoading(true);
              setRetryNonce((n) => n + 1);
            }}
            className="bg-sf-primary px-6 py-2.5 font-sans text-[13px] font-medium uppercase tracking-[1.2px] text-[hsl(var(--accent-on-accent))] transition-shadow hover:shadow-sf-glow-teal"
          >
            Reconnect →
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        connectionError,
        signUp,
        signIn,
        signInWithOAuth,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

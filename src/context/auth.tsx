import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { ProfileWithDepartment } from "@/lib/types";

interface LoginResult {
  error: string | null;
  profile: ProfileWithDepartment | null;
}

interface AuthContextValue {
  session: Session | null;
  profile: ProfileWithDepartment | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const loadProfile = async (
  userId: string
): Promise<ProfileWithDepartment | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, departments(id, name)")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProfileWithDepartment;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileWithDepartment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id).then((p) => {
          if (active) setProfile(p);
        });
      }
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession?.user) {
          loadProfile(nextSession.user.id).then((p) => {
            if (active) setProfile(p);
          });
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        return { error: error.message, profile: null };
      }

      const loaded = await loadProfile(data.user.id);
      if (!loaded) {
        await supabase.auth.signOut();
        return {
          error:
            "Este usuário não possui um perfil de acesso. Contate o administrador.",
          profile: null,
        };
      }
      setProfile(loaded);
      return { error: null, profile: loaded };
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (user) {
      const p = await loadProfile(user.id);
      if (p) setProfile(p);
    }
  }, []);

  const value = useMemo(
    () => ({ session, profile, loading, login, logout, refreshProfile }),
    [session, profile, loading, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  }
  return ctx;
}

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "customer" | "contractor" | null;

type AuthUser = {
  id: string;
  email: string;
  name: string;
};

type AuthContextType = {
  loading: boolean;
  user: AuthUser | null;
  role: UserRole;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<UserRole>(null);

  async function refreshAuth() {
    try {
      setLoading(true);

      const {
        data: { user: supabaseUser },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      if (!supabaseUser) {
        setUser(null);
        setRole(null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", supabaseUser.id)
        .single();

      if (profileError) throw profileError;

      const normalizedRole: UserRole =
        profile?.role === "customer"
          ? "customer"
          : profile?.role === "contractor" || profile?.role === "tradesperson"
          ? "contractor"
          : null;

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        name:
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          supabaseUser.email?.split("@")[0] ||
          "User",
      });

      setRole(normalizedRole);
    } catch (err) {
      console.error("Failed to load auth state:", err);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  }

  useEffect(() => {
    refreshAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      loading,
      user,
      role,
      refreshAuth,
      signOut,
    }),
    [loading, user, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
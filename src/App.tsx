import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import CreateJob from "@/pages/CreateJob";
import JobDetail from "@/pages/JobDetail";
import JobQuotes from "@/pages/JobQuotes";
import ContractorDashboard from "@/pages/ContractorDashboard";
import CompleteContractorProfile from "@/pages/CompleteContractorProfile";
import EditContractorProfile from "@/pages/EditContractorProfile";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import NotFound from "@/pages/NotFound";

type UserRole = "customer" | "contractor" | null;

type AuthState = {
  loading: boolean;
  userId: string | null;
  role: UserRole;
};

function useAuthState() {
  const [authState, setAuthState] = useState<AuthState>({
    loading: true,
    userId: null,
    role: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadAuthState() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (!user) {
          if (mounted) {
            setAuthState({
              loading: false,
              userId: null,
              role: null,
            });
          }
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        const rawRole = profile?.role;

        const normalizedRole: UserRole =
          rawRole === "customer"
            ? "customer"
            : rawRole === "contractor" || rawRole === "tradesperson"
            ? "contractor"
            : null;

        if (mounted) {
          setAuthState({
            loading: false,
            userId: user.id,
            role: normalizedRole,
          });
        }
      } catch (err) {
        console.error("Failed to load auth state:", err);

        if (mounted) {
          setAuthState({
            loading: false,
            userId: null,
            role: null,
          });
        }
      }
    }

    loadAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadAuthState();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return authState;
}

function LoadingScreen() {
  return <div className="p-6">Loading...</div>;
}

function RootRedirect() {
  const { loading, userId, role } = useAuthState();

  if (loading) return <LoadingScreen />;

  if (!userId) {
    return <Navigate to="/sign-in" replace />;
  }

  if (role === "contractor") {
    return <Navigate to="/contractor-dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function CustomerRoute({ children }: { children: JSX.Element }) {
  const { loading, userId, role } = useAuthState();

  if (loading) return <LoadingScreen />;

  if (!userId) {
    return <Navigate to="/sign-in" replace />;
  }

  if (role !== "customer") {
    return <Navigate to="/contractor-dashboard" replace />;
  }

  return children;
}

function ContractorRoute({ children }: { children: JSX.Element }) {
  const { loading, userId, role } = useAuthState();

  if (loading) return <LoadingScreen />;

  if (!userId) {
    return <Navigate to="/sign-in" replace />;
  }

  if (role !== "contractor") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  const { loading, userId, role } = useAuthState();

  if (loading) return <LoadingScreen />;

  if (userId) {
    if (role === "contractor") {
      return <Navigate to="/contractor-dashboard" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/home" element={<Index />} />

        <Route
          path="/sign-in"
          element={
            <PublicOnlyRoute>
              <SignIn />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/sign-up"
          element={
            <PublicOnlyRoute>
              <SignUp />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <CustomerRoute>
              <Dashboard />
            </CustomerRoute>
          }
        />

        <Route
          path="/create-job"
          element={
            <CustomerRoute>
              <CreateJob />
            </CustomerRoute>
          }
        />

        <Route
          path="/jobs/:jobId"
          element={
            <CustomerRoute>
              <JobDetail />
            </CustomerRoute>
          }
        />

        <Route
          path="/jobs/:jobId/quotes"
          element={
            <CustomerRoute>
              <JobQuotes />
            </CustomerRoute>
          }
        />

        <Route
          path="/contractor-dashboard"
          element={
            <ContractorRoute>
              <ContractorDashboard />
            </ContractorRoute>
          }
        />

        <Route
          path="/contractorDashboard"
          element={<Navigate to="/contractor-dashboard" replace />}
        />

        <Route
          path="/complete-contractor-profile"
          element={
            <ContractorRoute>
              <CompleteContractorProfile />
            </ContractorRoute>
          }
        />

        <Route
          path="/edit-contractor-profile"
          element={
            <ContractorRoute>
              <EditContractorProfile />
            </ContractorRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  );
}
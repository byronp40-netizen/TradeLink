import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import CreateJob from "@/pages/CreateJob";
import EditJob from "@/pages/EditJob";
import JobDetail from "@/pages/JobDetail";
import JobQuotes from "@/pages/JobQuotes";
import ContractorDashboard from "@/pages/ContractorDashboard";
import CompleteContractorProfile from "@/pages/CompleteContractorProfile";
import EditContractorProfile from "@/pages/EditContractorProfile";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import NotFound from "@/pages/NotFound";

function LoadingScreen() {
  return <div className="p-6">Loading...</div>;
}

function RootRedirect() {
  const { loading, user, role } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (role === "contractor") {
    return <Navigate to="/contractor-dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function CustomerRoute({ children }: { children: JSX.Element }) {
  const { loading, user, role } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (role !== "customer") {
    return <Navigate to="/contractor-dashboard" replace />;
  }

  return children;
}

function ContractorRoute({ children }: { children: JSX.Element }) {
  const { loading, user, role } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (role !== "contractor") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  const { loading, user, role } = useAuth();

  if (loading) return <LoadingScreen />;

  if (user) {
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
          path="/jobs/:jobId/edit"
          element={
            <CustomerRoute>
              <EditJob />
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

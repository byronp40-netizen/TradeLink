import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { Routes, Route, Navigate } from "react-router-dom";

import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import CreateJob from "@/pages/CreateJob";
import JobDetail from "@/pages/JobDetail";
import JobQuotes from "@/pages/JobQuotes";
import ContractorDashboard from "@/pages/ContractorDashboard";
import CompleteContractorProfile from "@/pages/CompleteContractorProfile";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import NotFound from "@/pages/NotFound";

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <Routes>
        <Route path="/" element={<Index />} />

        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contractorDashboard" element={<ContractorDashboard />} />
        <Route path="/complete-contractor-profile" element={<CompleteContractorProfile />} />

        <Route path="/create-job" element={<CreateJob />} />
        <Route path="/jobs/:jobId" element={<JobDetail />} />
        <Route path="/jobs/:jobId/quotes" element={<JobQuotes />} />

        <Route path="/contractor-dashboard" element={<Navigate to="/contractorDashboard" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  );
}
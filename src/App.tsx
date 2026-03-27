import JobQuotes from "@/pages/JobQuotes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { Routes, Route } from "react-router-dom";

import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import CreateJob from "@/pages/CreateJob";
import JobDetail from "@/pages/JobDetail";
import NotFound from "@/pages/NotFound";
import ContractorDashboard from "@/pages/ContractorDashboard";

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs/:jobId/quotes" element={<JobQuotes />} />
        <Route path="/contractorDashboard" element={<ContractorDashboard />} />
        <Route path="/create-job" element={<CreateJob />} />
        <Route path="/jobs/:jobId" element={<JobDetail />} />

        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  );
}

export default App;
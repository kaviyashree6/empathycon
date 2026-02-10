import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ChatPortal from "./pages/ChatPortal";
import TherapistLogin from "./pages/TherapistLogin";
import TherapistDashboard from "./pages/TherapistDashboard";
import NotFound from "./pages/NotFound";
import { JournalPage } from "./components/journal/JournalPage";
import { BreathingExercise } from "./components/breathing/BreathingExercise";
import Settings from "./pages/Settings";
import Wellness from "./pages/Wellness";
import EmotionalDashboard from "./pages/EmotionalDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/chat" element={<ChatPortal />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/breathing" element={<BreathingExercise />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/wellness" element={<Wellness />} />
            <Route path="/emotional-dashboard" element={<EmotionalDashboard />} />
            <Route path="/therapist" element={<TherapistLogin />} />
            <Route path="/therapist/dashboard" element={<TherapistDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

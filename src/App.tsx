import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SettingsProvider } from "@/contexts/SettingsContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Simulate from "./pages/Simulate";
import FocusSetup from "./pages/FocusSetup";
import FocusSession from "./pages/FocusSession";
import PricingPage from "./pages/PricingPage";
import { useAirMode } from "@/features/air-mode/AirModeProvider";
import MobileApp from "./mobile/MobileApp";

import { AirModeControls } from "@/features/air-mode/AirModeControls";

const AirModeWrapper = () => {
  const { startTracking, stopTracking, isReady, airModeActive } = useAirMode();
  return (
    <AirModeControls
      isReady={isReady}
      airModeActive={airModeActive}
      onStart={startTracking}
      onStop={stopTracking}
    />
  );
};


import { MailProvider, useMail } from "@/contexts/MailContext";
import MailFromM87 from "@/components/MailFromM87";

const MailModalWrapper = () => {
  const { mailOpen, setMailOpen, setMailUnread } = useMail();
  return (
    <MailFromM87 
      open={mailOpen} 
      onClose={() => setMailOpen(false)} 
      onBadgeRead={() => setMailUnread(false)} 
    />
  );
};

const queryClient = new QueryClient();

const DesktopRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/auth" element={<Auth />} />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      }
    />
    <Route
      path="/simulate"
      element={
        <ProtectedRoute>
          <Simulate />
        </ProtectedRoute>
      }
    />
    <Route
      path="/focus/setup"
      element={
        <ProtectedRoute>
          <FocusSetup />
        </ProtectedRoute>
      }
    />
    <Route
      path="/focus/session"
      element={
        <ProtectedRoute>
          <FocusSession />
        </ProtectedRoute>
      }
    />
    <Route path="/pricing" element={<PricingPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MailProvider>
        <SettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/m/*" element={<MobileApp />} />
                <Route path="/*" element={<DesktopRoutes />} />
              </Routes>
            </BrowserRouter>
            <AirModeWrapper />
            <MailModalWrapper />
          </TooltipProvider>
        </SettingsProvider>
      </MailProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

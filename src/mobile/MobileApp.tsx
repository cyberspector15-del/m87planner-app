import { Navigate, Route, Routes } from "react-router-dom";
import MobileLayout from "./components/MobileLayout";
import MobileDashboard from "./pages/MobileDashboard";
import MobileTasks from "./pages/MobileTasks";
import MobileSettings from "./pages/MobileSettings";
import MobileFocus from "./pages/MobileFocus";
import MobileRoutines from "./pages/MobileRoutines";
import MobileConsequences from "./pages/MobileConsequences";
import MobileAnalytics from "./pages/MobileAnalytics";
import MobilePricing from "./pages/MobilePricing";

const MobileApp = () => {
  return (
    <MobileLayout>
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="/dashboard" element={<MobileDashboard />} />
        <Route path="/tasks" element={<MobileTasks />} />
        <Route path="/focus/*" element={<MobileFocus />} />
        <Route path="/routines" element={<MobileRoutines />} />
        <Route path="/consequences" element={<MobileConsequences />} />
        <Route path="/analytics" element={<MobileAnalytics />} />
        <Route path="/pricing" element={<MobilePricing />} />
        <Route path="/settings" element={<MobileSettings />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </MobileLayout>
  );
};

export default MobileApp;

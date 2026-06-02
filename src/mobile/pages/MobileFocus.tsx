import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import FocusSetup from "@/pages/FocusSetup";
import FocusSession from "@/pages/FocusSession";

const MobileFocus = () => {
  const { pathname } = useLocation();

  if (pathname === "/m/focus" || pathname === "/m/focus/") {
    return <Navigate to="/m/focus/setup" replace />;
  }

  return (
    <Routes>
      <Route path="setup" element={<FocusSetup />} />
      <Route path="session" element={<FocusSession />} />
      <Route path="*" element={<Navigate to="/m/focus/setup" replace />} />
    </Routes>
  );
};

export default MobileFocus;

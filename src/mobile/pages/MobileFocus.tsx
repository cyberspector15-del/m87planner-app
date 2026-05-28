import { Navigate, Route, Routes } from "react-router-dom";
import FocusSetup from "@/pages/FocusSetup";
import FocusSession from "@/pages/FocusSession";

const MobileFocus = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="setup" replace />} />
      <Route path="/setup" element={<FocusSetup />} />
      <Route path="/session" element={<FocusSession />} />
    </Routes>
  );
};

export default MobileFocus;


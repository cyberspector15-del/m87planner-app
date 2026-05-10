import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AirModeProvider } from "./features/air-mode/AirModeProvider";

createRoot(document.getElementById("root")!).render(
  <AirModeProvider>
    <App />
  </AirModeProvider>
);

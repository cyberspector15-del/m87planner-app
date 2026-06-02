import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

const MobileLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const isPricingRoute = location.pathname.startsWith("/m/pricing");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className={
          isPricingRoute
            ? "mx-auto w-full max-w-md"
            : "mx-auto w-full max-w-md px-4 pb-24 pt-4"
        }
      >
        {children}
      </div>
      <BottomNav />
    </div>
  );
};

export default MobileLayout;

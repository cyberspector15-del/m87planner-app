import { ReactNode } from "react";
import BottomNav from "./BottomNav";

const MobileLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-md px-4 pb-24 pt-4">{children}</div>
      <BottomNav />
    </div>
  );
};

export default MobileLayout;


import { Navigate } from "react-router-dom";
import { CircleNotch } from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  // When context user is null we do one direct session check before redirecting,
  // to handle the race where navigate fires before React has applied the auth state update.
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (user) {
      // Context already has the user — no extra check needed
      setHasSession(true);
      setSessionChecked(true);
      return;
    }
    if (!loading) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setHasSession(!!session);
        setSessionChecked(true);
      });
    }
  }, [user, loading]);

  // Show spinner while context is loading or while we're doing the extra check
  if (loading || !sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CircleNotch size={32} weight="thin" className="animate-spin text-cosmic-silver" />
      </div>
    );
  }

  if (!user && !hasSession) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

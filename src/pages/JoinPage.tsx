import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const REFERRAL_STORAGE_KEY = 'm87_referral_code';

export default function JoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const refCode = searchParams.get('ref');

  // Persist referral code to localStorage as soon as the page loads.
  // This survives multi-step signup flows, OAuth redirects, etc.
  useEffect(() => {
    if (refCode) {
      localStorage.setItem(REFERRAL_STORAGE_KEY, refCode);
    }
  }, [refCode]);

  // If already logged in
  if (user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="relative z-10 glass p-8 rounded-2xl max-w-md border border-border/30">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">
            You're already in — this invite doesn't apply.
          </h1>
          <Button onClick={() => navigate('/dashboard')} variant="cosmic-primary">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleAcceptInvite = () => {
    // Also write to storage immediately on click (belt-and-suspenders),
    // in case the effect hasn't fired yet in some edge case.
    if (refCode) {
      localStorage.setItem(REFERRAL_STORAGE_KEY, refCode);
    }
    navigate('/auth');
  };

  // Not logged in
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="relative z-10 max-w-md w-full space-y-8 glass p-10 rounded-3xl border border-border/30">
        <div>
          <h2 className="font-display font-bold text-foreground text-3xl mb-3 tracking-widest">
            M87 PLANNER
          </h2>
          <p className="text-muted-foreground font-sans text-md">
            You've been invited to M87 Planner
          </p>
        </div>
        
        {refCode && (
          <div className="bg-black/40 border border-white/5 rounded-lg p-3 text-sm text-cosmic-silver sim-font-mono">
            Invite Code: {refCode}
          </div>
        )}

        <Button 
          className="w-full h-12" 
          variant="cosmic-primary"
          onClick={handleAcceptInvite}
        >
          Accept Invite
        </Button>
      </div>
    </div>
  );
}

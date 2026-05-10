import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const GoogleIcon = () => (
  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
    <svg width="12" height="12" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
    </svg>
  </div>
);

export const GoogleAuthButton = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    setIsRedirecting(true);
    setError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError("Google sign-in failed. Try again.");
        setIsRedirecting(false);
      }
    } catch (err) {
      setError("Google sign-in failed. Try again.");
      setIsRedirecting(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isRedirecting}
        className={`
          w-full flex items-center justify-center gap-[12px] px-5 py-[14px] 
          rounded-[12px] transition-all duration-200 ease-out font-inter google-btn-shadow
          ${isRedirecting ? 'opacity-70 cursor-not-allowed text-[#999999]' : 'text-white hover:bg-[rgba(255,255,255,0.1)] hover:-translate-y-[1px] group'}
        `}
        style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
          boxShadow: isRedirecting 
            ? 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 0 1px rgba(255,255,255,0.06)' 
            : undefined
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .google-btn-shadow {
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 0 1px rgba(255,255,255,0.06);
          }
          .google-btn-shadow:hover:not(:disabled) {
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 0 1px rgba(255,255,255,0.2);
          }
        `}} />
        {!isRedirecting && <GoogleIcon />}
        <span className={`text-[15px] font-medium leading-none`}>
          {isRedirecting ? "Redirecting..." : "Continue with Google"}
        </span>
      </button>
      
      {error && (
        <p className="text-[#CF3030] text-[13px] font-inter text-center animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};

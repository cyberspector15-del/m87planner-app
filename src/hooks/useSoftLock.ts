import { useState, useEffect, useCallback } from 'react';

export const useSoftLock = () => {
  const [showExitModal, setShowExitModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const requestLock = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      // Push dummy state to trap back gesture
      window.history.pushState(null, '', window.location.href);
      setIsLocked(true);
    } catch (err) {
      console.error('Fullscreen request failed:', err);
      // Fallback: still lock popstate even if fullscreen fails
      window.history.pushState(null, '', window.location.href);
      setIsLocked(true);
    }
  }, []);

  const exitLock = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsLocked(false);
    } catch (err) {
      console.error('Exit fullscreen failed:', err);
    }
  }, []);

  const dismissModal = useCallback(() => {
    setShowExitModal(false);
  }, []);

  useEffect(() => {
    if (!isLocked) return;

    const handlePopState = () => {
      // User tried to go back. Trap them and show modal.
      window.history.pushState(null, '', window.location.href);
      setShowExitModal(true);
    };

    const handleFullscreenChange = () => {
      // If user exited fullscreen via Esc/F11, show modal
      if (!document.fullscreenElement && isLocked) {
        setShowExitModal(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isLocked]);

  return {
    showExitModal,
    requestLock,
    exitLock,
    dismissModal,
  };
};

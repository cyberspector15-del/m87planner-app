import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useFocusTimer } from '@/hooks/useFocusTimer';
import { FocusTimer } from './FocusTimer';
import { ScanLine } from './ScanLine';
import { AmbientRings } from './AmbientRings';
import { ModeShiftPulse } from './ModeShiftPulse';
import { SessionComplete } from './SessionComplete';
import { BreakActivityPanel } from './BreakActivityPanel';
import { BreakActivity, BreakTier } from '@/types/focusMode';
import { useSoftLock } from '@/hooks/useSoftLock';
import { ExitFrictionModal } from './ExitFrictionModal';
import { useFocusSessionAward } from '@/hooks/useFocusSessionAward';

// ── helpers ─────────────────────────────────────────────────────────────────

const formatTime = (s: number): string => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const breakLabel = (tier: BreakTier, durationMin: number): string =>
  `${tier.toUpperCase()} · ${durationMin} MIN BREAK`;

const hudLabel = (tier: BreakTier, activity: string | null): string => {
  const activityPart = tier === 'deep' && activity ? activity.toUpperCase() : '—';
  return `FOCUS SESSION · ${tier.toUpperCase()} BREAK · ${activityPart}`;
};

// ── component ────────────────────────────────────────────────────────────────

export const FocusSessionHUD = () => {
  const { session, secondsLeft, progressPct, phase, focusElapsedSecondsRef } = useFocusTimer();
  const { awardFocusSession } = useFocusSessionAward();
  const navigate = useNavigate();
  const { showExitModal, requestLock, exitLock, dismissModal } = useSoftLock();

  // Local swap state — mirrors what is committed to Supabase
  const [localActivity, setLocalActivity] = useState<BreakActivity | null>(null);
  const [localSwapUsed, setLocalSwapUsed] = useState(false);

  const isBreak = phase === 'break';

  // Derived active activity (local override after swap, or session value)
  const activeActivity = localActivity ?? session?.breakActivity ?? null;
  const isDrift = isBreak && activeActivity === 'drift';

  // ── soft lock integration ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'focus') {
      requestLock();
    }
  }, [phase, requestLock]);

  const handleEndEarly = async () => {
    if (!session) return;
    const seconds = focusElapsedSecondsRef.current;
    const focusMinutesCompleted = seconds > 0 ? Math.max(1, Math.round(seconds / 60)) : 0;
    
    const { error } = await supabase
      .from('focus_sessions')
      .update({
        exited_early: true,
        focus_minutes_completed: focusMinutesCompleted,
        completed_at: new Date().toISOString(),
        phase: 'complete',
      })
      .eq('id', session.id);

    if (error) {
      console.error('Could not complete focus session:', error);
    } else {
      await awardFocusSession(session.id);
    }

    await exitLock();
    navigate('/dashboard');
  };

  const handleStayInOrbit = () => {
    dismissModal();
    requestLock();
  };


  // ── complete phase ────────────────────────────────────────────────────────
  if (phase === 'complete') {
    return <SessionComplete session={session} />;
  }

  // ── loading ───────────────────────────────────────────────────────────────
  if (phase === 'loading' || !session) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Space Mono', monospace",
          color: '#333333',
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
        }}
      >
        LOADING SESSION...
      </div>
    );
  }

  // ── active focus or rest mode HUD ─────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000',
        overflowY: isBreak ? 'auto' : 'hidden',
        scrollBehavior: isBreak ? 'smooth' : 'auto',
      }}
    >
      {/* ── BACKGROUND LAYER ──────────────────────────────────────────────── */}
      
      {/* Teal Ambient Radial Gradient for Rest Mode / Drift */}
      <AnimatePresence>
        {isBreak && !isDrift && (
          <motion.div
            key="rest-ambient"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'radial-gradient(ellipse at center, rgba(69,161,153,0.04) 0%, transparent 60%)',
              zIndex: 0,
            }}
          />
        )}
        {isDrift && (
          <motion.div
            key="drift-ambient"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 0,
            }}
          >
            <motion.div
              animate={{
                background: [
                  'radial-gradient(ellipse at center, rgba(69,161,153,0.04) 0%, transparent 60%)',
                  'radial-gradient(ellipse at center, rgba(69,161,153,0.08) 0%, transparent 60%)',
                  'radial-gradient(ellipse at center, rgba(69,161,153,0.04) 0%, transparent 60%)',
                ]
              }}
              transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
              style={{ width: '100%', height: '100%' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Rings (Rest Mode) */}
      {isBreak && <AmbientRings ringCount={isDrift ? 3 : 1} />}
      
      {/* Scan line (Focus Mode) */}
      <AnimatePresence>
        {!isBreak && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ScanLine />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Shift Pulse (Triggers ONCE when entering break mode) */}
      {isBreak && <ModeShiftPulse />}

      {/* ── TOP HUD STRIP ─────────────────────────────────────────────────── */}
      <motion.div
        animate={{
          backgroundColor: isDrift ? 'rgba(10,10,10,0.1)' : isBreak ? 'rgba(10,10,10,0.3)' : 'rgba(10,10,10,0.6)',
          borderColor: isDrift ? 'rgba(255,255,255,0.01)' : isBreak ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
        }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          backdropFilter: 'blur(32px) saturate(150%)',
          WebkitBackdropFilter: 'blur(32px) saturate(150%)',
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 20,
        }}
      >
        {/* Left — session info */}
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            color: '#999999',
            opacity: isDrift ? 0.4 : 1,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            transition: 'opacity 0.6s ease-in-out',
          }}
        >
          {hudLabel(session.breakTier, session.breakActivity)}
        </span>

        {/* Center — M87 wordmark */}
        <span
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 700,
            fontSize: '0.875rem',
            color: '#FFFFFF',
            opacity: isDrift ? 0.4 : 1,
            letterSpacing: '0.25em',
            transition: 'opacity 0.6s ease-in-out',
          }}
        >
          M87
        </span>

        {/* Right — session date */}
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            color: '#999999',
            opacity: isDrift ? 0.4 : 1,
            letterSpacing: '0.12em',
            transition: 'opacity 0.6s ease-in-out',
          }}
        >
          {session.focusStartedAt
            ? session.focusStartedAt.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }).toUpperCase()
            : '—'}
        </span>
      </motion.div>

      {/* ── MAIN TIMER — centered / upper-center in break ─────────────────── */}
      <FocusTimer secondsLeft={secondsLeft} phase={phase as 'focus' | 'break'} isDrift={isDrift} />

      {/* ── BREAK ACTIVITY PANEL — lower screen, break mode only ──────────── */}
      <AnimatePresence>
        {isBreak && session && session.breakTier !== 'micro' && (
          <div
            style={{
              position: 'absolute',
              top: '55%',
              left: 0,
              right: 0,
              padding: '0 24px 80px', // Extra padding for bottom info + user request
              zIndex: 15,
            }}
          >
            <BreakActivityPanel
              sessionId={session.id}
              breakTier={session.breakTier}
              breakActivity={activeActivity}
              breakDuration={session.breakDuration}
              swapAllowed={session.swapAllowed}
              swapUsed={localSwapUsed || session.swapUsed}
              breakExpired={secondsLeft === 0}
              onSwapComplete={(newActivity) => {
                setLocalActivity(newActivity);
                setLocalSwapUsed(true);
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM INFO ROW ───────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: '10px', // sit just above the 2px progress bar
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 20,
        }}
      >
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            color: '#999999',
            opacity: isDrift ? 0.4 : 1,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            transition: 'opacity 0.6s ease-in-out',
          }}
        >
          {isBreak ? `FOCUS RESUMES IN ${formatTime(secondsLeft)}` : `BREAK IN ${formatTime(secondsLeft)}`}
        </span>

        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            color: '#999999',
            opacity: isDrift ? 0.4 : 1,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            transition: 'opacity 0.6s ease-in-out',
          }}
        >
          {breakLabel(session.breakTier, session.breakDuration)}
        </span>
      </div>

      {/* ── PROGRESS BAR — fixed bottom ───────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'rgba(51,51,51,0.3)',
          zIndex: 20,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, #45A199, #BFBFBF)',
            transition: 'width 1s linear',
          }}
        />
      </div>
      {/* ── EXIT FRICTION MODAL ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showExitModal && (
          <ExitFrictionModal
            focusMinutesCompleted={Math.round((focusElapsedSecondsRef?.current || 0) / 60)}
            onStay={handleStayInOrbit}
            onEnd={handleEndEarly}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

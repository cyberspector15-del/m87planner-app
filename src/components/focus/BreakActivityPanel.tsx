import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { BreakActivity, BreakTier } from '@/types/focusMode';
import { SESSION_STORAGE_KEY } from '@/hooks/useFocusSession';
import { GameController, ArrowRight, Flame, Waves, ArrowSquareOut } from "@phosphor-icons/react";
import { SignalEcho } from './game/SignalEcho';
import { CognitiveSprint } from './game/CognitiveSprint';
import { DriftState } from './DriftState';

// ── activity config ──────────────────────────────────────────────────────────

interface ActivityConfig {
  header: string;
  subtext: string;
  ghostText?: string;
  hasCta?: boolean;
  ctaLabel?: string;
}

const getActivityConfig = (
  tier: BreakTier,
  activity: BreakActivity | null,
  breakDuration: number
): ActivityConfig => {
  if (tier === 'standard') {
    return {
      header: 'COGNITIVE SPRINT',
      subtext: 'Mental reset · 3 challenges · Auto-ends',
      hasCta: true,
      ctaLabel: 'BEGIN SPRINT',
    };
  }

  const effectiveActivity = tier === 'short' && !activity ? 'play' : activity;

  switch (effectiveActivity) {
    case 'play':
      return {
        header: 'SIGNAL ECHO',
        subtext: 'Cognitive reset · Pattern recognition',
        hasCta: true,
        ctaLabel: 'BEGIN GAME',
      };
    case 'move':
      return {
        header: 'PHYSICAL RESET',
        subtext: 'Step away · Move your body · Return focused',
        ghostText: 'MOVE',
      };
    case 'fuel':
      return {
        header: 'BIOLOGICAL MAINTENANCE',
        subtext: 'Hydrate · Eat · Rest your eyes',
        ghostText: 'FUEL',
      };
    case 'drift':
      return {
        header: 'DRIFT PHASE',
        subtext: 'Close your eyes · Breathe · Return when ready',
      };
    case 'surface':
      return {
        header: 'SURFACE MISSION',
        subtext: `Step outside · No screen · Return in ${breakDuration} min`,
        ghostText: 'SURFACE',
      };
    default:
      return {
        header: 'REST MODE',
        subtext: 'Take a moment to recover',
      };
  }
};

// ── swap activity list ───────────────────────────────────────────────────────

const ACTIVITIES: { id: BreakActivity; label: string; Icon: React.ElementType }[] = [
  { id: 'play', label: 'Play', Icon: GameController },
  { id: 'move', label: 'Move', Icon: ArrowRight },
  { id: 'fuel', label: 'Fuel', Icon: Flame },
  { id: 'drift', label: 'Drift', Icon: Waves },
  { id: 'surface', label: 'Surface', Icon: ArrowSquareOut },
];

// ── props ────────────────────────────────────────────────────────────────────

interface BreakActivityPanelProps {
  sessionId: string;
  breakTier: BreakTier;
  breakActivity: BreakActivity | null;
  breakDuration: number;
  swapAllowed: boolean;
  swapUsed: boolean;
  breakExpired: boolean;
  onSwapComplete: (newActivity: BreakActivity) => void;
}

// ── main component ───────────────────────────────────────────────────────────

export const BreakActivityPanel = ({
  sessionId,
  breakTier,
  breakActivity,
  breakDuration,
  swapAllowed,
  swapUsed,
  breakExpired,
  onSwapComplete,
}: BreakActivityPanelProps) => {
  const [showSwapSheet, setShowSwapSheet] = useState(false);
  const [showGamePlaceholder, setShowGamePlaceholder] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const config = getActivityConfig(breakTier, breakActivity, breakDuration);
  const canSwap = swapAllowed && !swapUsed;

  const handleSwap = async (newActivity: BreakActivity) => {
    setIsSwapping(true);
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const id = stored || sessionId;

    const { error } = await supabase
      .from('focus_sessions')
      .update({ break_activity: newActivity, swap_used: true })
      .eq('id', id);

    if (!error) {
      onSwapComplete(newActivity);
      setShowSwapSheet(false);
    }
    setIsSwapping(false);
  };

  if (breakActivity === 'drift') {
    return (
      <AnimatePresence>
        <motion.div
          key="drift-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DriftState />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {/* ── Activity Card ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.7 }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '28rem',
          margin: '0 auto',
          overflow: 'hidden',
        }}
      >
        {/* Ghost background text */}
        {config.ghostText && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(4rem, 18vw, 10rem)',
              color: 'rgba(255,255,255,0.08)',
              letterSpacing: '0.05em',
              userSelect: 'none',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 0,
            }}
          >
            {config.ghostText}
          </div>
        )}

        {/* Card surface */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              background: 'rgba(18,18,18,0.5)',
              backdropFilter: 'blur(28px) saturate(145%)',
              WebkitBackdropFilter: 'blur(28px) saturate(145%)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)',
              borderRadius: '12px',
              padding: '24px',
          }}
        >
          {/* Header */}
          <p
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.6875rem',
              color: '#999999',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            {config.header}
          </p>

          {/* Subtext */}
          <p
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: '0.875rem',
              color: '#999999',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {config.subtext}
          </p>

          {/* CTA / game */}
          {config.hasCta && (
            <div style={{ marginTop: '20px' }}>
              {/* Signal Echo — real game for Short · Play */}
              {breakTier !== 'standard' ? (
                showGamePlaceholder ? (
                  <SignalEcho breakExpired={breakExpired} />
                ) : (
                  <button
                    onClick={() => setShowGamePlaceholder(true)}
                    style={{
                      width: '100%',
                      height: '44px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'rgba(30,30,30,0.6)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.04)',
                      color: '#FFFFFF',
                      fontFamily: "'Orbitron', sans-serif",
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                      (e.target as HTMLElement).style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.18)';
                    }}
                    onMouseLeave={e => {
                      (e.target as HTMLElement).style.transform = 'translateY(0)';
                      (e.target as HTMLElement).style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.04)';
                    }}
                  >
                    {config.ctaLabel}
                  </button>
                )
              ) : (
                /* Standard tier — Cognitive Sprint placeholder (Phase 5) */
                showGamePlaceholder ? (
                  <CognitiveSprint 
                    breakExpired={breakExpired} 
                    onFinish={() => setShowGamePlaceholder(false)} 
                  />
                ) : (
                  <button
                    onClick={() => setShowGamePlaceholder(true)}
                    style={{
                      width: '100%',
                      height: '44px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'rgba(30,30,30,0.6)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.04)',
                      color: '#FFFFFF',
                      fontFamily: "'Orbitron', sans-serif",
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                      (e.target as HTMLElement).style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.18)';
                    }}
                    onMouseLeave={e => {
                      (e.target as HTMLElement).style.transform = 'translateY(0)';
                      (e.target as HTMLElement).style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.04)';
                    }}
                  >
                    {config.ctaLabel}
                  </button>
                )
              )}
            </div>
          )}

          {/* Swap UI */}
          {canSwap && (
            <div
              style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(51,51,51,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '0.75rem',
                  color: '#999999',
                }}
              >
                Activity can be changed
              </span>
              <button
                onClick={() => setShowSwapSheet(true)}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.6875rem',
                  color: '#45A199',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                SWAP ACTIVITY
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Swap Sheet ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSwapSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              key="swap-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowSwapSheet(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                zIndex: 40,
              }}
            />

            {/* Sheet */}
            <motion.div
              key="swap-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: '#141414',
                border: '1px solid rgba(51,51,51,0.4)',
                borderBottom: 'none',
                borderRadius: '12px 12px 0 0',
                padding: '24px 24px 40px',
                zIndex: 50,
              }}
            >
              {/* Handle */}
              <div
                style={{
                  width: '40px',
                  height: '3px',
                  background: '#333333',
                  borderRadius: '2px',
                  margin: '0 auto 24px',
                }}
              />

              <p
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.6875rem',
                  color: '#999999',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  marginBottom: '20px',
                }}
              >
                SELECT ACTIVITY
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '12px',
                }}
              >
                {ACTIVITIES.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    disabled={isSwapping}
                    onClick={() => handleSwap(id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '16px 8px',
                      background: breakActivity === id ? 'rgba(69,161,153,0.08)' : '#1A1A1A',
                      border: `1px solid ${breakActivity === id ? 'rgba(69,161,153,0.5)' : 'rgba(51,51,51,0.4)'}`,
                      borderRadius: '10px',
                      cursor: isSwapping ? 'not-allowed' : 'pointer',
                      opacity: isSwapping ? 0.5 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon
                      size={20}
                      weight="thin"
                      color={breakActivity === id ? '#45A199' : '#999999'}
                    />
                    <span
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '0.5625rem',
                        color: breakActivity === id ? '#FFFFFF' : '#999999',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

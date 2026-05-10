import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSignalEcho } from '@/hooks/useSignalEcho';
import { SignalEchoNode } from './SignalEchoNode';

interface SignalEchoProps {
  breakExpired: boolean;
}

const mono = "'Space Mono', monospace";
const inter = "'Inter', system-ui, sans-serif";
const orbitron = "'Orbitron', sans-serif";

export const SignalEcho = ({ breakExpired }: SignalEchoProps) => {
  const seed = useRef(Date.now()).current;

  const {
    gameState,
    currentRound,
    sequences,
    activeNodeIndex,
    userFlashNode,
    inputProgress,
    hasRetried,
    roundsMatched,
    breathingSecondsLeft,
    startRound,
    handleNodeTap,
    playAgain,
  } = useSignalEcho(seed, breakExpired);

  const currentSeq = sequences[currentRound] ?? [];
  const isInteractive = gameState === 'input';

  // ── status text ──────────────────────────────────────────────────────────
  const statusText = (() => {
    switch (gameState) {
      case 'ready':
        return `ROUND ${currentRound + 1} OF 3`;
      case 'playback':
        return 'WATCH...';
      case 'input':
        return hasRetried ? 'RETRY' : 'REPLICATE';
      case 'matched':
        return 'SEQUENCE MATCHED';
      case 'breathing':
        return `ROUND ${currentRound + 1} OF 3`;
      case 'complete':
        return 'SIGNAL CLEAR';
      default:
        return '';
    }
  })();

  const statusColor =
    gameState === 'matched' ? '#45A199'
    : gameState === 'complete' ? '#FFFFFF'
    : '#999999';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', position: 'relative' }}>

      {/* ── Completion teal pulse ─────────────────────────────────────── */}
      <AnimatePresence>
        {gameState === 'complete' && (
          <motion.div
            key="complete-pulse"
            initial={{ width: 0, height: 0, opacity: 0.15 }}
            animate={{ width: '100%', height: '100%', opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              background: 'rgba(69,161,153,0.15)',
              pointerEvents: 'none',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 0,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Status label ─────────────────────────────────────────────── */}
      <motion.p
        key={statusText}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          fontFamily: mono,
          fontSize: '0.6875rem',
          color: statusColor,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          margin: 0,
          transition: 'color 0.3s ease',
        }}
      >
        {statusText}
      </motion.p>

      {/* ── Subtext / Breathing countdown ────────────────────────────── */}
      <AnimatePresence mode="wait">
        {gameState === 'ready' && (
          <motion.p
            key="subtext-ready"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ fontFamily: inter, fontSize: '0.8125rem', color: '#999999', margin: '-12px 0 0', textAlign: 'center' }}
          >
            Watch the sequence
          </motion.p>
        )}

        {gameState === 'breathing' && (
          <motion.div
            key="breathing"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center' }}
          >
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontFamily: inter, fontSize: '0.875rem', color: '#999999', margin: '0 0 8px' }}
            >
              Rest...
            </motion.p>
            <p style={{ fontFamily: mono, fontSize: '0.625rem', color: '#999999', letterSpacing: '0.15em', margin: 0 }}>
              NEXT ROUND IN {breathingSecondsLeft}
            </p>
          </motion.div>
        )}

        {gameState === 'complete' && (
          <motion.p
            key="subtext-complete"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ fontFamily: inter, fontSize: '0.8125rem', color: '#999999', margin: '-12px 0 0', textAlign: 'center' }}
          >
            {roundsMatched}/3 sequences matched
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Node grid — 2×3 ──────────────────────────────────────────── */}
      <AnimatePresence>
        {gameState !== 'complete' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 64px)',
              gridTemplateRows: 'repeat(2, 64px)',
              gap: '16px',
            }}
          >
            {Array.from({ length: 6 }, (_, i) => {
              const isPlaybackActive = gameState === 'playback' && activeNodeIndex === i;
              const isUserCorrect = userFlashNode?.index === i && userFlashNode.correct;
              const isUserWrong = userFlashNode?.index === i && !userFlashNode.correct;

              return (
                <SignalEchoNode
                  key={i}
                  index={i}
                  isPlaybackActive={isPlaybackActive}
                  isUserCorrect={isUserCorrect}
                  isUserWrong={isUserWrong}
                  isInteractive={isInteractive}
                  onClick={() => handleNodeTap(i)}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Progress dots (input phase) ───────────────────────────────── */}
      {gameState === 'input' && (
        <div style={{ display: 'flex', gap: '6px' }}>
          {currentSeq.map((_, dotIdx) => (
            <div
              key={dotIdx}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: dotIdx < inputProgress ? '#45A199' : '#333333',
                border: '1px solid rgba(255,255,255,0.15)',
                transition: 'background 0.2s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* ── CTA button (ready state) ───────────────────────────────── */}
      <AnimatePresence>
        {gameState === 'ready' && (
          <motion.button
            key="start-btn"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25 }}
            onClick={startRound}
            style={{
              height: '44px',
              padding: '0 32px',
              borderRadius: '10px',
              border: 'none',
              background: 'rgba(30,30,30,0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.04)',
              color: '#FFFFFF',
              fontFamily: orbitron,
              fontWeight: 700,
              fontSize: '0.6875rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onHoverStart={() => {}}
            whileHover={{
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.18)',
              y: -1,
            }}
          >
            START ROUND
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Play Again (complete state) ───────────────────────────── */}
      {gameState === 'complete' && (
        <button
          onClick={playAgain}
          style={{
            fontFamily: mono,
            fontSize: '0.625rem',
            color: '#45A199',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            marginTop: '4px',
          }}
        >
          PLAY AGAIN
        </button>
      )}
    </div>
  );
};

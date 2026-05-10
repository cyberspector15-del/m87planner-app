import React, { useEffect, useRef, useState } from 'react';
import { GestureType } from './types';

interface AirCursorProps {
  x: number;
  y: number;
  visible: boolean;
  gestureType?: GestureType;
  airModeActive?: boolean;
}

// Trail config
const TRAIL_LENGTH = 6;
const trailOpacities = [0.18, 0.14, 0.10, 0.07, 0.04, 0.01];
const trailSizes = [8, 7, 6, 5, 4, 4];

// Inject keyframes once
const STYLES_ID = 'air-cursor-styles';
function injectStyles() {
  if (document.getElementById(STYLES_ID)) return;
  const style = document.createElement('style');
  style.id = STYLES_ID;
  style.textContent = `
    @keyframes air-cursor-rotate {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes air-cursor-pulse {
      0%, 100% { box-shadow: 0 0 8px rgba(255,255,255,0.4), 0 0 20px rgba(140,180,255,0.25); }
      50%       { box-shadow: 0 0 14px rgba(255,255,255,0.6), 0 0 30px rgba(140,180,255,0.4); }
    }
    @keyframes air-cursor-appear {
      from { opacity: 0; transform: scale(0.8); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes air-cursor-pinch-pulse {
      0%   { transform: scale(1); }
      40%  { transform: scale(0.75); filter: brightness(2); }
      100% { transform: scale(1); filter: brightness(1); }
    }

    .air-cursor__event-horizon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1.5px solid rgba(255, 255, 255, 0.85);
      box-shadow: 0 0 8px rgba(255,255,255,0.4), 0 0 20px rgba(140,180,255,0.25);
      animation: air-cursor-rotate 8s linear infinite, air-cursor-pulse 3s ease-in-out infinite;
      position: absolute;
      top: 0; left: 0;
    }
    .air-cursor__core {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #000;
      box-shadow: 0 0 6px rgba(255,255,255,0.3);
    }
    .air-cursor__accretion-disk {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-15deg);
      width: 44px;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(140,200,255,0.9), transparent);
      filter: blur(0.8px);
      box-shadow: 0 0 6px rgba(140,200,255,0.5);
    }

    /* Gesture variants */
    .air-cursor--pinch .air-cursor__event-horizon {
      box-shadow: 0 0 18px rgba(255,255,255,0.9), 0 0 32px rgba(200,220,255,0.6);
    }
    .air-cursor--pinch {
      animation: air-cursor-pinch-pulse 180ms ease forwards;
    }
    .air-cursor--scroll .air-cursor__accretion-disk {
      filter: brightness(1.6) blur(0.6px);
    }
    .air-cursor--scroll .air-cursor__event-horizon {
      box-shadow: 0 0 10px rgba(255,255,255,0.5), 0 0 26px rgba(140,180,255,0.35);
    }
    .air-cursor--palm .air-cursor__event-horizon {
      border-color: rgba(100,255,180,0.8);
    }
    .air-cursor--fist .air-cursor__event-horizon {
      border-color: rgba(255,100,100,0.7);
    }

    /* Magnetic hover */
    .air-cursor--magnetic .air-cursor__event-horizon {
      box-shadow: 0 0 16px rgba(255,255,255,0.7), 0 0 35px rgba(140,180,255,0.5);
      border-color: rgba(255,255,255,1);
    }
  `;
  document.head.appendChild(style);
}

export function AirCursor({ x, y, visible, gestureType = 'NONE', airModeActive = false }: AirCursorProps) {
  // Inject CSS once
  useEffect(() => { injectStyles(); }, []);

  // Trail positions stored as refs — no React re-render
  const trailRefs = useRef<Array<HTMLDivElement | null>>(Array(TRAIL_LENGTH).fill(null));
  const posHistoryRef = useRef<Array<{ x: number; y: number }>>(
    Array(TRAIL_LENGTH).fill({ x: 0, y: 0 })
  );
  const rafRef = useRef<number | null>(null);

  // Magnetic state needs React to trigger class change
  const [isMagnetic, setIsMagnetic] = useState(false);
  const innerRef = useRef<HTMLDivElement | null>(null);

  // Update trail via RAF — completely off React render cycle
  useEffect(() => {
    // Push new position into history
    posHistoryRef.current = [{ x, y }, ...posHistoryRef.current.slice(0, TRAIL_LENGTH - 1)];

    const updateTrail = () => {
      trailRefs.current.forEach((el, i) => {
        if (!el) return;
        const pos = posHistoryRef.current[i];
        if (!pos) return;
        el.style.transform = `translate3d(${pos.x - trailSizes[i] / 2}px, ${pos.y - trailSizes[i] / 2}px, 0)`;
      });
    };

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateTrail);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [x, y]);

  // Magnetic hover detection
  useEffect(() => {
    const INTERACTIVE = 'button, a, [role="button"], input, select, textarea, label';
    const el = document.elementFromPoint(x, y);
    if (el && el.closest(INTERACTIVE)) {
      setIsMagnetic(true);
    } else {
      setIsMagnetic(false);
    }
  }, [x, y]);

  const gestureClass =
    gestureType === 'PINCH' ? 'air-cursor--pinch' :
    gestureType === 'TWO_FINGER_SCROLL' ? 'air-cursor--scroll' :
    gestureType === 'OPEN_PALM' ? 'air-cursor--palm' :
    gestureType === 'FIST' ? 'air-cursor--fist' :
    '';

  const magneticClass = isMagnetic ? 'air-cursor--magnetic' : '';

  return (
    <>
      {/* Trail dots — position-only, no React cycle */}
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
        <div
          key={i}
          ref={el => { trailRefs.current[i] = el; }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: `${trailSizes[i]}px`,
            height: `${trailSizes[i]}px`,
            borderRadius: '50%',
            background: 'rgba(180, 210, 255, 1)',
            opacity: visible ? trailOpacities[i] : 0,
            pointerEvents: 'none',
            zIndex: 999997,
            transition: 'opacity 0.3s ease',
            willChange: 'transform',
          }}
        />
      ))}

      {/* Outer wrapper — position only, NO transition on transform */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '36px',
          height: '36px',
          pointerEvents: 'none',
          zIndex: 999999,
          willChange: 'transform',
          transform: `translate3d(${x - 18}px, ${y - 18}px, 0)`,
        }}
      >
        {/* Inner — handles opacity + scale transitions only */}
        <div
          ref={innerRef}
          className={`air-cursor ${gestureClass} ${magneticClass}`}
          style={{
            position: 'relative',
            width: '36px',
            height: '36px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'scale(1)' : 'scale(0.8)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
          }}
        >
          <div className="air-cursor__event-horizon" />
          <div className="air-cursor__accretion-disk" />
          <div className="air-cursor__core" />
        </div>
      </div>
    </>
  );
}

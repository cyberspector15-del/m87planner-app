import { useEffect, useRef, useState } from 'react';
import { GestureType, HandLandmark } from './types';

const HOLD_DURATION_MS = 2000;
const TOGGLE_COOLDOWN_MS = 2000;
const CLICK_COOLDOWN_MS = 400;
const SCROLL_ACTIVATION_DELAY_MS = 200;
const PINCH_MIN_FRAMES = 2;
const CURSOR_STABLE_SPEED_THRESHOLD = 8;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export function useInteractionEngine(
  gestureType: GestureType,
  handDetected: boolean,
  cursorX: number,
  cursorY: number,
  handLandmarks: HandLandmark[] | null
): { airModeActive: boolean } {
  const [airModeActive, setAirModeActive] = useState(false);

  // ── Hold-to-toggle refs ──────────────────────────────────────────────────
  const holdStartRef = useRef<number | null>(null);
  const lastGestureRef = useRef<GestureType>('NONE');
  const toggleCooldownUntilRef = useRef<number>(0);

  // ── Pinch-click refs ─────────────────────────────────────────────────────
  const pinchFrameCountRef = useRef(0);
  const pinchFiredRef = useRef(false);
  const clickCooldownUntilRef = useRef<number>(0);

  // ── Scroll refs ──────────────────────────────────────────────────────────
  const prevWristYRef = useRef<number | null>(null);
  const scrollStartTimeRef = useRef<number | null>(null);
  const scrollVelocityRef = useRef(0);

  // ── Cursor stability refs ────────────────────────────────────────────────
  const prevCursorXRef = useRef(cursorX);
  const prevCursorYRef = useRef(cursorY);

  // ── Idle tracking ref ────────────────────────────────────────────────────
  const lastGestureTimeRef = useRef<number>(performance.now());

  // Keep latest values accessible in interval without extra deps
  const airModeActiveRef = useRef(airModeActive);
  useEffect(() => { airModeActiveRef.current = airModeActive; }, [airModeActive]);

  const cursorXRef = useRef(cursorX);
  const cursorYRef = useRef(cursorY);
  useEffect(() => { cursorXRef.current = cursorX; }, [cursorX]);
  useEffect(() => { cursorYRef.current = cursorY; }, [cursorY]);

  const landmarksRef = useRef<HandLandmark[] | null>(null);
  useEffect(() => { landmarksRef.current = handLandmarks; }, [handLandmarks]);

  // ── Reset helpers ────────────────────────────────────────────────────────
  const resetScrollState = () => {
    prevWristYRef.current = null;
    scrollStartTimeRef.current = null;
    scrollVelocityRef.current = 0;
  };

  const resetPinchState = () => {
    pinchFrameCountRef.current = 0;
    pinchFiredRef.current = false;
  };

  const resetAllTimers = () => {
    holdStartRef.current = null;
    resetScrollState();
    resetPinchState();
  };

  const gestureTypeRef = useRef<GestureType>('NONE');
  const handDetectedRef = useRef(false);

  useEffect(() => { gestureTypeRef.current = gestureType; }, [gestureType]);
  useEffect(() => { handDetectedRef.current = handDetected; }, [handDetected]);

  // Reset timers on gesture change
  useEffect(() => {
    if (!handDetected) {
      resetAllTimers();
      lastGestureRef.current = 'NONE';
      return;
    }

    const now = performance.now();

    if (gestureType !== lastGestureRef.current) {
      holdStartRef.current = gestureType !== 'NONE' ? now : null;
      lastGestureRef.current = gestureType;
      if (gestureType !== 'TWO_FINGER_SCROLL') resetScrollState();
      if (gestureType !== 'PINCH') resetPinchState();
    }
  }, [gestureType, handDetected]);

  // ── ESC key failsafe ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAirModeActive(false);
        airModeActiveRef.current = false;
        console.log('[AirCommand] ESC pressed — Air Mode disabled');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main loop via interval — checks hold duration and fires interactions
  useEffect(() => {
    const interval = setInterval(() => {
      const gestureType = gestureTypeRef.current;
      const handDetected = handDetectedRef.current;
      const active = airModeActiveRef.current;
      const now = performance.now();

      if (!handDetected) return;

      // ── Track last gesture time (idle detection) ─────────────────────
      if (gestureType !== 'NONE') lastGestureTimeRef.current = now;

      // ── Auto-disable after 10 min idle ───────────────────────────────
      if (active && now - lastGestureTimeRef.current > IDLE_TIMEOUT_MS) {
        setAirModeActive(false);
        airModeActiveRef.current = false;
        console.log('[AirCommand] Auto-disabled after 10min idle');
        return;
      }

      // ── Cursor stability measurement ─────────────────────────────────
      const cursorSpeed = Math.sqrt(
        Math.pow(cursorXRef.current - prevCursorXRef.current, 2) +
        Math.pow(cursorYRef.current - prevCursorYRef.current, 2)
      );
      prevCursorXRef.current = cursorXRef.current;
      prevCursorYRef.current = cursorYRef.current;
      const isCursorStable = cursorSpeed < CURSOR_STABLE_SPEED_THRESHOLD;

      // ── Hold-to-toggle ───────────────────────────────────────────────
      if (
        (gestureType === 'OPEN_PALM' && !active) ||
        (gestureType === 'FIST' && active)
      ) {
        if (
          holdStartRef.current !== null &&
          now - holdStartRef.current >= HOLD_DURATION_MS &&
          now >= toggleCooldownUntilRef.current
        ) {
          const next = gestureType === 'OPEN_PALM';
          setAirModeActive(next);
          airModeActiveRef.current = next;
          toggleCooldownUntilRef.current = now + TOGGLE_COOLDOWN_MS;
          holdStartRef.current = null;
          console.log('[AirCommand] Air Mode:', next ? 'ACTIVE' : 'INACTIVE');
        }
      }

      if (!active) return;

      // ── Pinch click (only when cursor is stable) ─────────────────────
      if (gestureType === 'PINCH') {
        pinchFrameCountRef.current += 1;
        if (
          pinchFrameCountRef.current >= PINCH_MIN_FRAMES &&
          !pinchFiredRef.current &&
          isCursorStable &&
          now >= clickCooldownUntilRef.current
        ) {
          const el = document.elementFromPoint(cursorXRef.current, cursorYRef.current);
          if (el) {
            (el as HTMLElement).dispatchEvent(
              new MouseEvent('click', { bubbles: true, cancelable: true })
            );
            console.log('[AirCommand] Click at', cursorXRef.current.toFixed(0), cursorYRef.current.toFixed(0));
          }
          pinchFiredRef.current = true;
          clickCooldownUntilRef.current = now + CLICK_COOLDOWN_MS;
        }
      }

      // ── Scroll with momentum ─────────────────────────────────────────
      if (gestureType === 'TWO_FINGER_SCROLL') {
        const lm = landmarksRef.current;
        if (!lm || lm.length < 1) return;
        const wristY = lm[0].y;
        if (scrollStartTimeRef.current === null) {
          scrollStartTimeRef.current = now;
          prevWristYRef.current = wristY;
          return;
        }
        if (now - scrollStartTimeRef.current < SCROLL_ACTIVATION_DELAY_MS) return;
        if (prevWristYRef.current !== null) {
          const deltaY = (wristY - prevWristYRef.current) * 40 * window.innerHeight;
          scrollVelocityRef.current += deltaY * 0.2;
        }
        prevWristYRef.current = wristY;
      }

      // Apply scroll momentum every tick (decays even when not actively scrolling)
      if (Math.abs(scrollVelocityRef.current) > 0.5) {
        window.scrollBy(0, scrollVelocityRef.current);
        scrollVelocityRef.current *= 0.85;
      } else {
        scrollVelocityRef.current = 0;
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  return { airModeActive };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { HandLandmark, GestureType } from './types';

const BUFFER_SIZE = 7;
const COOLDOWN_MS = 400;

function detectRawGesture(lm: HandLandmark[]): GestureType {
  // 1. PINCH — highest priority
  const dx = lm[4].x - lm[8].x;
  const dy = lm[4].y - lm[8].y;
  const pinchDist = Math.sqrt(dx * dx + dy * dy);
  if (pinchDist < 0.05) return 'PINCH';

  const indexExtended = lm[8].y < lm[6].y;
  const middleExtended = lm[12].y < lm[10].y;
  const ringBent = lm[16].y > lm[14].y;
  const pinkyBent = lm[20].y > lm[18].y;
  const ringExtended = lm[16].y < lm[14].y;
  const pinkyExtended = lm[20].y < lm[18].y;
  const indexBent = lm[8].y > lm[6].y;
  const middleBent = lm[12].y > lm[10].y;

  // 2. TWO_FINGER_SCROLL — index + middle extended, ring + pinky bent
  if (indexExtended && middleExtended && ringBent && pinkyBent) {
    return 'TWO_FINGER_SCROLL';
  }

  // 3. OPEN_PALM — all four fingers extended
  if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
    return 'OPEN_PALM';
  }

  // 4. FIST — all four fingers bent
  if (indexBent && middleBent && ringBent && pinkyBent) {
    return 'FIST';
  }

  return 'NONE';
}

export function useGestureEngine(
  handLandmarks: HandLandmark[] | null,
  handDetected: boolean
): { gestureType: GestureType } {
  const [gestureType, setGestureType] = useState<GestureType>('NONE');

  const frameBufferRef = useRef<GestureType[]>([]);
  const cooldownUntilRef = useRef<number>(0);
  const lastLoggedRef = useRef<GestureType>('NONE');

  // Keep landmarks/handDetected fresh in refs for the RAF loop
  const landmarksRef = useRef<HandLandmark[] | null>(null);
  const handDetectedRef = useRef(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    landmarksRef.current = handLandmarks;
  }, [handLandmarks]);

  useEffect(() => {
    handDetectedRef.current = handDetected;
  }, [handDetected]);

  const loop = useCallback(() => {
    const lm = landmarksRef.current;
    const detected = handDetectedRef.current;

    // Determine raw gesture
    let raw: GestureType = 'NONE';
    if (detected && lm && lm.length >= 21) {
      raw = detectRawGesture(lm);
    }

    // Push into frame buffer (cap at BUFFER_SIZE)
    const buf = frameBufferRef.current;
    buf.push(raw);
    if (buf.length > BUFFER_SIZE) buf.shift();

    // Stable only when all frames agree
    if (buf.length === BUFFER_SIZE && buf.every((g) => g === buf[0])) {
      const stable = buf[0];
      const now = performance.now();

      // Apply cooldown — only gate non-NONE transitions
      if (stable !== 'NONE' && now < cooldownUntilRef.current) {
        // still in cooldown, skip
      } else {
        setGestureType((prev) => {
          if (prev !== stable) {
            if (stable !== 'NONE') {
              cooldownUntilRef.current = now + COOLDOWN_MS;
            }
            if (lastLoggedRef.current !== stable) {
              console.log('[AirCommand] Gesture:', stable);
              lastLoggedRef.current = stable;
            }
            return stable;
          }
          return prev;
        });
      }
    }

    animationRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loop]);

  return { gestureType };
}

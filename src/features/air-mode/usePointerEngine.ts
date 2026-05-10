import { useEffect, useRef, useState, useCallback } from 'react';
import { HandLandmark, AirModeConfig } from './types';

export function usePointerEngine(
  handLandmarks: HandLandmark[] | null,
  handDetected: boolean,
  config: AirModeConfig
) {
  const cursorXRef = useRef(0);
  const cursorYRef = useRef(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);

  const landmarksRef = useRef<HandLandmark[] | null>(null);
  const animationRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const configRef = useRef(config);

  useEffect(() => { landmarksRef.current = handLandmarks; }, [handLandmarks]);
  useEffect(() => { configRef.current = config; }, [config]);

  // Handle visibility based on handDetected
  useEffect(() => {
    if (handDetected) {
      if (hideTimeoutRef.current !== null) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setCursorVisible(true);
    } else {
      hideTimeoutRef.current = setTimeout(() => {
        setCursorVisible(false);
      }, 2000);
    }

    return () => {
      if (hideTimeoutRef.current !== null) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [handDetected]);

  const loop = useCallback(() => {
    const landmarks = landmarksRef.current;
    const cfg = configRef.current;

    if (landmarks && landmarks.length >= 13) {
      let targetX: number;
      let targetY: number;

      if (cfg.calibration) {
        // Apply calibrated bounding-box mapping
        const rawX = (landmarks[8].x + landmarks[12].x) / 2;
        const rawY = (landmarks[8].y + landmarks[12].y) / 2;
        const { minX, maxX, minY, maxY } = cfg.calibration;
        const normX = Math.max(0, Math.min(1, (rawX - minX) / (maxX - minX)));
        const normY = Math.max(0, Math.min(1, (rawY - minY) / (maxY - minY)));
        targetX = (1 - normX) * window.innerWidth * cfg.cursorSpeedMultiplier;
        targetY = normY * window.innerHeight * cfg.cursorSpeedMultiplier;
      } else {
        // Raw mapping with mirrored X
        targetX = (1 - (landmarks[8].x + landmarks[12].x) / 2) * window.innerWidth * cfg.cursorSpeedMultiplier;
        targetY = ((landmarks[8].y + landmarks[12].y) / 2) * window.innerHeight * cfg.cursorSpeedMultiplier;
      }

      const prevX = cursorXRef.current;
      const prevY = cursorYRef.current;

      const alpha = cfg.smoothingFactor;
      const rawNewX = prevX + (targetX - prevX) * alpha;
      const rawNewY = prevY + (targetY - prevY) * alpha;

      // Edge clamping
      const newX = Math.max(0, Math.min(window.innerWidth, rawNewX));
      const newY = Math.max(0, Math.min(window.innerHeight, rawNewY));

      const dx = Math.abs(newX - prevX);
      const dy = Math.abs(newY - prevY);

      if (dx >= 1 || dy >= 1) {
        cursorXRef.current = newX;
        cursorYRef.current = newY;
        setCursorPos({ x: newX, y: newY });
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

  return {
    cursorX: cursorPos.x,
    cursorY: cursorPos.y,
    cursorVisible,
  };
}

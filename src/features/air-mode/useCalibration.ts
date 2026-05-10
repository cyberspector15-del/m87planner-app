import { useState, useRef, useEffect, useCallback } from 'react';
import { HandLandmark, CalibrationBounds } from './types';

const STORAGE_KEY = 'm87_air_calibration';

const STEP_LABELS = [
  'TOP-LEFT',
  'TOP-RIGHT',
  'BOTTOM-LEFT',
  'BOTTOM-RIGHT',
] as const;

type CalibrationStep = 0 | 1 | 2 | 3 | 4;

function loadFromStorage(): CalibrationBounds | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CalibrationBounds;
  } catch {
    return null;
  }
}

function saveToStorage(bounds: CalibrationBounds) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bounds));
  } catch {
    // ignore
  }
}

export function useCalibration() {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState<CalibrationStep>(0);
  const [calibrationBounds, setCalibrationBounds] = useState<CalibrationBounds | null>(
    () => loadFromStorage()
  );

  // Store captured points: [topLeft, topRight, bottomLeft, bottomRight]
  const capturedPointsRef = useRef<Array<{ x: number; y: number }>>([]);

  const startCalibration = useCallback(() => {
    capturedPointsRef.current = [];
    setCalibrationStep(1);
    setIsCalibrating(true);
  }, []);

  const confirmPoint = useCallback((landmarks: HandLandmark[]) => {
    if (!landmarks || landmarks.length < 9) return;

    const tip = landmarks[8]; // Index finger tip
    capturedPointsRef.current.push({ x: tip.x, y: tip.y });

    const nextStep = (capturedPointsRef.current.length + 1) as CalibrationStep;

    if (capturedPointsRef.current.length === 4) {
      // Compute bounds
      const pts = capturedPointsRef.current;
      const bounds: CalibrationBounds = {
        minX: Math.min(pts[0].x, pts[2].x),
        maxX: Math.max(pts[1].x, pts[3].x),
        minY: Math.min(pts[0].y, pts[1].y),
        maxY: Math.max(pts[2].y, pts[3].y),
      };
      setCalibrationBounds(bounds);
      saveToStorage(bounds);
      setCalibrationStep(4);
      setIsCalibrating(false);
    } else {
      setCalibrationStep(nextStep);
    }
  }, []);

  const resetCalibration = useCallback(() => {
    capturedPointsRef.current = [];
    setCalibrationBounds(null);
    setCalibrationStep(0);
    setIsCalibrating(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const skipCalibration = useCallback(() => {
    capturedPointsRef.current = [];
    setCalibrationStep(0);
    setIsCalibrating(false);
  }, []);

  return {
    isCalibrating,
    calibrationStep,
    calibrationBounds,
    stepLabel: calibrationStep >= 1 && calibrationStep <= 4
      ? STEP_LABELS[calibrationStep - 1]
      : null,
    startCalibration,
    confirmPoint,
    resetCalibration,
    skipCalibration,
  };
}

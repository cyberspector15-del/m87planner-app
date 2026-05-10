import React, { createContext, useContext, ReactNode, RefObject, useState, useEffect, useCallback } from 'react';
import { useHandTracking } from './useHandTracking';
import { usePointerEngine } from './usePointerEngine';
import { useGestureEngine } from './useGestureEngine';
import { useInteractionEngine } from './useInteractionEngine';
import { useCalibration } from './useCalibration';
import { AirCursor } from './AirCursor';
import { CalibrationOverlay } from './CalibrationOverlay';
import { AirModeSettings } from './AirModeSettings';
import { HandLandmark, GestureType, AirModeConfig, CalibrationBounds } from './types';

// ── Config persistence ────────────────────────────────────────────────────────
const CONFIG_STORAGE_KEY = 'm87_air_config';

const DEFAULT_CONFIG: AirModeConfig = {
  smoothingFactor: 0.20,
  cursorSpeedMultiplier: 1.0,
  calibration: null,
};

function loadConfig(): AirModeConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
interface AirModeContextValue {
  handLandmarks: HandLandmark[];
  handDetected: boolean;
  isReady: boolean;
  gestureType: GestureType;
  airModeActive: boolean;
  videoRef: RefObject<HTMLVideoElement>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  config: AirModeConfig;
  setConfig: (config: AirModeConfig) => void;
  calibrationBounds: CalibrationBounds | null;
  startCalibration: () => void;
  resetCalibration: () => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
}

const AirModeContext = createContext<AirModeContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AirModeProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<AirModeConfig>(loadConfig);
  const [showSettings, setShowSettings] = useState(false);

  const {
    videoRef,
    canvasRef,
    handLandmarks,
    handDetected,
    isReady,
    startTracking,
    stopTracking,
  } = useHandTracking();

  const {
    isCalibrating,
    calibrationStep,
    calibrationBounds,
    startCalibration,
    confirmPoint,
    resetCalibration,
    skipCalibration,
  } = useCalibration();

  const landmarks = handLandmarks.length > 0 ? handLandmarks : null;

  const { gestureType } = useGestureEngine(landmarks, handDetected);

  // Merge calibration bounds into config whenever they change
  const setConfig = useCallback((next: AirModeConfig) => {
    setConfigState(next);
  }, []);

  // Keep config.calibration in sync with calibrationBounds from hook
  useEffect(() => {
    setConfigState(prev => ({ ...prev, calibration: calibrationBounds }));
  }, [calibrationBounds]);

  const { cursorX, cursorY, cursorVisible } = usePointerEngine(landmarks, handDetected, config);

  const { airModeActive } = useInteractionEngine(
    gestureType,
    handDetected,
    cursorX,
    cursorY,
    landmarks
  );

  return (
    <AirModeContext.Provider
      value={{
        handLandmarks,
        handDetected,
        isReady,
        gestureType,
        airModeActive,
        videoRef,
        startTracking,
        stopTracking,
        config,
        setConfig,
        calibrationBounds,
        startCalibration,
        resetCalibration,
        showSettings,
        setShowSettings,
      }}
    >
      {children}

      {/* Hidden canvas for MediaPipe processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Video element for verification — hidden from UI */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ display: 'none' }}
      />

      {/* Background dim when Air Mode is active */}
      {airModeActive && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.12)',
          pointerEvents: 'none',
          zIndex: 999998,
          transition: 'opacity 0.5s ease',
        }} />
      )}

      {/* Air cursor overlay */}
      <AirCursor
        x={cursorX}
        y={cursorY}
        visible={cursorVisible}
        gestureType={gestureType}
        airModeActive={airModeActive}
      />

      {/* Calibration overlay */}
      {isCalibrating && (
        <CalibrationOverlay
          calibrationStep={calibrationStep}
          onConfirm={confirmPoint}
          onSkip={skipCalibration}
          currentLandmarks={landmarks}
          gestureType={gestureType}
        />
      )}

      {/* Settings panel */}
      {showSettings && (
        <AirModeSettings
          config={config}
          onConfigChange={setConfig}
          onStartCalibration={startCalibration}
          onResetCalibration={resetCalibration}
          onClose={() => setShowSettings(false)}
          hasCalibration={calibrationBounds !== null}
        />
      )}
    </AirModeContext.Provider>
  );
}

export function useAirMode() {
  const context = useContext(AirModeContext);
  if (!context) {
    throw new Error('useAirMode must be used within an AirModeProvider');
  }
  return context;
}

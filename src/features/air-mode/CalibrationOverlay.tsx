import React, { useEffect, useRef } from 'react';
import { HandLandmark } from './types';

interface CalibrationOverlayProps {
  calibrationStep: 0 | 1 | 2 | 3 | 4;
  onConfirm: (landmarks: HandLandmark[]) => void;
  onSkip: () => void;
  currentLandmarks: HandLandmark[] | null;
  gestureType?: string;
}

const STEP_CONFIGS = [
  { label: 'TOP-LEFT',     corner: { top: 40,    left: 40  },  desc: 'Point your index finger to the TOP-LEFT corner and hold' },
  { label: 'TOP-RIGHT',    corner: { top: 40,    right: 40 },  desc: 'Point your index finger to the TOP-RIGHT corner and hold' },
  { label: 'BOTTOM-LEFT',  corner: { bottom: 40, left: 40  },  desc: 'Point your index finger to the BOTTOM-LEFT corner and hold' },
  { label: 'BOTTOM-RIGHT', corner: { bottom: 40, right: 40 },  desc: 'Point your index finger to the BOTTOM-RIGHT corner and hold' },
];

const STYLES_ID = 'air-calibration-styles';

function injectCalibrationStyles() {
  if (document.getElementById(STYLES_ID)) return;
  const style = document.createElement('style');
  style.id = STYLES_ID;
  style.textContent = `
    @keyframes calib-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(0, 180, 255, 0.7), 0 0 20px rgba(0, 180, 255, 0.4); }
      50%       { box-shadow: 0 0 0 12px rgba(0, 180, 255, 0), 0 0 40px rgba(0, 180, 255, 0.7); }
    }
    @keyframes calib-appear {
      from { opacity: 0; transform: scale(0.8); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes calib-target-rotate {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes step-slide-in {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .calib-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999999;
      background: rgba(0, 0, 0, 0.88);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      animation: calib-appear 0.4s ease forwards;
      backdrop-filter: blur(4px);
      font-family: 'Inter', 'SF Pro Display', system-ui, sans-serif;
    }
    .calib-header {
      position: absolute;
      top: 32px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .calib-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3em;
      color: rgba(0, 180, 255, 0.9);
      text-transform: uppercase;
    }
    .calib-step-indicator {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.18em;
      color: rgba(255, 255, 255, 0.4);
      text-transform: uppercase;
    }
    .calib-center-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 28px;
      animation: step-slide-in 0.35s ease forwards;
    }
    .calib-instruction {
      font-size: 15px;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.85);
      text-align: center;
      max-width: 400px;
      line-height: 1.6;
      letter-spacing: 0.02em;
    }
    .calib-instruction strong {
      color: #00b4ff;
      font-weight: 700;
    }
    .calib-pinch-hint {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.35);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .calib-progress-dots {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .calib-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      transition: all 0.3s ease;
    }
    .calib-dot.active {
      background: #00b4ff;
      box-shadow: 0 0 8px rgba(0, 180, 255, 0.8);
      width: 18px;
      border-radius: 3px;
    }
    .calib-dot.done {
      background: rgba(0, 180, 255, 0.5);
    }
    .calib-actions {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .calib-btn-confirm {
      padding: 10px 32px;
      background: rgba(0, 180, 255, 0.12);
      border: 1px solid rgba(0, 180, 255, 0.7);
      border-radius: 3px;
      color: #00b4ff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .calib-btn-confirm:hover {
      background: rgba(0, 180, 255, 0.22);
      box-shadow: 0 0 16px rgba(0, 180, 255, 0.35);
    }
    .calib-btn-skip {
      padding: 10px 20px;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 3px;
      color: rgba(255, 255, 255, 0.35);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .calib-btn-skip:hover {
      color: rgba(255, 255, 255, 0.65);
      border-color: rgba(255, 255, 255, 0.3);
    }

    /* Corner target */
    .calib-target {
      position: absolute;
      width: 40px;
      height: 40px;
      pointer-events: none;
    }
    .calib-target__ring {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1.5px solid rgba(0, 180, 255, 0.9);
      animation: calib-pulse 1.5s ease-in-out infinite;
    }
    .calib-target__crosshair {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
    }
    .calib-target__crosshair::before,
    .calib-target__crosshair::after {
      content: '';
      position: absolute;
      background: rgba(0, 180, 255, 0.7);
    }
    .calib-target__crosshair::before {
      width: 1px;
      height: 14px;
      top: -7px; left: 0;
    }
    .calib-target__crosshair::after {
      height: 1px;
      width: 14px;
      left: -7px; top: 0;
    }
    .calib-target__dot {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #00b4ff;
      box-shadow: 0 0 8px rgba(0, 180, 255, 1);
    }
  `;
  document.head.appendChild(style);
}

export function CalibrationOverlay({
  calibrationStep,
  onConfirm,
  onSkip,
  currentLandmarks,
  gestureType,
}: CalibrationOverlayProps) {
  const prevGestureRef = useRef<string>('NONE');

  useEffect(() => { injectCalibrationStyles(); }, []);

  // Auto-confirm on PINCH
  useEffect(() => {
    if (
      gestureType === 'PINCH' &&
      prevGestureRef.current !== 'PINCH' &&
      currentLandmarks
    ) {
      onConfirm(currentLandmarks);
    }
    prevGestureRef.current = gestureType ?? 'NONE';
  }, [gestureType, currentLandmarks, onConfirm]);

  if (calibrationStep === 0 || calibrationStep === 4) return null;

  const stepIdx = calibrationStep - 1;
  const step = STEP_CONFIGS[stepIdx];
  const instructionParts = step.desc.split(/(TOP-LEFT|TOP-RIGHT|BOTTOM-LEFT|BOTTOM-RIGHT)/);

  return (
    <div className="calib-overlay">
      {/* Header */}
      <div className="calib-header">
        <div className="calib-title">M87 AIR COMMAND — CALIBRATION</div>
        <div className="calib-step-indicator">Step {calibrationStep} of 4</div>
      </div>

      {/* Corner target */}
      <div className="calib-target" style={step.corner as React.CSSProperties}>
        <div className="calib-target__ring" />
        <div className="calib-target__crosshair" />
        <div className="calib-target__dot" />
      </div>

      {/* Center content */}
      <div className="calib-center-content" key={calibrationStep}>
        {/* Progress dots */}
        <div className="calib-progress-dots">
          {[1, 2, 3, 4].map(n => (
            <div
              key={n}
              className={`calib-dot ${n === calibrationStep ? 'active' : n < calibrationStep ? 'done' : ''}`}
            />
          ))}
        </div>

        {/* Instruction */}
        <div className="calib-instruction">
          {instructionParts.map((part, i) =>
            ['TOP-LEFT', 'TOP-RIGHT', 'BOTTOM-LEFT', 'BOTTOM-RIGHT'].includes(part)
              ? <strong key={i}>{part}</strong>
              : <span key={i}>{part}</span>
          )}
        </div>

        <div className="calib-pinch-hint">or pinch to confirm</div>

        {/* Actions */}
        <div className="calib-actions">
          <button
            className="calib-btn-confirm"
            onClick={() => currentLandmarks && onConfirm(currentLandmarks)}
          >
            CONFIRM
          </button>
          <button className="calib-btn-skip" onClick={onSkip}>
            SKIP CALIBRATION
          </button>
        </div>
      </div>
    </div>
  );
}

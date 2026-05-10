import React, { useCallback, useEffect } from 'react';
import { AirModeConfig } from './types';

interface AirModeSettingsProps {
  config: AirModeConfig;
  onConfigChange: (config: AirModeConfig) => void;
  onStartCalibration: () => void;
  onResetCalibration: () => void;
  onClose: () => void;
  hasCalibration: boolean;
}

const SETTINGS_STYLES_ID = 'air-settings-styles';

function injectSettingsStyles() {
  if (document.getElementById(SETTINGS_STYLES_ID)) return;
  const style = document.createElement('style');
  style.id = SETTINGS_STYLES_ID;
  style.textContent = `
    @keyframes settings-appear {
      from { opacity: 0; transform: translateY(12px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .air-settings-panel {
      position: fixed;
      bottom: 80px;
      right: 24px;
      width: 300px;
      background: rgba(0, 0, 0, 0.90);
      border: 1px solid rgba(0, 180, 255, 0.2);
      border-radius: 6px;
      z-index: 9999990;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      animation: settings-appear 0.3s ease forwards;
      backdrop-filter: blur(16px);
      box-shadow: 0 0 40px rgba(0, 0, 0, 0.6), 0 0 1px rgba(0, 180, 255, 0.3) inset;
      font-family: 'Inter', 'SF Pro Display', system-ui, sans-serif;
    }
    .air-settings__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .air-settings__title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3em;
      color: rgba(0, 180, 255, 0.9);
      text-transform: uppercase;
    }
    .air-settings__close {
      width: 24px;
      height: 24px;
      border-radius: 3px;
      border: 1px solid rgba(255,255,255,0.12);
      background: transparent;
      color: rgba(255,255,255,0.4);
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .air-settings__close:hover {
      border-color: rgba(255,255,255,0.3);
      color: rgba(255,255,255,0.8);
    }
    .air-settings__divider {
      height: 1px;
      background: rgba(255,255,255,0.06);
    }
    .air-settings__group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .air-settings__label-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .air-settings__label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2em;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
    }
    .air-settings__value {
      font-size: 11px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: #00b4ff;
      letter-spacing: 0.05em;
    }
    .air-settings__slider {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 2px;
      border-radius: 1px;
      background: rgba(255,255,255,0.1);
      outline: none;
      cursor: pointer;
    }
    .air-settings__slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #00b4ff;
      box-shadow: 0 0 8px rgba(0, 180, 255, 0.7);
      cursor: pointer;
      transition: box-shadow 0.15s ease;
    }
    .air-settings__slider::-webkit-slider-thumb:hover {
      box-shadow: 0 0 14px rgba(0, 180, 255, 1);
    }
    .air-settings__slider::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border: none;
      border-radius: 50%;
      background: #00b4ff;
      box-shadow: 0 0 8px rgba(0, 180, 255, 0.7);
      cursor: pointer;
    }
    .air-settings__actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .air-settings__btn {
      width: 100%;
      padding: 9px 0;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.18s ease;
    }
    .air-settings__btn--primary {
      background: rgba(0, 180, 255, 0.1);
      border: 1px solid rgba(0, 180, 255, 0.5);
      color: #00b4ff;
    }
    .air-settings__btn--primary:hover {
      background: rgba(0, 180, 255, 0.2);
      box-shadow: 0 0 12px rgba(0, 180, 255, 0.3);
    }
    .air-settings__btn--ghost {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.3);
    }
    .air-settings__btn--ghost:hover {
      border-color: rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.55);
    }
    .air-settings__hint {
      font-size: 10px;
      letter-spacing: 0.15em;
      color: rgba(255,255,255,0.2);
      text-align: center;
      text-transform: uppercase;
    }
    .air-settings__calib-badge {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: rgba(0, 255, 140, 0.8);
      text-transform: uppercase;
    }
  `;
  document.head.appendChild(style);
}

const CONFIG_STORAGE_KEY = 'm87_air_config';

function saveConfig(config: AirModeConfig) {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch { /* ignore */ }
}

export function AirModeSettings({
  config,
  onConfigChange,
  onStartCalibration,
  onResetCalibration,
  onClose,
  hasCalibration,
}: AirModeSettingsProps) {
  useEffect(() => { injectSettingsStyles(); }, []);

  const handleSmoothing = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...config, smoothingFactor: parseFloat(e.target.value) };
    onConfigChange(next);
    saveConfig(next);
  }, [config, onConfigChange]);

  const handleSpeed = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const next = { ...config, cursorSpeedMultiplier: parseFloat(e.target.value) };
    onConfigChange(next);
    saveConfig(next);
  }, [config, onConfigChange]);

  return (
    <div className="air-settings-panel">
      {/* Header */}
      <div className="air-settings__header">
        <span className="air-settings__title">Air Command Settings</span>
        <button className="air-settings__close" onClick={onClose}>✕</button>
      </div>

      <div className="air-settings__divider" />

      {/* Smoothing */}
      <div className="air-settings__group">
        <div className="air-settings__label-row">
          <span className="air-settings__label">Cursor Smoothing</span>
          <span className="air-settings__value">{config.smoothingFactor.toFixed(2)}</span>
        </div>
        <input
          className="air-settings__slider"
          type="range"
          min={0.15}
          max={0.3}
          step={0.01}
          value={config.smoothingFactor}
          onChange={handleSmoothing}
        />
      </div>

      {/* Speed */}
      <div className="air-settings__group">
        <div className="air-settings__label-row">
          <span className="air-settings__label">Pointer Speed</span>
          <span className="air-settings__value">{config.cursorSpeedMultiplier.toFixed(2)}×</span>
        </div>
        <input
          className="air-settings__slider"
          type="range"
          min={0.8}
          max={1.5}
          step={0.05}
          value={config.cursorSpeedMultiplier}
          onChange={handleSpeed}
        />
      </div>

      <div className="air-settings__divider" />

      {/* Calibration actions */}
      <div className="air-settings__actions">
        <div className="air-settings__label-row" style={{ marginBottom: -4 }}>
          <span className="air-settings__label">Calibration</span>
          {hasCalibration && (
            <span className="air-settings__calib-badge">● ACTIVE</span>
          )}
        </div>
        <button
          className="air-settings__btn air-settings__btn--primary"
          onClick={() => { onStartCalibration(); onClose(); }}
        >
          {hasCalibration ? 'Recalibrate' : 'Start Calibration'}
        </button>
        {hasCalibration && (
          <button className="air-settings__btn air-settings__btn--ghost" onClick={onResetCalibration}>
            Reset Calibration
          </button>
        )}
      </div>

      <div className="air-settings__divider" />

      <div className="air-settings__hint">Press ESC to exit Air Mode</div>
    </div>
  );
}

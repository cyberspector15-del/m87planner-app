import React, { useEffect } from 'react';

interface AirModeControlsProps {
  isReady: boolean;
  airModeActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

const STYLES_ID = 'air-mode-controls-styles';

function injectControlStyles() {
  if (document.getElementById(STYLES_ID)) return;
  const style = document.createElement('style');
  style.id = STYLES_ID;
  style.textContent = `
    @keyframes air-control-pulse {
      0%, 100% { border-top-color: rgba(255, 255, 255, 0.4); box-shadow: 0 -4px 12px rgba(255,255,255,0.0); }
      50%      { border-top-color: rgba(255, 255, 255, 1); box-shadow: 0 -4px 12px rgba(255,255,255,0.4); }
    }
    @keyframes air-dot-pulse {
      0%, 100% { opacity: 0.3; transform: scale(0.9); }
      50%      { opacity: 1; transform: scale(1.1); box-shadow: 0 0 8px rgba(255,255,255,0.8); }
    }
    .air-controls-wrapper {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      gap: 12px;
      align-items: center;
      max-width: 220px;
    }
    .air-control-btn {
      background: #000;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.6);
      border-radius: 2px;
      padding: 8px 16px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .air-control-btn:hover {
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.2);
    }
    .air-control-btn:active {
      transform: scale(0.96);
    }
    .air-control-btn.active-state {
      border-top: 2px solid white;
      animation: air-control-pulse 3s ease-in-out infinite;
    }
    .air-control-btn.btn-stop {
      border-color: rgba(255, 255, 255, 0.3);
      color: rgba(255, 255, 255, 0.7);
    }
    .air-control-btn.btn-stop:hover {
      border-color: rgba(255, 255, 255, 0.6);
      color: #fff;
    }
    .air-active-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #fff;
      animation: air-dot-pulse 2s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

export function AirModeControls({
  isReady,
  airModeActive,
  onStart,
  onStop,
}: AirModeControlsProps) {
  useEffect(() => { injectControlStyles(); }, []);

  return (
    <div className="air-controls-wrapper">
      <button
        className={`air-control-btn ${airModeActive ? 'active-state' : ''}`}
        onClick={onStart}
      >
        {airModeActive && <div className="air-active-dot" />}
        {isReady ? 'AIR MODE' : 'INITIALIZING...'}
      </button>

      {isReady && (
        <button className="air-control-btn btn-stop" onClick={onStop}>
          STOP
        </button>
      )}
    </div>
  );
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export type GestureType = "NONE" | "PINCH" | "OPEN_PALM" | "FIST" | "TWO_FINGER_SCROLL";

export interface CalibrationBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface AirModeConfig {
  smoothingFactor: number;       // 0.15–0.3, default 0.20
  cursorSpeedMultiplier: number; // 0.8–1.5, default 1.0
  calibration: CalibrationBounds | null;
}

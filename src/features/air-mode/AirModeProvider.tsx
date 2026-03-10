/**
 * M87 Air Command — AirModeProvider
 * Updated: Phase 2 Pointer Engine + main-thread MediaPipe
 */

import React, { createContext, useContext } from "react";
import { useHandTracking } from "./useHandTracking";
import { usePointerEngine } from "./usePointerEngine";
import { AirCursor } from "./AirCursor";
import type { HandLandmark } from "./types";

// ─── Context Definition ───────────────────────────────────────────────────────

interface AirModeContextValue {
    handLandmarks: HandLandmark[] | null;
    handDetected: boolean;
    isWorkerReady: boolean;
    videoRef: React.RefObject<HTMLVideoElement>;
    startTracking: () => Promise<void>;
    stopTracking: () => void;
    cursorX: number;
    cursorY: number;
    cursorVisible: boolean;
}

const AirModeContext = createContext<AirModeContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AirModeProvider({ children }: { children: React.ReactNode }) {
    const {
        videoRef,
        canvasRef,
        handLandmarks,
        handDetected,
        isWorkerReady,
        startTracking,
        stopTracking,
    } = useHandTracking();

    const { cursorX, cursorY, cursorVisible } = usePointerEngine(
        handLandmarks,
        handDetected
    );

    return (
        <AirModeContext.Provider
            value={{
                handLandmarks,
                handDetected,
                isWorkerReady,
                videoRef,
                startTracking,
                stopTracking,
                cursorX,
                cursorY,
                cursorVisible,
            }}
        >
            {children}

            {/* Cinematic cursor overlay */}
            <AirCursor x={cursorX} y={cursorY} visible={cursorVisible} />

            {/* Video preview for debugging: pinned to bottom left so user can see if camera is working */}
            <video
                ref={videoRef}
                style={{
                    position: "fixed",
                    bottom: "20px",
                    left: "20px",
                    width: "240px",
                    height: "180px",
                    zIndex: 999999,
                    border: "2px solid red",
                    borderRadius: "8px",
                    backgroundColor: "#000",
                    transform: "scaleX(-1)" // Mirror the video for natural feel
                }}
                playsInline
                muted
                aria-hidden="true"
            />
        </AirModeContext.Provider>
    );
}

// ─── Consumer Hook ────────────────────────────────────────────────────────────

export function useAirMode(): AirModeContextValue {
    const ctx = useContext(AirModeContext);
    if (!ctx) {
        throw new Error("useAirMode must be used inside <AirModeProvider>.");
    }
    return ctx;
}

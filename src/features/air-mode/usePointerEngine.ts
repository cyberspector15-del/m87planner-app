/**
 * M87 Air Command — usePointerEngine Hook
 * Phase 2: Pointer Engine
 *
 * Converts raw hand landmarks into a smoothed screen-space cursor position.
 *
 * Pipeline:
 *   Landmarks (normalized 0-1)
 *   → midpoint of index tip (8) + middle tip (12)
 *   → map to screen pixels
 *   → LERP smoothing at ~60 FPS via requestAnimationFrame
 *   → cursorX, cursorY, cursorVisible
 *
 * CRITICAL PERF NOTE:
 *   All animation happens inside a ref-based RAF loop.
 *   React state is only updated once per ~16 ms frame via a dirty flag,
 *   so the component re-render budget is minimal.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import type { HandLandmark } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

/** LERP factor: higher = snappier, lower = more cinematic glide */
const SMOOTHING_FACTOR = 0.18;

/** Ignore target deltas smaller than this (pixels) to kill micro-jitter */
const JITTER_THRESHOLD_PX = 1;

/** Landmark indices we care about */
const INDEX_TIP = 8;
const MIDDLE_TIP = 12;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PointerEngineState {
    cursorX: number;
    cursorY: number;
    cursorVisible: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePointerEngine(
    handLandmarks: HandLandmark[] | null,
    handDetected: boolean
): PointerEngineState {
    // Smoothed cursor — updated via RAF loop, drives React state
    const smoothedX = useRef(0);
    const smoothedY = useRef(0);

    // Target position derived from landmarks — written by landmark effect
    const targetX = useRef(0);
    const targetY = useRef(0);

    // Frame handle
    const rafRef = useRef<number | null>(null);

    // React-visible state (updated once per frame when changed)
    const [cursorX, setCursorX] = useState(0);
    const [cursorY, setCursorY] = useState(0);
    const [cursorVisible, setCursorVisible] = useState(false);

    // ─── Update target from landmarks ─────────────────────────────────────────

    useEffect(() => {
        if (!handLandmarks || handLandmarks.length < 13) return;

        const indexTip = handLandmarks[INDEX_TIP];
        const middleTip = handLandmarks[MIDDLE_TIP];

        // Midpoint in normalized space
        const midX = (indexTip.x + middleTip.x) / 2;
        const midY = (indexTip.y + middleTip.y) / 2;

        // Map to screen space
        const screenX = midX * window.innerWidth;
        const screenY = midY * window.innerHeight;

        // Jitter filter: skip if the movement is too tiny
        const dx = screenX - targetX.current;
        const dy = screenY - targetY.current;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= JITTER_THRESHOLD_PX) {
            targetX.current = screenX;
            targetY.current = screenY;
        }
    }, [handLandmarks]);

    // ─── Animation Loop ────────────────────────────────────────────────────────

    const animationLoop = useCallback(() => {
        // LERP smoothed position toward target
        const newX = smoothedX.current + (targetX.current - smoothedX.current) * SMOOTHING_FACTOR;
        const newY = smoothedY.current + (targetY.current - smoothedY.current) * SMOOTHING_FACTOR;

        smoothedX.current = newX;
        smoothedY.current = newY;

        // Push rounded pixel values to React state (avoids sub-pixel thrashing)
        setCursorX(Math.round(newX));
        setCursorY(Math.round(newY));

        rafRef.current = requestAnimationFrame(animationLoop);
    }, []);

    // ─── Start / stop loop based on hand presence ──────────────────────────────

    useEffect(() => {
        if (handDetected) {
            setCursorVisible(true);

            // Kick off animation loop if not already running
            if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(animationLoop);
            }
        } else {
            // Hide cursor when no hand
            setCursorVisible(false);

            // Stop the loop (saves GPU/CPU when inactive)
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        }

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [handDetected, animationLoop]);

    return { cursorX, cursorY, cursorVisible };
}

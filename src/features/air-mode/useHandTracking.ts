/**
 * M87 Air Command — useHandTracking Hook
 * Phase 1: Hand Tracking Core (Main Thread Edition)
 *
 * Runs MediaPipe Hands directly on the main thread via a hidden canvas.
 * No Web Worker — we load the Hands script from CDN and process frames here.
 *
 * Why no worker? @mediapipe/hands internally calls importScripts() which
 * is incompatible with any modern ES Module worker bundler (including Vite).
 * Running on the main thread is perfectly fine for 30fps hand tracking.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Hands, Results } from "@mediapipe/hands";
import type { HandLandmark, WorkerOutgoingMessage } from "./types";

const TARGET_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const NO_HAND_TIMEOUT_MS = 2000;

export interface UseHandTrackingReturn {
    videoRef: React.RefObject<HTMLVideoElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    handLandmarks: HandLandmark[] | null;
    handDetected: boolean;
    isWorkerReady: boolean;
    startTracking: () => Promise<void>;
    stopTracking: () => void;
}

export function useHandTracking(): UseHandTrackingReturn {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const handsRef = useRef<Hands | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(0);
    const noHandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isProcessingRef = useRef(false);

    const [handLandmarks, setHandLandmarks] = useState<HandLandmark[] | null>(null);
    const [handDetected, setHandDetected] = useState(false);
    const [isWorkerReady, setIsWorkerReady] = useState(false);

    // ─── MediaPipe Results Handler ────────────────────────────────────────────

    const onResults = useCallback((results: Results) => {
        isProcessingRef.current = false;

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            if (noHandTimerRef.current) {
                clearTimeout(noHandTimerRef.current);
                noHandTimerRef.current = null;
            }
            const landmarks: HandLandmark[] = results.multiHandLandmarks[0].map((lm) => ({
                x: lm.x,
                y: lm.y,
                z: lm.z,
            }));
            setHandDetected(true);
            setHandLandmarks(landmarks);
            console.log("[AirCommand] Hand landmarks:", landmarks);
        } else {
            if (!noHandTimerRef.current) {
                noHandTimerRef.current = setTimeout(() => {
                    setHandDetected(false);
                    setHandLandmarks(null);
                    noHandTimerRef.current = null;
                }, NO_HAND_TIMEOUT_MS);
            }
        }
    }, []);

    // ─── Frame Capture Loop ────────────────────────────────────────────────────

    const captureLoop = useCallback((timestamp: number) => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const hands = handsRef.current;

        if (!video || !canvas || !hands || !isWorkerReady) {
            rafRef.current = requestAnimationFrame(captureLoop);
            return;
        }

        // Throttle to ~30 FPS
        if (timestamp - lastFrameTimeRef.current < FRAME_INTERVAL_MS) {
            rafRef.current = requestAnimationFrame(captureLoop);
            return;
        }
        lastFrameTimeRef.current = timestamp;

        // Only capture when video is streaming
        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || isProcessingRef.current) {
            rafRef.current = requestAnimationFrame(captureLoop);
            return;
        }

        // Draw video to canvas first (fixes silent MediaPipe failures)
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            rafRef.current = requestAnimationFrame(captureLoop);
            return;
        }

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        isProcessingRef.current = true;

        hands.send({ image: canvas }).then(() => {
            // Success, isProcessingRef is reset in onResults
        }).catch((err) => {
            console.error("[HandTracking] Frame send error:", err);
            isProcessingRef.current = false;
        });

        rafRef.current = requestAnimationFrame(captureLoop);
    }, [isWorkerReady]);

    // ─── Start Tracking ───────────────────────────────────────────────────────

    const startTracking = useCallback(async () => {
        // 1. Request webcam
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false,
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Important: MUST set inline styles/attributes for MediaPipe to read it correctly if passed directly
                videoRef.current.width = 640;
                videoRef.current.height = 480;
                await videoRef.current.play();
                console.log("[AirCommand] Webcam stream started.");
            }
        } catch (err) {
            console.error("[AirCommand] Failed to access webcam:", err);
            return;
        }

        // 2. Initialize MediaPipe Hands on the main thread
        const hands = new Hands({
            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7,
        });

        hands.onResults(onResults);

        try {
            await hands.initialize();
            handsRef.current = hands;
            setIsWorkerReady(true);
            console.log("[AirCommand] MediaPipe Hands initialized.");
        } catch (err) {
            console.error("[AirCommand] MediaPipe init failed:", err);
            return;
        }

        // 3. Start frame loop
        rafRef.current = requestAnimationFrame(captureLoop);
    }, [onResults, captureLoop]);

    // ─── Stop Tracking ────────────────────────────────────────────────────────

    const stopTracking = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        if (handsRef.current) {
            handsRef.current.close();
            handsRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }

        setHandDetected(false);
        setHandLandmarks(null);
        setIsWorkerReady(false);
        isProcessingRef.current = false;

        console.log("[AirCommand] Tracking stopped.");
    }, []);

    // ─── Restart loop if isWorkerReady changes ─────────────────────────────────

    useEffect(() => {
        if (isWorkerReady && rafRef.current === null) {
            rafRef.current = requestAnimationFrame(captureLoop);
        }
    }, [isWorkerReady, captureLoop]);

    // ─── Cleanup on unmount ───────────────────────────────────────────────────

    useEffect(() => {
        return () => {
            stopTracking();
            if (noHandTimerRef.current) clearTimeout(noHandTimerRef.current);
        };
    }, [stopTracking]);

    return {
        videoRef,
        canvasRef,
        handLandmarks,
        handDetected,
        isWorkerReady,
        startTracking,
        stopTracking,
    };
}

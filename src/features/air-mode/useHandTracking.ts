import { useCallback, useRef, useState } from 'react';
declare const Hands: any;
type Results = any;
import { HandLandmark } from './types';

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [handLandmarks, setHandLandmarks] = useState<HandLandmark[]>([]);
  const [handDetected, setHandDetected] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handsRef = useRef<Hands | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);

  const handDetectedRef = useRef(false);

  const onResults = useCallback((results: Results) => {
    setIsReady(true);
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Filter low-confidence detections
      const confidence = results.multiHandedness?.[0]?.score ?? 1;
      if (confidence < 0.75) {
        // Treat as no hand — fall through to the else branch
        if (handDetectedRef.current && timeoutRef.current === null) {
          timeoutRef.current = window.setTimeout(() => {
            setHandDetected(false);
            handDetectedRef.current = false;
            timeoutRef.current = null;
          }, 2000);
        }
        return;
      }

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      const landmarks = results.multiHandLandmarks[0].map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
      }));
      setHandLandmarks(landmarks);
      if (!handDetectedRef.current) {
        setHandDetected(true);
        handDetectedRef.current = true;
      }
    } else {
      if (handDetectedRef.current && timeoutRef.current === null) {
        timeoutRef.current = window.setTimeout(() => {
          setHandDetected(false);
          handDetectedRef.current = false;
          timeoutRef.current = null;
        }, 2000);
      }
    }
  }, []);

  const sendFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const hands = handsRef.current;

    if (!video || !canvas || !hands) {
      animationRef.current = requestAnimationFrame(sendFrame);
      return;
    }

    const now = performance.now();
    // Throttle to ~30 FPS (every ~33.3ms)
    if (now - lastTimeRef.current >= 33.3) {
      lastTimeRef.current = now;

      // Ensure dimensions match
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext('2d');
      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          await hands.send({ image: canvas });
        } catch (error) {
          console.error("[AirCommand] Error processing hands.send:", error);
        }
      }
    }
    
    animationRef.current = requestAnimationFrame(sendFrame);
  }, []);

  const startTracking = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(onResults);
      await hands.initialize();
      handsRef.current = hands;

      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(sendFrame);
    } catch (error) {
      console.error("[AirCommand] Failed to start tracking:", error);
    }
  }, [onResults, sendFrame]);

  const stopTracking = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setHandLandmarks([]);
    setHandDetected(false);
    handDetectedRef.current = false;
    setIsReady(false);
  }, []);

  return {
    videoRef,
    canvasRef,
    handLandmarks,
    handDetected,
    isReady,
    startTracking,
    stopTracking,
  };
}

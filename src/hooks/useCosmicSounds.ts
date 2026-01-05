import { useCallback, useRef, useState } from "react";

// Cosmic sound effects using Web Audio API
export const useCosmicSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cosmic-sounds-muted") === "true";
    }
    return false;
  });

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev;
      localStorage.setItem("cosmic-sounds-muted", String(newValue));
      return newValue;
    });
  }, []);

  // Soft ambient hum - plays when overlay starts
  const playInitiate = useCallback(() => {
    if (isMuted) return;

    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Create oscillators for layered cosmic sound
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Low rumble
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(80, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.8);

      // High shimmer
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(880, now + 0.5);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2000, now);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.15, now + 0.1);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 1);

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.05, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc1.connect(gain1).connect(filter).connect(ctx.destination);
      osc2.connect(gain2).connect(filter).connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 0.8);
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, isMuted]);

  // Soft tick for status message change
  const playTick = useCallback(() => {
    if (isMuted) return;

    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, isMuted]);

  // Triumphant chord for completion
  const playComplete = useCallback(() => {
    if (isMuted) return;

    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Major chord frequencies (C-E-G-C)
      const frequencies = [261.63, 329.63, 392.0, 523.25];

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.05 + i * 0.03);
        gain.gain.setValueAtTime(0.1, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + 1.8);
      });
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, isMuted]);

  return {
    playInitiate,
    playTick,
    playComplete,
    isMuted,
    toggleMute,
  };
};

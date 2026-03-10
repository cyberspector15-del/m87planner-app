/**
 * M87 Air Command — AirCursor Component
 * Phase 2: Pointer Engine
 *
 * A fixed-position overlay that renders the virtual cursor.
 * Phase 2: simple glowing dot — replaced with black hole design in Phase 5.
 *
 * CRITICAL CSS RULES:
 *   - pointer-events: none → never blocks real mouse/touch
 *   - z-index: 999999      → always on top of everything
 *   - transform: translate3d → GPU-accelerated position updates
 */

import React from "react";

interface AirCursorProps {
    x: number;
    y: number;
    visible: boolean;
}

export function AirCursor({ x, y, visible }: AirCursorProps) {
    return (
        <div
            aria-hidden="true"
            style={{
                // ── Positioning layer ──────────────────────────────────────────────
                position: "fixed",
                top: 0,
                left: 0,
                // Move relative to top-left origin; -10px centers the 20px dot
                transform: `translate3d(${x - 10}px, ${y - 10}px, 0)`,

                // ── Visibility ─────────────────────────────────────────────────────
                opacity: visible ? 1 : 0,
                // Fade in/out smoothly when hand appears or disappears
                transition: "opacity 0.35s ease",

                // ── Stacking ───────────────────────────────────────────────────────
                zIndex: 999999,
                pointerEvents: "none" as const,

                // ── Cursor dot visual (Phase 2 placeholder) ────────────────────────
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.95)",
                boxShadow: [
                    "0 0 8px 2px rgba(255, 255, 255, 0.9)",
                    "0 0 20px 4px rgba(180, 220, 255, 0.6)",
                    "0 0 40px 6px rgba(100, 160, 255, 0.3)",
                ].join(", "),

                // ── Smooth position transition driven by RAF — NOT CSS transition ──
                // (RAF + LERP handles movement; CSS transition only for opacity above)
                willChange: "transform, opacity",
            }}
        />
    );
}

import CosmicBackground from "@/components/CosmicBackground";
import Header from "@/components/Header";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Warning, Pulse, X } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { CommitModal } from "@/components/CommitModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useFlux } from "../hooks/useFlux";

interface SimulateProps {
  /** Mobile shell uses its own header; desktop keeps Header by default. */
  hideHeader?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════
   SIMULATE V8 — Cinematic Animation Layer
   All easing: ease-out or cubic-bezier only. Zero spring. Zero bounce.
   API: /nvidia-api/v1/chat/completions (meta/llama-3.3-70b-instruct)
   Key: VITE_NVIDIA_API_KEY
═══════════════════════════════════════════════════════════════════ */

/* ─── Cyan Smoke Generator Component ─── */
const CyanSmoke = ({ revealed, full, label }: { revealed: string; full: string; label?: string }) => {
  const isTyping = revealed.length > 0 && revealed.length < full.length;
  const glowLength = 10;

  const recentChars = isTyping ? revealed.slice(Math.max(0, revealed.length - glowLength)) : "";
  const olderChars = isTyping ? revealed.slice(0, Math.max(0, revealed.length - glowLength)) : revealed;

  const renderText = (text: string) => {
    if (!label) return text;
    const parts = text.split(new RegExp(`(${label})`, "gi"));
    return parts.map((part, idx) =>
      part.toUpperCase() === label.toUpperCase()
        ? <span key={idx} className="text-amber-400 font-medium">{part}</span>
        : <span key={idx}>{part}</span>
    );
  };

  return (
    <>
      <span className="typed-old" style={{
        color: "inherit",
        transition: "text-shadow 0.6s ease-out, color 0.6s ease-out"
      }}>
        {renderText(olderChars)}
      </span>
      <span className="typed-glow" style={{
        color: recentChars ? "rgba(255,255,255,1)" : "inherit",
        textShadow: recentChars ? "0 0 8px rgba(0, 212, 255, 0.9), 0 0 16px rgba(0, 212, 255, 0.5), 0 0 32px rgba(0, 212, 255, 0.2)" : "none",
        transition: "text-shadow 0.6s ease-out, color 0.6s ease-out"
      }}>
        {renderText(recentChars)}
      </span>
      {isTyping && (
        <span className="sim-cursor-blink ml-px" style={{ color: "rgba(255,255,255,0.4)" }}>▌</span>
      )}
    </>
  );
};

/* ─── TypeScript interfaces (UNCHANGED) ─── */
interface Branch {
  id: string;
  label: string;
  descriptor: string;
  probability: number;
  risks: string[];
  opportunityCost: string;
  compounding: { oneMonth: string; sixMonths: string; oneYear: string };
  signalStrength: number;
}
interface SimulationResult {
  branches: Branch[];
  recommendedTrajectory: { recommendedId: string; reasoning: string };
}

/* ─── System prompt (UNCHANGED) ─── */
const SYSTEM_PROMPT = `You are the Consequence Simulator — a cold, analytical strategic intelligence AI embedded inside M87 Planner. Your job is to model diverging future timelines for any decision a user inputs.

You must respond ONLY with a valid JSON object. No preamble. No explanation. No markdown. Raw JSON only.

The JSON structure must be exactly:
{
  "branches": [
    {
      "id": "alpha",
      "label": "TIMELINE ALPHA",
      "descriptor": "one line describing this path",
      "probability": 73,
      "risks": [
        "risk one as a full sentence",
        "risk two as a full sentence"
      ],
      "opportunityCost": "one to two sentences describing what this path sacrifices",
      "compounding": {
        "oneMonth": "what happens in 1 month on this path",
        "sixMonths": "what happens in 6 months on this path",
        "oneYear": "what happens in 1 year on this path"
      },
      "signalStrength": 4
    }
  ],
  "recommendedTrajectory": {
    "recommendedId": "alpha",
    "reasoning": "2-3 sentences of cold analytical reasoning for why this path is recommended. Reference the timeline label by name."
  }
}

Rules:
- Generate 2, 3, or 4 branches depending on decision complexity
- branch ids must be: alpha, beta, gamma, delta (in order)
- probability values must sum to 100 across all branches
- signalStrength is 1-5 (proportional to probability)
- All text must be analytical, cold, precise — no motivational language, no emotional framing
- recommendedId must match one of the branch ids exactly
- Return ONLY the JSON. Nothing else.`;

/* ─── NVIDIA NIM API call (UNCHANGED) ─── */
async function callNvidiaAPI(decision: string): Promise<SimulationResult> {
  const apiKey = import.meta.env.VITE_NVIDIA_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") throw new Error("API_KEY_NOT_CONFIGURED");

  const userMessage = `Analyze this decision and generate diverging timeline branches:\n\n${decision}\n\nReturn the full JSON intelligence brief.`;
  const response = await fetch("/nvidia-api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "meta/llama-3.3-70b-instruct",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      max_tokens: 2000,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("API_KEY_NOT_CONFIGURED");
    throw new Error(`API_ERROR:${response.status}`);
  }

  const data = await response.json();
  const rawContent: string = data?.choices?.[0]?.message?.content ?? "";
  if (!rawContent) throw new Error("EMPTY_RESPONSE");

  const cleaned = rawContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
  let parsed: SimulationResult;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("PARSE_FAILURE");
    parsed = JSON.parse(m[0]);
  }
  if (!parsed.branches || !Array.isArray(parsed.branches) || parsed.branches.length === 0)
    throw new Error("PARSE_FAILURE");
  return parsed;
}

/* ─── Segment builder (UNCHANGED) ─── */
const ACCENT_OPACITIES = [0.18, 0.08, 0.05, 0.03];
type Segment = { key: string; text: string };
function buildSegments(result: SimulationResult): Segment[] {
  const segs: Segment[] = [];
  for (const branch of result.branches) {
    segs.push({ key: `desc-${branch.id}`, text: branch.descriptor });
    branch.risks.forEach((r, i) => segs.push({ key: `risk-${branch.id}-${i}`, text: r }));
    segs.push({ key: `opp-${branch.id}`, text: branch.opportunityCost });
    segs.push({ key: `comp-${branch.id}-1m`, text: branch.compounding.oneMonth });
    segs.push({ key: `comp-${branch.id}-6m`, text: branch.compounding.sixMonths });
    segs.push({ key: `comp-${branch.id}-1y`, text: branch.compounding.oneYear });
  }
  segs.push({ key: "reasoning", text: result.recommendedTrajectory.reasoning });
  return segs;
}

/* ══════════════════════════════════════════════════════
   ANIMATION UTILITIES
══════════════════════════════════════════════════════ */

/* Mobile: reduce durations 30%, disable blur */
const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
const d = (base: number) => (isMobile ? base * 0.7 : base);
const blurVal = (px: number) => (isMobile ? 0 : px);

/* Reusable ease */
const EASE_OUT = "easeOut" as const;

/* ── Ambient orb: slow drifting radial gradient behind all content ── */
const AmbientOrb = () => (
  <motion.div
    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      width: "100%",
      height: 400,
      overflow: "hidden",
      background:
        "radial-gradient(ellipse 600px 300px at 50% 0%, rgba(255,255,255,0.015) 0%, transparent 70%)",
      zIndex: 0,
      pointerEvents: "none",
    }}
  />
);

/* ── Animated signal bars: left-to-right fill, staggered ── */
const AnimatedSignalBars = ({ filled, active }: { filled: number; active: boolean }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <motion.div
        key={i}
        className="h-[3px] rounded-sm"
        initial={{ scaleX: 0 }}
        animate={active ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: d(0.2), ease: EASE_OUT, delay: active ? i * 0.08 : 0 }}
        style={{
          width: 20,
          transformOrigin: "left center",
          background: i < filled ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.08)",
        }}
      />
    ))}
  </div>
);

/* ── Counting probability badge: counts from 0 → pct on activation ── */
const CountingBadge = ({ pct, active }: { pct: number; active: boolean }) => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!active) return;
    const duration = d(800);
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 2);
      setDisplayed(Math.round(eased * pct));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, pct]);

  const label = `${displayed}% Likely`;

  const baseStyle: React.CSSProperties = {
    backdropFilter: "blur(8px)",
  };

  if (pct >= 60)
    return (
      <span
        className="text-xs font-mono px-3 py-1 rounded-lg tracking-wider uppercase"
        style={{
          ...baseStyle,
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "rgba(255,255,255,0.9)",
        }}
      >
        {label}
      </span>
    );
  if (pct >= 30)
    return (
      <span
        className="text-xs font-mono px-3 py-1 rounded-lg tracking-wider uppercase"
        style={{
          ...baseStyle,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        {label}
      </span>
    );
  return (
    <span
      className="text-xs font-mono px-3 py-1 rounded-lg tracking-wider uppercase"
      style={{
        ...baseStyle,
        background: "rgba(255,80,80,0.1)",
        border: "1px solid rgba(255,80,80,0.2)",
        color: "rgba(255,80,80,0.65)",
      }}
    >
      {label}
    </span>
  );
};

/* ── Idle graphic (UNCHANGED) ── */
const IdleGraphic = () => (
  <motion.div
    className="flex flex-col items-center pt-16 pb-8"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.25 } }}
    transition={{ duration: 0.5, ease: EASE_OUT }}
    style={{ opacity: 0.5 }}
  >
    <svg width="260" height="100" viewBox="0 0 260 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="130" y1="25" x2="12" y2="95" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 4" />
      <line x1="130" y1="25" x2="130" y2="3" stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="3 4" />
      <line x1="130" y1="25" x2="248" y2="95" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 4" />
      <circle cx="12" cy="95" r="2" fill="rgba(255,255,255,0.08)" />
      <circle cx="248" cy="95" r="2" fill="rgba(255,255,255,0.08)" />
      <circle cx="130" cy="3" r="1.5" fill="rgba(255,255,255,0.06)" />
      <circle cx="130" cy="25" r="4" fill="rgb(52,211,153)" className="animate-pulse"
        style={{ filter: "drop-shadow(0 0 4px rgb(52,211,153))" }} />
    </svg>
    <p className="text-xs text-muted-foreground mt-5 tracking-[0.2em] uppercase font-mono text-center">
      Your decision architecture will appear here
    </p>
  </motion.div>
);

/* ── Radar ping: new concentric rings design ── */
const RadarPing = () => {
  const rings = [
    { size: 16, opacity: 0.8, delay: 0 },
    { size: 48, opacity: 0.4, delay: 0.5 },
    { size: 96, opacity: 0.15, delay: 1.0 },
  ];

  return (
    <motion.div
      className="flex flex-col items-center pt-16 pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: d(0.4), ease: EASE_OUT }}
    >
      {/* Rings container */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        {/* Static center anchor dot */}
        <div
          style={{
            position: "absolute",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.9)",
            zIndex: 2,
          }}
        />
        {/* Concentric expanding rings */}
        {rings.map((ring, i) => (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              width: ring.size,
              height: ring.size,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.6)",
            }}
            animate={{
              scale: [1, 2.5],
              opacity: [ring.opacity, 0],
            }}
            transition={{
              duration: d(2),
              ease: EASE_OUT,
              repeat: Infinity,
              delay: ring.delay,
              repeatDelay: 0,
            }}
          />
        ))}
      </div>

      {/* Label + sequential dots */}
      <div className="flex items-center gap-1 mt-8">
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.4)",
            fontFamily: "'Space Mono', monospace",
          }}
        >
          Analyzing Decision Variables
        </p>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="font-mono"
            style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
          >
            .
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
};

/* ── Error state (UNCHANGED) ── */
const ErrorState = ({ message }: { message: string }) => (
  <motion.div
    className="w-full mt-8 py-4 text-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3, ease: EASE_OUT }}
  >
    <p className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,80,80,0.75)" }}>
      {message}
    </p>
  </motion.div>
);

/* ══════════════════════════════════════════════════════
   BRANCH CARD — SCAN + MATERIALIZE + PHASE ANIMATION
   Phase sequence (per card, relative to mount):
     "scan"        → scan line sweeps (0.35s, + cardDelay)
     "materialize" → card fades in with blur (0.5s)
     "done"        → border grows (0.4s) + label/badge slide (0.3s)
     "active"      → counter starts, bars fill (triggered 650ms after "done")
══════════════════════════════════════════════════════ */
type CardPhase = "scan" | "materialize" | "done" | "active";

interface BranchCardProps {
  branch: Branch;
  cardDelay: number;
  leftAccentOpacity: number;
  revealedDescriptor: string;
  revealedRisks: string[];
  revealedOpportunityCost: string;
  revealedCompounding: { oneMonth: string; sixMonths: string; oneYear: string };
  setRef: (key: string) => (el: HTMLElement | null) => void;
  onCommit: (branch: Branch) => void;
  isRecommended: boolean;
}

const BranchCard = ({
  branch,
  cardDelay,
  leftAccentOpacity,
  revealedDescriptor,
  revealedRisks,
  revealedOpportunityCost,
  revealedCompounding,
  setRef,
  onCommit,
  isRecommended,
}: BranchCardProps) => {
  const [phase, setPhase] = useState<CardPhase>("scan");

  /* Transition "done" → "active" after border+badge delays resolve */
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => setPhase("active"), 650);
    return () => clearTimeout(t);
  }, [phase]);

  const isVisible = phase === "materialize" || phase === "done" || phase === "active";
  const isBorderVisible = phase === "done" || phase === "active";
  const isActive = phase === "active";

  /* Internal section stagger (fires immediately on mount; cards are
     opacity:0 during scan so these complete invisibly — desired) */
  const sd = (i: number) => cardDelay + 0.07 + 0.1 * i;

  const compoundingRows = [
    { label: "1 Month", revealed: revealedCompounding.oneMonth, segKey: `comp-${branch.id}-1m`, full: branch.compounding.oneMonth },
    { label: "6 Months", revealed: revealedCompounding.sixMonths, segKey: `comp-${branch.id}-6m`, full: branch.compounding.sixMonths },
    { label: "1 Year", revealed: revealedCompounding.oneYear, segKey: `comp-${branch.id}-1y`, full: branch.compounding.oneYear },
  ];

  return (
    <div style={{ position: "relative" }}>

      {/* ── STEP 1: Scan line (sweeps downward, disappears when done) ── */}
      {phase === "scan" && (
        <motion.div
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: 700, opacity: 0 }}
          transition={{ duration: d(0.35), ease: EASE_OUT, delay: cardDelay }}
          onAnimationComplete={() => setPhase("materialize")}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
      )}

      {/* ── STEP 2–4: Card container ── */}
      <motion.div
        className="rounded-xl"
        style={{
          position: "relative",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(8px) saturate(150%)",
          WebkitBackdropFilter: "blur(8px) saturate(150%)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
          padding: "32px",
          /* No borderLeft here — handled by absolute div below */
        }}
        initial={{ opacity: 0, y: 20, filter: `blur(${blurVal(4)}px)` }}
        animate={
          isVisible
            ? { opacity: 1, y: 0, filter: "blur(0px)" }
            : { opacity: 0, y: 20, filter: `blur(${blurVal(4)}px)` }
        }
        transition={{ duration: d(0.5), ease: EASE_OUT }}
        onAnimationComplete={() => {
          if (phase === "materialize") setPhase("done");
        }}
        whileHover={{ border: "1px solid rgba(255,255,255,0.11)" }}
      >
        {/* ── STEP 3: Left accent border grows from top ── */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={isBorderVisible ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: d(0.4), ease: EASE_OUT, delay: 0.1 }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 2,
            transformOrigin: "top center",
            background: `rgba(255,255,255,${leftAccentOpacity})`,
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
          }}
        />

        {/* ── STEP 4: Branch header — label slides from left, badge from right ── */}
        <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
          <div>
            <motion.p
              className="font-display font-semibold text-foreground tracking-wide text-base mb-1"
              initial={{ x: -10, opacity: 0 }}
              animate={isBorderVisible ? { x: 0, opacity: 1 } : { x: -10, opacity: 0 }}
              transition={{ duration: d(0.3), ease: EASE_OUT, delay: 0.65 }}
            >
              {branch.label}
            </motion.p>
            {/* Descriptor — typewriter managed by parent */}
            <p ref={setRef(`desc-${branch.id}`)} className="text-sm text-muted-foreground">
              <CyanSmoke revealed={revealedDescriptor} full={branch.descriptor} />
            </p>
          </div>

          {/* Badge slides from right, counter activates with phase */}
          <motion.div
            initial={{ x: 10, opacity: 0 }}
            animate={isBorderVisible ? { x: 0, opacity: 1 } : { x: 10, opacity: 0 }}
            transition={{ duration: d(0.3), ease: EASE_OUT, delay: 0.65 }}
          >
            <CountingBadge pct={branch.probability} active={isActive} />
          </motion.div>
        </div>

        {/* Risk Factors */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: d(0.4), ease: EASE_OUT, delay: sd(1) } } }}
          initial="hidden"
          animate="show"
          className="mb-6"
        >
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Risk Factors
          </p>
          <ul className="space-y-3">
            {branch.risks.map((r, i) => (
              <li key={i} className="flex items-start gap-3">
                <Warning size={14} weight="thin" className="shrink-0 mt-0.5" style={{ color: "rgba(255,80,80,0.7)" }} />
                <span ref={setRef(`risk-${branch.id}-${i}`)} className="text-sm text-muted-foreground leading-relaxed">
                  <CyanSmoke revealed={revealedRisks[i] ?? ""} full={r} />
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Opportunity Cost */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: d(0.4), ease: EASE_OUT, delay: sd(2) } } }}
          initial="hidden"
          animate="show"
          className="mb-6"
        >
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Opportunity Cost
          </p>
          <p ref={setRef(`opp-${branch.id}`)} className="text-sm text-muted-foreground leading-relaxed pl-4"
            style={{ borderLeft: "2px solid rgba(255,255,255,0.06)" }}>
            <CyanSmoke revealed={revealedOpportunityCost} full={branch.opportunityCost} />
          </p>
        </motion.div>

        {/* Compounding Effects */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: d(0.4), ease: EASE_OUT, delay: sd(3) } } }}
          initial="hidden"
          animate="show"
          className="mb-8"
        >
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Compounding Effects
          </p>
          <div>
            {compoundingRows.map((row, i) => (
              <div key={i} className="grid gap-4 py-3"
                style={{
                  gridTemplateColumns: "100px 1fr",
                  borderBottom: i < compoundingRows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}>
                <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground/60">{row.label}</span>
                <span ref={setRef(row.segKey)} className="text-sm text-muted-foreground leading-relaxed">
                  <CyanSmoke revealed={row.revealed} full={row.full} />
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Signal strength — animated bars fill when card is active */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: d(0.4), ease: EASE_OUT, delay: sd(4) } } }}
          initial="hidden"
          animate="show"
          className="flex items-center gap-4 pt-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <span className="font-mono text-[9px] tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
            Branch Signal Strength
          </span>
          <AnimatedSignalBars filled={branch.signalStrength} active={isActive} />
        </motion.div>

        {/* ── Commit Timeline Button ── */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: d(0.4), ease: EASE_OUT, delay: sd(5) } } }}
          initial="hidden"
          animate="show"
        >
          <button
            onClick={() => onCommit(branch)}
            className="w-full font-mono uppercase tracking-[0.1em] transition-all duration-200 pointer-events-auto"
            style={{
              marginTop: "24px",
              padding: "14px",
              background: "transparent",
              border: isRecommended ? "1px solid rgba(200,168,75,0.3)" : "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: isRecommended ? "rgba(200,168,75,0.7)" : "rgba(255,255,255,0.6)",
              fontSize: "11px",
              cursor: "pointer",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = isRecommended ? "rgba(200,168,75,0.6)" : "rgba(255,255,255,0.3)";
              e.currentTarget.style.color = isRecommended ? "rgba(200,168,75,1)" : "rgba(255,255,255,0.9)";
              e.currentTarget.style.background = isRecommended ? "rgba(200,168,75,0.03)" : "rgba(255,255,255,0.03)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = isRecommended ? "rgba(200,168,75,0.3)" : "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = isRecommended ? "rgba(200,168,75,0.7)" : "rgba(255,255,255,0.6)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Commit To This Timeline →
          </button>
        </motion.div>

      </motion.div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   INTELLIGENCE BRIEF — animated header + grand finale
══════════════════════════════════════════════════════ */
const IntelligenceBrief = ({ result, onCommit }: { result: SimulationResult, onCommit: (b: Branch) => void }) => {
  const { branches, recommendedTrajectory } = result;
  const recommendedBranch = branches.find((b) => b.id === recommendedTrajectory.recommendedId);

  /* ── Delay the green dot pulse until after header animates in ── */
  const [dotPulsing, setDotPulsing] = useState(false);

  /* ── Typewriter queue (UNCHANGED) ── */
  const segments = useMemo(() => buildSegments(result), [result]);
  const [revealedMap, setRevealedMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(segments.map((s) => [s.key, ""]))
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const charRef = useRef(0);
  const elemRefs = useRef<Record<string, HTMLElement | null>>({});
  const setRef = useCallback(
    (key: string) => (el: HTMLElement | null) => { elemRefs.current[key] = el; },
    []
  );

  useEffect(() => {
    if (currentIdx >= segments.length) {
      const el = elemRefs.current["reasoning"];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const seg = segments[currentIdx];
    charRef.current = 0;
    const scrollTarget = elemRefs.current[seg.key];
    if (scrollTarget) scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" });
    const id = setInterval(() => {
      charRef.current += 1;
      const revealed = seg.text.slice(0, charRef.current);
      setRevealedMap((prev) => ({ ...prev, [seg.key]: revealed }));
      if (charRef.current >= seg.text.length) {
        clearInterval(id);
        setCurrentIdx((idx) => idx + 1);
      }
    }, 18);
    return () => clearInterval(id);
  }, [currentIdx, segments]);

  /* ── Reasoning text with amber label highlight (UNCHANGED) ── */
  const revealedReasoning = revealedMap["reasoning"] ?? "";
  const renderReasoning = () => {
    if (!recommendedBranch) return <CyanSmoke revealed={revealedReasoning} full={result.recommendedTrajectory.reasoning} />;
    return <CyanSmoke revealed={revealedReasoning} full={result.recommendedTrajectory.reasoning} label={recommendedBranch.label} />;
  };

  /* ── Grand finale delay: after all branch cards reveal ── */
  const recommendedDelay = 0.4 + branches.length * 0.3 + 0.4;

  return (
    <div className="w-full mt-16 text-left">

      {/* ── SIMULATION ACTIVE header row: slides in from top ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: d(0.5), ease: EASE_OUT }}
        onAnimationComplete={() => setDotPulsing(true)}
      >
        <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2 h-2 rounded-full bg-emerald-400"
              style={{
                boxShadow: "0 0 8px rgb(52,211,153)",
                animation: dotPulsing ? "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" : "none",
              }}
            />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-emerald-400">
              Simulation Active
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/40">
            {branches.length} Timeline Branch{branches.length !== 1 ? "es" : ""} Identified
          </span>
        </div>

        {/* Separator: scaleX 0 → 1 from left */}
        <motion.div
          className="w-full h-px mb-10"
          style={{
            background: "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02), transparent)",
            transformOrigin: "left center",
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: d(0.8), ease: EASE_OUT, delay: 0.5 }}
        />
      </motion.div>

      {/* ── Branch cards: staggered scan+materialize sequence ── */}
      <div className="flex flex-col gap-3">
        {branches.map((branch, idx) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            cardDelay={idx * 0.3}
            leftAccentOpacity={ACCENT_OPACITIES[idx] ?? 0.03}
            revealedDescriptor={revealedMap[`desc-${branch.id}`] ?? ""}
            revealedRisks={branch.risks.map((_, i) => revealedMap[`risk-${branch.id}-${i}`] ?? "")}
            revealedOpportunityCost={revealedMap[`opp-${branch.id}`] ?? ""}
            revealedCompounding={{
              oneMonth: revealedMap[`comp-${branch.id}-1m`] ?? "",
              sixMonths: revealedMap[`comp-${branch.id}-6m`] ?? "",
              oneYear: revealedMap[`comp-${branch.id}-1y`] ?? "",
            }}
            setRef={setRef}
            onCommit={onCommit}
            isRecommended={branch.id === recommendedTrajectory.recommendedId}
          />
        ))}
      </div>

      {/* ── RECOMMENDED TRAJECTORY — grand finale ── */}
      <motion.div
        className="mt-6 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px) saturate(160%)",
          WebkitBackdropFilter: "blur(12px) saturate(160%)",
          padding: "32px",
          position: "relative",
          overflow: "hidden",
        }}
        initial={{ opacity: 0, y: 32, filter: `blur(${blurVal(6)}px)` }}
        animate={{
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          boxShadow: [
            "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
            "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 20px rgba(200,168,75,0.3)",
            "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
          ],
        }}
        transition={{
          opacity: { duration: d(0.7), ease: EASE_OUT, delay: recommendedDelay },
          y: { duration: d(0.7), ease: EASE_OUT, delay: recommendedDelay },
          filter: { duration: d(0.7), ease: EASE_OUT, delay: recommendedDelay },
          boxShadow: { duration: d(1.2), ease: "easeInOut", delay: recommendedDelay + 0.1, times: [0, 0.5, 1] },
        }}
      >
        {/* Animated left gold border: scaleY 0 → 1 from top */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: d(0.6), ease: EASE_OUT, delay: recommendedDelay }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: "rgba(245,158,11,0.7)",
            transformOrigin: "top center",
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
          }}
        />

        {/* Icon: scale+rotate entrance */}
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="bg-amber-500/10 p-2 rounded-lg"
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: d(0.5), ease: EASE_OUT, delay: recommendedDelay + 0.2 }}
          >
            <Pulse size={16} weight="thin" className="text-amber-400" />
          </motion.div>

          {/* "RECOMMENDED TRAJECTORY" — letterSpacing animates in */}
          <motion.p
            className="font-display font-semibold text-foreground"
            initial={{ letterSpacing: "0em", opacity: 0 }}
            animate={{ letterSpacing: "0.05em", opacity: 1 }}
            transition={{ duration: d(0.6), ease: EASE_OUT, delay: recommendedDelay + 0.15 }}
          >
            Recommended Trajectory
          </motion.p>
        </div>

        <p ref={setRef("reasoning")} className="text-sm text-muted-foreground leading-relaxed">
          {renderReasoning()}
        </p>
      </motion.div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   EXAMPLE PROMPTS
══════════════════════════════════════════════════════ */
const EXAMPLE_PROMPTS = [
  "Should I launch my startup now or wait 3 months?",
  "Should I drop out and go all-in or finish my degree?",
  "Should I hire my first employee now or stay solo?",
  "Should I pivot my product or double down on current direction?",
];

type SimState = "idle" | "loading" | "ready" | "error";
type BtnLabel = "RUN SIMULATION" | "Loading..." | "ANALYZING...";

/* ══════════════════════════════════════════════════════
   INPUT WRAPPER — entry animations + fade-out + glow
══════════════════════════════════════════════════════ */
const SimulateInputWrapper = ({
  onRunStart,
  onComplete,
  onError,
  hidden,
}: {
  onRunStart: () => void;
  onComplete: (result: SimulationResult, decisionText: string) => void;
  onError: (msg: string) => void;
  hidden: boolean;
}) => {
  const [value, setValue] = useState("");
  const [btnLabel, setBtnLabel] = useState<BtnLabel>("RUN SIMULATION");
  const [inputError, setInputError] = useState("");
  const [displayedLabel, setDisplayedLabel] = useState("RUN SIMULATION");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { balance, spendFlux, canAfford } = useFlux();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyzingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Button text typewriter: types out label changes */
  useEffect(() => {
    let i = 0;
    const target = btnLabel;
    if (target === "RUN SIMULATION") { setDisplayedLabel("RUN SIMULATION"); return; }
    setDisplayedLabel("");
    const id = setInterval(() => {
      i++;
      setDisplayedLabel(target.slice(0, i));
      if (i >= target.length) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [btnLabel]);

  /* Typewriter chip fill */
  const typewriterFill = useCallback((prompt: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setValue("");
    let i = 0;
    const type = () => {
      if (i <= prompt.length) { setValue(prompt.slice(0, i)); i++; timerRef.current = setTimeout(type, 28); }
    };
    type();
  }, []);

  const handleRun = useCallback(async () => {
    if (btnLabel !== "RUN SIMULATION") return;

    const SIMULATION_COST = 200;
    console.log('canAfford simulation:', canAfford('simulation'));
    console.log('current balance:', balance);
    if (!canAfford('simulation')) {
      setShowUpgradeModal(true);
      return; // stop execution — don't run simulation
    }

    const trimmed = value.trim();
    if (!trimmed) { setInputError("Enter a decision to simulate."); return; }
    setInputError("");
    onRunStart();
    setBtnLabel("Loading...");
    if (analyzingTimeoutRef.current) clearTimeout(analyzingTimeoutRef.current);
    analyzingTimeoutRef.current = setTimeout(() => setBtnLabel("ANALYZING..."), 1200);
    try {
      const result = await callNvidiaAPI(trimmed);
      if (analyzingTimeoutRef.current) clearTimeout(analyzingTimeoutRef.current);
      console.log('simulation success, spending FLUX...');
      const spent = await spendFlux('simulation');
      console.log('spendFlux result:', spent);
      setBtnLabel("RUN SIMULATION");
      onComplete(result, trimmed);
    } catch (err) {
      if (analyzingTimeoutRef.current) clearTimeout(analyzingTimeoutRef.current);
      setBtnLabel("RUN SIMULATION");
      const raw = err instanceof Error ? err.message : "UNKNOWN";
      if (raw === "API_KEY_NOT_CONFIGURED") onError("API KEY NOT CONFIGURED — ADD VITE_NVIDIA_API_KEY TO .ENV");
      else if (raw === "PARSE_FAILURE" || raw === "EMPTY_RESPONSE") onError("SIMULATION FAILED — INVALID RESPONSE FROM MODEL");
      else onError("SIMULATION FAILED — CHECK API CONNECTION");
    }
  }, [btnLabel, value, onRunStart, onComplete, onError, spendFlux]);

  const isRunning = btnLabel !== "RUN SIMULATION";

  /* Page entry base delay */
  const BASE = 2.4; // after header + separator animations

  return (
    /* Fade/slide OUT entire section when loading begins */
    <motion.div
      animate={hidden ? { opacity: 0, y: -20 } : { opacity: 1, y: 0 }}
      transition={{ duration: d(0.5), ease: EASE_OUT }}
      style={{ pointerEvents: hidden ? "none" : "auto" }}
      className="w-full text-left"
    >
      {/* Textarea entry */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: d(0.7), ease: EASE_OUT, delay: BASE }}
      >
        <textarea
          value={value}
          onChange={(e) => { setValue(e.target.value); if (inputError) setInputError(""); }}
          placeholder="Describe the decision you're weighing..."
          rows={5}
          className="w-full text-sm text-foreground leading-relaxed resize-none outline-none transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${inputError ? "rgba(255,80,80,0.4)" : "rgba(255,255,255,0.08)"}`,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 12,
            padding: "20px 24px",
            minHeight: 140,
            fontFamily: "Inter, system-ui, sans-serif",
            color: "hsl(var(--foreground))",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = inputError ? "rgba(255,80,80,0.5)" : "rgba(255,255,255,0.2)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.04)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = inputError ? "rgba(255,80,80,0.4)" : "rgba(255,255,255,0.08)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {inputError ? (
          <p className="font-mono text-[11px] tracking-[0.1em] mt-2 mb-4" style={{ color: "rgba(255,80,80,0.75)" }}>
            {inputError}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-3 mb-5">
            Be specific. Include context, timeframe, and what's at stake.
          </p>
        )}
      </motion.div>

      {/* RUN SIMULATION button entry + breathing glow when running */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: d(0.6), ease: EASE_OUT, delay: BASE + 0.15 }}
      >
        <motion.button
          onClick={handleRun}
          disabled={isRunning}
          className="w-full text-sm font-medium uppercase tracking-[0.15em] text-foreground transition-colors duration-200 disabled:cursor-not-allowed"
          style={{
            height: 52,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderRadius: 14,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
          /* Breathing glow while analyzing */
          animate={
            isRunning
              ? {
                boxShadow: [
                  "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0px rgba(255,255,255,0)",
                  "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px rgba(255,255,255,0.08)",
                  "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0px rgba(255,255,255,0)",
                ],
                opacity: 0.7,
              }
              : {
                boxShadow: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
                opacity: 1,
              }
          }
          transition={
            isRunning
              ? { duration: d(1.4), repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
          }
          onMouseEnter={(e) => {
            if (isRunning) return;
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
          }}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              {displayedLabel}
              <span className="sim-cursor-blink text-muted-foreground">▌</span>
            </span>
          ) : (
            "RUN SIMULATION"
          )}
        </motion.button>
      </motion.div>

      {/* Chips: staggered entry + lift micro-interaction */}
      <motion.div
        className="mt-6 flex flex-wrap gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: BASE + 0.3, duration: d(0.3), ease: EASE_OUT }}
      >
        {EXAMPLE_PROMPTS.map((prompt, idx) => (
          <motion.button
            key={idx}
            onClick={() => typewriterFill(prompt)}
            className="text-xs"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: d(0.4), ease: EASE_OUT, delay: BASE + 0.3 + idx * 0.07 }}
            whileHover={{ y: -2, transition: { duration: 0.2, ease: EASE_OUT } }}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: 20,
              padding: "7px 14px",
              color: "rgba(255,255,255,0.55)",
              fontFamily: "Inter, system-ui, sans-serif",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              e.currentTarget.style.color = "rgba(255,255,255,0.85)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "rgba(255,255,255,0.55)";
            }}
          >
            {prompt}
            <span className="text-emerald-400/70 text-[10px]">↗</span>
          </motion.button>
        ))}
      </motion.div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        type="flux"
        featureName="Consequence Simulator"
        fluxRequired={200}
        fluxAvailable={balance}
      />
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════
   HISTORY DRAWER UI
══════════════════════════════════════════════════════ */
const HistoryDrawer = ({
  isOpen,
  onClose,
  onLoadSimulation,
  refreshTrigger
}: {
  isOpen: boolean;
  onClose: () => void;
  onLoadSimulation: (id: string, text: string, branches: any, rec: any) => void;
  refreshTrigger: number;
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (isOpen && history.length === 0) setLoading(true); // Only show loading spinner on initial manual open
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data } = await supabase
          .from('simulations')
          .select('id, decision_text, created_at, branches, recommended_trajectory, committed_timelines(id)')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        if (data) setHistory(data);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [isOpen, refreshTrigger]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }} transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed top-0 right-0 h-[100vh] w-[380px] z-50 flex flex-col"
            style={{ background: "#0C0C11", borderLeft: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/40">Simulation History</span>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={16} weight="thin" /></button>
            </div>
            <div className="flex-1 overflow-y-auto cosmic-scrollbar p-6 space-y-4">
              {loading ? (
                <p className="font-mono text-[10px] uppercase text-white/20 text-center mt-10">Loading...</p>
              ) : history.length === 0 ? (
                <p className="font-mono text-[10px] uppercase text-white/20 text-center mt-10">No simulations yet</p>
              ) : (
                history.map(item => {
                  const isCommitted = item.committed_timelines && item.committed_timelines.length > 0;
                  const d = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(item.created_at));
                  return (
                    <div
                      key={item.id}
                      onClick={() => onLoadSimulation(item.id, item.decision_text, item.branches, item.recommended_trajectory)}
                      className="p-4 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <p className="text-sm text-white/80 line-clamp-2 leading-relaxed mb-3">{item.decision_text}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] text-white/30">{d}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-white/30 uppercase">{item.branches?.length || 0} Branches</span>
                          {isCommitted && (
                            <span className="font-mono text-[8px] tracking-[0.1em] px-1.5 py-0.5 rounded text-amber-500 bg-amber-500/10 border border-amber-500/20">CONFIRMED</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ══════════════════════════════════════════════════════
   PAGE SHELL
══════════════════════════════════════════════════════ */
const Simulate = ({ hideHeader = false }: SimulateProps) => {
  const [simState, setSimState] = useState<SimState>("idle");
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleComplete = useCallback(async (result: SimulationResult, decisionText: string) => {
    setSimResult(result);
    setSimState("ready");

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data } = await supabase
          .from('simulations')
          .insert({
            user_id: userData.user.id,
            decision_text: decisionText,
            branches: result.branches as any,
            recommended_trajectory: result.recommendedTrajectory as any
          })
          .select()
          .single();

        if (data) setCurrentSimulationId(data.id);
      }
    } catch {
      // Handle silently
    }
  }, [setCurrentSimulationId]);

  const handleError = useCallback((msg: string) => {
    setErrorMessage(msg);
    setSimState("error");
  }, []);

  const handleRunStart = useCallback(() => {
    setSimState("loading");
    setSimResult(null);
    setErrorMessage("");
  }, []);

  /* Subtitle animation delay */
  const subtitleDelay = 1.4;
  const ruleDelay = subtitleDelay + 0.8 + 0.3;

  return (
    <div className="min-h-screen relative" style={{ overflowX: "hidden", width: "100%", maxWidth: "100vw", boxSizing: "border-box" }}>
      <CosmicBackground />

      {/* ── Ambient Phantom Character (Desktop Only) ── */}
      <motion.img
        src="/phantom.png"
        alt="Ambient Phantom"
        className="hidden md:block fixed pointer-events-none z-0"
        style={{
          left: "-60px",
          top: "50%",
          transform: "translateY(-50%)",
          height: "85vh",
          width: "auto",
          maxWidth: "420px",
          objectFit: "cover",
          objectPosition: "right center",
          WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 35%, rgba(0,0,0,0.2) 65%, transparent 100%), linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.3) 80%, transparent 100%)",
          maskImage: "linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 35%, rgba(0,0,0,0.2) 65%, transparent 100%), linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.3) 80%, transparent 100%)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect"
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.12 }}
        transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
      />

      <CommitModal
        isOpen={showCommitModal}
        onClose={() => setShowCommitModal(false)}
        branch={selectedBranch as any}
        simulationId={currentSimulationId}
        onPlanActivated={() => setRefreshTrigger(prev => prev + 1)}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        refreshTrigger={refreshTrigger}
        onClose={() => setIsHistoryOpen(false)}
        onLoadSimulation={(id, txt, branches, rec) => {
          setCurrentSimulationId(id);
          setSimResult({ branches, recommendedTrajectory: rec });
          setSimState("ready");
          setIsHistoryOpen(false);
        }}
      />

      <button
        onClick={() => setIsHistoryOpen(true)}
        className="fixed z-40 transition-colors duration-200"
        style={{
          right: 24,
          top: "50%",
          transform: "translateY(-50%) rotate(90deg)",
          transformOrigin: "bottom right",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "8px 16px",
          fontFamily: "'Space Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.3)",
          cursor: "pointer",
          borderRadius: "4px",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = "rgba(255,255,255,0.7)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = "rgba(255,255,255,0.3)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        }}
      >
        HISTORY
      </button>

      {/* ── Ambient orb behind all content ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AmbientOrb />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {!hideHeader && <Header />}

        <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-8 pb-12 lg:pt-12 lg:pb-20 overflow-y-auto cosmic-scrollbar">
          <div className="w-full max-w-[728px]">

            {/* ── PAGE HEADER with cinematic word-stagger ── */}
            <div className="mb-8 text-center">

              {/* Label: letterSpacing expands on entry */}
              <motion.p
                className="text-xs text-muted-foreground uppercase mb-3"
                initial={{ opacity: 0, letterSpacing: "0.1em" }}
                animate={{ opacity: 0.7, letterSpacing: "0.3em" }}
                transition={{ duration: d(1.2), ease: EASE_OUT, delay: 0.1 }}
              >
                Consequence Simulator
              </motion.p>

              {/* Static Headline (Fallback Safety) */}
              <h1 style={{
                fontSize: "clamp(28px, 6vw, 64px)",
                fontWeight: "bold",
                color: "#FFFFFF",
                textAlign: "center",
                lineHeight: 1.1,
                marginBottom: "16px",
                opacity: 1,
                visibility: "visible"
              }}>
                <span style={{ display: "block", whiteSpace: "nowrap" }}>Model Your Future.</span>
                <span style={{ display: "block", whiteSpace: "nowrap" }}>Choose Your Timeline.</span>
              </h1>

              {/* Subtitle */}
              <motion.p
                className="text-muted-foreground max-w-md mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: d(0.8), ease: EASE_OUT, delay: subtitleDelay }}
              >
                Input a decision. The AI generates diverging timeline branches with strategic intelligence for each path.
              </motion.p>

              {/* Horizontal rule: scaleX from left */}
              <motion.div
                className="w-full h-px mt-10"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
                  transformOrigin: "left center",
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: d(1.0), ease: EASE_OUT, delay: ruleDelay }}
              />
            </div>

            {/* ── Input section ── */}
            <div className="mb-4">
              <SimulateInputWrapper
                onRunStart={handleRunStart}
                onComplete={handleComplete}
                onError={handleError}
                hidden={simState === "loading"}
              />
            </div>

            {/* ── Output states ── */}
            <AnimatePresence mode="wait">
              {simState === "idle" && <IdleGraphic key="idle" />}
              {simState === "loading" && <RadarPing key="radar" />}
              {simState === "error" && <ErrorState key="error" message={errorMessage} />}
              {simState === "ready" && simResult && (
                <motion.div
                  key="brief"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                >
                  <IntelligenceBrief
                    result={simResult}
                    onCommit={(branch) => {
                      setSelectedBranch(branch);
                      setShowCommitModal(true);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Simulate;

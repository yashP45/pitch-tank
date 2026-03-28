"use client";

import type { Mood } from "@/lib/types";

interface MoodConfig {
  label: string;
  borderGlow: string;
  bodyRotate: number;
  headTilt: number;
  armsCrossed: boolean;
  leanBack: boolean;
}

const MOOD_CONFIG: Record<Mood, MoodConfig> = {
  disinterested: {
    label: "BILKUL INTERESTED NAHI",
    borderGlow: "rgba(68,68,68,0.4)",
    bodyRotate: 2,
    headTilt: 0,
    armsCrossed: true,
    leanBack: true,
  },
  suspicious: {
    label: "DEKH RAHA HOON...",
    borderGlow: "rgba(232,137,26,0.3)",
    bodyRotate: 0,
    headTilt: -5,
    armsCrossed: false,
    leanBack: false,
  },
  impressed: {
    label: "INTERESTING HAI",
    borderGlow: "rgba(232,137,26,0.6)",
    bodyRotate: -2,
    headTilt: -3,
    armsCrossed: false,
    leanBack: false,
  },
  invested: {
    label: "BAAT KARTE HAIN",
    borderGlow: "var(--ashneer-accent)",
    bodyRotate: -5,
    headTilt: -5,
    armsCrossed: false,
    leanBack: false,
  },
};

interface AshneerPortraitProps {
  mood?: Mood;
  size?: "normal" | "small";
}

export default function AshneerPortrait({ mood = "disinterested", size = "normal" }: AshneerPortraitProps) {
  const config = MOOD_CONFIG[mood] || MOOD_CONFIG.disinterested;
  const isSmall = size === "small";
  const w = isSmall ? 120 : 180;
  const h = isSmall ? 140 : 200;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: isSmall ? 6 : 10 }}>
      <div
        style={{
          width: w,
          height: h,
          borderRadius: 12,
          border: `1.5px solid ${config.borderGlow}`,
          boxShadow: `0 0 24px ${config.borderGlow}`,
          background: "var(--surface)",
          overflow: "hidden",
          transition: "all 0.8s ease",
          position: "relative",
        }}
      >
        <svg
          viewBox="0 0 180 200"
          width={w}
          height={h}
          style={{ transition: "transform 0.8s ease", transform: `rotate(${config.bodyRotate}deg)` }}
        >
          <rect x="30" y="140" width="120" height="55" rx="6" fill="#1a1612" stroke="rgba(232,137,26,0.1)" strokeWidth="1" />
          <rect x="25" y="130" width="130" height="14" rx="4" fill="#1a1612" stroke="rgba(232,137,26,0.08)" strokeWidth="1" />

          <g
            style={{ transition: "transform 0.8s ease", transformOrigin: "90px 130px" }}
            transform={config.leanBack ? "translate(3, 2)" : "translate(-2, -2)"}
          >
            <path d="M60 95 L55 145 L125 145 L120 95 Q110 80 90 78 Q70 80 60 95Z" fill="#222" stroke="rgba(232,137,26,0.1)" strokeWidth="0.5" />
            <line x1="90" y1="82" x2="90" y2="130" stroke="rgba(232,137,26,0.3)" strokeWidth="2" />
            <line x1="90" y1="82" x2="72" y2="110" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <line x1="90" y1="82" x2="108" y2="110" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            {config.armsCrossed ? (
              <>
                <path d="M60 100 Q50 115 65 125 Q80 128 95 120" fill="none" stroke="#333" strokeWidth="8" strokeLinecap="round" />
                <path d="M120 100 Q130 115 115 125 Q100 128 85 120" fill="none" stroke="#2a2a2a" strokeWidth="8" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M60 98 Q48 120 52 140" fill="none" stroke="#333" strokeWidth="8" strokeLinecap="round" />
                {mood === "invested" ? (
                  <path d="M120 98 Q135 105 145 95" fill="none" stroke="#2a2a2a" strokeWidth="8" strokeLinecap="round" />
                ) : (
                  <path d="M120 98 Q132 120 128 140" fill="none" stroke="#2a2a2a" strokeWidth="8" strokeLinecap="round" />
                )}
              </>
            )}

            <rect x="82" y="62" width="16" height="20" rx="4" fill="#c4956a" />

            <g style={{ transition: "transform 0.8s ease", transformOrigin: "90px 48px" }} transform={`rotate(${config.headTilt})`}>
              <ellipse cx="90" cy="42" rx="24" ry="28" fill="#c4956a" />
              <path d="M66 35 Q70 14 90 12 Q110 14 114 35" fill="#1a1a1a" />
              <line x1="76" y1="33" x2="85" y2="32" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
              <line x1="95" y1="32" x2="104" y2="33" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
              <ellipse cx="80" cy="38" rx="3" ry="2.5" fill="#1a1a1a" />
              <ellipse cx="100" cy="38" rx="3" ry="2.5" fill="#1a1a1a" />
              <path d="M88 42 Q90 48 92 42" fill="none" stroke="#a07850" strokeWidth="1" />
              {mood === "impressed" || mood === "invested" ? (
                <path d="M83 52 Q90 56 97 52" fill="none" stroke="#8a6040" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <line x1="83" y1="53" x2="97" y2="53" stroke="#8a6040" strokeWidth="1.5" strokeLinecap="round" />
              )}
              <path d="M70 48 Q72 62 90 66 Q108 62 110 48" fill="none" stroke="rgba(26,26,26,0.2)" strokeWidth="1" />
            </g>
          </g>
        </svg>
      </div>

      <span
        style={{
          fontFamily: "var(--font-dm), sans-serif",
          fontSize: isSmall ? 9 : 11,
          color: "var(--text-dim)",
          letterSpacing: "0.15em",
          textAlign: "center",
          transition: "color 0.8s ease",
        }}
      >
        {config.label}
      </span>
    </div>
  );
}

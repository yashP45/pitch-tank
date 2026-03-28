"use client";

import type { Mood } from "@/lib/types";

interface MoodConfig {
  label: string;
  borderGlow: string;
}

const MOOD_CONFIG: Record<Mood, MoodConfig> = {
  disinterested: {
    label: "BILKUL INTERESTED NAHI",
    borderGlow: "rgba(68,68,68,0.4)",
  },
  suspicious: {
    label: "DEKH RAHA HOON...",
    borderGlow: "rgba(232,137,26,0.3)",
  },
  impressed: {
    label: "INTERESTING HAI",
    borderGlow: "rgba(232,137,26,0.6)",
  },
  invested: {
    label: "BAAT KARTE HAIN",
    borderGlow: "var(--ashneer-accent)",
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
          overflow: "hidden",
          transition: "all 0.8s ease",
          position: "relative",
        }}
      >
        <img
          src="/ashneer.png"
          alt="Ashneer Grover"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 15%",
            display: "block",
          }}
        />
        {/* Vignette overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
            pointerEvents: "none",
          }}
        />
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

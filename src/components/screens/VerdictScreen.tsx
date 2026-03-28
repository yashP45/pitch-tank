"use client";

import { useState, useEffect, useCallback } from "react";
import type { VerdictData } from "@/lib/types";
import ShareCard from "../ui/ShareCard";

function getZoneColor(value: number): string {
  if (value <= 25) return "var(--meter-red)";
  if (value <= 50) return "var(--meter-amber)";
  if (value <= 75) return "var(--meter-green)";
  return "var(--meter-gold)";
}

function getZoneVerdict(value: number): string {
  if (value <= 25) return "Absolutely Not. Next.";
  if (value <= 50) return "Not Yet. Keep Working.";
  if (value <= 60) return "Interesting. But...";
  if (value <= 75) return "I'm Listening.";
  return "Let's Make a Deal.";
}

interface WordByWordTextProps {
  text: string;
  onComplete?: () => void;
}

function WordByWordText({ text, onComplete }: WordByWordTextProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const words = (text || "").split(" ");

  useEffect(() => {
    setVisibleCount(0);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      if (i <= words.length) {
        setVisibleCount(i);
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, 60);
    return () => clearInterval(interval);
  }, [text, words.length, onComplete]);

  return <span>{words.slice(0, visibleCount).join(" ")}</span>;
}

interface VerdictScreenProps {
  verdict: VerdictData;
  fundabilityHistory: number[];
  onRestart: () => void;
}

export default function VerdictScreen({ verdict, onRestart }: VerdictScreenProps) {
  const [phase, setPhase] = useState<"entrance" | "reveal">("entrance");
  const [displayScore, setDisplayScore] = useState(0);
  const [, setMonologueDone] = useState(false);
  const [showSignature, setShowSignature] = useState(false);

  const finalScore = verdict?.fundability || 0;
  const verdictData = verdict?.verdict || { respected: "", killShot: "", conditional: "", gutLine: "" };
  const dialogue = verdict?.dialogue || "";

  useEffect(() => {
    const t = setTimeout(() => setPhase("reveal"), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "reveal") return;
    let current = 0;
    const step = Math.max(1, Math.floor(finalScore / 60));
    const interval = setInterval(() => {
      current += step;
      if (current >= finalScore) {
        setDisplayScore(finalScore);
        clearInterval(interval);
      } else {
        setDisplayScore(current);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [phase, finalScore]);

  const handleMonologueComplete = useCallback(() => {
    setMonologueDone(true);
    if (finalScore > 75) {
      setTimeout(() => setShowSignature(true), 1500);
    }
  }, [finalScore]);

  if (phase === "entrance") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm), sans-serif",
            fontSize: 14,
            color: "var(--text-muted)",
            textAlign: "center",
            animation: "pulseOpacity 1.5s ease-in-out infinite",
          }}
        >
          Ashneer's verdict is coming...
        </p>
      </div>
    );
  }

  const color = getZoneColor(finalScore);
  const zoneVerdict = getZoneVerdict(finalScore);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        animation: "fadeIn 0.8s ease both",
      }}
    >
      <div style={{ maxWidth: 640, width: "100%" }}>
        <p
          style={{
            fontFamily: "var(--font-dm), sans-serif",
            fontSize: 11,
            letterSpacing: "0.3em",
            color: "var(--text-dim)",
            textAlign: "center",
            marginBottom: 32,
            textTransform: "uppercase" as const,
          }}
        >
          The Verdict
        </p>

        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <span
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: 96,
              fontWeight: 700,
              color,
              display: "inline-block",
              animation: "countUp 0.5s ease both",
            }}
          >
            {displayScore}
          </span>
        </div>

        <p
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontStyle: "italic",
            fontSize: 24,
            color,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          {zoneVerdict}
        </p>

        <div style={{ height: 1, background: "var(--border-subtle)", margin: "32px 0" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
          <VerdictRow label="What Impressed:" value={verdictData.respected} />
          <VerdictRow label="What Didn't Work:" value={verdictData.killShot} />
          <VerdictRow label="If You Fix This:" value={verdictData.conditional} />
          <VerdictRow label="Gut Feel:" value={verdictData.gutLine} highlight />
        </div>

        {dialogue && (
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "24px 28px", marginBottom: 32 }}>
            <p
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: 16,
                lineHeight: 1.8,
                fontStyle: "italic",
                color: "var(--text-muted)",
              }}
            >
              <WordByWordText text={dialogue} onComplete={handleMonologueComplete} />
            </p>
          </div>
        )}

        {showSignature && (
          <p
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontStyle: "italic",
              fontSize: 18,
              color: "var(--ashneer-accent)",
              textAlign: "center",
              marginBottom: 32,
              animation: "fadeIn 1s ease both",
            }}
          >
            &quot;Main Ashneer Grover hoon. Aur mere jaisa koi nahi.&quot;
          </p>
        )}

        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
          <ShareCard score={finalScore} gutLine={verdictData.gutLine} />
          <button
            onClick={onRestart}
            style={{
              background: "transparent",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-dm), sans-serif",
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 8,
              cursor: "pointer",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget;
              btn.style.borderColor = "var(--ashneer-accent)";
              btn.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget;
              btn.style.borderColor = "var(--border-subtle)";
              btn.style.color = "var(--text-muted)";
            }}
          >
            New Pitch
          </button>
        </div>
      </div>
    </div>
  );
}

interface VerdictRowProps {
  label: string;
  value?: string;
  highlight?: boolean;
}

function VerdictRow({ label, value, highlight }: VerdictRowProps) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-dm), sans-serif",
          fontSize: 11,
          color: "var(--text-dim)",
          textTransform: "uppercase" as const,
          letterSpacing: "0.1em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: highlight ? "var(--font-playfair), serif" : "var(--font-dm), sans-serif",
          fontStyle: highlight ? "italic" : "normal",
          fontSize: 15,
          color: highlight ? "var(--ashneer-accent)" : "var(--text-primary)",
          lineHeight: 1.5,
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

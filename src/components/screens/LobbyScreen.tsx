"use client";

import { useState, useEffect, useRef } from "react";

interface LobbyScreenProps {
  onEnter: () => void;
}

const TYPEWRITER_TEXT = "The Tank awaits.";
const CHAR_DELAY = 70;

export default function LobbyScreen({ onEnter }: LobbyScreenProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [typewriterDone, setTypewriterDone] = useState(false);
  const [showSubtext, setShowSubtext] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        indexRef.current += 1;
        if (indexRef.current <= TYPEWRITER_TEXT.length) {
          setDisplayedText(TYPEWRITER_TEXT.slice(0, indexRef.current));
        } else {
          clearInterval(interval);
          setTypewriterDone(true);
        }
      }, CHAR_DELAY);
      return () => clearInterval(interval);
    }, 800);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!typewriterDone) return;
    const t1 = setTimeout(() => setShowSubtext(true), 500);
    const t2 = setTimeout(() => setShowButton(true), 1300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [typewriterDone]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0c0b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Spotlight beam from above */}
      <div
        style={{
          position: "absolute",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: "80%",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(232,137,26,0.16) 0%, rgba(232,137,26,0.05) 40%, transparent 70%)",
          pointerEvents: "none",
          animation: "spotlightPulse 4s ease-in-out infinite",
        }}
      />

      {/* Secondary ambient glow on the stage floor */}
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 160,
          background:
            "radial-gradient(ellipse, rgba(232,137,26,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(30px)",
        }}
      />

      {/* Floating particles */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: `${25 + (i % 3) * 8}%`,
            left: `calc(50% + ${(i - 2) * 50}px)`,
            width: i % 2 === 0 ? 3 : 2,
            height: i % 2 === 0 ? 3 : 2,
            borderRadius: "50%",
            background: `rgba(232,137,26,${0.3 + (i % 3) * 0.15})`,
            animation: `floatParticle ${3 + i * 0.6}s ease-in-out infinite`,
            animationDelay: `${i * 0.9}s`,
          }}
        />
      ))}

      {/* Title — large hero text */}
      <h1
        style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: "clamp(36px, 6vw, 64px)",
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: "rgba(255,255,255,0.9)",
          animation: "fadeIn 1.2s ease 0.2s both",
          textTransform: "uppercase" as const,
          marginBottom: 12,
          zIndex: 1,
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        Pitch Tank
      </h1>
      <span
        style={{
          fontFamily: "var(--font-dm), sans-serif",
          fontSize: "clamp(12px, 1.5vw, 15px)",
          letterSpacing: "0.5em",
          color: "rgba(232,137,26,0.6)",
          animation: "fadeIn 1.2s ease 0.4s both",
          textTransform: "uppercase" as const,
          marginBottom: 56,
          zIndex: 1,
        }}
      >
        India
      </span>

      {/* Podium + Microphone */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: 48,
          zIndex: 1,
          animation: "fadeIn 1.4s ease 0.5s both",
        }}
      >
        {/* Microphone */}
        <div style={{ position: "relative", height: 90, marginBottom: 4 }}>
          {/* Mic head */}
          <div
            style={{
              width: 16,
              height: 22,
              borderRadius: "50% 50% 40% 40%",
              background: "#2a2825",
              border: "1px solid rgba(232,137,26,0.35)",
              margin: "0 auto",
              boxShadow: "0 0 12px rgba(232,137,26,0.15)",
            }}
          />
          {/* Mic stand */}
          <div
            style={{
              width: 2,
              height: 66,
              background: "linear-gradient(to bottom, rgba(232,137,26,0.45), rgba(232,137,26,0.08))",
              margin: "0 auto",
            }}
          />
        </div>

        {/* Podium surface */}
        <div
          style={{
            width: 140,
            height: 8,
            background: "linear-gradient(to right, transparent, rgba(232,137,26,0.18), transparent)",
            borderRadius: 2,
          }}
        />
        {/* Podium body */}
        <div
          style={{
            width: 115,
            height: 45,
            background: "#141210",
            borderLeft: "1px solid rgba(232,137,26,0.12)",
            borderRight: "1px solid rgba(232,137,26,0.12)",
            borderBottom: "1px solid rgba(232,137,26,0.08)",
            clipPath: "polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)",
          }}
        />
        {/* Stage floor line */}
        <div
          style={{
            width: 280,
            height: 1,
            background: "linear-gradient(to right, transparent, rgba(232,137,26,0.12), transparent)",
            marginTop: 2,
          }}
        />
      </div>

      {/* Typewriter text */}
      <p
        style={{
          fontFamily: "var(--font-playfair), serif",
          fontStyle: "italic",
          fontSize: "clamp(22px, 3vw, 30px)",
          color: "#f5ede0",
          textAlign: "center",
          minHeight: 44,
          lineHeight: 1.5,
          zIndex: 1,
          marginBottom: 16,
        }}
      >
        {displayedText}
        {!typewriterDone && (
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: "0.9em",
              background: "#e8891a",
              marginLeft: 3,
              verticalAlign: "text-bottom",
              animation: "pulseOpacity 0.8s ease-in-out infinite",
            }}
          />
        )}
      </p>

      {/* Subtext */}
      <p
        style={{
          fontFamily: "var(--font-dm), sans-serif",
          fontSize: 14,
          color: "rgba(255,255,255,0.35)",
          opacity: showSubtext ? 1 : 0,
          transition: "opacity 0.6s ease",
          zIndex: 1,
          marginBottom: 40,
          letterSpacing: "0.01em",
        }}
      >
        Ashneer Grover is waiting. Have your idea ready.
      </p>

      {/* CTA Button */}
      <button
        onClick={onEnter}
        style={{
          fontFamily: "var(--font-playfair), serif",
          fontStyle: "italic",
          fontSize: 17,
          border: "2px solid #e8891a",
          background: "transparent",
          padding: "16px 48px",
          color: "#e8891a",
          borderRadius: 4,
          cursor: "pointer",
          opacity: showButton ? 1 : 0,
          transform: showButton ? "translateY(0)" : "translateY(12px)",
          transition:
            "opacity 0.6s ease, transform 0.6s ease, background 0.2s, color 0.2s",
          letterSpacing: "0.04em",
          zIndex: 1,
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget;
          btn.style.background = "#e8891a";
          btn.style.color = "#0e0c0b";
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget;
          btn.style.background = "transparent";
          btn.style.color = "#e8891a";
        }}
      >
        Take the Stage →
      </button>
    </div>
  );
}

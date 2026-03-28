"use client";

import { useState, useEffect, useRef } from "react";

interface LobbyScreenProps {
  onEnter: () => void;
}

const TYPEWRITER_TEXT = "Ashneer Grover aapka intezaar kar raha hai.";
const CHAR_DELAY = 55;

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
    }, 600);
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        padding: "24px 16px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-dm), sans-serif",
          fontSize: 11,
          letterSpacing: "0.3em",
          color: "var(--text-dim)",
          animation: "fadeIn 0.8s ease 0.2s both",
          textTransform: "uppercase" as const,
        }}
      >
        Pitch Tank India
      </span>

      <div
        style={{
          width: 160,
          height: 220,
          background: "#141210",
          border: "1.5px solid rgba(232,137,26,0.3)",
          borderRadius: "4px 4px 0 0",
          position: "relative",
          animation: "doorGlow 3s ease-in-out infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "rgba(232,137,26,0.2)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "rgba(232,137,26,0.6)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            bottom: "55%",
            border: "1px solid rgba(232,137,26,0.08)",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "52%",
            left: 20,
            right: 20,
            bottom: 20,
            border: "1px solid rgba(232,137,26,0.08)",
            borderRadius: 2,
          }}
        />
      </div>

      <p
        style={{
          fontFamily: "var(--font-playfair), serif",
          fontStyle: "italic",
          fontSize: 22,
          color: "var(--text-primary)",
          textAlign: "center",
          minHeight: 33,
          lineHeight: 1.5,
        }}
      >
        {displayedText}
        {!typewriterDone && (
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: 22,
              background: "var(--ashneer-accent)",
              marginLeft: 2,
              verticalAlign: "text-bottom",
              animation: "pulseOpacity 0.8s ease-in-out infinite",
            }}
          />
        )}
      </p>

      <p
        style={{
          fontFamily: "var(--font-dm), sans-serif",
          fontSize: 13,
          color: "var(--text-muted)",
          opacity: showSubtext ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      >
        60 seconds. Apna idea ready rakh.
      </p>

      <button
        onClick={onEnter}
        style={{
          fontFamily: "var(--font-playfair), serif",
          fontStyle: "italic",
          fontSize: 16,
          border: "2px solid var(--ashneer-accent)",
          background: "transparent",
          padding: "14px 36px",
          color: "var(--ashneer-accent)",
          borderRadius: 4,
          cursor: "pointer",
          opacity: showButton ? 1 : 0,
          transform: showButton ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.6s ease, transform 0.6s ease, background 0.2s, color 0.2s",
          letterSpacing: "0.02em",
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget;
          btn.style.background = "var(--ashneer-accent)";
          btn.style.color = "#0e0c0b";
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget;
          btn.style.background = "transparent";
          btn.style.color = "var(--ashneer-accent)";
        }}
      >
        Tank mein Jaao →
      </button>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { getRandomTerm } from "@/lib/startupTerms";

export default function PenTapLoader() {
  const term = useMemo(() => getRandomTerm(), []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "20px 0",
        animation: "fadeIn 0.3s ease both",
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontSize: 24,
          animation: "penTap 0.8s ease-in-out infinite",
          transformOrigin: "bottom center",
        }}
      >
        ✒
      </span>

      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--font-dm), sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--ashneer-accent)",
            marginBottom: 2,
          }}
        >
          {term.term}
        </div>
        <div
          style={{
            fontFamily: "var(--font-dm), sans-serif",
            fontSize: 12,
            color: "var(--text-muted)",
            fontStyle: "italic",
            maxWidth: 260,
          }}
        >
          {term.definition}
        </div>
      </div>

      <span
        style={{
          fontFamily: "var(--font-dm), sans-serif",
          fontSize: 11,
          color: "var(--text-dim)",
        }}
      >
        Ashneer soch raha hai...
      </span>
    </div>
  );
}

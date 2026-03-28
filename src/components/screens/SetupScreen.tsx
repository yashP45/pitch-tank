"use client";

import { useState, useCallback } from "react";
import type { StartupData } from "@/lib/types";

interface SetupScreenProps {
  onSubmit: (startup: StartupData) => void;
}

const SECTORS = [
  "D2C / Consumer Brand",
  "Fintech / Payments",
  "Agritech / Rural",
  "Edtech",
  "SaaS / B2B",
  "Healthtech",
  "Logistics",
  "Social / Creator",
  "Other",
];

const STAGES = [
  "Just an Idea",
  "Built an MVP",
  "Generating Revenue",
  "Scaling Up",
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface-raised)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 10,
  padding: "12px 16px",
  color: "var(--text-primary)",
  fontFamily: "var(--font-dm), sans-serif",
  fontSize: 15,
  outline: "none",
  resize: "none",
  transition: "border-color 0.2s",
};

interface PillSelectorProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
}

function PillSelector({ options, value, onChange }: PillSelectorProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              fontFamily: "var(--font-dm), sans-serif",
              fontSize: 13,
              padding: "8px 16px",
              borderRadius: 20,
              border: `1.5px solid ${selected ? "var(--ashneer-accent)" : "var(--border-subtle)"}`,
              background: selected ? "rgba(232,137,26,0.08)" : "transparent",
              color: selected ? "var(--ashneer-accent)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function SetupScreen({ onSubmit }: SetupScreenProps) {
  const [idea, setIdea] = useState("");
  const [sector, setSector] = useState("");
  const [stage, setStage] = useState("");
  const [strength, setStrength] = useState("");
  const [weakness, setWeakness] = useState("");

  const isValid = idea.trim() && sector && stage;

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    onSubmit({ idea: idea.trim(), sector, stage, strength: strength.trim(), weakness: weakness.trim() });
  }, [idea, sector, stage, strength, weakness, isValid, onSubmit]);

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = "auto";
    target.style.height = target.scrollHeight + "px";
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-playfair), serif",
    fontStyle: "italic",
    fontSize: 17,
    color: "var(--text-primary)",
    marginBottom: 10,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          background: "var(--surface)",
          borderRadius: 20,
          padding: 40,
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          animation: "fadeUp 0.6s ease both",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--ashneer-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-dm), sans-serif",
              fontSize: 13,
              fontWeight: 700,
              color: "#0e0c0b",
              flexShrink: 0,
            }}
          >
            AG
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-dm), sans-serif", fontSize: 13, color: "var(--text-primary)" }}>
              Ashneer Grover
            </div>
            <div style={{ fontFamily: "var(--font-dm), sans-serif", fontSize: 11, color: "var(--text-muted)" }}>
              BharatPe · Shark Tank India
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>What's your idea? Describe in 2 lines.</label>
          <textarea
            rows={3}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onInput={handleTextareaInput}
            placeholder="Describe your startup idea here..."
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "rgba(232,137,26,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Which sector are you in?</label>
          <PillSelector options={SECTORS} value={sector} onChange={setSector} />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>What stage are you at?</label>
          <PillSelector options={STAGES} value={stage} onChange={setStage} />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>One thing you've already validated.</label>
          <input
            type="text"
            value={strength}
            onChange={(e) => setStrength(e.target.value)}
            placeholder="Optional — but helps"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "rgba(232,137,26,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>One area where you're not confident.</label>
          <input
            type="text"
            value={weakness}
            onChange={(e) => setWeakness(e.target.value)}
            placeholder="Be honest — Ashneer will figure it out anyway"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "rgba(232,137,26,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
          />
        </div>

        <p
          style={{
            fontFamily: "var(--font-dm), sans-serif",
            fontSize: 12,
            color: "var(--text-dim)",
            fontStyle: "italic",
            marginBottom: 28,
          }}
        >
          Don't know exact numbers? That's fine — share what you know.
        </p>

        <button
          onClick={handleSubmit}
          disabled={!isValid}
          style={{
            width: "100%",
            background: isValid ? "var(--ashneer-accent)" : "rgba(232,137,26,0.3)",
            color: "#0e0c0b",
            fontFamily: "var(--font-dm), sans-serif",
            fontSize: 15,
            fontWeight: 600,
            padding: 16,
            borderRadius: 12,
            border: "none",
            cursor: isValid ? "pointer" : "not-allowed",
            opacity: isValid ? 1 : 0.4,
            transition: "opacity 0.2s, background 0.2s",
          }}
        >
          Start Pitch →
        </button>
      </div>
    </div>
  );
}

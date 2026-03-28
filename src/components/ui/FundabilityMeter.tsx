"use client";

import { useRef, useEffect, useState } from "react";

function getZoneColor(value: number): string {
  if (value <= 25) return "var(--meter-red)";
  if (value <= 50) return "var(--meter-amber)";
  if (value <= 75) return "var(--meter-green)";
  return "var(--meter-gold)";
}

function getZoneLabel(value: number): string {
  if (value <= 25) return "Pass";
  if (value <= 50) return "Maybe";
  if (value <= 75) return "Interesting";
  return "Deal Zone";
}

interface FundabilityMeterProps {
  value?: number;
  horizontal?: boolean;
}

export default function FundabilityMeter({ value = 20, horizontal = false }: FundabilityMeterProps) {
  const prevValueRef = useRef(value);
  const [animClass, setAnimClass] = useState("");

  useEffect(() => {
    const prev = prevValueRef.current;
    if (value > prev) {
      setAnimClass("pulse-up");
    } else if (value < prev) {
      setAnimClass("shake-down");
    }
    prevValueRef.current = value;
    const t = setTimeout(() => setAnimClass(""), 600);
    return () => clearTimeout(t);
  }, [value]);

  const color = getZoneColor(value);
  const label = getZoneLabel(value);

  if (horizontal) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
        <span
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: 24,
            fontWeight: 700,
            color,
            minWidth: 36,
            textAlign: "right",
            transition: "color 0.6s ease",
          }}
        >
          {value}
        </span>
        <div
          style={{
            flex: 1,
            height: 12,
            borderRadius: 6,
            border: "1px solid var(--border-subtle)",
            background: "rgba(255,255,255,0.03)",
            overflow: "hidden",
            position: "relative",
            animation: animClass === "shake-down" ? "meterShakeDown 0.4s ease" : "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${value}%`,
              background: color,
              borderRadius: 6,
              transition: "width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.6s ease",
              animation: animClass === "pulse-up" ? "meterPulseUp 0.6s ease" : "none",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "var(--font-dm), sans-serif",
            fontSize: 11,
            color,
            minWidth: 90,
            transition: "color 0.6s ease",
          }}
        >
          {label}
        </span>
      </div>
    );
  }

  const zoneLabelStyle: React.CSSProperties = {
    fontFamily: "var(--font-dm), sans-serif",
    fontSize: 10,
    color: "var(--text-dim)",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <span
        style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: 28,
          fontWeight: 700,
          color,
          transition: "color 0.6s ease",
        }}
      >
        {value}
      </span>

      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
        <div
          style={{
            width: 40,
            height: 220,
            borderRadius: 8,
            border: "1px solid var(--border-subtle)",
            background: "rgba(255,255,255,0.03)",
            overflow: "hidden",
            position: "relative",
            animation: animClass === "shake-down" ? "meterShakeDown 0.4s ease" : "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: `${value}%`,
              background: color,
              borderRadius: "0 0 7px 7px",
              transition: "height 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.6s ease",
              animation: animClass === "pulse-up" ? "meterPulseUp 0.6s ease" : "none",
            }}
          />
        </div>

        <div
          style={{
            height: 220,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingTop: 2,
            paddingBottom: 2,
          }}
        >
          <span style={zoneLabelStyle}>Deal Zone</span>
          <span style={zoneLabelStyle}>Interesting</span>
          <span style={zoneLabelStyle}>Maybe</span>
          <span style={zoneLabelStyle}>Pass</span>
        </div>
      </div>

      <span
        style={{
          fontFamily: "var(--font-dm), sans-serif",
          fontSize: 12,
          color,
          fontWeight: 500,
          transition: "color 0.6s ease",
        }}
      >
        {label}
      </span>
    </div>
  );
}

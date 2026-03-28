"use client";

import { useCallback } from "react";

function getZoneColor(value: number): string {
  if (value <= 25) return "#8b2020";
  if (value <= 50) return "#b87333";
  if (value <= 75) return "#4a7c59";
  return "#f0a500";
}

interface ShareCardProps {
  score: number;
  gutLine?: string;
}

export default function ShareCard({ score, gutLine }: ShareCardProps) {
  const handleShare = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0e0c0b";
    ctx.fillRect(0, 0, 600, 400);

    ctx.fillStyle = "rgba(232,137,26,0.05)";
    ctx.beginPath();
    ctx.ellipse(300, 0, 300, 200, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#5a5048";
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("PITCH TANK INDIA", 300, 50);

    const color = getZoneColor(score);
    ctx.fillStyle = color;
    ctx.font = 'bold 96px "Playfair Display", serif';
    ctx.textAlign = "center";
    ctx.fillText(score.toString(), 300, 180);

    ctx.fillStyle = "#f5ede0";
    ctx.font = 'italic 18px "Playfair Display", serif';
    ctx.textAlign = "center";
    const maxWidth = 480;
    const words = (gutLine || "").split(" ");
    let line = "";
    let y = 230;
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line.trim(), 300, y);
        line = word + " ";
        y += 26;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line.trim(), 300, y);

    ctx.fillStyle = "#e8891a";
    ctx.font = 'bold 28px "DM Sans", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText("AG", 570, 370);

    ctx.fillStyle = "#5a5048";
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.textAlign = "left";
    ctx.fillText("pitchtank.in", 30, 375);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pitch-tank-result.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [score, gutLine]);

  return (
    <button
      onClick={handleShare}
      style={{
        background: "transparent",
        border: "2px solid var(--ashneer-accent)",
        color: "var(--ashneer-accent)",
        fontFamily: "var(--font-dm), sans-serif",
        fontSize: 14,
        fontWeight: 600,
        padding: "12px 28px",
        borderRadius: 8,
        cursor: "pointer",
        transition: "background 0.2s, color 0.2s",
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
      Ye result share kar →
    </button>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Mood, StartupData, ChatMessage, DisplayMessage, VerdictData, AshneerResponse } from "@/lib/types";
import AshneerPortrait from "../ui/AshneerPortrait";
import FundabilityMeter from "../ui/FundabilityMeter";
import PenTapLoader from "../ui/PenTapLoader";
import { buildSystemPrompt, buildVerdictPrompt } from "@/lib/systemPrompt";
import { buildSummaryPrompt } from "@/lib/summarize";

interface WordByWordTextProps {
  text: string;
  onComplete?: () => void;
}

function WordByWordText({ text, onComplete }: WordByWordTextProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const words = text.split(" ");

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

  return (
    <span>
      {words.slice(0, visibleCount).join(" ")}
      {visibleCount < words.length && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: 16,
            background: "var(--ashneer-accent)",
            marginLeft: 4,
            verticalAlign: "text-bottom",
            animation: "pulseOpacity 0.6s ease-in-out infinite",
          }}
        />
      )}
    </span>
  );
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

interface TankScreenProps {
  startup: StartupData;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  mood: Mood;
  onMoodChange: (mood: Mood) => void;
  fundability: number;
  onFundabilityChange: (score: number) => void;
  conversationSummary: string | null;
  setConversationSummary: React.Dispatch<React.SetStateAction<string | null>>;
  onVerdict: (verdict: VerdictData) => void;
}

export default function TankScreen({
  startup,
  messages,
  setMessages,
  mood,
  onMoodChange,
  fundability,
  onFundabilityChange,
  conversationSummary,
  setConversationSummary,
  onVerdict,
}: TankScreenProps) {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  const exchangeCount = Math.floor(messages.length / 2);
  const canRequestVerdict = messages.length >= 16;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, loading]);

  const consumeStream = async (response: Response): Promise<string> => {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6);
        try {
          const data = JSON.parse(jsonStr);
          if (data.error) throw new Error(data.error);
          if (data.chunk) fullText += data.chunk;
          if (data.done) return fullText;
        } catch (e: unknown) {
          if (e instanceof Error && !e.message.includes("Unexpected")) throw e;
        }
      }
    }
    return fullText;
  };

  const triggerSummarization = useCallback(
    async (msgs: ChatMessage[]) => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: msgs,
            systemPrompt: buildSummaryPrompt(),
            stream: false,
          }),
        });
        const data = await res.json();
        if (data.text) {
          setConversationSummary(data.text);
        }
      } catch {
        // Summarization failure is non-critical
      }
    },
    [setConversationSummary]
  );

  const sendMessage = useCallback(
    async (userText: string, isVerdict = false) => {
      const userMessage: ChatMessage = { role: "user", content: userText };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setDisplayMessages((prev) => [...prev, { role: "user", text: userText }]);
      setInput("");
      setLoading(true);
      setError(null);

      try {
        let apiMessages: ChatMessage[];
        let systemPrompt: string;

        if (isVerdict) {
          systemPrompt = buildVerdictPrompt(startup, conversationSummary);
          apiMessages =
            conversationSummary && newMessages.length > 4
              ? newMessages.slice(-4)
              : newMessages;
        } else if (conversationSummary && newMessages.length > 8) {
          systemPrompt = buildSystemPrompt(startup, conversationSummary);
          apiMessages = newMessages.slice(-4);
        } else {
          systemPrompt = buildSystemPrompt(startup, null);
          apiMessages = newMessages;
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            systemPrompt,
            stream: true,
          }),
        });

        if (!response.ok) throw new Error("API request failed");

        const fullText = await consumeStream(response);
        let parsed: AshneerResponse;
        try {
          parsed = JSON.parse(fullText);
        } catch {
          throw new Error("Invalid response format");
        }

        const { mood: newMood, fundability: newFund, dialogue, verdict } = parsed;

        if (newMood) onMoodChange(newMood);
        if (newFund != null) onFundabilityChange(newFund);

        const assistantMessage: ChatMessage = { role: "assistant", content: fullText };
        const updatedMessages = [...newMessages, assistantMessage];
        setMessages(updatedMessages);
        setDisplayMessages((prev) => [
          ...prev,
          { role: "assistant", text: dialogue, mood: newMood },
        ]);

        if (isVerdict && verdict) {
          setTimeout(() => {
            onVerdict({ ...parsed, verdict } as VerdictData);
          }, 2000);
        }

        if (updatedMessages.length === 8 && !conversationSummary) {
          triggerSummarization(updatedMessages);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        setDisplayMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Bhai mera connection cut gaya. Phir bol.",
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [
      messages,
      setMessages,
      startup,
      conversationSummary,
      onMoodChange,
      onFundabilityChange,
      onVerdict,
      triggerSummarization,
    ]
  );

  const handleRetry = useCallback(() => {
    setDisplayMessages((prev) => prev.filter((m) => !m.isError));
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === "user") {
      setMessages((prev) => prev.slice(0, -1));
      sendMessage(lastUserMsg.content);
    }
  }, [messages, setMessages, sendMessage]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || loading) return;
    sendMessage(text);
  }, [input, loading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVerdictRequest = useCallback(() => {
    sendMessage("Main apna pitch de chuka hoon. Ab faisla sunao.", true);
  }, [sendMessage]);

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = "auto";
    target.style.height = Math.min(target.scrollHeight, 96) + "px";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        fontFamily: "var(--font-dm), sans-serif",
      }}
    >
      {/* LEFT PANEL */}
      <div
        style={{
          width: isMobile ? "100%" : "30%",
          minWidth: isMobile ? "auto" : 240,
          maxWidth: isMobile ? "none" : 320,
          padding: isMobile ? "16px 16px 8px" : "32px 24px",
          display: "flex",
          flexDirection: isMobile ? "row" : "column",
          alignItems: "center",
          justifyContent: isMobile ? "space-between" : "flex-start",
          gap: isMobile ? 16 : 24,
          borderRight: isMobile ? "none" : "1px solid var(--border-subtle)",
          borderBottom: isMobile ? "1px solid var(--border-subtle)" : "none",
        }}
      >
        <AshneerPortrait mood={mood} size={isMobile ? "small" : "normal"} />
        <FundabilityMeter value={fundability} horizontal={isMobile} />
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: isMobile ? "calc(100vh - 180px)" : "100vh",
          position: "relative",
        }}
      >
        {/* Chat area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? "16px 12px" : "24px 32px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {displayMessages.length === 0 && !loading && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                animation: "fadeIn 0.6s ease both",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "var(--ashneer-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-dm), sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0e0c0b",
                }}
              >
                AG
              </div>
              <p style={{ fontSize: 14, color: "var(--text-muted)", fontStyle: "italic", textAlign: "center" }}>
                Ashneer is watching. Make your opening pitch.
              </p>
              <p style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center" }}>
                Apna idea, numbers, aur vision — seedha baat karo.
              </p>
            </div>
          )}

          {displayMessages.map((msg, i) => (
            <div key={i}>
              {msg.role === "assistant" ? (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", animation: "fadeUp 0.3s ease both" }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: msg.isError ? "var(--meter-red)" : "var(--ashneer-accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#0e0c0b",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    AG
                  </div>
                  <div>
                    <div
                      style={{
                        background: "var(--surface-raised)",
                        borderRadius: "4px 16px 16px 16px",
                        padding: "16px 20px",
                        fontFamily: "var(--font-playfair), serif",
                        fontSize: 16,
                        lineHeight: 1.8,
                        color: "var(--text-primary)",
                        maxWidth: 520,
                      }}
                    >
                      {msg.isError ? msg.text : <WordByWordText text={msg.text} />}
                    </div>
                    {msg.isError && (
                      <button
                        onClick={handleRetry}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--ashneer-accent)",
                          fontFamily: "var(--font-dm), sans-serif",
                          fontSize: 12,
                          cursor: "pointer",
                          marginTop: 6,
                          padding: 0,
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                      >
                        Phir try karo
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "flex-end", animation: "fadeUp 0.3s ease both" }}>
                  <div
                    style={{
                      background: "rgba(232,137,26,0.12)",
                      border: "1px solid rgba(232,137,26,0.2)",
                      borderRadius: "16px 4px 16px 16px",
                      padding: "12px 18px",
                      fontSize: 15,
                      color: "var(--text-primary)",
                      maxWidth: 420,
                      lineHeight: 1.6,
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--ashneer-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#0e0c0b",
                  flexShrink: 0,
                }}
              >
                AG
              </div>
              <PenTapLoader />
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Progress + Input */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            padding: isMobile ? "8px 12px" : "12px 32px",
            paddingBottom: isMobile ? "calc(8px + env(safe-area-inset-bottom, 0px))" : 12,
            background: "var(--bg-deep)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span
              style={{
                fontSize: 11,
                color: canRequestVerdict ? "var(--ashneer-accent)" : "var(--text-dim)",
                fontFamily: "var(--font-dm), sans-serif",
                transition: "color 0.3s ease",
              }}
            >
              {canRequestVerdict
                ? "Verdict ready"
                : exchangeCount > 0
                ? `Exchange ${exchangeCount} of 8`
                : "Start your pitch"}
            </span>

            {canRequestVerdict && !loading && (
              <button
                onClick={handleVerdictRequest}
                style={{
                  background: "var(--ashneer-accent)",
                  color: "#0e0c0b",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 18px",
                  fontFamily: "var(--font-dm), sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  animation: "borderPulse 2s ease-in-out infinite",
                }}
              >
                Verdict Maango
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={handleTextareaInput}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Apna jawab do..."
              rows={1}
              style={{
                flex: 1,
                background: "var(--surface-raised)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 10,
                padding: "12px 16px",
                color: "var(--text-primary)",
                fontFamily: "var(--font-dm), sans-serif",
                fontSize: 15,
                outline: "none",
                resize: "none",
                maxHeight: 96,
                opacity: loading ? 0.5 : 1,
                transition: "border-color 0.2s, opacity 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(232,137,26,0.5)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: input.trim() && !loading ? "var(--ashneer-accent)" : "rgba(232,137,26,0.2)",
                border: "none",
                color: "#0e0c0b",
                fontSize: 18,
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

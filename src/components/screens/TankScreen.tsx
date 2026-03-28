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
  onExit: () => void;
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
  onExit,
}: TankScreenProps) {
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [confirmingExit, setConfirmingExit] = useState(false);
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
            text: "Connection lost. Please try again.",
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
    sendMessage("I've completed my pitch. Give me your verdict.", true);
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
          position: "relative",
        }}
      >
        <AshneerPortrait mood={mood} size={isMobile ? "small" : "normal"} />
        <FundabilityMeter value={fundability} horizontal={isMobile} />

        {/* Mobile exit button (top-right corner) */}
        {isMobile && (
          <div style={{ position: "absolute", top: 8, right: 12, zIndex: 2 }}>
            {!confirmingExit ? (
              <button
                onClick={() => setConfirmingExit(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-dim)",
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "var(--font-dm), sans-serif",
                  padding: "4px 0",
                }}
              >
                ×
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", padding: "4px 8px", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Leave?</span>
                <button
                  onClick={onExit}
                  style={{
                    background: "none",
                    border: "1px solid var(--meter-red)",
                    color: "var(--meter-red)",
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 3,
                    cursor: "pointer",
                    fontFamily: "var(--font-dm), sans-serif",
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmingExit(false)}
                  style={{
                    background: "none",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 3,
                    cursor: "pointer",
                    fontFamily: "var(--font-dm), sans-serif",
                  }}
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}

        {/* Exit button */}
        {!isMobile && (
          <div style={{ marginTop: "auto", paddingTop: 24, width: "100%" }}>
            {!confirmingExit ? (
              <button
                onClick={() => setConfirmingExit(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-dim)",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "var(--font-dm), sans-serif",
                  padding: "6px 0",
                }}
              >
                Leave Chat ×
              </button>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Are you sure?</span>
                <button
                  onClick={onExit}
                  style={{
                    background: "none",
                    border: "1px solid var(--meter-red)",
                    color: "var(--meter-red)",
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 3,
                    cursor: "pointer",
                    fontFamily: "var(--font-dm), sans-serif",
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmingExit(false)}
                  style={{
                    background: "none",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 3,
                    cursor: "pointer",
                    fontFamily: "var(--font-dm), sans-serif",
                  }}
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
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
            padding: isMobile ? "20px 14px" : "32px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
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
                gap: 16,
                animation: "fadeIn 0.6s ease both",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #e8891a, #f0a500)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-dm), sans-serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#fff",
                  boxShadow: "0 4px 16px rgba(232,137,26,0.25)",
                }}
              >
                AG
              </div>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: 18, color: "var(--text-primary)", fontStyle: "italic", textAlign: "center" }}>
                Ashneer is watching.
              </p>
              <p style={{ fontFamily: "var(--font-dm), sans-serif", fontSize: 13, color: "var(--text-dim)", textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>
                Present your idea, numbers, and vision. No excuses.
              </p>
            </div>
          )}

          {displayMessages.map((msg, i) => (
            <div key={i}>
              {msg.role === "assistant" ? (
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", animation: "fadeUp 0.4s ease both", maxWidth: isMobile ? "95%" : "80%" }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: msg.isError
                        ? "linear-gradient(135deg, var(--meter-red), #e04545)"
                        : "linear-gradient(135deg, #e8891a, #f0a500)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#fff",
                      flexShrink: 0,
                      marginTop: 4,
                      boxShadow: msg.isError
                        ? "0 2px 8px rgba(211,47,47,0.2)"
                        : "0 2px 8px rgba(232,137,26,0.2)",
                    }}
                  >
                    AG
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontFamily: "var(--font-dm), sans-serif", fontSize: 11, color: "var(--text-dim)", display: "block", marginBottom: 6, fontWeight: 500 }}>
                      Ashneer Grover
                    </span>
                    <div
                      style={{
                        background: "var(--surface-raised)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "2px 16px 16px 16px",
                        padding: "18px 22px",
                        fontFamily: "var(--font-dm), sans-serif",
                        fontSize: 15,
                        lineHeight: 1.85,
                        color: "var(--text-primary)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
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
                          marginTop: 8,
                          padding: 0,
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                      >
                        Retry →
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "flex-end", animation: "fadeUp 0.3s ease both" }}>
                  <div style={{ maxWidth: isMobile ? "85%" : "65%", minWidth: 0 }}>
                    <span style={{ fontFamily: "var(--font-dm), sans-serif", fontSize: 11, color: "var(--text-dim)", display: "block", marginBottom: 6, fontWeight: 500, textAlign: "right" }}>
                      You
                    </span>
                    <div
                      style={{
                        background: "rgba(232,137,26,0.08)",
                        border: "1px solid rgba(232,137,26,0.15)",
                        borderRadius: "16px 2px 16px 16px",
                        padding: "16px 20px",
                        fontFamily: "var(--font-dm), sans-serif",
                        fontSize: 15,
                        color: "var(--text-primary)",
                        lineHeight: 1.7,
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #e8891a, #f0a500)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(232,137,26,0.2)",
                }}
              >
                AG
              </div>
              <div style={{ paddingTop: 4 }}>
                <PenTapLoader />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Progress + Input */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            padding: isMobile ? "10px 14px" : "14px 40px",
            paddingBottom: isMobile ? "calc(10px + env(safe-area-inset-bottom, 0px))" : 14,
            background: "var(--bg-deep)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-dim)",
                  fontFamily: "var(--font-dm), sans-serif",
                  fontWeight: 500,
                }}
              >
                {canRequestVerdict
                  ? "Verdict ready"
                  : exchangeCount > 0
                  ? `Exchange ${exchangeCount} of 8`
                  : "Start your pitch"}
              </span>
              {exchangeCount > 0 && !canRequestVerdict && (
                <div style={{ display: "flex", gap: 3 }}>
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: 14,
                        height: 3,
                        borderRadius: 2,
                        background: idx < exchangeCount
                          ? "var(--ashneer-accent)"
                          : "var(--border-subtle)",
                        transition: "background 0.3s ease",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {canRequestVerdict && !loading && (
              <button
                onClick={handleVerdictRequest}
                style={{
                  background: "linear-gradient(135deg, #e8891a, #f0a500)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontFamily: "var(--font-dm), sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(232,137,26,0.25)",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(232,137,26,0.35)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(232,137,26,0.25)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Get Verdict
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
              placeholder="Type your response..."
              rows={1}
              style={{
                flex: 1,
                background: "var(--surface-raised)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                padding: "13px 18px",
                color: "var(--text-primary)",
                fontFamily: "var(--font-dm), sans-serif",
                fontSize: 15,
                outline: "none",
                resize: "none",
                maxHeight: 96,
                opacity: loading ? 0.5 : 1,
                transition: "border-color 0.2s, opacity 0.2s, box-shadow 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(232,137,26,0.5)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-subtle)";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: input.trim() && !loading
                  ? "var(--ashneer-accent)"
                  : "rgba(232,137,26,0.15)",
                border: "none",
                color: input.trim() && !loading ? "#0e0c0b" : "var(--text-dim)",
                fontSize: 18,
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s, box-shadow 0.2s, transform 0.1s",
                boxShadow: input.trim() && !loading
                  ? "0 2px 10px rgba(232,137,26,0.25)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (input.trim() && !loading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
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

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Mood, Screen, StartupData, VerdictData, ChatMessage } from "@/lib/types";
import LobbyScreen from "./screens/LobbyScreen";
import SetupScreen from "./screens/SetupScreen";
import TankScreen from "./screens/TankScreen";
import VerdictScreen from "./screens/VerdictScreen";

const MOOD_BACKGROUNDS: Record<Mood, string> = {
  disinterested: "radial-gradient(ellipse at top, #1a1410 0%, #0e0c0b 100%)",
  suspicious: "radial-gradient(ellipse at top, #1a1814 0%, #0e0c0b 100%)",
  impressed: "radial-gradient(ellipse at top, #2a1f0e 0%, #0e0c0b 100%)",
  invested: "radial-gradient(ellipse at top, #2e1e08 0%, #0e0c0b 100%)",
};

const SESSION_KEY = "pitchTankSession";

interface SessionState {
  screen: Screen;
  startup: StartupData | null;
  messages: ChatMessage[];
  mood: Mood;
  fundability: number;
  fundabilityHistory: number[];
  conversationSummary: string | null;
  verdict: VerdictData | null;
}

function loadSession(): SessionState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionState;
    if (data.screen === "verdict" && !data.verdict) return null;
    if (data.screen === "tank" && !data.startup) return null;
    return data;
  } catch {
    return null;
  }
}

function saveSession(state: SessionState) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("lobby");
  const [transitioning, setTransitioning] = useState(false);
  const [startup, setStartup] = useState<StartupData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mood, setMood] = useState<Mood>("disinterested");
  const [fundability, setFundability] = useState(20);
  const [fundabilityHistory, setFundabilityHistory] = useState<number[]>([20]);
  const [conversationSummary, setConversationSummary] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<VerdictData | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const pendingScreenRef = useRef<Screen | null>(null);

  // Restore session on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.screen !== "lobby") {
      setScreen(saved.screen);
      setStartup(saved.startup);
      setMessages(saved.messages);
      setMood(saved.mood);
      setFundability(saved.fundability);
      setFundabilityHistory(saved.fundabilityHistory);
      setConversationSummary(saved.conversationSummary);
      setVerdict(saved.verdict);
    }
    setHydrated(true);
  }, []);

  // Persist session on state changes
  useEffect(() => {
    if (!hydrated) return;
    if (screen === "lobby") {
      clearSession();
      return;
    }
    saveSession({
      screen, startup, messages, mood,
      fundability, fundabilityHistory, conversationSummary, verdict,
    });
  }, [hydrated, screen, startup, messages, mood, fundability, fundabilityHistory, conversationSummary, verdict]);

  const changeScreen = useCallback((newScreen: Screen) => {
    setTransitioning(true);
    pendingScreenRef.current = newScreen;
    setTimeout(() => {
      setScreen(newScreen);
      setTimeout(() => setTransitioning(false), 50);
    }, 300);
  }, []);

  const handleEnterLobby = useCallback(() => {
    changeScreen("setup");
  }, [changeScreen]);

  const handleSubmitSetup = useCallback(
    (startupData: StartupData) => {
      setStartup(startupData);
      setMessages([]);
      setMood("disinterested");
      setFundability(20);
      setFundabilityHistory([20]);
      setConversationSummary(null);
      setVerdict(null);
      changeScreen("tank");
    },
    [changeScreen]
  );

  const handleMoodChange = useCallback((newMood: Mood) => {
    setMood(newMood);
  }, []);

  const handleFundabilityChange = useCallback((newScore: number) => {
    setFundability(newScore);
    setFundabilityHistory((prev) => [...prev, newScore]);
  }, []);

  const handleVerdict = useCallback(
    (verdictData: VerdictData) => {
      setVerdict(verdictData);
      if (verdictData.mood) setMood(verdictData.mood);
      if (verdictData.fundability != null) {
        setFundability(verdictData.fundability);
        setFundabilityHistory((prev) => [...prev, verdictData.fundability]);
      }
      changeScreen("verdict");
    },
    [changeScreen]
  );

  const handleRestart = useCallback(() => {
    clearSession();
    setStartup(null);
    setMessages([]);
    setMood("disinterested");
    setFundability(20);
    setFundabilityHistory([20]);
    setConversationSummary(null);
    setVerdict(null);
    changeScreen("lobby");
  }, [changeScreen]);

  const handleExit = useCallback(() => {
    clearSession();
    setStartup(null);
    setMessages([]);
    setMood("disinterested");
    setFundability(20);
    setFundabilityHistory([20]);
    setConversationSummary(null);
    setVerdict(null);
    changeScreen("lobby");
  }, [changeScreen]);

  if (!hydrated) return null;

  const renderScreen = () => {
    switch (screen) {
      case "lobby":
        return <LobbyScreen onEnter={handleEnterLobby} />;
      case "setup":
        return <SetupScreen onSubmit={handleSubmitSetup} />;
      case "tank":
        return (
          <TankScreen
            startup={startup!}
            messages={messages}
            setMessages={setMessages}
            mood={mood}
            onMoodChange={handleMoodChange}
            fundability={fundability}
            onFundabilityChange={handleFundabilityChange}
            conversationSummary={conversationSummary}
            setConversationSummary={setConversationSummary}
            onVerdict={handleVerdict}
            onExit={handleExit}
          />
        );
      case "verdict":
        return (
          <VerdictScreen
            verdict={verdict!}
            fundabilityHistory={fundabilityHistory}
            onRestart={handleRestart}
          />
        );
      default:
        return null;
    }
  };

  const showMoodBg = screen !== "lobby";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: showMoodBg
          ? (MOOD_BACKGROUNDS[mood] || MOOD_BACKGROUNDS.disinterested)
          : "#0e0c0b",
        transition: "background 2s ease",
        opacity: transitioning ? 0 : 1,
        transitionProperty: "opacity, background",
        transitionDuration: "0.4s, 2s",
        transitionTimingFunction: "ease, ease",
      }}
    >
      {renderScreen()}
    </div>
  );
}

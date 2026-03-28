"use client";

import { useState, useCallback, useRef } from "react";
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

  const pendingScreenRef = useRef<Screen | null>(null);

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
    setStartup(null);
    setMessages([]);
    setMood("disinterested");
    setFundability(20);
    setFundabilityHistory([20]);
    setConversationSummary(null);
    setVerdict(null);
    changeScreen("lobby");
  }, [changeScreen]);

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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: MOOD_BACKGROUNDS[mood] || MOOD_BACKGROUNDS.disinterested,
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

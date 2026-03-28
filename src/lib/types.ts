export type Mood = "disinterested" | "suspicious" | "impressed" | "invested";

export type Screen = "lobby" | "setup" | "tank" | "verdict";

export interface StartupData {
  idea: string;
  sector: string;
  stage: string;
  strength: string;
  weakness: string;
}

export interface VerdictBreakdown {
  respected: string;
  killShot: string;
  conditional: string;
  gutLine: string;
}

export interface VerdictData {
  mood: Mood;
  fundability: number;
  dialogue: string;
  verdict: VerdictBreakdown;
}

export interface AshneerResponse {
  mood: Mood;
  fundability: number;
  dialogue: string;
  verdict?: VerdictBreakdown;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DisplayMessage {
  role: "user" | "assistant";
  text: string;
  mood?: Mood;
  isError?: boolean;
}

export interface StartupTerm {
  term: string;
  definition: string;
}

// Lightweight in-memory + localStorage store for the latest results across routes.
import type { VoiceAnalysisResponse, HandwritingAnalysisResponse, PredictionResult } from "./api";

const KEY = "neurosense-state-v1";

export interface AppState {
  voice?: VoiceAnalysisResponse;
  handwriting?: HandwritingAnalysisResponse;
  biomedical?: PredictionResult;
  history: { id: string; date: string; risk: string; probability: number; modality: string }[];
}

const listeners = new Set<() => void>();
let state: AppState = load();

function load(): AppState {
  if (typeof window === "undefined") return { history: [] };
  try { return JSON.parse(localStorage.getItem(KEY) ?? "") as AppState; }
  catch { return { history: [] }; }
}
function save() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function getState() { return state; }
export function subscribe(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }
export function setState(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  save();
  listeners.forEach((l) => l());
}
export function pushHistory(entry: AppState["history"][number]) {
  state = { ...state, history: [entry, ...state.history].slice(0, 25) };
  save();
  listeners.forEach((l) => l());
}

import { useSyncExternalStore } from "react";
export function useAppState(): AppState {
  return useSyncExternalStore(
    (cb) => subscribe(cb),
    () => state,
    () => state,
  );
}

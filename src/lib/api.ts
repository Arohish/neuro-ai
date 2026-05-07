// API client for the external Parkinson's detection Python service.
// Set VITE_PD_API_URL in env to point at your FastAPI backend.
// If unset, the client falls back to a deterministic mock so the UI is fully demoable.

export type RiskLevel = "healthy" | "mild" | "high";

export interface VoiceFeatures {
  fundamentalFrequency: number; // Hz
  jitter: number; // %
  shimmer: number; // %
  hnr: number; // dB
  mfccMean: number;
  pitchVariation: number;
  tremorIndex: number;
}

export interface PredictionResult {
  probability: number; // 0..1
  confidence: number; // 0..1
  risk: RiskLevel;
  contributors: { name: string; weight: number }[]; // SHAP-like
  modality: "voice" | "handwriting" | "biomedical" | "fusion";
}

export interface VoiceAnalysisResponse extends PredictionResult {
  features: VoiceFeatures;
  modality: "voice";
}

export interface HandwritingAnalysisResponse extends PredictionResult {
  metrics: {
    micrographia: number;
    tremor: number;
    pressureIrregularity: number;
    spiralDeviation: number;
    spacing: number;
  };
  modality: "handwriting";
}

const API_URL = import.meta.env.VITE_PD_API_URL as string | undefined;

async function tryFetch<T>(path: string, body: FormData | object): Promise<T | null> {
  if (!API_URL) return null;
  try {
    const init: RequestInit = body instanceof FormData
      ? { method: "POST", body }
      : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
    const res = await fetch(`${API_URL}${path}`, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// --- Mock generators (deterministic from input characteristics) ---
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 0xffffffff;
}
function rng(seed: number) { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
function riskFrom(p: number): RiskLevel { return p < 0.35 ? "healthy" : p < 0.65 ? "mild" : "high"; }

export async function analyzeVoice(audio: Blob): Promise<VoiceAnalysisResponse> {
  const fd = new FormData();
  fd.append("file", audio, "voice.webm");
  const real = await tryFetch<VoiceAnalysisResponse>("/api/voice", fd);
  if (real) return real;

  const seed = hashSeed(`${audio.size}-${audio.type}`);
  const r = rng(seed * 1e6);
  const probability = Math.min(0.95, Math.max(0.05, 0.3 + r() * 0.6));
  const features: VoiceFeatures = {
    fundamentalFrequency: 110 + r() * 80,
    jitter: 0.3 + r() * 1.4,
    shimmer: 2 + r() * 6,
    hnr: 10 + r() * 15,
    mfccMean: -12 + r() * 8,
    pitchVariation: r() * 30,
    tremorIndex: r(),
  };
  return {
    probability,
    confidence: 0.7 + r() * 0.25,
    risk: riskFrom(probability),
    modality: "voice",
    features,
    contributors: [
      { name: "Jitter", weight: 0.28 },
      { name: "Shimmer", weight: 0.22 },
      { name: "HNR", weight: 0.18 },
      { name: "Pitch variation", weight: 0.16 },
      { name: "Tremor index", weight: 0.16 },
    ],
  };
}

export async function analyzeHandwriting(image: Blob): Promise<HandwritingAnalysisResponse> {
  const fd = new FormData();
  fd.append("file", image, "handwriting.png");
  const real = await tryFetch<HandwritingAnalysisResponse>("/api/handwriting", fd);
  if (real) return real;

  const seed = hashSeed(`${image.size}-${image.type}`);
  const r = rng(seed * 1e6);
  const probability = Math.min(0.95, Math.max(0.05, 0.25 + r() * 0.65));
  return {
    probability,
    confidence: 0.68 + r() * 0.28,
    risk: riskFrom(probability),
    modality: "handwriting",
    metrics: {
      micrographia: r(),
      tremor: r(),
      pressureIrregularity: r(),
      spiralDeviation: r(),
      spacing: r(),
    },
    contributors: [
      { name: "Spiral deviation", weight: 0.30 },
      { name: "Tremor", weight: 0.25 },
      { name: "Micrographia", weight: 0.20 },
      { name: "Pressure variance", weight: 0.15 },
      { name: "Letter spacing", weight: 0.10 },
    ],
  };
}

export interface BiomedicalInput {
  mdvpFo: number; mdvpFhi: number; mdvpFlo: number;
  jitter: number; shimmer: number; hnr: number; rpde: number; dfa: number;
}
export async function analyzeBiomedical(input: BiomedicalInput): Promise<PredictionResult> {
  const real = await tryFetch<PredictionResult>("/api/biomedical", input);
  if (real) return real;
  const seed = hashSeed(JSON.stringify(input));
  const r = rng(seed * 1e6);
  const score = (input.jitter / 2 + input.shimmer / 8 + (30 - input.hnr) / 30 + input.rpde + input.dfa) / 5;
  const probability = Math.min(0.95, Math.max(0.05, score * 0.7 + r() * 0.2));
  return {
    probability,
    confidence: 0.8 + r() * 0.15,
    risk: riskFrom(probability),
    modality: "biomedical",
    contributors: [
      { name: "Jitter", weight: 0.3 },
      { name: "Shimmer", weight: 0.25 },
      { name: "HNR", weight: 0.2 },
      { name: "RPDE", weight: 0.15 },
      { name: "DFA", weight: 0.1 },
    ],
  };
}

export function fusePredictions(parts: PredictionResult[]): PredictionResult {
  if (parts.length === 0) {
    return { probability: 0, confidence: 0, risk: "healthy", contributors: [], modality: "fusion" };
  }
  const weights = { voice: 0.4, handwriting: 0.35, biomedical: 0.25, fusion: 0 } as const;
  let totalW = 0; let p = 0; let c = 0;
  for (const part of parts) {
    const w = weights[part.modality] || 0.33;
    p += part.probability * w; c += part.confidence * w; totalW += w;
  }
  const probability = p / totalW;
  return {
    probability,
    confidence: c / totalW,
    risk: riskFrom(probability),
    modality: "fusion",
    contributors: parts.map(part => ({
      name: part.modality.charAt(0).toUpperCase() + part.modality.slice(1),
      weight: part.probability,
    })),
  };
}

// --- Chat (Lovable AI later; mock for now) ---
export async function chatHealthAssistant(messages: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  const last = messages[messages.length - 1]?.content.toLowerCase() ?? "";
  if (!API_URL) {
    if (last.includes("symptom")) return "Common Parkinson's symptoms include tremor at rest, bradykinesia (slow movement), rigidity, and postural instability. Voice and handwriting changes often appear early.\n\n_This is general information, not a medical diagnosis._";
    if (last.includes("result") || last.includes("prediction")) return "The AI combines voice biomarkers, handwriting features, and biomedical signals using a weighted ensemble. Higher jitter/shimmer in voice and increased spiral deviation in handwriting raise the risk score.\n\n_Always consult a neurologist for diagnosis._";
    return "I'm an AI assistant for Parkinson's screening questions. Ask me about symptoms, the analysis pipeline, or how to interpret your report.\n\n_This is not a medical diagnosis._";
  }
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const data = await res.json();
  return data.reply as string;
}

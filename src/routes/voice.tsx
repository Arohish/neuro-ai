import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Upload, Play, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { analyzeVoice, type VoiceAnalysisResponse } from "@/lib/api";
import { RiskMeter } from "@/components/RiskMeter";
import { ContributorChart } from "@/components/ContributorChart";
import { setState as setAppState, pushHistory, useAppState } from "@/lib/store";

export const Route = createFileRoute("/voice")({
  head: () => ({ meta: [{ title: "Voice Analysis · NeuroSense" }, { name: "description", content: "Real-time voice biomarker extraction for Parkinson's screening." }] }),
  component: VoicePage,
});

function VoicePage() {
  const { voice } = useAppState();
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(Array(48).fill(4));
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const arr = Array.from(data).slice(0, 48).map((v) => Math.max(4, (v / 255) * 60));
        setLevels(arr);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      const rec = new MediaRecorder(stream);
      mediaRef.current = rec; chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        await runAnalysis(blob);
      };
      rec.start();
      setRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setLevels(Array(48).fill(4));
    setRecording(false);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setAudioUrl(URL.createObjectURL(file));
    await runAnalysis(file);
  }

  async function runDemo() {
    // Synthesize 1s of white noise as a deterministic demo blob
    const ctx = new AudioContext(); const buf = ctx.createBuffer(1, 22050, 22050);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() - 0.5) * 0.4;
    const off = new OfflineAudioContext(1, 22050, 22050);
    const s = off.createBufferSource(); s.buffer = buf; s.connect(off.destination); s.start();
    const rendered = await off.startRendering();
    const wav = audioBufferToWav(rendered);
    const blob = new Blob([wav], { type: "audio/wav" });
    setAudioUrl(URL.createObjectURL(blob));
    await runAnalysis(blob);
  }

  async function runAnalysis(blob: Blob) {
    setAnalyzing(true);
    try {
      const res = await analyzeVoice(blob);
      setAppState({ voice: res });
      pushHistory({ id: crypto.randomUUID(), date: new Date().toISOString(), risk: res.risk, probability: res.probability, modality: "voice" });
      toast.success("Voice analysis complete");
    } catch {
      toast.error("Analysis failed");
    } finally { setAnalyzing(false); }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Voice Analysis</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Sustain the vowel "ahhh" for 3–5 seconds. We extract jitter, shimmer, HNR, MFCCs and pitch variation,
          then score Parkinson's risk via the trained ensemble.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="border-border bg-card p-6">
          <div className="flex h-40 items-end justify-center gap-1 rounded-xl bg-secondary/60 p-4">
            {levels.map((h, i) => (
              <motion.div key={i} animate={{ height: h }} transition={{ duration: 0.08 }}
                className="w-1.5 rounded-full" style={{ background: "var(--gradient-primary)" }} />
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!recording ? (
              <Button onClick={startRecording} className="gap-2" disabled={analyzing}>
                <Mic className="h-4 w-4" /> Start recording
              </Button>
            ) : (
              <Button onClick={stopRecording} variant="destructive" className="gap-2">
                <Square className="h-4 w-4" /> Stop
              </Button>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background/40 px-4 py-2 text-sm hover:bg-background/70">
              <Upload className="h-4 w-4" /> Upload .wav / .mp3
              <input type="file" accept="audio/*" className="hidden" onChange={onUpload} />
            </label>
            <Button variant="secondary" onClick={runDemo} disabled={analyzing} className="gap-2">
              <Sparkles className="h-4 w-4" /> Try demo sample
            </Button>
            {audioUrl && (
              <audio controls src={audioUrl} className="ml-auto h-9" />
            )}
          </div>
          {analyzing && <p className="mt-4 text-sm text-accent">Extracting biomarkers…</p>}
        </Card>

        <Card className="border-border bg-card p-6">
          {voice ? (
            <div className="flex flex-col items-center gap-4">
              <RiskMeter probability={voice.probability} risk={voice.risk} label="Voice risk" />
              <div className="text-center text-sm text-muted-foreground">
                Confidence <span className="font-medium text-foreground">{(voice.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              <div>
                <Play className="mx-auto mb-3 h-10 w-10 opacity-40" />
                Record or upload a sample to see your risk score.
              </div>
            </div>
          )}
        </Card>
      </div>

      {voice && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="border-border bg-card p-6">
            <h3 className="mb-3 font-semibold">Extracted biomedical features</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Stat k="Fundamental freq." v={`${voice.features.fundamentalFrequency.toFixed(1)} Hz`} />
              <Stat k="Jitter" v={`${voice.features.jitter.toFixed(2)} %`} />
              <Stat k="Shimmer" v={`${voice.features.shimmer.toFixed(2)} %`} />
              <Stat k="HNR" v={`${voice.features.hnr.toFixed(1)} dB`} />
              <Stat k="MFCC mean" v={voice.features.mfccMean.toFixed(2)} />
              <Stat k="Pitch variation" v={voice.features.pitchVariation.toFixed(2)} />
              <Stat k="Tremor index" v={voice.features.tremorIndex.toFixed(2)} />
            </dl>
          </Card>
          <Card className="border-border bg-card p-6">
            <h3 className="mb-3 font-semibold">Feature contribution (SHAP-like)</h3>
            <ContributorChart data={voice.contributors} />
            <p className="mt-3 text-xs text-muted-foreground">
              Higher jitter and shimmer combined with low HNR most strongly increased the predicted risk.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/40 pb-1">
      <dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd>
    </div>
  );
}

// Minimal WAV encoder for demo
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numCh = 1, sr = buffer.sampleRate;
  const samples = buffer.getChannelData(0);
  const out = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(out);
  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF"); view.setUint32(4, 36 + samples.length * 2, true); writeStr(8, "WAVE");
  writeStr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true); view.setUint32(28, sr * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeStr(36, "data"); view.setUint32(40, samples.length * 2, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++, off += 2) {
  const s = Math.max(-1, Math.min(1, samples[i]));
  view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
}

return out;
}
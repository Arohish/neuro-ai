import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeBiomedical, fusePredictions, type PredictionResult } from "@/lib/api";
import { RiskMeter } from "@/components/RiskMeter";
import { ContributorChart } from "@/components/ContributorChart";
import { useAppState, setState as setAppState, pushHistory } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/combined")({
  head: () => ({ meta: [{ title: "Combined AI Assessment · NeuroSense" }, { name: "description", content: "Multimodal weighted ensemble Parkinson's risk score." }] }),
  component: CombinedPage,
});

function CombinedPage() {
  const { voice, handwriting, biomedical } = useAppState();
  const [form, setForm] = useState({ mdvpFo: 154, mdvpFhi: 197, mdvpFlo: 116, jitter: 0.6, shimmer: 4.2, hnr: 21.0, rpde: 0.5, dfa: 0.7 });
  const [running, setRunning] = useState(false);

  async function runBio() {
    setRunning(true);
    try {
      const res = await analyzeBiomedical(form);
      setAppState({ biomedical: res });
      pushHistory({ id: crypto.randomUUID(), date: new Date().toISOString(), risk: res.risk, probability: res.probability, modality: "biomedical" });
      toast.success("Biomedical analysis complete");
    } finally { setRunning(false); }
  }

  const parts: PredictionResult[] = [voice, handwriting, biomedical].filter(Boolean) as PredictionResult[];
  const fused = parts.length ? fusePredictions(parts) : null;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Combined AI Assessment</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The fusion engine weighs every modality (voice 40% · handwriting 35% · biomedical 25%) into a single
          explainable risk score.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">UCI biomedical features</h3>
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(form) as (keyof typeof form)[]).map((k) => (
              <div key={k}>
                <Label className="text-xs capitalize">{k.replace(/([A-Z])/g, " $1")}</Label>
                <Input type="number" step="0.01" value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: parseFloat(e.target.value) || 0 })} />
              </div>
            ))}
          </div>
          <Button className="mt-5 w-full" onClick={runBio} disabled={running}>
            {running ? "Analyzing…" : "Run biomedical model"}
          </Button>
        </Card>

        <Card className="relative overflow-hidden border-border bg-card p-6">
          <div className="absolute inset-0 -z-0 opacity-50" style={{ background: "var(--gradient-glow)" }} />
          <div className="relative z-10">
            <h3 className="mb-2 font-semibold">Fused multimodal risk</h3>
            {fused ? (
              <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
                <RiskMeter probability={fused.probability} risk={fused.risk} label="Combined" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Based on <strong className="text-foreground">{parts.length}</strong> modality{parts.length === 1 ? "" : "ies"},
                    the AI estimates a <strong className="text-foreground">{(fused.probability * 100).toFixed(0)}%</strong> Parkinson's likelihood
                    with <strong className="text-foreground">{(fused.confidence * 100).toFixed(0)}%</strong> confidence.
                  </p>
                  <ul className="mt-4 space-y-1 text-sm">
                    {voice && <li>· Voice biomarkers contributed <strong>{(voice.probability * 100).toFixed(0)}%</strong> risk signal.</li>}
                    {handwriting && <li>· Handwriting kinematics contributed <strong>{(handwriting.probability * 100).toFixed(0)}%</strong> risk signal.</li>}
                    {biomedical && <li>· UCI biomedical features contributed <strong>{(biomedical.probability * 100).toFixed(0)}%</strong> risk signal.</li>}
                  </ul>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Explanation: high jitter/shimmer combined with spiral deviation and reduced HNR drive the risk upward.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Run at least one modality to see the fused score.</p>
            )}
          </div>
        </Card>
      </div>

      {fused && (
        <Card className="mt-6 border-border bg-card p-6">
          <h3 className="mb-3 font-semibold">Per-modality contribution</h3>
          <ContributorChart data={fused.contributors} />
        </Card>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool, Upload, Eraser, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { analyzeHandwriting } from "@/lib/api";
import { RiskMeter } from "@/components/RiskMeter";
import { ContributorChart } from "@/components/ContributorChart";
import { setState as setAppState, pushHistory, useAppState } from "@/lib/store";

export const Route = createFileRoute("/handwriting")({
  head: () => ({ meta: [{ title: "Handwriting Analysis · NeuroSense" }, { name: "description", content: "Spiral and handwriting analysis for Parkinson's micrographia and tremor detection." }] }),
  component: HandwritingPage,
});

function HandwritingPage() {
  const { handwriting } = useAppState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d")!; ctx.fillStyle = "#0f1729"; ctx.fillRect(0, 0, c.width, c.height);
    // template spiral guide
    ctx.strokeStyle = "rgba(120,140,180,0.25)"; ctx.lineWidth = 1;
    ctx.beginPath();
    const cx = c.width / 2, cy = c.height / 2;
    for (let t = 0; t < 6 * Math.PI; t += 0.05) {
      const r = t * 6;
      const x = cx + r * Math.cos(t), y = cy + r * Math.sin(t);
      if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, []);

  function pos(e: React.PointerEvent) {
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  }
  function down(e: React.PointerEvent) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
    ctx.strokeStyle = "#7dd3fc"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!; const p = pos(e);
    ctx.lineTo(p.x, p.y); ctx.stroke();
  }
  function up() { drawing.current = false; }
  function clear() {
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#0f1729"; ctx.fillRect(0, 0, c.width, c.height);
    setPreviewUrl(null);
  }

  async function analyzeCanvas() {
    const c = canvasRef.current!;
    const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), "image/png"));
    setPreviewUrl(URL.createObjectURL(blob));
    await run(blob);
  }
  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setPreviewUrl(URL.createObjectURL(f)); await run(f);
  }
  async function runDemo() {
    // generate a wobbly spiral as demo
    const off = document.createElement("canvas"); off.width = 400; off.height = 400;
    const ctx = off.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 400, 400);
    ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.beginPath();
    for (let t = 0; t < 6 * Math.PI; t += 0.05) {
      const r = t * 8; const wobble = Math.sin(t * 5) * 3;
      const x = 200 + (r + wobble) * Math.cos(t), y = 200 + (r + wobble) * Math.sin(t);
      if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const blob: Blob = await new Promise((r) => off.toBlob((b) => r(b!), "image/png"));
    setPreviewUrl(URL.createObjectURL(blob)); await run(blob);
  }
  async function run(blob: Blob) {
    setAnalyzing(true);
    try {
      const res = await analyzeHandwriting(blob);
      setAppState({ handwriting: res });
      pushHistory({ id: crypto.randomUUID(), date: new Date().toISOString(), risk: res.risk, probability: res.probability, modality: "handwriting" });
      toast.success("Handwriting analysis complete");
    } catch { toast.error("Analysis failed"); } finally { setAnalyzing(false); }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Handwriting Analysis</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Trace the guide spiral or upload a writing sample. The CNN evaluates micrographia, tremor and pressure
          irregularity to estimate Parkinson's likelihood.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="border-border bg-card p-6">
          <div className="overflow-hidden rounded-xl border border-border">
            <canvas ref={canvasRef} width={640} height={420}
              onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
              className="h-[420px] w-full touch-none" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={analyzeCanvas} disabled={analyzing} className="gap-2">
              <PenTool className="h-4 w-4" /> Analyze drawing
            </Button>
            <Button variant="outline" onClick={clear} className="gap-2">
              <Eraser className="h-4 w-4" /> Clear
            </Button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background/40 px-4 py-2 text-sm hover:bg-background/70">
              <Upload className="h-4 w-4" /> Upload image
              <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
            </label>
            <Button variant="secondary" onClick={runDemo} disabled={analyzing} className="gap-2">
              <Sparkles className="h-4 w-4" /> Try demo
            </Button>
          </div>
          {previewUrl && <img src={previewUrl} alt="preview" className="mt-4 max-h-32 rounded-md border border-border" />}
        </Card>

        <Card className="border-border bg-card p-6">
          {handwriting ? (
            <div className="flex flex-col items-center gap-4">
              <RiskMeter probability={handwriting.probability} risk={handwriting.risk} label="Handwriting risk" />
              <div className="text-sm text-muted-foreground">
                Confidence <span className="font-medium text-foreground">{(handwriting.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              Draw or upload to begin.
            </div>
          )}
        </Card>
      </div>

      {handwriting && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="border-border bg-card p-6">
            <h3 className="mb-3 font-semibold">Detected handwriting metrics</h3>
            <div className="space-y-3">
              {Object.entries(handwriting.metrics).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{k.replace(/([A-Z])/g, " $1")}</span>
                    <span className="font-medium">{(v * 100).toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full" style={{ width: `${v * 100}%`, background: "var(--gradient-primary)" }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="border-border bg-card p-6">
            <h3 className="mb-3 font-semibold">Feature contribution</h3>
            <ContributorChart data={handwriting.contributors} />
          </Card>
        </div>
      )}
    </div>
  );
}

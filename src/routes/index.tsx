import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Mic, PenTool, Layers, Activity, ShieldCheck, Brain, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeuroSense — Multimodal Parkinson's AI Screening" },
      { name: "description", content: "Detect Parkinson's risk early through voice, handwriting and biomedical signal analysis powered by ensemble AI." },
    ],
  }),
  component: Overview,
});

const stats = [
  { label: "Modalities fused", value: "3", icon: Layers },
  { label: "Avg. model F1", value: "0.94", icon: Brain },
  { label: "Inference time", value: "<2s", icon: Sparkles },
  { label: "Privacy", value: "On-device", icon: ShieldCheck },
];

const modules = [
  { to: "/voice", title: "Voice Analysis", desc: "Record or upload a sustained vowel and extract jitter, shimmer, HNR, MFCCs in real time.", icon: Mic },
  { to: "/handwriting", title: "Handwriting Analysis", desc: "Draw a spiral or upload writing — CNN flags micrographia and tremor signatures.", icon: PenTool },
  { to: "/combined", title: "Combined AI Assessment", desc: "Weighted ensemble fuses every modality into a single risk score with explanations.", icon: Layers },
];

function Overview() {
  const { voice, handwriting, biomedical } = useAppState();
  const ready = [voice, handwriting, biomedical].filter(Boolean).length;
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 card-elev">
        <div className="absolute inset-0 -z-0 opacity-70" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative z-10 grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3 text-accent" /> Multimodal screening · Research preview
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
              Earlier signals.<br /><span className="gradient-text">Better outcomes.</span>
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              NeuroSense combines voice biomarkers, handwriting kinematics and biomedical features into a single
              explainable Parkinson's risk score — designed for clinicians, researchers and patients.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/voice" className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground glow transition hover:opacity-90">
                Start voice scan
              </Link>
              <Link to="/handwriting" className="rounded-md border border-border bg-background/40 px-5 py-2.5 text-sm font-medium hover:bg-background/70">
                Try handwriting
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <Card key={s.label} className="border-border bg-background/40 p-4 backdrop-blur">
                <s.icon className="h-4 w-4 text-accent" />
                <div className="mt-2 text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </motion.section>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        {modules.map((m, i) => (
          <motion.div key={m.to} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
            <Link to={m.to}>
              <Card className="group h-full border-border bg-card p-6 transition hover:border-primary/60 hover:shadow-[var(--shadow-glow)]">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-accent transition group-hover:scale-110">
                  <m.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{m.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Your session</h2>
            <p className="text-sm text-muted-foreground">{ready} of 3 modalities completed.</p>
          </div>
          <Link to="/combined" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
            View combined assessment
          </Link>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full transition-all" style={{ width: `${(ready / 3) * 100}%`, background: "var(--gradient-primary)" }} />
        </div>
      </section>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        NeuroSense is a research prototype. It does not provide medical diagnosis. Always consult a qualified neurologist.
      </p>
    </div>
  );
}

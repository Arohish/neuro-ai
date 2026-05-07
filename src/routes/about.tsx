import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Brain, Mic, PenTool, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About Parkinson's · NeuroSense" }, { name: "description", content: "Background on Parkinson's disease and how multimodal AI screening works." }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-bold">About Parkinson's Disease</h1>
      <p className="mt-3 text-muted-foreground">
        Parkinson's disease (PD) is a progressive neurological disorder affecting movement, speech and fine motor control.
        Early detection improves quality of life through timely intervention.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          { icon: Mic, title: "Voice biomarkers", text: "Reduced harmonic-to-noise ratio, increased jitter and shimmer often appear years before motor symptoms." },
          { icon: PenTool, title: "Handwriting changes", text: "Micrographia (smaller handwriting), tremor and irregular pressure are early indicators." },
          { icon: Brain, title: "Multimodal AI", text: "Combining modalities reduces false positives and improves screening accuracy beyond any single test." },
          { icon: ShieldCheck, title: "Privacy first", text: "Audio and drawings are processed in-session. NeuroSense is a research prototype, not a medical device." },
        ].map((c) => (
          <Card key={c.title} className="border-border bg-card p-5">
            <c.icon className="h-5 w-5 text-accent" />
            <h3 className="mt-3 font-semibold">{c.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{c.text}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        <strong className="text-foreground">Disclaimer.</strong> NeuroSense is a research and educational prototype.
        It does not provide medical diagnosis. Always consult a qualified neurologist for clinical evaluation.
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { useAppState } from "@/lib/store";
import { fusePredictions, type PredictionResult } from "@/lib/api";
import jsPDF from "jspdf";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · NeuroSense" }, { name: "description", content: "Download PDF reports of AI Parkinson's screening results." }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { voice, handwriting, biomedical, history } = useAppState();
  const parts = [voice, handwriting, biomedical].filter(Boolean) as PredictionResult[];
  const fused = parts.length ? fusePredictions(parts) : null;

  function generatePdf() {
    if (!fused) { toast.error("Run at least one analysis first"); return; }
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text("NeuroSense — Parkinson's Screening Report", 14, 20);
    doc.setFontSize(10); doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.setTextColor(0);
    doc.setFontSize(14); doc.text("Combined AI Assessment", 14, 42);
    doc.setFontSize(11);
    doc.text(`Risk level: ${fused.risk.toUpperCase()}`, 14, 52);
    doc.text(`Probability: ${(fused.probability * 100).toFixed(1)}%`, 14, 60);
    doc.text(`Confidence: ${(fused.confidence * 100).toFixed(1)}%`, 14, 68);

    let y = 82;
    if (voice) { doc.setFontSize(13); doc.text("Voice Analysis", 14, y); y += 8;
      doc.setFontSize(10);
      doc.text(`Probability ${(voice.probability * 100).toFixed(1)}% · Confidence ${(voice.confidence * 100).toFixed(1)}%`, 14, y); y += 6;
      doc.text(`Jitter ${voice.features.jitter.toFixed(2)}% · Shimmer ${voice.features.shimmer.toFixed(2)}% · HNR ${voice.features.hnr.toFixed(1)} dB`, 14, y); y += 10;
    }
    if (handwriting) { doc.setFontSize(13); doc.text("Handwriting Analysis", 14, y); y += 8;
      doc.setFontSize(10);
      doc.text(`Probability ${(handwriting.probability * 100).toFixed(1)}% · Confidence ${(handwriting.confidence * 100).toFixed(1)}%`, 14, y); y += 10;
    }
    if (biomedical) { doc.setFontSize(13); doc.text("Biomedical Features", 14, y); y += 8;
      doc.setFontSize(10);
      doc.text(`Probability ${(biomedical.probability * 100).toFixed(1)}% · Confidence ${(biomedical.confidence * 100).toFixed(1)}%`, 14, y); y += 10;
    }

    y += 4; doc.setFontSize(13); doc.text("AI Explanation", 14, y); y += 8;
    doc.setFontSize(10); doc.setTextColor(80);
    const expl = "The ensemble fuses voice, handwriting and biomedical signals using weighted averaging. Elevated jitter/shimmer combined with handwriting tremor are the strongest contributors to the risk score.";
    const lines = doc.splitTextToSize(expl, 180); doc.text(lines, 14, y);

    doc.setFontSize(9); doc.setTextColor(120);
    doc.text("This is an AI-generated research report. Not a medical diagnosis. Consult a neurologist.", 14, 285);
    doc.save(`neurosense-report-${Date.now()}.pdf`);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="mt-2 text-sm text-muted-foreground">Download a clinical-style PDF or review your scan history.</p>
        </div>
        <Button onClick={generatePdf} className="gap-2"><Download className="h-4 w-4" /> Download PDF</Button>
      </header>

      <Card className="border-border bg-card p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" /> Recent scans</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scans yet. Run a voice or handwriting analysis to get started.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Date</th><th className="p-3">Modality</th><th className="p-3">Risk</th><th className="p-3 text-right">Probability</th></tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-border/60">
                    <td className="p-3">{new Date(h.date).toLocaleString()}</td>
                    <td className="p-3 capitalize">{h.modality}</td>
                    <td className="p-3 capitalize">{h.risk}</td>
                    <td className="p-3 text-right font-medium">{(h.probability * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

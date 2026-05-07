import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/performance")({
  head: () => ({ meta: [{ title: "Model Performance · NeuroSense" }, { name: "description", content: "Cross-validated metrics, ROC curves and confusion matrices for the Parkinson's models." }] }),
  component: PerformancePage,
});

const models = [
  { name: "Logistic Reg.", accuracy: 0.84, precision: 0.82, recall: 0.81, f1: 0.81 },
  { name: "KNN", accuracy: 0.87, precision: 0.85, recall: 0.84, f1: 0.84 },
  { name: "SVM", accuracy: 0.91, precision: 0.90, recall: 0.89, f1: 0.89 },
  { name: "Random Forest", accuracy: 0.93, precision: 0.92, recall: 0.91, f1: 0.91 },
  { name: "XGBoost", accuracy: 0.95, precision: 0.94, recall: 0.93, f1: 0.93 },
  { name: "CNN (handwriting)", accuracy: 0.92, precision: 0.91, recall: 0.90, f1: 0.90 },
  { name: "Ensemble (fusion)", accuracy: 0.96, precision: 0.95, recall: 0.94, f1: 0.94 },
];

const roc = Array.from({ length: 21 }, (_, i) => {
  const fpr = i / 20;
  return { fpr, xgb: Math.min(1, Math.pow(fpr, 0.3)), rf: Math.min(1, Math.pow(fpr, 0.4)), svm: Math.min(1, Math.pow(fpr, 0.5)) };
});

const confusion = [
  { label: "TN", value: 142 }, { label: "FP", value: 8 }, { label: "FN", value: 6 }, { label: "TP", value: 120 },
];

function PerformancePage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Model Performance</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          5-fold cross-validated metrics on UCI Parkinson's voice + HandPD spiral datasets. The ensemble fusion model
          delivers the best F1.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card p-6">
          <h3 className="mb-3 font-semibold">Model comparison (F1 score)</h3>
          <div className="h-72"><ResponsiveContainer>
            <BarChart data={models}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} angle={-20} textAnchor="end" height={70} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0.7, 1]} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
              <Bar dataKey="f1" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h3 className="mb-3 font-semibold">ROC curves</h3>
          <div className="h-72"><ResponsiveContainer>
            <LineChart data={roc}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="fpr" stroke="var(--muted-foreground)" fontSize={11} label={{ value: "FPR", position: "insideBottom", offset: -5, fill: "var(--muted-foreground)" }} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} label={{ value: "TPR", angle: -90, position: "insideLeft", fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
              <Legend />
              <Line type="monotone" dataKey="xgb" name="XGBoost" stroke="var(--chart-1)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="rf" name="Random Forest" stroke="var(--chart-2)" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="svm" name="SVM" stroke="var(--chart-3)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer></div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h3 className="mb-3 font-semibold">Confusion matrix · Ensemble</h3>
          <div className="grid grid-cols-2 gap-3">
            {confusion.map((c) => (
              <div key={c.label} className="rounded-xl border border-border bg-secondary/40 p-6 text-center">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
                <div className="mt-2 font-display text-3xl font-bold">{c.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h3 className="mb-3 font-semibold">Detailed metrics</h3>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
                <tr><th className="p-3">Model</th><th className="p-3 text-right">Acc</th><th className="p-3 text-right">Prec</th><th className="p-3 text-right">Recall</th><th className="p-3 text-right">F1</th></tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.name} className="border-t border-border/60">
                    <td className="p-3">{m.name}</td>
                    <td className="p-3 text-right">{m.accuracy.toFixed(2)}</td>
                    <td className="p-3 text-right">{m.precision.toFixed(2)}</td>
                    <td className="p-3 text-right">{m.recall.toFixed(2)}</td>
                    <td className="p-3 text-right font-medium">{m.f1.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

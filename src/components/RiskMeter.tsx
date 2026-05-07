import { motion } from "framer-motion";
import type { RiskLevel } from "@/lib/api";

const colorFor = (r: RiskLevel) =>
  r === "healthy" ? "var(--color-success)" : r === "mild" ? "var(--color-warning)" : "var(--color-danger)";
const labelFor = (r: RiskLevel) =>
  r === "healthy" ? "Low Risk" : r === "mild" ? "Mild Risk" : "High Risk";

export function RiskMeter({ probability, risk, label }: { probability: number; risk: RiskLevel; label?: string }) {
  const pct = Math.round(probability * 100);
  const radius = 70; const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - probability);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle cx="90" cy="90" r={radius} stroke="var(--muted)" strokeWidth="14" fill="none" />
          <motion.circle
            cx="90" cy="90" r={radius} stroke={colorFor(risk)} strokeWidth="14" fill="none"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="font-display text-4xl font-bold">{pct}%</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{label ?? "Risk"}</div>
          </div>
        </div>
      </div>
      <span
        className="rounded-full px-3 py-1 text-xs font-medium"
        style={{ background: `color-mix(in oklab, ${colorFor(risk)} 20%, transparent)`, color: colorFor(risk) }}
      >
        {labelFor(risk)}
      </span>
    </div>
  );
}

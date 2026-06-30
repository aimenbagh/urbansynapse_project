import { Sparkles, X, TrendingDown, Cloud, Coins } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const MEASURE_LABELS: Record<string, string> = {
  insulation: "Isolation", glazing: "Vitrage", hvac: "CVC", solar_pv: "Photovoltaïque",
};

export default function SimulationBanner() {
  const simulation = useAppStore((s) => s.simulation);
  const clear = useAppStore((s) => s.clearSimulation);

  if (!simulation.result || simulation.measures.length === 0) return null;
  const r = simulation.result;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
      <Sparkles className="text-emerald-400" size={20} />
      <div className="flex-1">
        <p className="text-sm font-medium text-emerald-300">
          Simulation active — {simulation.measures.map((m) => MEASURE_LABELS[m] ?? m).join(", ")}
        </p>
        <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-300">
          <span className="flex items-center gap-1"><TrendingDown size={12} /> -{r.reduction_pct}% conso ({r.buildings_count} bât.)</span>
          <span className="flex items-center gap-1"><Cloud size={12} /> {r.total_co2_avoided_t} t CO₂/an</span>
          <span className="flex items-center gap-1"><Coins size={12} /> {(r.total_annual_savings_da / 1e6).toFixed(1)} M DA/an</span>
          {r.roi_years != null && <span>ROI {r.roi_years} ans</span>}
        </div>
      </div>
      <button onClick={clear} className="text-slate-400 hover:text-white" title="Effacer la simulation">
        <X size={16} />
      </button>
    </div>
  );
}

import { Calendar, Target, Coins, CheckCircle2 } from "lucide-react";
import type { PlanPhase } from "@/api/foresight";

const PRIORITY: Record<string, string> = {
  Haute: "bg-rose-500/15 text-rose-300",
  Moyenne: "bg-amber-500/15 text-amber-300",
  Basse: "bg-emerald-500/15 text-emerald-300",
};

export default function PhaseCard({ phase, index }: { phase: PlanPhase; index: number }) {
  return (
    <div className="rounded-xl border border-white/5 bg-navy-light/60 p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{index + 1}</span>
            <h3 className="font-semibold">{phase.title}</h3>
          </div>
          <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
            <Calendar size={12} /> {phase.period} · {phase.focus}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-accent">{phase.total_budget_m_da}</p>
          <p className="text-xs text-slate-500">M DA</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm">
        <Target size={16} className="text-emerald-400" />
        <span className="text-slate-300">{phase.target.indicator} :</span>
        <span className="font-semibold text-emerald-400">{phase.target.from} → {phase.target.to}</span>
      </div>

      <div className="space-y-2">
        {phase.actions.map((a, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg bg-white/5 p-3">
            <CheckCircle2 size={16} className="mt-0.5 text-primary" />
            <div className="flex-1">
              <p className="text-sm">{a.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className={`rounded-full px-2 py-0.5 ${PRIORITY[a.priority]}`}>{a.priority}</span>
                <span className="flex items-center gap-1"><Coins size={11} /> {a.budget_m_da} M DA</span>
                <span className="flex items-center gap-1"><Calendar size={11} /> {a.deadline}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

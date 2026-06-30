import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  icon: LucideIcon;
}

export default function KpiCard({ label, value, delta, positive = true, icon: Icon }: Props) {
  return (
    <div className="rounded-xl bg-navy-light/60 border border-white/5 p-4">
      <div className="flex items-start justify-between">
        <div className="rounded-lg bg-primary/15 p-2"><Icon size={18} className="text-primary" /></div>
        {delta && (
          <span className={clsx("text-xs", positive ? "text-emerald-400" : "text-rose-400")}>
            {positive ? "↑" : "↓"} {delta}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

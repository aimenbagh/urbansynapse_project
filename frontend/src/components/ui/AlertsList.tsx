import { AlertTriangle, Activity, Lightbulb } from "lucide-react";

const alerts = [
  { icon: AlertTriangle, color: "text-rose-400", title: "Risque d'inondation élevé", zone: "Secteur Nord-Est", time: "Il y a 25 min" },
  { icon: Activity, color: "text-amber-400", title: "Consommation énergétique anormale", zone: "Zone industrielle", time: "Il y a 1 h" },
  { icon: Lightbulb, color: "text-emerald-400", title: "Opportunité d'optimisation", zone: "Transport public", time: "Il y a 2 h" },
];

export default function AlertsList() {
  return (
    <div className="space-y-3">
      {alerts.map((a) => {
        const Icon = a.icon;
        return (
          <div key={a.title} className="flex items-start gap-3 rounded-lg bg-white/5 p-3">
            <Icon size={18} className={`mt-0.5 ${a.color}`} />
            <div className="flex-1">
              <p className="text-sm font-medium">{a.title}</p>
              <p className="text-xs text-slate-400">{a.zone}</p>
            </div>
            <span className="text-xs text-slate-500">{a.time}</span>
          </div>
        );
      })}
    </div>
  );
}

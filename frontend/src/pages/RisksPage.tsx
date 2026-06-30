import { CloudRain, Waves, Flame, Mountain } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";

const risks = [
  { name: "Inondation", level: "Élevé", color: "text-rose-400", icon: Waves, zones: "Secteur Nord-Est" },
  { name: "Séisme", level: "Modéré", color: "text-amber-400", icon: Mountain, zones: "Ensemble du territoire" },
  { name: "Feu de forêt", level: "Faible", color: "text-emerald-400", icon: Flame, zones: "Périphérie boisée" },
  { name: "Îlot de chaleur", level: "Élevé", color: "text-rose-400", icon: CloudRain, zones: "Centre dense" },
];

export default function RisksPage() {
  return (
    <div>
      <PageHeader
        title="Risques naturels"
        subtitle="Cartographie et évaluation des aléas sur le territoire"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {risks.map((r) => {
          const Icon = r.icon;
          return (
            <Panel key={r.name}>
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-white/5 p-3">
                  <Icon className={r.color} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{r.name}</h3>
                    <span className={`text-sm font-medium ${r.color}`}>{r.level}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{r.zones}</p>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

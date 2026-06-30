import { useQuery } from "@tanstack/react-query";
import {
  Users, Building2, Leaf, Car, Zap, Shield, Cloud, Wind, ArrowRight,
  Ruler, Home, CalendarClock,
} from "lucide-react";
import KpiCard from "@/components/ui/KpiCard";
import Panel from "@/components/ui/Panel";
import SimulationBanner from "@/components/ui/SimulationBanner";
import SectorDonut from "@/components/charts/SectorDonut";
import IndicatorTrend from "@/components/charts/IndicatorTrend";
import AlertsList from "@/components/ui/AlertsList";
import { fetchIndicators } from "@/api/indicators";
import { fetchScenarios } from "@/api/scenarios";
import { fetchTerritoryStats } from "@/api/territories";
import { useAppStore } from "@/store/useAppStore";

const KEY_INDICATORS = [
  { key: "energy_performance", label: "Performance énergétique", icon: Zap, suffix: "%", delta: "12%" },
  { key: "resilience", label: "Résilience territoriale", icon: Shield, suffix: "%", delta: "8%" },
  { key: "co2_avoided", label: "Émissions CO₂ évitées", icon: Cloud, suffix: " t", delta: "15%" },
  { key: "air_quality", label: "Qualité de l'air", icon: Wind, suffix: "/100", delta: "7%" },
];

export default function DashboardPage() {
  const territoryId = useAppStore((s) => s.activeTerritoryId);

  const { data: indicators } = useQuery({
    queryKey: ["indicators", territoryId],
    queryFn: () => fetchIndicators(territoryId),
  });
  const { data: scenarios } = useQuery({
    queryKey: ["scenarios", territoryId],
    queryFn: () => fetchScenarios(territoryId),
  });
  const { data: stats } = useQuery({
    queryKey: ["stats", territoryId],
    queryFn: () => fetchTerritoryStats(territoryId),
  });

  const getVal = (key: string) => indicators?.find((i) => i.key === key)?.value;
  const fmt = (n?: number) =>
    n == null ? "—" : n >= 1_000_000 ? `${(n / 1e6).toFixed(1)}M`
      : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`;

  return (
    <div className="space-y-6">
      <SimulationBanner />
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour, <span className="text-primary">Administrateur</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Territoire analysé : <span className="text-slate-200">{stats?.name ?? "…"}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KEY_INDICATORS.map((ind) => {
          const v = getVal(ind.key);
          return (
            <KpiCard key={ind.key} label={ind.label}
              value={v != null ? `${v}${ind.suffix}` : "—"} delta={ind.delta} icon={ind.icon} />
          );
        })}
      </div>

      {/* Stats territoriales live */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Population" value={fmt(stats?.population)} icon={Users} />
        <KpiCard label="Densité (hab/km²)" value={fmt(stats?.density)} icon={Ruler} />
        <KpiCard label="Bâtiments analysés" value={fmt(stats?.buildings_count)} icon={Building2} />
        <KpiCard label="Âge moyen du bâti" value={stats?.avg_building_age ? `${stats.avg_building_age} ans` : "—"} icon={CalendarClock} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Évolution des indicateurs (12 mois)" className="lg:col-span-2">
          <IndicatorTrend />
        </Panel>
        <Panel title="Répartition par secteur">
          <SectorDonut />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Alertes & recommandations">
          <AlertsList />
        </Panel>
        <Panel title="Scénarios récents" className="lg:col-span-2">
          {!scenarios?.length && (
            <p className="text-sm text-slate-500">
              Aucun scénario. Créez-en un depuis Simulation urbaine.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {scenarios?.slice(0, 4).map((s) => (
              <div key={s.id} className="rounded-lg bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{s.name}</h3>
                  {s.performance != null && (
                    <span className="text-sm font-semibold text-emerald-400">{s.performance}%</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">{s.description}</p>
                <ArrowRight size={16} className="mt-2 text-primary" />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

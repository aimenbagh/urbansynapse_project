import { useQuery } from "@tanstack/react-query";
import {
  Layers, Zap, Building, AlertTriangle, Navigation, BarChart2, Check,
  Users, Ruler, Home, Sparkles, Lightbulb,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import SimulationBanner from "@/components/ui/SimulationBanner";
import TerritoryMap from "@/components/map/TerritoryMap";
import MapLegend from "@/components/map/MapLegend";
import SectorDonut from "@/components/charts/SectorDonut";
import { fetchIndicators } from "@/api/indicators";
import { fetchTerritoryStats } from "@/api/territories";
import { fetchRecommendations } from "@/api/planning";
import { useAppStore } from "@/store/useAppStore";

const LAYERS = [
  { id: "land_use", label: "Occupation du sol", icon: Layers },
  { id: "energy", label: "Réseaux énergétiques", icon: Zap },
  { id: "buildings", label: "Bâti existant", icon: Building },
  { id: "risks", label: "Risques naturels", icon: AlertTriangle },
  { id: "mobility", label: "Mobilité & Accessibilité", icon: Navigation },
  { id: "socio", label: "Données socio-économiques", icon: BarChart2 },
  { id: "communes", label: "Communes (population réelle)", icon: Users },
];

const RISKS = [
  { name: "Inondation", level: "Élevé", color: "text-rose-400" },
  { name: "Séisme", level: "Modéré", color: "text-amber-400" },
  { name: "Feu de forêt", level: "Faible", color: "text-emerald-400" },
  { name: "Îlot de chaleur", level: "Élevé", color: "text-rose-400" },
];

const PRIORITY_STYLE: Record<string, string> = {
  Haute: "bg-rose-500/15 text-rose-300",
  Moyenne: "bg-amber-500/15 text-amber-300",
  Basse: "bg-emerald-500/15 text-emerald-300",
};

export default function TerritorialAnalysisPage() {
  const territoryId = useAppStore((s) => s.activeTerritoryId);
  const activeLayers = useAppStore((s) => s.activeLayers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);

  const { data: indicators } = useQuery({
    queryKey: ["indicators", territoryId],
    queryFn: () => fetchIndicators(territoryId),
  });
  const { data: stats } = useQuery({
    queryKey: ["stats", territoryId],
    queryFn: () => fetchTerritoryStats(territoryId),
  });
  const { data: recommendations } = useQuery({
    queryKey: ["recommendations", territoryId],
    queryFn: () => fetchRecommendations(territoryId),
  });

  const getVal = (k: string) => indicators?.find((i) => i.key === k)?.value;

  return (
    <div>
      <PageHeader
        title="Analyse territoriale"
        subtitle={`Cartographie multi-couches — ${stats?.name ?? "…"}`}
      />
      <SimulationBanner />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Panel><div className="flex items-center gap-3"><Users className="text-primary" size={20} /><div><p className="text-lg font-bold">{stats?.population?.toLocaleString() ?? "—"}</p><p className="text-xs text-slate-400">Population</p></div></div></Panel>
        <Panel><div className="flex items-center gap-3"><Ruler className="text-primary" size={20} /><div><p className="text-lg font-bold">{stats?.density ?? "—"}</p><p className="text-xs text-slate-400">Densité hab/km²</p></div></div></Panel>
        <Panel><div className="flex items-center gap-3"><Home className="text-primary" size={20} /><div><p className="text-lg font-bold">{stats?.buildings_count ?? "—"}</p><p className="text-xs text-slate-400">Bâtiments</p></div></div></Panel>
        <Panel><div className="flex items-center gap-3"><Layers className="text-primary" size={20} /><div><p className="text-lg font-bold">{stats?.zones_count ?? "—"}</p><p className="text-xs text-slate-400">Zones</p></div></div></Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Panel title="Couches d'analyse">
          <div className="space-y-2">
            {LAYERS.map((l) => {
              const Icon = l.icon;
              const on = activeLayers.includes(l.id);
              return (
                <button key={l.id} onClick={() => toggleLayer(l.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                    on ? "bg-primary/15 text-primary" : "text-slate-300 hover:bg-white/5"}`}>
                  <span className="flex items-center gap-2"><Icon size={16} /> {l.label}</span>
                  {on && <Check size={14} />}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Occupation du sol → zones · Bâti/Réseaux → bâtiments ·
            Risques naturels, Mobilité et Données socio-éco → couches dédiées.
          </p>

          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-300">Indicateurs clés</h3>
            <div className="space-y-3">
              {[
                { k: "energy_performance", label: "Performance énergétique", suffix: "%" },
                { k: "resilience", label: "Résilience territoriale", suffix: "%" },
                { k: "air_quality", label: "Qualité de l'air", suffix: "/100" },
              ].map((i) => (
                <div key={i.k} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{i.label}</span>
                  <span className="text-sm font-semibold">{getVal(i.k) ?? "—"}{i.suffix}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <div className="lg:col-span-2">
          <Panel className="h-full">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Carte du territoire</h2>
              <span className="text-xs text-slate-400">{activeLayers.length} couche(s) active(s)</span>
            </div>
            <div className="h-[55vh]"><TerritoryMap /></div>
            <div className="mt-3 rounded-lg bg-white/5 p-3"><MapLegend /></div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Analyse énergétique"><SectorDonut /></Panel>
          <Panel title="Analyse des risques">
            <div className="space-y-2">
              {RISKS.map((r) => (
                <div key={r.name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{r.name}</span>
                  <span className={`font-medium ${r.color}`}>{r.level}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Recommandations de planification IA */}
      <Panel className="mt-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="text-accent-2" size={18} />
          <h2 className="font-semibold">Recommandations de planification (IA)</h2>
        </div>
        {!recommendations?.length && (
          <p className="text-sm text-slate-500">Analyse en cours ou indicateurs satisfaisants.</p>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {recommendations?.map((r, i) => (
            <div key={i} className="rounded-lg border border-white/5 bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLE[r.priority]}`}>
                  {r.priority}
                </span>
                <span className="text-xs text-slate-500">{r.category}</span>
              </div>
              <h3 className="flex items-start gap-2 font-medium">
                <Lightbulb size={16} className="mt-0.5 text-accent" /> {r.title}
              </h3>
              <p className="mt-1 text-sm text-slate-400">{r.detail}</p>
              <p className="mt-2 text-xs text-emerald-400">→ {r.impact}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

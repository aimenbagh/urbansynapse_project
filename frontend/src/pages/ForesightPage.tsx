import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sparkles, Loader2, Download, Brain, LineChart as LineIcon, Target,
  Coins, Layers, TrendingUp, Wallet,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import PhaseCard from "@/components/foresight/PhaseCard";
import MarkdownView from "@/components/ui/MarkdownView";
import TerritoryMap from "@/components/map/TerritoryMap";
import MapLegend from "@/components/map/MapLegend";
import {
  fetchForecast, fetchScenarios, generatePlan, fetchStructuredPlan,
  type PlanResult, type StructuredPlan,
} from "@/api/foresight";
import { useAppStore } from "@/store/useAppStore";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

type Tab = "projection" | "scenarios" | "plan" | "narrative";
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "projection", label: "Projection ML", icon: LineIcon },
  { id: "scenarios", label: "Trajectoires", icon: TrendingUp },
  { id: "plan", label: "Plan structuré", icon: Layers },
  { id: "narrative", label: "Plan rédigé (IA)", icon: Brain },
];

const TRAJ: Record<string, { label: string; color: string }> = {
  tendanciel: { label: "Tendanciel (+1%/an)", color: "#94a3b8" },
  volontariste: { label: "Volontariste (+2.5%/an)", color: "#3b82f6" },
  objectif_2030: { label: "Objectif accéléré (+4%/an)", color: "#22c55e" },
};

export default function ForesightPage() {
  const territoryId = useAppStore((s) => s.activeTerritoryId);
  const [tab, setTab] = useState<Tab>("projection");
  const [horizon, setHorizon] = useState(10);

  const { data: forecast } = useQuery({ queryKey: ["forecast", territoryId, horizon], queryFn: () => fetchForecast(territoryId, 2025 + horizon) });
  const { data: scenarios } = useQuery({ queryKey: ["scenarios-foresight", territoryId, horizon], queryFn: () => fetchScenarios(territoryId, horizon) });
  const { data: structured } = useQuery({ queryKey: ["structured", territoryId, horizon], queryFn: () => fetchStructuredPlan(territoryId, horizon) });

  const planMut = useMutation({ mutationFn: () => generatePlan(territoryId, horizon) });
  const plan: PlanResult | undefined = planMut.data;

  const forecastData = forecast
    ? [...forecast.history.map((p) => ({ year: p.year, historique: p.value })),
       ...forecast.forecast.map((p) => ({ year: p.year, projection: p.value }))]
    : [];

  const trajData = scenarios
    ? scenarios.trajectories.tendanciel.map((_, i) => {
        const row: any = { year: scenarios.trajectories.tendanciel[i].year };
        for (const k of Object.keys(scenarios.trajectories)) row[k] = scenarios.trajectories[k][i].value;
        return row;
      })
    : [];

  const downloadPlan = () => {
    if (!plan) return;
    const blob = new Blob([plan.plan_markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `plan_${plan.territory}.md`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Planification prospective (IA)"
        subtitle="Projections ML, trajectoires, plan d'action structuré et rédaction générative"
        action={
          <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}
            className="rounded-lg bg-white/5 px-3 py-2 text-sm outline-none">
            {[5, 10, 15].map((h) => <option key={h} value={h} className="bg-navy">Horizon {h} ans</option>)}
          </select>
        }
      />

      {/* Bandeau de synthèse */}
      {structured && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Panel><div className="flex items-center gap-3"><Target className="text-primary" size={20} /><div><p className="text-lg font-bold">{structured.summary.current_performance}% → {structured.summary.target_performance}%</p><p className="text-xs text-slate-400">Performance énergétique</p></div></div></Panel>
          <Panel><div className="flex items-center gap-3"><Sparkles className="text-emerald-400" size={20} /><div><p className="text-lg font-bold">{structured.summary.renewable_target}%</p><p className="text-xs text-slate-400">Cible renouvelable 2030</p></div></div></Panel>
          <Panel><div className="flex items-center gap-3"><Wallet className="text-accent" size={20} /><div><p className="text-lg font-bold">{structured.summary.total_budget_m_da}</p><p className="text-xs text-slate-400">Budget total (M DA)</p></div></div></Panel>
          <Panel><div className="flex items-center gap-3"><Layers className="text-accent-2" size={20} /><div><p className="text-lg font-bold">{structured.phases.length} phases</p><p className="text-xs text-slate-400">{structured.period}</p></div></div></Panel>
        </div>
      )}

      {/* Onglets */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition ${
                tab === t.id ? "bg-primary text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "projection" && (
        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Projection énergétique (modèle ML)</h2>
            {forecast && <span className="text-xs text-slate-400">R² = {forecast.r2} · {forecast.model}</span>}
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ background: "#101d36", border: "none", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine x={2024} stroke="#ffffff30" strokeDasharray="4 4" label={{ value: "Aujourd'hui", fill: "#94a3b8", fontSize: 10 }} />
              <Line type="monotone" dataKey="historique" name="Historique" stroke="#2da3e0" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="projection" name="Projection" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
          {forecast && <p className="mt-2 text-xs text-slate-400">Croissance historique {forecast.historical_cagr_pct}%/an · Source : Bilan Énergétique National algérien.</p>}
        </Panel>
      )}

      {tab === "scenarios" && (
        <Panel title="Trajectoires prospectives — Performance énergétique">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trajData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[60, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
              <Tooltip contentStyle={{ background: "#101d36", border: "none", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {Object.entries(TRAJ).map(([k, m]) => (
                <Line key={k} type="monotone" dataKey={k} name={m.label} stroke={m.color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {Object.entries(TRAJ).map(([k, m]) => {
              const last = scenarios?.trajectories[k]?.slice(-1)[0];
              return (
                <div key={k} className="rounded-lg bg-white/5 p-3">
                  <p className="text-sm" style={{ color: m.color }}>{m.label}</p>
                  <p className="mt-1 text-xl font-bold">{last?.value ?? "—"}%</p>
                  <p className="text-xs text-slate-400">en {last?.year ?? ""}</p>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {tab === "plan" && structured && (
        <div className="space-y-4">
          {/* Carte du territoire concerné par le plan */}
          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Territoire concerné — {structured.territory}</h2>
              <span className="text-xs text-slate-400">Zones et bâtiments visés par le plan</span>
            </div>
            <div className="h-[42vh]"><TerritoryMap planMode /></div>
            <div className="mt-3 rounded-lg bg-white/5 p-3"><MapLegend /></div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-3">
            {structured.phases.map((p, i) => <PhaseCard key={i} phase={p} index={i} />)}
          </div>
          <Panel>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-300"><Coins size={16} className="text-accent" /> Budget total du plan ({structured.period})</span>
              <span className="text-xl font-bold text-accent">{structured.summary.total_budget_m_da} M DA</span>
            </div>
          </Panel>
        </div>
      )}

      {tab === "narrative" && (
        <Panel>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><Brain size={18} className="text-accent-2" /> Plan rédigé par IA générative</h2>
            <button onClick={() => planMut.mutate()} disabled={planMut.isPending}
              className="flex items-center gap-2 rounded-lg bg-accent-2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
              {planMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {planMut.isPending ? "Génération…" : "Générer"}
            </button>
          </div>
          {plan && (
            <div className="mt-5">
              <div className="mb-3 flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs ${plan.source === "mistral" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                  {plan.source === "mistral" ? "Généré par Mistral AI" : "Plan local (IA non configurée)"}
                </span>
                <button onClick={downloadPlan} className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1 text-xs hover:bg-white/10">
                  <Download size={12} /> Télécharger
                </button>
              </div>
              <div className="grid gap-4 lg:grid-cols-5">
                {/* Carte du territoire (à gauche, sticky) */}
                <div className="lg:col-span-2">
                  <div className="rounded-lg bg-white/5 p-3 lg:sticky lg:top-4">
                    <p className="mb-2 text-sm font-medium text-slate-300">Territoire concerné</p>
                    <div className="h-[360px]"><TerritoryMap planMode /></div>
                    <div className="mt-3"><MapLegend /></div>
                  </div>
                </div>
                {/* Plan rédigé (à droite) */}
                <div className="lg:col-span-3 max-h-[560px] overflow-y-auto rounded-lg bg-white/5 p-5">
                  <MarkdownView content={plan.plan_markdown} />
                </div>
              </div>
            </div>
          )}
          {!plan && !planMut.isPending && (
            <p className="mt-4 text-sm text-slate-500">Génère un plan d'action narratif combinant la projection ML, le diagnostic et l'IA générative (Mistral).</p>
          )}
        </Panel>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Zap, ShieldAlert, Users, Trophy, Shield, Bus, Trees, Grid3x3, Sparkles, Lightbulb, Loader2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import MarkdownView from "@/components/ui/MarkdownView";
import { fetchTerritories } from "@/api/territories";
import { fetchCompareData, fetchCompareAnalysis, type CompareData } from "@/api/profile";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

function useCompare(id: number | null) {
  return useQuery({
    queryKey: ["compare-data", id],
    queryFn: () => fetchCompareData(id!),
    enabled: id !== null,
  });
}

// higher=true → la valeur la plus haute gagne
const METRICS: { key: keyof CompareData; label: string; icon: any; unit: string; higher: boolean }[] = [
  { key: "energy_performance", label: "Performance énergétique", icon: Zap, unit: "%", higher: true },
  { key: "risk_global", label: "Indice de risque", icon: ShieldAlert, unit: "/100", higher: false },
  { key: "resilience_global", label: "Résilience globale", icon: Shield, unit: "%", higher: true },
  { key: "transport_coverage", label: "Couverture transports", icon: Bus, unit: "%", higher: true },
  { key: "green_coverage", label: "Trame verte", icon: Trees, unit: "%", higher: true },
  { key: "population", label: "Population", icon: Users, unit: "", higher: true },
  { key: "density", label: "Densité (hab/km²)", icon: Grid3x3, unit: "", higher: true },
];

export default function ComparePage() {
  const { data: territories } = useQuery({ queryKey: ["territories"], queryFn: fetchTerritories });
  const [idA, setIdA] = useState<number | null>(1);
  const [idB, setIdB] = useState<number | null>(2);
  const { data: a } = useCompare(idA);
  const { data: b } = useCompare(idB);
  const { data: analysis, isLoading: aiLoading } = useQuery({
    queryKey: ["compare-analysis", idA, idB],
    queryFn: () => fetchCompareAnalysis(idA!, idB!),
    enabled: idA !== null && idB !== null && idA !== idB,
  });

  const Select = ({ value, onChange, color }: { value: number | null; onChange: (v: number) => void; color: string }) => (
    <select value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full rounded-lg border-2 bg-navy-light px-3 py-2 text-sm outline-none ${color}`}>
      {territories?.map((t) => <option key={t.id} value={t.id} className="bg-navy">{t.name}</option>)}
    </select>
  );

  const chartData = a && b ? [
    { critère: "Perf. énerg.", [a.territory_name]: a.energy_performance, [b.territory_name]: b.energy_performance },
    { critère: "Risque", [a.territory_name]: a.risk_global, [b.territory_name]: b.risk_global },
    { critère: "Résilience", [a.territory_name]: a.resilience_global, [b.territory_name]: b.resilience_global },
    { critère: "Transports", [a.territory_name]: a.transport_coverage, [b.territory_name]: b.transport_coverage },
    { critère: "Trame verte", [a.territory_name]: a.green_coverage, [b.territory_name]: b.green_coverage },
  ] : [];

  return (
    <div>
      <PageHeader title="Comparer deux wilayas" subtitle="Analyse côte à côte des performances (données cohérentes avec les pages thématiques)" />

      <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Select value={idA} onChange={setIdA} color="border-primary" />
        <ArrowLeftRight className="text-slate-500" />
        <Select value={idB} onChange={setIdB} color="border-accent-2" />
      </div>

      {a && b && (
        <>
          {/* KPIs côte à côte (7 indicateurs) */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {METRICS.map(({ key, label, icon: Icon, unit, higher }) => {
              const av = a[key] as number, bv = b[key] as number;
              const aWins = higher ? av > bv : av < bv;
              const eq = av === bv;
              return (
                <Panel key={key}>
                  <div className="mb-2 flex items-center gap-2 text-xs text-slate-400"><Icon size={14} /> {label}</div>
                  <div className="flex items-center justify-between">
                    <div className={!eq && aWins ? "font-bold text-primary" : "text-slate-300"}>
                      {av.toLocaleString()}{unit}
                      {!eq && aWins && <Trophy size={12} className="ml-1 inline text-accent" />}
                    </div>
                    <span className="text-xs text-slate-600">vs</span>
                    <div className={!eq && !aWins ? "font-bold text-accent-2" : "text-slate-300"}>
                      {bv.toLocaleString()}{unit}
                      {!eq && !aWins && <Trophy size={12} className="ml-1 inline text-accent" />}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>

          {/* Graphe comparatif */}
          <Panel title="Comparaison visuelle" className="mt-6">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="critère" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ background: "#101d36", border: "none", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey={a.territory_name} fill="#2da3e0" radius={[4, 4, 0, 0]} />
                <Bar dataKey={b.territory_name} fill="#7c4dff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          {/* Détails côte à côte */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[a, b].map((w, i) => (
              <Panel key={w.territory_id} title={w.territory_name}>
                <div className="space-y-1.5 text-sm">
                  <Row label="Zone sismique (RPA)" value={w.seismic_zone} color={i === 0 ? "text-primary" : "text-accent-2"} />
                  <Row label="Population" value={w.population.toLocaleString()} />
                  <Row label="Densité" value={`${w.density.toLocaleString()} hab/km²`} />
                  <Row label="Performance énergétique" value={`${w.energy_performance}%`} />
                  <Row label="Indice de risque" value={`${w.risk_global}/100`} />
                  <Row label="Résilience" value={`${w.resilience_global}%`} />
                  <Row label="Couverture transports" value={`${w.transport_coverage}%`} />
                  <Row label="Accessibilité piétonne" value={`${w.pedestrian}%`} />
                  <Row label="Trame verte" value={`${w.green_coverage}%`} />
                </div>
              </Panel>
            ))}
          </div>

          {/* Analyse comparative IA */}
          <Panel className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="text-accent-2" size={18} />
              <h3 className="font-semibold">Analyse comparative intelligente</h3>
              {analysis?.ai_available
                ? <span className="rounded-full bg-accent-2/15 px-2 py-0.5 text-xs text-accent-2">IA Mistral</span>
                : <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">Analyse locale</span>}
            </div>

            {aiLoading ? (
              <div className="flex items-center gap-2 py-6 text-slate-400">
                <Loader2 className="animate-spin" size={16} /> Analyse en cours…
              </div>
            ) : analysis ? (
              <>
                {/* Analyse IA Mistral si disponible */}
                {analysis.ai && (
                  <div className="mb-4 rounded-lg border border-accent-2/20 bg-accent-2/5 p-4">
                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-accent-2">
                      <Sparkles size={12} /> Généré par IA (Mistral)
                    </p>
                    <MarkdownView content={analysis.ai.text} />
                  </div>
                )}

                {/* Analyse locale (toujours affichée) */}
                <div className="rounded-lg bg-white/5 p-4">
                  <p className="mb-3 text-sm font-medium text-slate-200">{analysis.local.summary}</p>
                  <p className="mb-2 flex items-center gap-1 text-xs font-medium text-accent">
                    <Lightbulb size={13} /> Solutions recommandées
                  </p>
                  <ul className="space-y-2">
                    {analysis.local.solutions.map((sol, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-300">
                        <span className="mt-0.5 text-accent">{i + 1}.</span>
                        <span>{sol}</span>
                      </li>
                    ))}
                  </ul>
                </div>


              </>
            ) : null}
          </Panel>
        </>
      )}
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1.5">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium ${color ?? ""}`}>{value}</span>
    </div>
  );
}

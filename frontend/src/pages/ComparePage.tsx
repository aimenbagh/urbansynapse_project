import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Zap, ShieldAlert, Users, Trophy } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { fetchTerritories } from "@/api/territories";
import { fetchProfile, type TerritoryProfile } from "@/api/profile";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

function useProfile(id: number | null) {
  return useQuery({
    queryKey: ["profile", id],
    queryFn: () => fetchProfile(id!),
    enabled: id !== null,
  });
}

export default function ComparePage() {
  const { data: territories } = useQuery({ queryKey: ["territories"], queryFn: fetchTerritories });
  const [idA, setIdA] = useState<number | null>(1);
  const [idB, setIdB] = useState<number | null>(2);
  const { data: a } = useProfile(idA);
  const { data: b } = useProfile(idB);

  const Select = ({ value, onChange, color }: { value: number | null; onChange: (v: number) => void; color: string }) => (
    <select value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full rounded-lg border-2 bg-navy-light px-3 py-2 text-sm outline-none ${color}`}>
      {territories?.map((t) => <option key={t.id} value={t.id} className="bg-navy">{t.name}</option>)}
    </select>
  );

  const chartData = a && b ? [
    { critère: "Perf. énerg.", [a.territory.name]: a.energy_performance, [b.territory.name]: b.energy_performance },
    { critère: "Risque", [a.territory.name]: a.risk.global, [b.territory.name]: b.risk.global },
    { critère: "Densité", [a.territory.name]: a.chart[2].value, [b.territory.name]: b.chart[2].value },
  ] : [];

  return (
    <div>
      <PageHeader title="Comparer deux wilayas" subtitle="Analyse côte à côte des performances" />

      <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Select value={idA} onChange={setIdA} color="border-primary" />
        <ArrowLeftRight className="text-slate-500" />
        <Select value={idB} onChange={setIdB} color="border-accent-2" />
      </div>

      {a && b && (
        <>
          {/* KPIs côte à côte */}
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Zap, label: "Performance énergétique", av: a.energy_performance, bv: b.energy_performance, unit: "%", higher: true },
              { icon: ShieldAlert, label: "Indice de risque", av: a.risk.global, bv: b.risk.global, unit: "/100", higher: false },
              { icon: Users, label: "Population", av: a.population, bv: b.population, unit: "", higher: true },
            ].map(({ icon: Icon, label, av, bv, unit, higher }) => {
              const aWins = higher ? av > bv : av < bv;
              return (
                <Panel key={label}>
                  <div className="mb-2 flex items-center gap-2 text-xs text-slate-400"><Icon size={14} /> {label}</div>
                  <div className="flex items-center justify-between">
                    <div className={aWins ? "font-bold text-primary" : "text-slate-300"}>
                      {av.toLocaleString()}{unit}
                      {aWins && <Trophy size={12} className="ml-1 inline text-accent" />}
                    </div>
                    <span className="text-slate-600">vs</span>
                    <div className={!aWins ? "font-bold text-accent-2" : "text-slate-300"}>
                      {bv.toLocaleString()}{unit}
                      {!aWins && <Trophy size={12} className="ml-1 inline text-accent" />}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>

          {/* Graphe comparatif */}
          <Panel title="Comparaison visuelle" className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="critère" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ background: "#101d36", border: "none", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey={a.territory.name} fill="#2da3e0" radius={[4, 4, 0, 0]} />
                <Bar dataKey={b.territory.name} fill="#7c4dff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          {/* Analyses côte à côte */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Panel title={a.territory.name}>
              <p className="text-sm leading-relaxed text-slate-300">{a.analysis}</p>
            </Panel>
            <Panel title={b.territory.name}>
              <p className="text-sm leading-relaxed text-slate-300">{b.analysis}</p>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

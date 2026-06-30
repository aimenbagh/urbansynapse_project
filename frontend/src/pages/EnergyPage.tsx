import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Zap, TrendingDown, Building2, Globe2, Coins, Cloud } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import {
  simulateRetrofit, simulateTerritoryRetrofit,
  type RetrofitResult, type TerritoryRetrofitResult,
} from "@/api/energy";
import { fetchBuildings } from "@/api/territories";
import { useAppStore } from "@/store/useAppStore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const MEASURES = [
  { id: "insulation", label: "Isolation thermique" },
  { id: "glazing", label: "Double vitrage" },
  { id: "hvac", label: "Système CVC performant" },
  { id: "solar_pv", label: "Panneaux photovoltaïques" },
];
const CLASSES = ["A", "B", "C", "D", "E", "F", "G"];
const CLASS_COLOR: Record<string, string> = {
  A: "#16a34a", B: "#65a30d", C: "#ca8a04", D: "#d97706",
  E: "#ea580c", F: "#dc2626", G: "#991b1b",
};

export default function EnergyPage() {
  const territoryId = useAppStore((s) => s.activeTerritoryId);
  const setSimulation = useAppStore((s) => s.setSimulation);
  const [surface, setSurface] = useState(100);
  const [energyClass, setEnergyClass] = useState("E");
  const [measures, setMeasures] = useState<string[]>(["insulation"]);

  const { data: buildings } = useQuery({
    queryKey: ["buildings", territoryId],
    queryFn: () => fetchBuildings(territoryId),
  });

  const mutation = useMutation({
    mutationFn: () =>
      simulateRetrofit({ surface_m2: surface, energy_class: energyClass, measures }),
  });
  const result: RetrofitResult | undefined = mutation.data;

  const territoryMut = useMutation({
    mutationFn: () =>
      simulateTerritoryRetrofit(territoryId, measures),
    onSuccess: (data) =>
      setSimulation({ measures, result: data }),
  });
  const terr: TerritoryRetrofitResult | undefined = territoryMut.data;

  const toggle = (id: string) =>
    setMeasures((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  // Distribution des classes énergétiques du parc
  const distribution = CLASSES.map((c) => ({
    classe: c,
    count: buildings?.filter((b) => b.energy_class === c).length ?? 0,
  }));

  return (
    <div>
      <PageHeader
        title="Performance énergétique"
        subtitle="Parc de bâtiments et simulation de rénovation énergétique"
      />

      {/* Distribution du parc */}
      <Panel title={`Distribution des classes énergétiques (${buildings?.length ?? 0} bâtiments)`} className="mb-6">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="classe" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#101d36", border: "none", borderRadius: 8 }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {distribution.map((d) => <Cell key={d.classe} fill={CLASS_COLOR[d.classe]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Simulateur de rénovation">
          <label className="mb-1 block text-sm text-slate-400">Surface (m²)</label>
          <input type="number" value={surface} onChange={(e) => setSurface(Number(e.target.value))}
            className="mb-4 w-full rounded-lg bg-white/5 px-3 py-2 outline-none focus:ring-1 focus:ring-primary" />
          <label className="mb-1 block text-sm text-slate-400">Classe énergétique actuelle</label>
          <select value={energyClass} onChange={(e) => setEnergyClass(e.target.value)}
            className="mb-4 w-full rounded-lg bg-white/5 px-3 py-2 outline-none focus:ring-1 focus:ring-primary">
            {CLASSES.map((c) => <option key={c} value={c} className="bg-navy">{c}</option>)}
          </select>
          <label className="mb-2 block text-sm text-slate-400">Mesures de rénovation</label>
          <div className="space-y-2">
            {MEASURES.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={measures.includes(m.id)}
                  onChange={() => toggle(m.id)} className="accent-primary" />
                {m.label}
              </label>
            ))}
          </div>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
            className="mt-5 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/80 disabled:opacity-50">
            <Zap size={16} /> {mutation.isPending ? "Calcul…" : "Simuler"}
          </button>
        </Panel>

        <Panel title="Résultat de la simulation">
          {!result && !mutation.isError && (
            <p className="text-sm text-slate-500">Renseigne les paramètres puis lance la simulation.</p>
          )}
          {mutation.isError && (
            <p className="text-sm text-rose-400">Erreur : l'API backend est-elle démarrée (port 8000) ?</p>
          )}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 p-4">
                <TrendingDown className="text-emerald-400" />
                <div>
                  <p className="text-2xl font-bold text-emerald-400">-{result.reduction_pct}%</p>
                  <p className="text-sm text-slate-400">Réduction de consommation</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-lg font-semibold">{result.before_kwh}</p>
                  <p className="text-xs text-slate-400">kWh/an avant</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-lg font-semibold">{result.after_kwh}</p>
                  <p className="text-xs text-slate-400">kWh/an après</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-lg font-semibold text-primary">{result.saved_kwh}</p>
                  <p className="text-xs text-slate-400">kWh/an économisés</p>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Rénovation à l'échelle du territoire (vision territoriale) */}
      <Panel title="Rénovation à l'échelle du territoire" className="mt-6">
        <p className="mb-4 text-sm text-slate-400">
          Applique les mesures sélectionnées à l'ensemble du bâti du territoire actif
          et agrège l'impact (analyse multi-échelles bâtiment → territoire).
        </p>
        <button
          onClick={() => territoryMut.mutate()}
          disabled={territoryMut.isPending}
          className="mb-4 flex items-center gap-2 rounded-lg bg-accent-2 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          <Globe2 size={16} /> {territoryMut.isPending ? "Agrégation…" : "Simuler sur tout le territoire"}
        </button>
        {terr && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-emerald-500/10 p-4">
              <TrendingDown className="text-emerald-400" />
              <p className="mt-2 text-xl font-bold text-emerald-400">-{terr.reduction_pct}%</p>
              <p className="text-xs text-slate-400">Réduction sur {terr.buildings_count} bâtiments</p>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <Cloud className="text-primary" />
              <p className="mt-2 text-xl font-bold">{terr.total_co2_avoided_t} t</p>
              <p className="text-xs text-slate-400">CO₂ évité / an</p>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <Coins className="text-accent" />
              <p className="mt-2 text-xl font-bold">{(terr.total_annual_savings_da / 1e6).toFixed(1)} M DA</p>
              <p className="text-xs text-slate-400">Économies / an</p>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <Building2 className="text-primary" />
              <p className="mt-2 text-xl font-bold">{terr.roi_years ?? "—"} ans</p>
              <p className="text-xs text-slate-400">Retour sur investissement</p>
            </div>
          </div>
        )}
      </Panel>

      {/* Tableau du parc */}
      <Panel title="Parc de bâtiments" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className="py-2 pr-4 font-medium">Année</th>
                <th className="py-2 pr-4 font-medium">Étages</th>
                <th className="py-2 pr-4 font-medium">Surface (m²)</th>
                <th className="py-2 pr-4 font-medium">Classe</th>
                <th className="py-2 pr-4 font-medium">kWh/m²/an</th>
              </tr>
            </thead>
            <tbody>
              {buildings?.slice(0, 12).map((b) => (
                <tr key={b.id} className="border-b border-white/5">
                  <td className="py-2 pr-4">{b.construction_year}</td>
                  <td className="py-2 pr-4">{b.floors}</td>
                  <td className="py-2 pr-4">{b.surface_m2}</td>
                  <td className="py-2 pr-4">
                    <span className="rounded px-2 py-0.5 text-xs font-medium text-white"
                      style={{ background: CLASS_COLOR[b.energy_class ?? "D"] }}>
                      {b.energy_class}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{b.annual_kwh_m2}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!buildings?.length && (
            <p className="py-4 text-sm text-slate-500 flex items-center gap-2">
              <Building2 size={16} /> Aucune donnée. Le backend est-il lancé ?
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}

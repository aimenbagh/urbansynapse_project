import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, BarChart3, Sparkles, Shuffle, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import {
  fetchScenarios, createScenario, deleteScenario, type Scenario,
} from "@/api/scenarios";
import { useAppStore } from "@/store/useAppStore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const CRITERIA = [
  { key: "energy_performance", label: "Performance énergétique" },
  { key: "resilience", label: "Résilience" },
  { key: "air_quality", label: "Qualité de l'air" },
  { key: "green_surface", label: "Surfaces vertes" },
  { key: "mobility", label: "Mobilité" },
  { key: "density", label: "Densité" },
];

const PRESETS: Record<string, Record<string, number>> = {
  "Scénario durable": { energy_performance: 94, resilience: 80, air_quality: 88, green_surface: 70, mobility: 75, density: 50 },
  "Compact urbain": { energy_performance: 87, resilience: 70, air_quality: 75, green_surface: 45, mobility: 80, density: 90 },
  "Résilient": { energy_performance: 78, resilience: 91, air_quality: 80, green_surface: 65, mobility: 60, density: 55 },
  "Mobilité verte": { energy_performance: 82, resilience: 68, air_quality: 85, green_surface: 60, mobility: 95, density: 65 },
};

export default function SimulationPage() {
  const qc = useQueryClient();
  const territoryId = useAppStore((st) => st.activeTerritoryId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [detail, setDetail] = useState<any | null>(null);
  const [params, setParams] = useState<Record<string, number>>(
    Object.fromEntries(CRITERIA.map((c) => [c.key, 50]))
  );

  const { data: scenarios } = useQuery({
    queryKey: ["scenarios", territoryId],
    queryFn: () => fetchScenarios(1),
  });

  const createMut = useMutation({
    mutationFn: () =>
      createScenario({ territory_id: territoryId, name, description, parameters: params }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scenarios", territoryId] });
      setName(""); setDescription("");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteScenario(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scenarios", territoryId] }),
  });

  const applyPreset = (preset: string) => {
    setName(preset);
    setParams(PRESETS[preset]);
  };

  // Simulation aléatoire : remplit tous les curseurs avec des valeurs au hasard
  const randomSimulation = () => {
    const rnd = () => Math.floor(Math.random() * 81) + 15; // 15..95
    const randomParams: Record<string, number> = {};
    CRITERIA.forEach((c) => { randomParams[c.key] = rnd(); });
    setParams(randomParams);
    if (!name.trim()) setName(`Scénario aléatoire ${Math.floor(Math.random() * 900 + 100)}`);
    if (!description.trim()) setDescription("Scénario généré aléatoirement");
  };

  const comparison =
    scenarios?.map((s: Scenario) => ({
      name: s.name,
      performance: s.performance ?? 0,
    })) ?? [];

  const barColor = (v: number) =>
    v >= 85 ? "#22c55e" : v >= 70 ? "#3b82f6" : "#eab308";

  return (
    <div>
      <PageHeader
        title="Simulation urbaine"
        subtitle="Construisez, évaluez et comparez vos scénarios d'aménagement"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Constructeur de scénario */}
        <Panel title="Nouveau scénario">
          <label className="mb-1 block text-sm text-slate-400">Nom</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Scénario durable"
            className="mb-3 w-full rounded-lg bg-white/5 px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
          />
          <label className="mb-1 block text-sm text-slate-400">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Transition énergétique et biodiversité"
            className="mb-4 w-full rounded-lg bg-white/5 px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="mb-4 flex flex-wrap gap-2">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Sparkles size={12} /> Préréglages :
            </span>
            {Object.keys(PRESETS).map((p) => (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                className="rounded-full bg-white/5 px-3 py-1 text-xs hover:bg-primary/20"
              >
                {p}
              </button>
            ))}
            <button
              onClick={randomSimulation}
              className="flex items-center gap-1 rounded-full bg-accent-2/20 px-3 py-1 text-xs text-accent-2 hover:bg-accent-2/30"
            >
              <Shuffle size={12} /> Aléatoire
            </button>
          </div>

          <div className="space-y-3">
            {CRITERIA.map((c) => (
              <div key={c.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{c.label}</span>
                  <span className="font-medium text-primary">{params[c.key]}</span>
                </div>
                <input
                  type="range" min={0} max={100} value={params[c.key]}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, [c.key]: Number(e.target.value) }))
                  }
                  className="w-full accent-primary"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => createMut.mutate()}
            disabled={!name || createMut.isPending}
            className="mt-5 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/80 disabled:opacity-50"
          >
            <Plus size={16} /> {createMut.isPending ? "Création…" : "Créer le scénario"}
          </button>
          {createMut.isError && (
            <p className="mt-2 text-sm text-rose-400">
              Erreur : le backend est-il lancé sur le port 8000 ?
            </p>
          )}
        </Panel>

        {/* Comparaison */}
        <Panel title="Comparaison des performances">
          {comparison.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun scénario à comparer. Créez-en un à gauche.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparison} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                <YAxis type="category" dataKey="name" width={110} stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ background: "#101d36", border: "none", borderRadius: 8 }} />
                <Bar dataKey="performance" radius={[0, 6, 6, 0]}>
                  {comparison.map((c, i) => (
                    <Cell key={i} fill={barColor(c.performance)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      {/* Liste des scénarios */}
      <Panel title="Scénarios enregistrés" className="mt-6">
        {!scenarios?.length && (
          <p className="text-sm text-slate-500">Aucun scénario enregistré.</p>
        )}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {scenarios?.map((s) => (
            <div key={s.id}
              onClick={() => setDetail(s)}
              className="cursor-pointer rounded-lg border border-white/5 bg-white/5 p-4 transition hover:border-primary/40">
              <div className="flex items-start justify-between">
                <BarChart3 size={18} className="text-primary" />
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMut.mutate(s.id); }}
                  className="text-slate-500 hover:text-rose-400"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <h3 className="mt-2 font-medium">{s.name}</h3>
              <p className="text-xs text-slate-400">{s.description}</p>
              {s.performance != null && (
                <div className="mt-3">
                  <div className="h-1.5 w-full rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${s.performance}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-sm font-semibold text-primary">
                    {s.performance}%
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* Modale de détail d'un scénario */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDetail(null)}>
          <div className="w-full max-w-md rounded-xl bg-navy-light p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-start justify-between">
              <h3 className="text-lg font-semibold">{detail.name}</h3>
              <button onClick={() => setDetail(null)} className="rounded-lg bg-white/5 p-1.5 hover:bg-white/10"><X size={18} /></button>
            </div>
            {detail.description && <p className="mb-4 text-sm text-slate-400">{detail.description}</p>}

            {detail.performance != null && (
              <div className="mb-4 rounded-lg bg-primary/10 p-3 text-center">
                <p className="text-2xl font-bold text-primary">{detail.performance}%</p>
                <p className="text-xs text-slate-400">Score de performance global</p>
              </div>
            )}

            <p className="mb-2 text-xs font-medium text-slate-400">Détail des critères</p>
            <div className="space-y-2.5">
              {CRITERIA.map((c) => {
                const val = detail.parameters?.[c.key];
                if (val == null) return null;
                return (
                  <div key={c.key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-300">{c.label}</span>
                      <span className="font-medium">{val}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                );
              })}
              {!detail.parameters && <p className="text-sm text-slate-500">Aucun détail de critère enregistré pour ce scénario.</p>}
            </div>

            <button
              onClick={() => { setName(detail.name + " (copie)"); if (detail.parameters) setParams(detail.parameters); setDetail(null); }}
              className="mt-5 w-full rounded-lg bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10">
              Charger ces valeurs dans le simulateur
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { saveAhp, fetchSavedAhp, deleteAhp } from "@/api/ahp";
import { Save, Trash2, History } from "lucide-react";
import { Scale, CheckCircle2, AlertCircle, Calculator } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { computeAhpScore, type AHPScoreResult } from "@/api/ahp";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
} from "recharts";

const CRITERIA = ["Énergie", "Résilience", "Qualité air", "Mobilité"];
// Échelle de Saaty : intensité d'importance
const SAATY = [
  { v: 1, label: "Égale" },
  { v: 3, label: "Modérée" },
  { v: 5, label: "Forte" },
  { v: 7, label: "Très forte" },
  { v: 9, label: "Extrême" },
];
const COLORS = ["#22c55e", "#3b82f6", "#06b6d4", "#a855f7"];

export default function MulticriteriaPage() {
  // Matrice de comparaison par paires (diagonale = 1, symétrie inverse)
  const n = CRITERIA.length;
  const [matrix, setMatrix] = useState<number[][]>(
    Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1 : i < j ? 2 : 0.5))
    )
  );
  const [values] = useState<Record<string, number>>({
    "Énergie": 80, "Résilience": 70, "Qualité air": 85, "Mobilité": 60,
  });

  const setCell = (i: number, j: number, v: number) => {
    setMatrix((m) => {
      const copy = m.map((row) => [...row]);
      copy[i][j] = v;
      copy[j][i] = +(1 / v).toFixed(4);
      return copy;
    });
  };

  const mutation = useMutation({
    mutationFn: () => computeAhpScore(CRITERIA, matrix, values),
  });
  const result: AHPScoreResult | undefined = mutation.data;
  const qc = useQueryClient();
  const { data: saved } = useQuery({ queryKey: ["ahp-saved"], queryFn: fetchSavedAhp });
  const saveMut = useMutation({
    mutationFn: (name: string) => saveAhp({
      name, criteria: CRITERIA, matrix,
      weights: result!.weights, consistency_ratio: result!.consistency_ratio,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ahp-saved"] }),
  });
  const delMut = useMutation({
    mutationFn: (id: number) => deleteAhp(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ahp-saved"] }),
  });
  const onSave = () => {
    const name = prompt("Nom de cette analyse :", "Pondération " + new Date().toLocaleDateString());
    if (name) saveMut.mutate(name);
  };

  const pieData = result
    ? Object.entries(result.weights).map(([name, value], i) => ({
        name, value: +(value * 100).toFixed(1), color: COLORS[i % COLORS.length],
      }))
    : [];

  return (
    <div>
      <PageHeader
        title="Analyse multicritère (AHP)"
        subtitle="Pondération des critères par la méthode de Saaty (Analytic Hierarchy Process)"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Matrice de comparaison par paires">
          <p className="mb-3 text-xs text-slate-400">
            Indiquez l'importance de chaque critère (en ligne) par rapport à l'autre (en colonne),
            sur l'échelle de Saaty (1 à 9).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="p-1"></th>
                  {CRITERIA.map((c) => (
                    <th key={c} className="p-1 text-slate-400">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CRITERIA.map((rc, i) => (
                  <tr key={rc}>
                    <td className="p-1 font-medium text-slate-300">{rc}</td>
                    {CRITERIA.map((_, j) => (
                      <td key={j} className="p-1">
                        {i === j ? (
                          <span className="block text-center text-slate-500">1</span>
                        ) : i < j ? (
                          <select
                            value={matrix[i][j]}
                            onChange={(e) => setCell(i, j, Number(e.target.value))}
                            className="w-full rounded bg-white/5 px-1 py-1 outline-none"
                          >
                            {SAATY.map((s) => (
                              <option key={s.v} value={s.v} className="bg-navy">
                                {s.v} — {s.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="block text-center text-slate-500">
                            {matrix[i][j].toFixed(2)}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="mt-5 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80 disabled:opacity-50"
          >
            <Calculator size={16} /> {mutation.isPending ? "Calcul…" : "Calculer les poids"}
          </button>
          {mutation.isError && (
            <p className="mt-2 text-sm text-rose-400">Erreur : backend lancé (port 8000) ?</p>
          )}
        </Panel>

        <Panel title="Résultat de la pondération">
          {!result && (
            <p className="text-sm text-slate-500">
              Renseignez la matrice puis calculez les poids.
            </p>
          )}
          {result && (
            <div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name"
                       innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#101d36", border: "none", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                  <span className="flex items-center gap-2 text-sm">
                    <Scale size={16} className="text-primary" /> Ratio de cohérence (CR)
                  </span>
                  <span className="text-sm font-semibold">{result.consistency_ratio}</span>
                </div>
                <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                  result.is_consistent ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                }`}>
                  {result.is_consistent ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {result.is_consistent
                    ? "Jugement cohérent (CR ≤ 0.10)"
                    : "Jugement incohérent (CR > 0.10) — révisez la matrice"}
                </div>
                <div className="rounded-lg bg-primary/10 p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{result.global_score}</p>
                  <p className="text-xs text-slate-400">Score global pondéré du territoire</p>
                </div>
                <button onClick={onSave} disabled={saveMut.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60">
                  <Save size={16} /> {saveMut.isPending ? "Enregistrement…" : "Enregistrer les résultats"}
                </button>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Historique des analyses sauvegardées */}
      {saved && saved.length > 0 && (
        <Panel title={`Analyses enregistrées (${saved.length})`} className="mt-6">
          <div className="space-y-2">
            {saved.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <History size={16} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-slate-500">
                      {Object.entries(a.weights).map(([k, v]) => `${k} ${(v * 100).toFixed(0)}%`).join(" · ")}
                    </p>
                  </div>
                </div>
                <button onClick={() => { if (confirm("Supprimer cette analyse ?")) delMut.mutate(a.id); }}
                  className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-rose-400" title="Supprimer">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

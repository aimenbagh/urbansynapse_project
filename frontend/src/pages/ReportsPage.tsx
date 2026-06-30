import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Calendar, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { downloadReportPDF, fetchRecommendations } from "@/api/planning";
import { fetchTerritoryStats } from "@/api/territories";
import { useAppStore } from "@/store/useAppStore";

const PRIORITY_STYLE: Record<string, string> = {
  Haute: "bg-rose-500/15 text-rose-300",
  Moyenne: "bg-amber-500/15 text-amber-300",
  Basse: "bg-emerald-500/15 text-emerald-300",
};

export default function ReportsPage() {
  const territoryId = useAppStore((s) => s.activeTerritoryId);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["stats", territoryId],
    queryFn: () => fetchTerritoryStats(territoryId),
  });
  const { data: recommendations } = useQuery({
    queryKey: ["recommendations", territoryId],
    queryFn: () => fetchRecommendations(territoryId),
  });

  const handleDownload = async () => {
    setBusy(true); setDone(false);
    try {
      await downloadReportPDF(territoryId, stats?.name ?? "territoire");
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch {
      alert("Erreur : le backend est-il lancé sur le port 8000 ?");
    } finally {
      setBusy(false);
    }
  };

  const reports = [
    { title: `Synthèse territoriale — ${stats?.name ?? "…"}`, date: "Juin 2026", type: "Analyse globale" },
    { title: "Performance énergétique du bâti", date: "Mai 2026", type: "Énergie" },
    { title: "Évaluation des risques naturels", date: "Avril 2026", type: "Résilience" },
    { title: "Scénarios de mobilité durable", date: "Mars 2026", type: "Mobilité" },
  ];

  return (
    <div>
      <PageHeader
        title="Rapports"
        subtitle="Synthèses décisionnelles générées par IA"
        action={
          <button onClick={handleDownload} disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80 disabled:opacity-60">
            {busy ? <Loader2 size={16} className="animate-spin" /> : done ? <CheckCircle2 size={16} /> : <FileText size={16} />}
            {busy ? "Génération…" : done ? "Téléchargé !" : "Nouveau rapport"}
          </button>
        }
      />

      {/* Aperçu des recommandations qui seront incluses */}
      <Panel className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="text-accent-2" size={18} />
          <h2 className="font-semibold">Recommandations incluses dans le rapport</h2>
        </div>
        {!recommendations?.length && (
          <p className="text-sm text-slate-500">Aucune recommandation pour ce territoire.</p>
        )}
        <div className="grid gap-2 md:grid-cols-2">
          {recommendations?.map((r, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_STYLE[r.priority]}`}>{r.priority}</span>
              <span className="text-slate-300">{r.title}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="space-y-3">
        {reports.map((r) => (
          <Panel key={r.title}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-white/5 p-3"><FileText className="text-primary" /></div>
                <div>
                  <h3 className="font-medium">{r.title}</h3>
                  <p className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar size={12} /> {r.date} · {r.type}
                  </p>
                </div>
              </div>
              <button onClick={handleDownload} disabled={busy}
                className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-60">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Exporter
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

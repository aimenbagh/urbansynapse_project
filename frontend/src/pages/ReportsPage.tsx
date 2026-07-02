import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText, Plus, Eye, Download, Trash2, X, Loader2, Zap, ShieldAlert, Users,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import {
  fetchReports, generateReport, deleteReport, fetchReportBlob, type SavedReport,
} from "@/api/reports";
import { fetchTerritories } from "@/api/territories";
import { useAppStore } from "@/store/useAppStore";

export default function ReportsPage() {
  const qc = useQueryClient();
  const activeTerritoryId = useAppStore((s) => s.activeTerritoryId);
  const { data: reports, isLoading } = useQuery({ queryKey: ["reports"], queryFn: fetchReports });
  const { data: territories } = useQuery({ queryKey: ["territories"], queryFn: fetchTerritories });
  const [viewing, setViewing] = useState<{ report: SavedReport; url: string } | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  const gen = useMutation({
    mutationFn: () => generateReport(activeTerritoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
    onError: () => alert("Échec de la génération. Vérifie que le backend est lancé."),
  });
  const del = useMutation({
    mutationFn: (id: number) => deleteReport(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });

  const activeName = territories?.find((t: any) => t.id === activeTerritoryId)?.name ?? "…";

  const view = async (r: SavedReport) => {
    setLoadingView(true);
    try {
      const blob = await fetchReportBlob(r.id);
      setViewing({ report: r, url: URL.createObjectURL(blob) });
    } catch { alert("Impossible d'afficher le rapport."); }
    finally { setLoadingView(false); }
  };
  const download = async (r: SavedReport) => {
    const blob = await fetchReportBlob(r.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `rapport_${r.territory_name}.pdf`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };
  const closeView = () => { if (viewing) URL.revokeObjectURL(viewing.url); setViewing(null); };

  return (
    <div>
      <PageHeader title="Rapports" subtitle="Historique des rapports générés avec les données réelles"
        action={
          <button onClick={() => gen.mutate()} disabled={gen.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60">
            {gen.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {gen.isPending ? "Génération…" : `Nouveau rapport (${activeName})`}
          </button>
        } />

      {isLoading ? (
        <p className="text-slate-400">Chargement…</p>
      ) : !reports?.length ? (
        <Panel><div className="py-10 text-center">
          <FileText className="mx-auto mb-3 text-slate-600" size={40} />
          <p className="text-slate-400">Aucun rapport généré pour le moment.</p>
          <p className="mt-1 text-sm text-slate-500">Clique « Nouveau rapport » pour en générer un avec les données réelles de la wilaya active.</p>
        </div></Panel>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Panel key={r.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                    <FileText className="text-primary" size={22} />
                  </div>
                  <div>
                    <h3 className="font-medium">{r.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                      {r.population != null && <span className="flex items-center gap-1"><Users size={12} /> {r.population.toLocaleString()} hab.</span>}
                      {r.energy_performance != null && <span className="flex items-center gap-1"><Zap size={12} /> {r.energy_performance}%</span>}
                      {r.risk_global != null && <span className="flex items-center gap-1"><ShieldAlert size={12} /> risque {r.risk_global}/100</span>}
                      <span>· {(r.size_bytes / 1024).toFixed(0)} Ko</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => view(r)} disabled={loadingView} title="Afficher"
                    className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">
                    <Eye size={14} /> Afficher
                  </button>
                  <button onClick={() => download(r)} title="Télécharger"
                    className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">
                    <Download size={14} /> Télécharger
                  </button>
                  <button onClick={() => { if (confirm("Supprimer ce rapport ?")) del.mutate(r.id); }} title="Supprimer"
                    className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-rose-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* Visionneuse PDF intégrée */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeView}>
          <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-navy-light shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <h3 className="font-semibold">{viewing.report.title}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => download(viewing.report)} className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">
                  <Download size={14} /> Télécharger
                </button>
                <button onClick={closeView} className="rounded-lg bg-white/5 p-1.5 hover:bg-white/10"><X size={18} /></button>
              </div>
            </div>
            <iframe src={viewing.url} title={viewing.report.title} className="flex-1 rounded-b-xl bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}

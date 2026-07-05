import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldAlert, Globe2, MapPin, Download, Eye, Sparkles, AlertTriangle,
  ShieldCheck, Siren, Loader2, X,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import MarkdownView from "@/components/ui/MarkdownView";
import { fetchTerritories } from "@/api/territories";
import {
  fetchSinglePlan, fetchGlobalPlan, downloadPlanPdf, openPlanPdf,
  singlePlanPdfUrl, globalPlanPdfUrl,
  fetchSubdivisions, fetchDairaPlan, fetchCommunePlan,
  dairaPlanPdfUrl, communePlanPdfUrl,
} from "@/api/riskPlans";

const LEVEL: any = {
  "Élevé": "bg-rose-500/15 text-rose-400", "Modéré": "bg-amber-500/15 text-amber-400",
  "Faible": "bg-emerald-500/15 text-emerald-400", "Structurel": "bg-sky-500/15 text-sky-400",
};

export default function RiskPlansPage() {
  const [mode, setMode] = useState<"single" | "global">("single");
  const { data: territories } = useQuery({ queryKey: ["territories"], queryFn: fetchTerritories });
  const [placeId, setPlaceId] = useState<number | null>(null);
  const [adminLevel, setAdminLevel] = useState<"wilaya" | "daira" | "commune">("wilaya");
  const [daira, setDaira] = useState<string>("");
  const [commune, setCommune] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const subs = useQuery({
    queryKey: ["risk-subs", placeId],
    queryFn: () => fetchSubdivisions(placeId!),
    enabled: mode === "single" && placeId !== null,
  });
  const single = useQuery({
    queryKey: ["risk-plan-single", placeId, adminLevel, daira, commune],
    queryFn: () => {
      if (adminLevel === "commune" && commune) return fetchCommunePlan(placeId!, commune);
      if (adminLevel === "daira" && daira) return fetchDairaPlan(placeId!, daira);
      return fetchSinglePlan(placeId!);
    },
    enabled: mode === "single" && placeId !== null &&
      (adminLevel === "wilaya" ||
       (adminLevel === "daira" && !!daira) ||
       (adminLevel === "commune" && !!commune)),
  });
  // PDF selon le niveau
  const currentPdfPath = () => {
    if (adminLevel === "commune" && commune) return communePlanPdfUrl(placeId!, commune);
    if (adminLevel === "daira" && daira) return dairaPlanPdfUrl(placeId!, daira);
    return singlePlanPdfUrl(placeId!);
  };
  const communesForDaira = subs.data?.dairas.find((d) => d.nom === daira)?.communes ?? [];
  const global = useQuery({
    queryKey: ["risk-plan-global"],
    queryFn: fetchGlobalPlan,
    enabled: mode === "global",
  });

  const viewPdf = async (path: string) => {
    setLoadingPdf(true);
    try { setPdfUrl(await openPlanPdf(path)); }
    finally { setLoadingPdf(false); }
  };
  const closePdf = () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); setPdfUrl(null); };

  return (
    <div>
      <PageHeader title="Gestion des risques & plans d'action"
        subtitle="Scénarios de risques (naturels, énergétiques), solutions et plans d'intervention" />

      {/* Sélecteur de périmètre */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button onClick={() => setMode("single")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${mode === "single" ? "bg-primary text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
          <MapPin size={16} /> Un lieu précis
        </button>
        <button onClick={() => setMode("global")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${mode === "global" ? "bg-primary text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
          <Globe2 size={16} /> Toute l'Algérie
        </button>
      </div>

      {/* MODE LIEU PRÉCIS */}
      {mode === "single" && (
        <>
          <Panel className="mb-6">
            <label className="mb-2 block text-sm text-slate-300">Choisir une wilaya</label>
            <select value={placeId ?? ""} onChange={(e) => { setPlaceId(Number(e.target.value) || null); setAdminLevel("wilaya"); setDaira(""); setCommune(""); }}
              className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
              <option value="" className="bg-navy">— Sélectionner —</option>
              {territories?.map((t: any) => <option key={t.id} value={t.id} className="bg-navy">{t.name}</option>)}
            </select>

            {placeId !== null && (
              <div className="mt-4">
                <p className="mb-2 text-sm text-slate-300">Niveau d'analyse</p>
                <div className="flex flex-wrap gap-2">
                  {[["wilaya", "Wilaya"], ["daira", "Daïra"], ["commune", "Commune"]].map(([lvl, lbl]) => (
                    <button key={lvl}
                      onClick={() => { setAdminLevel(lvl as any); if (lvl === "wilaya") { setDaira(""); setCommune(""); } if (lvl === "daira") setCommune(""); }}
                      className={`rounded-lg px-3 py-1.5 text-sm ${adminLevel === lvl ? "bg-primary text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
                      {lbl}
                    </button>
                  ))}
                </div>

                {(adminLevel === "daira" || adminLevel === "commune") && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Daïra</label>
                      <select value={daira} onChange={(e) => { setDaira(e.target.value); setCommune(""); }}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
                        <option value="" className="bg-navy">— Choisir une daïra —</option>
                        {subs.data?.dairas.map((d) => <option key={d.nom} value={d.nom} className="bg-navy">{d.nom}</option>)}
                      </select>
                    </div>
                    {adminLevel === "commune" && daira && (
                      <div>
                        <label className="mb-1 block text-xs text-slate-400">Commune</label>
                        <select value={commune} onChange={(e) => setCommune(e.target.value)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
                          <option value="" className="bg-navy">— Choisir une commune —</option>
                          {communesForDaira.map((cm) => <option key={cm} value={cm} className="bg-navy">{cm}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Panel>

          {single.isLoading && <p className="flex items-center gap-2 text-slate-400"><Loader2 className="animate-spin" size={16} /> Génération du plan…</p>}

          {single.data && (
            <>
              <Panel className="mb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="text-primary" size={24} />
                    <div>
                      <h3 className="font-semibold">{single.data.territoire}
                        {single.data.niveau_admin && <span className="ml-2 rounded bg-white/5 px-2 py-0.5 text-xs text-accent-2">{single.data.niveau_admin}</span>}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {single.data.wilaya_parent && single.data.niveau_admin !== "Wilaya" ? `Wilaya de ${single.data.wilaya_parent} · ` : ""}
                        Zone sismique {single.data.zone_sismique} · risque global {single.data.risque_global}/100
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => viewPdf(currentPdfPath())} disabled={loadingPdf}
                      className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">
                      <Eye size={14} /> Afficher le PDF
                    </button>
                    <button onClick={() => downloadPlanPdf(currentPdfPath(), `plan_risques_${single.data!.territoire}.pdf`)}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary/90">
                      <Download size={14} /> Télécharger
                    </button>
                  </div>
                </div>
              </Panel>

              {/* Scénarios */}
              <div className="space-y-4">
                {single.data.scénarios.map((sc, i) => (
                  <Panel key={i}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-400" />
                        <h3 className="font-semibold">{sc.aléa}</h3>
                      </div>
                      <span className={`rounded px-2 py-0.5 text-xs ${LEVEL[sc.niveau] ?? "bg-white/10 text-slate-300"}`}>
                        {sc.niveau}{sc.valeur != null ? ` · ${sc.valeur}/100` : ""}
                      </span>
                    </div>
                    <p className="mb-3 text-sm text-slate-300">{sc.scénario}</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-1 flex items-center gap-1 text-xs font-medium text-emerald-400"><ShieldCheck size={13} /> Prévention</p>
                        <ul className="space-y-1 text-sm text-slate-300">
                          {sc.prévention.map((x, j) => <li key={j} className="flex gap-1.5"><span className="text-emerald-400">•</span> {x}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-1 flex items-center gap-1 text-xs font-medium text-rose-400"><Siren size={13} /> Réponse en cas de crise</p>
                        <ul className="space-y-1 text-sm text-slate-300">
                          {sc.réponse_crise.map((x, j) => <li key={j} className="flex gap-1.5"><span className="text-rose-400">•</span> {x}</li>)}
                        </ul>
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>

              {/* Plan IA */}
              {single.data.ai_plan && (
                <Panel className="mt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="text-accent-2" size={18} />
                    <h3 className="font-semibold">Plan d'action détaillé (IA Mistral)</h3>
                  </div>
                  <MarkdownView content={single.data.ai_plan} />
                </Panel>
              )}
            </>
          )}
        </>
      )}

      {/* MODE GLOBAL */}
      {mode === "global" && (
        <>
          {global.isLoading && <p className="flex items-center gap-2 text-slate-400"><Loader2 className="animate-spin" size={16} /> Génération du rapport national…</p>}
          {global.data && (
            <>
              <Panel className="mb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Globe2 className="text-primary" size={24} />
                    <div>
                      <h3 className="font-semibold">Rapport national des risques</h3>
                      <p className="text-xs text-slate-400">{global.data.périmètre}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => viewPdf(globalPlanPdfUrl())} disabled={loadingPdf}
                      className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">
                      <Eye size={14} /> Afficher le PDF
                    </button>
                    <button onClick={() => downloadPlanPdf(globalPlanPdfUrl(), "plan_national_risques_algerie.pdf")}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary/90">
                      <Download size={14} /> Télécharger
                    </button>
                  </div>
                </div>
              </Panel>

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Wilayas les plus exposées">
                  <div className="space-y-1.5">
                    {global.data.wilayas_plus_risquées.map((w, i) => (
                      <div key={w.nom} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2"><span className="font-mono text-xs text-slate-600">{String(i + 1).padStart(2, "0")}</span> {w.nom}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-slate-400">{w.risque_global}/100</span>
                          <span className="rounded bg-white/5 px-1.5 text-xs text-accent-2">Z. {w.zone_sismique}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel title="Priorités nationales">
                  <ul className="space-y-2 text-sm text-slate-300">
                    {global.data.priorités_nationales.map((p, i) => (
                      <li key={i} className="flex gap-2"><span className="text-primary">{i + 1}.</span> {p}</li>
                    ))}
                  </ul>
                </Panel>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Panel title="Zones sismiques élevées">
                  <p className="text-sm text-slate-300">{global.data.zones_sismiques_élevées.join(", ") || "—"}</p>
                </Panel>
                <Panel title="Inondation élevée">
                  <p className="text-sm text-slate-300">{global.data.zones_inondation_élevée.join(", ") || "—"}</p>
                </Panel>
                <Panel title="Feux de forêt élevé">
                  <p className="text-sm text-slate-300">{global.data.zones_feu_forêt_élevé.join(", ") || "—"}</p>
                </Panel>
              </div>

              {global.data.ai_plan && (
                <Panel className="mt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="text-accent-2" size={18} />
                    <h3 className="font-semibold">Plan national détaillé (IA Mistral)</h3>
                  </div>
                  <MarkdownView content={global.data.ai_plan} />
                </Panel>
              )}
            </>
          )}
        </>
      )}

      {/* Visionneuse PDF */}
      {pdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closePdf}>
          <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-navy-light" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <h3 className="font-semibold">Aperçu du plan</h3>
              <button onClick={closePdf} className="rounded-lg bg-white/5 p-1.5 hover:bg-white/10"><X size={18} /></button>
            </div>
            <iframe src={pdfUrl} title="Plan PDF" className="flex-1 rounded-b-xl bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}

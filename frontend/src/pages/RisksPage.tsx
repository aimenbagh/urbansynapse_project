import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Waves, Mountain, Flame, CloudRain, AlertTriangle, ChevronRight, ChevronDown, MapPin,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { fetchRisksHierarchy } from "@/api/profile";
import { fetchTerritories } from "@/api/territories";
import { useAppStore } from "@/store/useAppStore";

const ICONS: any = { flood: Waves, seismic: Mountain, forest: Flame, heat: CloudRain };
const LEVEL_COLOR: any = { "Élevé": "text-rose-400", "Modéré": "text-amber-400", "Faible": "text-emerald-400" };
const BAR_COLOR: any = { "Élevé": "bg-rose-500", "Modéré": "bg-amber-500", "Faible": "bg-emerald-500" };
const BADGE: any = {
  "Élevé": "bg-rose-500/15 text-rose-400", "Modéré": "bg-amber-500/15 text-amber-400", "Faible": "bg-emerald-500/15 text-emerald-400",
};

export default function RisksPage() {
  const activeTerritoryId = useAppStore((s) => s.activeTerritoryId);
  const { data: territories } = useQuery({ queryKey: ["territories"], queryFn: fetchTerritories });
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["risks-hierarchy", activeTerritoryId],
    queryFn: () => fetchRisksHierarchy(activeTerritoryId),
    retry: 1,
  });
  const name = territories?.find((t: any) => t.id === activeTerritoryId)?.name ?? "";
  const [openDaira, setOpenDaira] = useState<string | null>(null);
  const [openCommune, setOpenCommune] = useState<string | null>(null);

  return (
    <div>
      <PageHeader title="Risques naturels" subtitle={`Cartographie et évaluation des aléas — ${name}`} />

      {isError ? (
        <Panel><div className="py-8 text-center">
          <p className="mb-2 text-rose-400">Impossible de charger les risques.</p>
          <p className="mb-4 text-sm text-slate-400">Vérifie que le serveur backend est démarré (port 8000) et à jour.</p>
          <button onClick={() => refetch()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">Réessayer</button>
        </div></Panel>
      ) : isLoading || !data ? (
        <p className="text-slate-400">Chargement…</p>
      ) : (
        <>
          {/* Niveau WILAYA */}
          <Panel className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                  <AlertTriangle className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Wilaya de {data.territory_name} — indice global</p>
                  <p className="text-2xl font-bold">{data.global}<span className="text-base text-slate-500">/100</span></p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Zone sismique (RPA)</p>
                <p className="text-xl font-semibold text-accent-2">{data.seismic_zone}</p>
              </div>
            </div>
          </Panel>

          {/* Aléas de la wilaya */}
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {data.hazards.map((h) => {
              const Icon = ICONS[h.key] ?? AlertTriangle;
              return (
                <Panel key={h.key}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5"><Icon className={LEVEL_COLOR[h.level]} size={20} /></div>
                      <div><h3 className="font-semibold">{h.name}</h3><p className="text-xs text-slate-400">{h.zone}</p></div>
                    </div>
                    <span className={`text-sm font-semibold ${LEVEL_COLOR[h.level]}`}>{h.level}</span>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs"><span className="text-slate-400">Niveau d'aléa</span><span className="font-medium">{h.value}/100</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${BAR_COLOR[h.level]}`} style={{ width: `${h.value}%` }} /></div>
                  </div>
                </Panel>
              );
            })}
          </div>

          {/* Hiérarchie DAÏRAS → COMMUNES */}
          {data.has_detail && (
            <Panel title={`Détail par daïra et commune (${data.dairas.length} daïras)`}>
              <div className="space-y-2">
                {data.dairas.map((d) => {
                  const open = openDaira === d.name;
                  return (
                    <div key={d.name} className="rounded-lg border border-white/5">
                      {/* Ligne daïra */}
                      <button onClick={() => setOpenDaira(open ? null : d.name)}
                        className="flex w-full items-center justify-between px-4 py-3 hover:bg-white/5">
                        <div className="flex items-center gap-2">
                          {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                          <span className="font-medium">Daïra {d.name}</span>
                          <span className="text-xs text-slate-500">({d.communes.length} communes)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-400">{d.global}/100</span>
                          <span className={`rounded px-2 py-0.5 text-xs ${BADGE[d.level]}`}>{d.level}</span>
                        </div>
                      </button>
                      {/* Communes de la daïra */}
                      {open && (
                        <div className="border-t border-white/5 bg-black/20 px-4 py-2">
                          {d.communes.map((cm) => {
                            const cOpen = openCommune === `${d.name}-${cm.name}`;
                            return (
                              <div key={cm.name}>
                                <button onClick={() => setOpenCommune(cOpen ? null : `${d.name}-${cm.name}`)}
                                  className="flex w-full items-center justify-between py-2 text-sm hover:bg-white/5">
                                  <div className="flex items-center gap-2">
                                    <MapPin size={13} className="text-slate-500" />
                                    <span>{cm.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-400">{cm.global}/100</span>
                                    <span className={`rounded px-2 py-0.5 text-xs ${BADGE[cm.level]}`}>{cm.level}</span>
                                  </div>
                                </button>
                                {/* Détail des aléas de la commune */}
                                {cOpen && (
                                  <div className="mb-2 ml-6 grid gap-1.5 rounded-lg bg-white/5 p-3 sm:grid-cols-2">
                                    {cm.hazards.map((h: any) => {
                                      const Icon = ICONS[h.key] ?? AlertTriangle;
                                      return (
                                        <div key={h.key} className="flex items-center justify-between text-xs">
                                          <span className="flex items-center gap-1.5 text-slate-300"><Icon size={12} className={LEVEL_COLOR[h.level]} /> {h.name}</span>
                                          <span className={LEVEL_COLOR[h.level]}>{h.value}/100</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          <p className="mt-4 text-xs text-slate-500">
            Découpage administratif officiel (58 wilayas, 545 daïras, 1541 communes). Zonage sismique : RPA.
            Les valeurs par commune sont estimées à partir du profil de la wilaya.
          </p>
        </>
      )}
    </div>
  );
}

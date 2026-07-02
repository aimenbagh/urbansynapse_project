import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Shield, Thermometer, Droplets, TreePine, ChevronRight, ChevronDown, MapPin, BarChart3,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import KpiCard from "@/components/ui/KpiCard";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
} from "recharts";
import { fetchResilience } from "@/api/profile";
import { fetchTerritories } from "@/api/territories";
import { useAppStore } from "@/store/useAppStore";

const BADGE: any = {
  "Élevée": "bg-emerald-500/15 text-emerald-400",
  "Moyenne": "bg-amber-500/15 text-amber-400",
  "Faible": "bg-rose-500/15 text-rose-400",
};

export default function ResiliencePage() {
  const activeTerritoryId = useAppStore((s) => s.activeTerritoryId);
  const { data: territories } = useQuery({ queryKey: ["territories"], queryFn: fetchTerritories });
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["resilience", activeTerritoryId],
    queryFn: () => fetchResilience(activeTerritoryId),
    retry: 1,
  });
  const name = territories?.find((t: any) => t.id === activeTerritoryId)?.name ?? "";
  const [openDaira, setOpenDaira] = useState<string | null>(null);
  // Sélection du niveau affiché dans le radar
  const [selected, setSelected] = useState<{ label: string; dims: any[] } | null>(null);

  const radarData = selected?.dims ?? data?.dimensions ?? [];
  const radarLabel = selected?.label ?? `Wilaya de ${name}`;

  return (
    <div>
      <PageHeader title="Résilience urbaine"
        subtitle={`Capacité d'adaptation face aux aléas climatiques — ${name}`} />

      {isError ? (
        <Panel><div className="py-8 text-center">
          <p className="mb-2 text-rose-400">Impossible de charger la résilience.</p>
          <p className="mb-4 text-sm text-slate-400">Vérifie que le serveur backend est démarré (port 8000) et à jour.</p>
          <button onClick={() => refetch()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">Réessayer</button>
        </div></Panel>
      ) : isLoading || !data ? (
        <p className="text-slate-400">Chargement…</p>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Résilience globale" value={`${data.global}%`} icon={Shield} />
            <KpiCard label="Îlots de chaleur" value={`${data.heat_zones} zones`} positive={false} icon={Thermometer} />
            <KpiCard label="Gestion de l'eau" value={`${data.water_management}%`} icon={Droplets} />
            <KpiCard label="Trame verte" value={`${data.green_coverage}%`} icon={TreePine} />
          </div>

          {/* Radar dynamique selon le niveau sélectionné */}
          <Panel className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Profil de résilience — {radarLabel}</h3>
              {selected && (
                <button onClick={() => setSelected(null)}
                  className="rounded-lg bg-white/5 px-3 py-1 text-xs text-slate-300 hover:bg-white/10">
                  Revenir à la wilaya
                </button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#ffffff15" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Radar dataKey="score" stroke="#7c4dff" fill="#7c4dff" fillOpacity={0.5} />
                <Tooltip contentStyle={{ background: "#101d36", border: "none", borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-slate-500">
              Clique le graphique d'une daïra ou commune ci-dessous pour l'afficher ici.
            </p>
          </Panel>

          {/* Hiérarchie avec bouton "voir le radar" à chaque niveau */}
          {data.has_detail && (
            <Panel title={`Résilience par daïra et commune (${data.dairas.length} daïras)`}>
              <div className="space-y-2">
                {data.dairas.map((d) => {
                  const open = openDaira === d.name;
                  return (
                    <div key={d.name} className="rounded-lg border border-white/5">
                      <div className="flex items-center justify-between px-4 py-3 hover:bg-white/5">
                        <button onClick={() => setOpenDaira(open ? null : d.name)} className="flex flex-1 items-center gap-2 text-left">
                          {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                          <span className="font-medium">Daïra {d.name}</span>
                          <span className="text-xs text-slate-500">({d.communes.length} communes)</span>
                        </button>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-slate-400">{d.global}%</span>
                          <span className={`rounded px-2 py-0.5 text-xs ${BADGE[d.level]}`}>{d.level}</span>
                          <button onClick={() => setSelected({ label: `Daïra ${d.name}`, dims: d.dimensions })}
                            title="Voir le radar de cette daïra"
                            className="flex items-center gap-1 rounded-lg bg-accent-2/15 px-2 py-1 text-xs text-accent-2 hover:bg-accent-2/25">
                            <BarChart3 size={12} /> Radar
                          </button>
                        </div>
                      </div>
                      {open && (
                        <div className="border-t border-white/5 bg-black/20 px-4 py-2">
                          {d.communes.map((cm) => (
                            <div key={cm.name} className="flex items-center justify-between py-2 text-sm">
                              <span className="flex items-center gap-2"><MapPin size={13} className="text-slate-500" /> {cm.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-400">{cm.global}%</span>
                                <span className={`rounded px-2 py-0.5 text-xs ${BADGE[cm.level]}`}>{cm.level}</span>
                                <button onClick={() => setSelected({ label: `Commune ${cm.name}`, dims: cm.dimensions })}
                                  title="Voir le radar de cette commune"
                                  className="flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-1 text-xs text-primary hover:bg-primary/25">
                                  <BarChart3 size={12} /> Radar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          <p className="mt-4 text-xs text-slate-500">
            Résilience dérivée du profil réel du territoire. Découpage officiel : 58 wilayas,
            545 daïras, 1541 communes. Chaque niveau a son propre profil multidimensionnel.
          </p>
        </>
      )}
    </div>
  );
}

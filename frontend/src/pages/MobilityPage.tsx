import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Navigation, Bus, Bike, Footprints, ChevronRight, ChevronDown, MapPin, BarChart3,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import KpiCard from "@/components/ui/KpiCard";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import { fetchMobilityDetail } from "@/api/profile";
import { fetchTerritories } from "@/api/territories";
import { useAppStore } from "@/store/useAppStore";

const BADGE: any = {
  "Bonne": "bg-emerald-500/15 text-emerald-400",
  "Moyenne": "bg-amber-500/15 text-amber-400",
  "Faible": "bg-rose-500/15 text-rose-400",
};

export default function MobilityPage() {
  const activeTerritoryId = useAppStore((s) => s.activeTerritoryId);
  const { data: territories } = useQuery({ queryKey: ["territories"], queryFn: fetchTerritories });
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mobility-detail", activeTerritoryId],
    queryFn: () => fetchMobilityDetail(activeTerritoryId),
    retry: 1,
  });
  const name = territories?.find((t: any) => t.id === activeTerritoryId)?.name ?? "";
  const [openDaira, setOpenDaira] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ label: string; modal: any[] } | null>(null);

  const modal = selected?.modal ?? data?.modal_split ?? [];
  const modalLabel = selected?.label ?? `Wilaya de ${name}`;
  const chartData = modal.map((m: any) => ({ mode: m.mode, part: m.value }));

  return (
    <div>
      <PageHeader title="Mobilité & Accessibilité"
        subtitle={`Flux de déplacement, parts modales et accessibilité — ${name}`} />

      {isError ? (
        <Panel><div className="py-8 text-center">
          <p className="mb-2 text-rose-400">Impossible de charger les données de mobilité.</p>
          <p className="mb-4 text-sm text-slate-400">Vérifie que le serveur backend est démarré (port 8000) et à jour.</p>
          <button onClick={() => refetch()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">Réessayer</button>
        </div></Panel>
      ) : isLoading || !data ? (
        <p className="text-slate-400">Chargement…</p>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Trafic moyen" value={`${data.traffic}%`} positive={false} icon={Navigation} />
            <KpiCard label="Couverture transports" value={`${data.transport_coverage}%`} icon={Bus} />
            <KpiCard label="Pistes cyclables" value={`${data.bike_km} km`} icon={Bike} />
            <KpiCard label="Accessibilité piétonne" value={`${data.pedestrian}%`} icon={Footprints} />
          </div>

          {/* Graphe dynamique selon le niveau sélectionné */}
          <Panel className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Répartition modale — {modalLabel}</h3>
              {selected && (
                <button onClick={() => setSelected(null)}
                  className="rounded-lg bg-white/5 px-3 py-1 text-xs text-slate-300 hover:bg-white/10">
                  Revenir à la wilaya
                </button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="mode" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: "#101d36", border: "none", borderRadius: 8 }}
                  formatter={(v: any) => [`${v}%`, "Part modale"]} />
                <Bar dataKey="part" fill="#2da3e0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-center text-xs text-slate-500">
              Clique le bouton « Graphe » d'une daïra ou commune ci-dessous pour l'afficher ici.
            </p>
          </Panel>

          {data.has_detail && (
            <Panel title={`Accessibilité par daïra et commune (${data.dairas.length} daïras)`}>
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
                          <span className="text-sm text-slate-400">{d.score}%</span>
                          <span className={`rounded px-2 py-0.5 text-xs ${BADGE[d.level]}`}>{d.level}</span>
                          <button onClick={() => setSelected({ label: `Daïra ${d.name}`, modal: d.modal_split })}
                            title="Voir le graphe de cette daïra"
                            className="flex items-center gap-1 rounded-lg bg-accent-2/15 px-2 py-1 text-xs text-accent-2 hover:bg-accent-2/25">
                            <BarChart3 size={12} /> Graphe
                          </button>
                        </div>
                      </div>
                      {open && (
                        <div className="border-t border-white/5 bg-black/20 px-4 py-2">
                          {d.communes.map((cm) => (
                            <div key={cm.name} className="flex items-center justify-between py-2 text-sm">
                              <span className="flex items-center gap-2"><MapPin size={13} className="text-slate-500" /> {cm.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500">TC {cm.transport_coverage}% · piéton {cm.pedestrian}%</span>
                                <span className={`rounded px-2 py-0.5 text-xs ${BADGE[cm.level]}`}>{cm.level}</span>
                                <button onClick={() => setSelected({ label: `Commune ${cm.name}`, modal: cm.modal_split })}
                                  title="Voir le graphe de cette commune"
                                  className="flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-1 text-xs text-primary hover:bg-primary/25">
                                  <BarChart3 size={12} /> Graphe
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
            Indicateurs dérivés de la densité et de la population. Découpage officiel : 58 wilayas,
            545 daïras, 1541 communes. Chaque niveau a sa propre répartition modale.
          </p>
        </>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Building2, BarChart3, FileUp, CheckCircle2, Loader2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { fetchTerritories } from "@/api/territories";
import { addTerritory, addZone, importEnergyBalance } from "@/api/ingest";
import { useAppStore } from "@/store/useAppStore";

type Tab = "territory" | "zone" | "balance";
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "territory", label: "Territoire", icon: MapPin },
  { id: "zone", label: "Zone + bâtiments", icon: Building2 },
  { id: "balance", label: "Bilan énergétique", icon: FileUp },
];

const inputCls = "w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-400">{label}</label>
      {children}
    </div>
  );
}

export default function DataEntryPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("territory");
  const setActiveTerritory = useAppStore((s) => s.setActiveTerritory);

  const { data: territories } = useQuery({ queryKey: ["territories"], queryFn: fetchTerritories });
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["territories"] });
    qc.invalidateQueries({ queryKey: ["indicators"] });
    qc.invalidateQueries({ queryKey: ["geojson"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };

  // --- Territoire ---
  const [terr, setTerr] = useState({ name: "", wilaya_code: "", population: "", area_km2: "", center_lon: "", center_lat: "" });
  const terrMut = useMutation({
    mutationFn: () => addTerritory({
      name: terr.name, wilaya_code: terr.wilaya_code || undefined,
      population: terr.population ? Number(terr.population) : undefined,
      area_km2: terr.area_km2 ? Number(terr.area_km2) : undefined,
      center_lon: terr.center_lon ? Number(terr.center_lon) : undefined,
      center_lat: terr.center_lat ? Number(terr.center_lat) : undefined,
    }),
    onSuccess: () => { invalidateAll(); setTerr({ name: "", wilaya_code: "", population: "", area_km2: "", center_lon: "", center_lat: "" }); },
  });

  // --- Zone ---
  const [zone, setZone] = useState({ territory_id: 1, name: "", land_use: "mixte", buildings_count: 5 });
  const zoneMut = useMutation({
    mutationFn: () => addZone(zone),
    onSuccess: () => { invalidateAll(); qc.invalidateQueries({ queryKey: ["geojson", zone.territory_id] }); setZone({ ...zone, name: "" }); },
  });

  // --- Bilan ---
  const [bal, setBal] = useState({ territory_id: 1, energy_performance: "", resilience: "", air_quality: "", co2_avoided: "", renewable_share: "" });
  const balMut = useMutation({
    mutationFn: () => importEnergyBalance({
      territory_id: bal.territory_id,
      energy_performance: bal.energy_performance ? Number(bal.energy_performance) : undefined,
      resilience: bal.resilience ? Number(bal.resilience) : undefined,
      air_quality: bal.air_quality ? Number(bal.air_quality) : undefined,
      co2_avoided: bal.co2_avoided ? Number(bal.co2_avoided) : undefined,
      renewable_share: bal.renewable_share ? Number(bal.renewable_share) : undefined,
    }),
    onSuccess: () => invalidateAll(),
  });

  const Success = ({ show, text }: { show: boolean; text: string }) =>
    show ? <p className="mt-3 flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 size={16} /> {text}</p> : null;

  return (
    <div>
      <PageHeader
        title="Ajouter des données"
        subtitle="Enregistrez territoires, zones, bâtiments et bilans — répercutés partout"
      />

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition ${
                tab === t.id ? "bg-primary text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "territory" && (
        <Panel title="Nouveau territoire (ville / wilaya)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom *"><input className={inputCls} value={terr.name} onChange={(e) => setTerr({ ...terr, name: e.target.value })} placeholder="Ex : Annaba" /></Field>
            <Field label="Code wilaya"><input className={inputCls} value={terr.wilaya_code} onChange={(e) => setTerr({ ...terr, wilaya_code: e.target.value })} placeholder="23" /></Field>
            <Field label="Population"><input type="number" className={inputCls} value={terr.population} onChange={(e) => setTerr({ ...terr, population: e.target.value })} /></Field>
            <Field label="Superficie (km²)"><input type="number" className={inputCls} value={terr.area_km2} onChange={(e) => setTerr({ ...terr, area_km2: e.target.value })} /></Field>
            <Field label="Longitude (centre carte)"><input type="number" className={inputCls} value={terr.center_lon} onChange={(e) => setTerr({ ...terr, center_lon: e.target.value })} placeholder="7.7667" /></Field>
            <Field label="Latitude (centre carte)"><input type="number" className={inputCls} value={terr.center_lat} onChange={(e) => setTerr({ ...terr, center_lat: e.target.value })} placeholder="36.90" /></Field>
          </div>
          <button onClick={() => terrMut.mutate()} disabled={!terr.name || terrMut.isPending}
            className="mt-5 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80 disabled:opacity-50">
            {terrMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />} Ajouter le territoire
          </button>
          <Success show={terrMut.isSuccess} text="Territoire ajouté ! Visible dans le sélecteur en haut." />
          {terrMut.isError && <p className="mt-3 text-sm text-rose-400">Erreur : backend lancé (port 8000) ?</p>}
        </Panel>
      )}

      {tab === "zone" && (
        <Panel title="Nouvelle zone + bâtiments (apparaît sur la carte)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Territoire">
              <select className={inputCls} value={zone.territory_id} onChange={(e) => setZone({ ...zone, territory_id: Number(e.target.value) })}>
                {territories?.map((t) => <option key={t.id} value={t.id} className="bg-navy">{t.name}</option>)}
              </select>
            </Field>
            <Field label="Nom de la zone *"><input className={inputCls} value={zone.name} onChange={(e) => setZone({ ...zone, name: e.target.value })} placeholder="Ex : Quartier Est" /></Field>
            <Field label="Usage du sol">
              <select className={inputCls} value={zone.land_use} onChange={(e) => setZone({ ...zone, land_use: e.target.value })}>
                {["residentiel", "tertiaire", "industrie", "mixte"].map((u) => <option key={u} value={u} className="bg-navy">{u}</option>)}
              </select>
            </Field>
            <Field label="Nombre de bâtiments"><input type="number" min={0} max={50} className={inputCls} value={zone.buildings_count} onChange={(e) => setZone({ ...zone, buildings_count: Number(e.target.value) })} /></Field>
          </div>
          <button onClick={() => zoneMut.mutate()} disabled={!zone.name || zoneMut.isPending}
            className="mt-5 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80 disabled:opacity-50">
            {zoneMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />} Ajouter la zone
          </button>
          <Success show={zoneMut.isSuccess} text="Zone et bâtiments ajoutés ! Visibles sur la carte (Analyse territoriale)." />
          {zoneMut.isError && <p className="mt-3 text-sm text-rose-400">Erreur : backend lancé ?</p>}
        </Panel>
      )}

      {tab === "balance" && (
        <Panel title="Importer un bilan énergétique (indicateurs)">
          <Field label="Territoire">
            <select className={`${inputCls} mb-4`} value={bal.territory_id} onChange={(e) => setBal({ ...bal, territory_id: Number(e.target.value) })}>
              {territories?.map((t) => <option key={t.id} value={t.id} className="bg-navy">{t.name}</option>)}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Performance énergétique (%)"><input type="number" className={inputCls} value={bal.energy_performance} onChange={(e) => setBal({ ...bal, energy_performance: e.target.value })} /></Field>
            <Field label="Résilience (%)"><input type="number" className={inputCls} value={bal.resilience} onChange={(e) => setBal({ ...bal, resilience: e.target.value })} /></Field>
            <Field label="Qualité de l'air (/100)"><input type="number" className={inputCls} value={bal.air_quality} onChange={(e) => setBal({ ...bal, air_quality: e.target.value })} /></Field>
            <Field label="CO₂ évité (t)"><input type="number" className={inputCls} value={bal.co2_avoided} onChange={(e) => setBal({ ...bal, co2_avoided: e.target.value })} /></Field>
            <Field label="Part renouvelable (%)"><input type="number" className={inputCls} value={bal.renewable_share} onChange={(e) => setBal({ ...bal, renewable_share: e.target.value })} /></Field>
          </div>
          <button onClick={() => balMut.mutate()} disabled={balMut.isPending}
            className="mt-5 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80 disabled:opacity-50">
            {balMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />} Importer le bilan
          </button>
          <Success show={balMut.isSuccess} text="Bilan importé ! KPIs mis à jour sur le Dashboard et l'Analyse." />
          {balMut.isError && <p className="mt-3 text-sm text-rose-400">Erreur : backend lancé ?</p>}
        </Panel>
      )}
    </div>
  );
}

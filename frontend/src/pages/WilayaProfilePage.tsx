import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import {
  Zap, ShieldAlert, Users, ArrowLeft, Droplets, Flame, Activity, Brain,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { fetchProfile } from "@/api/profile";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell,
} from "recharts";

const BAR_COLORS = ["#22c55e", "#dc2626", "#3b82f6"];

export default function WilayaProfilePage() {
  const { id } = useParams();
  const territoryId = Number(id);

  const { data: p, isLoading } = useQuery({
    queryKey: ["profile", territoryId],
    queryFn: () => fetchProfile(territoryId),
  });

  if (isLoading || !p) {
    return <div className="p-6 text-slate-400">Chargement du profil…</div>;
  }

  const radarData = [
    { axis: "Performance", value: p.energy_performance },
    { axis: "Inondation", value: p.risk.flood },
    { axis: "Chaleur", value: p.risk.heat },
    { axis: "Sismique", value: p.risk.seismic },
    { axis: "Densité", value: p.chart[2].value },
  ];

  return (
    <div>
      <Link to="/analyse-territoriale" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-primary">
        <ArrowLeft size={14} /> Retour à la carte
      </Link>
      <PageHeader title={`Profil — ${p.territory.name}`}
        subtitle={`Wilaya ${p.territory.wilaya_code} · Synthèse énergie / risques / population`} />

      {/* 3 KPIs principaux */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Panel>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/15 p-3"><Zap className="text-emerald-400" /></div>
            <div>
              <p className="text-2xl font-bold">{p.energy_performance}%</p>
              <p className="text-xs text-slate-400">Performance énergétique</p>
            </div>
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-500/15 p-3"><ShieldAlert className="text-rose-400" /></div>
            <div>
              <p className="text-2xl font-bold">{p.risk.global}/100</p>
              <p className="text-xs text-slate-400">Indice de risque naturel</p>
            </div>
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/15 p-3"><Users className="text-blue-400" /></div>
            <div>
              <p className="text-2xl font-bold">{p.population.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Population{p.density ? ` · ${p.density} hab/km²` : ""}</p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Graphe en barres des 3 dimensions */}
        <Panel title="Comparaison des 3 dimensions">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={p.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="dimension" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ background: "#101d36", border: "none", borderRadius: 8 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {p.chart.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Radar du profil détaillé */}
        <Panel title="Profil radar (risques détaillés)">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#ffffff20" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} />
              <Radar dataKey="value" stroke="#2da3e0" fill="#2da3e0" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Détail des risques */}
      <Panel title="Détail des risques naturels" className="mt-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-4">
            <Droplets className="text-blue-400" />
            <div><p className="text-xl font-bold">{p.risk.flood}/100</p><p className="text-xs text-slate-400">Inondation</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-4">
            <Flame className="text-orange-400" />
            <div><p className="text-xl font-bold">{p.risk.heat}/100</p><p className="text-xs text-slate-400">Îlot de chaleur</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-4">
            <Activity className="text-amber-400" />
            <div><p className="text-xl font-bold">{p.risk.seismic}/100</p><p className="text-xs text-slate-400">Sismique</p></div>
          </div>
        </div>
      </Panel>

      {/* Analyse combinée */}
      <Panel className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Brain className="text-accent-2" size={18} />
          <h2 className="font-semibold">Analyse combinée (énergie × risques × population)</h2>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">{p.analysis}</p>
      </Panel>
    </div>
  );
}

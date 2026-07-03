import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Zap, Shield, Cloud, Wind, Users, Ruler, Building2, CalendarClock,
  ChevronRight, ChevronDown, TrendingUp, TrendingDown, MapPin,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell,
} from "recharts";
import { fetchDashboard } from "@/api/profile";
import { fetchTerritories } from "@/api/territories";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";

const SECTOR_COLORS = ["#22c55e", "#a855f7", "#eab308", "#3b82f6"];

// Petite unité data en monospace pour l'identité "salle de contrôle"
function Metric({ icon: Icon, value, unit, label, tone = "text-sky-300" }: any) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-5 transition hover:border-amber-400/30">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
        <Icon size={17} className={tone} />
      </div>
      <div className="font-mono text-3xl font-semibold tracking-tight text-white">
        {value}<span className="ml-0.5 text-base font-normal text-slate-500">{unit}</span>
      </div>
      <div className="mt-1 text-[13px] text-slate-400">{label}</div>
      <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-amber-400/0 blur-2xl transition group-hover:bg-amber-400/10" />
    </div>
  );
}

export default function DashboardPage() {
  const territoryId = useAppStore((s) => s.activeTerritoryId);
  const user = useAuthStore((s) => s.user);
  const { data: territories } = useQuery({ queryKey: ["territories"], queryFn: fetchTerritories });
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", territoryId],
    queryFn: () => fetchDashboard(territoryId),
  });
  const [showDairas, setShowDairas] = useState(false);
  const [chartDaira, setChartDaira] = useState<string | null>(null);

  const name = territories?.find((t: any) => t.id === territoryId)?.name ?? "";
  const fmtK = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : `${n}`;

  if (isLoading || !data) return <p className="text-slate-400">Chargement du tableau de bord…</p>;
  const k = data.kpis;

  return (
    <div className="space-y-6">
      {/* MASTHEAD — signature : bandeau institutionnel avec filet ambre */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c1526] p-6">
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
        <div className="flex flex-wrap items-end justify-between gap-4 pl-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400/80">Intelligence territoriale</p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Bonjour, {user?.full_name ?? "Administrateur"}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
              <MapPin size={13} className="text-amber-400" />
              Wilaya analysée : <span className="font-medium text-slate-200">{name}</span>
              <span className="ml-2 font-mono text-xs text-slate-600">code {data.wilaya_code}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-4xl font-bold tracking-tight text-white">{k.energy_performance}<span className="text-lg text-slate-500">%</span></p>
            <p className="text-xs text-slate-400">Performance énergétique globale</p>
          </div>
        </div>
      </div>

      {/* KPIs — données réelles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={Zap} value={k.energy_performance} unit="%" label="Performance énergétique" tone="text-amber-300" />
        <Metric icon={Shield} value={k.resilience} unit="%" label="Résilience territoriale" tone="text-emerald-300" />
        <Metric icon={Cloud} value={fmtK(k.co2_avoided)} unit=" t" label="CO₂ évité / an" tone="text-sky-300" />
        <Metric icon={Wind} value={k.air_quality} unit="/100" label="Qualité de l'air" tone="text-violet-300" />
        <Metric icon={Users} value={fmtK(k.population)} unit="" label="Population" tone="text-sky-300" />
        <Metric icon={Ruler} value={fmtK(k.density)} unit="" label="Densité (hab/km²)" tone="text-amber-300" />
        <Metric icon={Building2} value={fmtK(k.buildings)} unit="" label="Bâtiments estimés" tone="text-emerald-300" />
        <Metric icon={CalendarClock} value={k.avg_building_age} unit=" ans" label="Âge moyen du bâti" tone="text-violet-300" />
      </div>

      {/* Graphes */}
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Évolution */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c1526] p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-white">
              Évolution — {chartDaira ? `Daïra ${chartDaira}` : `Wilaya de ${name}`}
            </h3>
            <div className="flex items-center gap-2">
              <select value={chartDaira ?? ""} onChange={(e) => setChartDaira(e.target.value || null)}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-slate-300 outline-none">
                <option value="" className="bg-navy">Wilaya (global)</option>
                {data.dairas.map((d) => <option key={d.name} value={d.name} className="bg-navy">{d.name}</option>)}
              </select>
              <span className="font-mono text-xs text-slate-500">12 mois</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartDaira ? (data.dairas.find((d) => d.name === chartDaira)?.evolution ?? data.evolution) : data.evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#0c1526", border: "1px solid #ffffff15", borderRadius: 10 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="performance" name="Performance" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="resilience" name="Résilience" stroke="#38bdf8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="air" name="Qualité air" stroke="#a855f7" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="mobility" name="Mobilité" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Secteurs */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c1526] p-5">
          <h3 className="mb-4 font-semibold text-white">Répartition par secteur</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={data.sectors} dataKey="value" nameKey="name" cx="50%" cy="50%"
                innerRadius={55} outerRadius={90} paddingAngle={3}>
                {data.sectors.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % 4]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0c1526", border: "1px solid #ffffff15", borderRadius: 10 }}
                formatter={(v: any) => [`${v}%`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {data.sectors.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SECTOR_COLORS[i % 4] }} />
                <span className="text-slate-400">{s.name}</span>
                <span className="ml-auto font-mono text-slate-300">{s.value}%</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-600">Source : Bilan Énergétique National algérien</p>
        </div>
      </div>

      {/* DÉTAIL PAR DAÏRA — nouveau */}
      {data.has_detail && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0c1526] p-5">
          <button onClick={() => setShowDairas((v) => !v)}
            className="flex w-full items-center justify-between">
            <h3 className="font-semibold text-white">
              Détail par daïra <span className="ml-1 font-mono text-xs text-slate-500">({data.dairas.length})</span>
            </h3>
            {showDairas ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
          </button>
          {showDairas && (
            <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.06]">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                <span>Daïra</span><span className="text-right">Communes</span>
                <span className="text-right">Performance</span><span className="text-right">Risque</span>
              </div>
              {data.dairas.map((d, i) => (
                <div key={d.name}
                  className={`grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2.5 text-sm ${i % 2 ? "bg-white/[0.015]" : ""}`}>
                  <span className="flex items-center gap-2 text-slate-200">
                    <span className="font-mono text-xs text-slate-600">{String(i + 1).padStart(2, "0")}</span>
                    {d.name}
                  </span>
                  <span className="text-right font-mono text-slate-400">{d.communes}</span>
                  <span className="flex items-center justify-end gap-1 font-mono">
                    {d.performance >= 65 ? <TrendingUp size={12} className="text-emerald-400" /> : <TrendingDown size={12} className="text-amber-400" />}
                    <span className={d.performance >= 65 ? "text-emerald-400" : "text-amber-400"}>{d.performance}%</span>
                  </span>
                  <span className={`text-right font-mono ${d.risk >= 65 ? "text-rose-400" : d.risk >= 45 ? "text-amber-400" : "text-emerald-400"}`}>{d.risk}/100</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

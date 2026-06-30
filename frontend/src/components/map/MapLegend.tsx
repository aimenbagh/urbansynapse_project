const ENERGY = [
  { c: "#16a34a", l: "A" }, { c: "#65a30d", l: "B" }, { c: "#ca8a04", l: "C" },
  { c: "#d97706", l: "D" }, { c: "#ea580c", l: "E" }, { c: "#dc2626", l: "F" },
  { c: "#991b1b", l: "G" },
];

export default function MapLegend() {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs lg:grid-cols-4">
      <div>
        <p className="mb-1.5 font-medium text-slate-300">Zones</p>
        <div className="flex items-center gap-2">
          <span className="h-3 w-5 rounded-sm border border-primary bg-primary/20" />
          <span className="text-slate-400">Périmètre</span>
        </div>
      </div>
      <div className="lg:col-span-2">
        <p className="mb-1.5 font-medium text-slate-300">Bâtiments — classe énergétique</p>
        <div className="flex flex-wrap gap-1.5">
          {ENERGY.map((e) => (
            <span key={e.l} className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm" style={{ background: e.c }} />
              <span className="text-slate-400">{e.l}</span>
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 font-medium text-slate-300">Couches thématiques</p>
        <div className="space-y-1">
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-rose-600/50 border border-rose-500" /><span className="text-slate-400">Risques</span></span>
          <span className="flex items-center gap-2"><span className="h-1 w-4 rounded bg-cyan-400" /><span className="text-slate-400">Mobilité</span></span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-purple-500/50 border border-purple-400" /><span className="text-slate-400">Densité socio-éco</span></span>
        </div>
      </div>
    </div>
  );
}

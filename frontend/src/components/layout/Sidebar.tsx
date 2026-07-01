import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Map, Activity, Scale, TrendingUp, Navigation, Shield,
  Zap, CloudRain, FileText, Settings, PlusCircle, Files, Users, GitCompare, Info,
} from "lucide-react";
import { useT } from "@/i18n/translations";
import { useAuthStore } from "@/store/useAuthStore";

const SECTIONS = [
  { titleKey: "nav.overview", items: [
    { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
    { to: "/a-propos", key: "nav.about", icon: Info },
    { to: "/analyse-territoriale", key: "nav.territorial", icon: Map },
  ]},
  { titleKey: "nav.analysis", items: [
    { to: "/simulation", key: "nav.simulation", icon: Activity },
    { to: "/multicritere", key: "nav.multicriteria", icon: Scale },
    { to: "/prospective", key: "nav.foresight", icon: TrendingUp },
    { to: "/comparer", key: "nav.compare", icon: GitCompare },
  ]},
  { titleKey: "nav.themes", items: [
    { to: "/energie", key: "nav.energy", icon: Zap },
    { to: "/mobilite", key: "nav.mobility", icon: Navigation },
    { to: "/resilience", key: "nav.resilience", icon: Shield },
    { to: "/risques", key: "nav.risks", icon: CloudRain },
  ]},
  { titleKey: "nav.data", items: [
    { to: "/documents", key: "nav.documents", icon: Files },
    { to: "/ajouter", key: "nav.add", icon: PlusCircle, adminOnly: true },
    { to: "/rapports", key: "nav.reports", icon: FileText },
    { to: "/utilisateurs", key: "nav.users", icon: Users, adminOnly: true },
    { to: "/parametres", key: "nav.settings", icon: Settings },
  ]},
];

export default function Sidebar() {
  const t = useT();
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  return (
    <aside className="w-64 shrink-0 overflow-y-auto bg-navy-light/60 border-r border-white/5 p-4">
      <div className="mb-6 flex flex-col items-center gap-1">
        <img src="/logo.png" alt="UrbanSynapse AI" className="h-20 w-20 object-contain" />
        <p className="text-xs text-slate-400">Intelligence Territoriale</p>
      </div>

      <nav className="space-y-5">
        {SECTIONS.map((section) => (
          <div key={section.titleKey}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {t(section.titleKey)}
            </p>
            <div className="space-y-1">
              {section.items.filter((it: any) => !it.adminOnly || isAdmin).map(({ to, key, icon: Icon }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      isActive ? "bg-primary/15 text-primary" : "text-slate-300 hover:bg-white/5"}`}>
                  <Icon size={18} /> {t(key)}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

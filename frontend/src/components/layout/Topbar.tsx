import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useT } from "@/i18n/translations";
import { Search, Bell, Plus, User, Settings, LogOut, AlertTriangle, Activity, Lightbulb } from "lucide-react";
import TerritorySelect from "./TerritorySelect";

const NOTIFICATIONS = [
  { icon: AlertTriangle, color: "text-rose-400", title: "Risque d'inondation élevé", zone: "Secteur Nord-Est", time: "Il y a 25 min" },
  { icon: Activity, color: "text-amber-400", title: "Consommation énergétique anormale", zone: "Zone industrielle", time: "Il y a 1 h" },
  { icon: Lightbulb, color: "text-emerald-400", title: "Opportunité d'optimisation", zone: "Transport public", time: "Il y a 2 h" },
];

function useOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return ref;
}

export default function Topbar() {
  const navigate = useNavigate();
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [openNotif, setOpenNotif] = useState(false);
  const [openUser, setOpenUser] = useState(false);

  const notifRef = useOutside(() => setOpenNotif(false));
  const userRef = useOutside(() => setOpenUser(false));

  return (
    <header className="flex items-center gap-4 border-b border-white/5 bg-navy-light/40 px-6 py-3">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
        <input placeholder={t("top.search")}
          className="w-full rounded-lg bg-white/5 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-500 focus:ring-1 focus:ring-primary" />
      </div>

      {/* Bouton Ajouter des données (ADMIN uniquement) */}
      {user?.role === "admin" && (
        <button onClick={() => navigate("/ajouter")}
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/80">
          <Plus size={16} /> {t("top.add")}
        </button>
      )}

      <TerritorySelect />

      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-400">
        ● {t("top.ai_active")}
      </span>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button onClick={() => { setOpenNotif((v) => !v); setOpenUser(false); }}
          className="relative rounded-lg p-2 text-slate-400 hover:bg-white/5">
          <Bell size={18} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
        </button>
        {openNotif && (
          <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-white/10 bg-navy-light p-2 shadow-xl">
            <div className="flex items-center justify-between px-2 py-2">
              <p className="text-sm font-semibold">{t("top.notifications")}</p>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">{NOTIFICATIONS.length}</span>
            </div>
            <div className="space-y-1">
              {NOTIFICATIONS.map((n) => {
                const Icon = n.icon;
                return (
                  <div key={n.title} className="flex items-start gap-3 rounded-lg p-2 hover:bg-white/5">
                    <Icon size={16} className={`mt-0.5 ${n.color}`} />
                    <div className="flex-1">
                      <p className="text-sm">{n.title}</p>
                      <p className="text-xs text-slate-400">{n.zone} · {n.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Menu Administrateur */}
      <div className="relative" ref={userRef}>
        <button onClick={() => { setOpenUser((v) => !v); setOpenNotif(false); }}
          className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-white/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/30">
            <User size={16} className="text-primary" />
          </div>
          {user?.full_name ?? "Utilisateur"}
        </button>
        {openUser && (
          <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-white/10 bg-navy-light p-2 shadow-xl">
            <div className="border-b border-white/5 px-3 py-2">
              <p className="text-sm font-medium">{user?.full_name ?? "Utilisateur"}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
              <span className="mt-1 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">{user?.role}</span>
            </div>
            <button onClick={() => { navigate("/parametres"); setOpenUser(false); }}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5">
              <User size={16} /> {t("top.profile")}
            </button>
            <button onClick={() => { navigate("/parametres"); setOpenUser(false); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5">
              <Settings size={16} /> {t("nav.settings")}
            </button>
            <button onClick={() => { logout(); navigate("/login"); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-400 hover:bg-white/5">
              <LogOut size={16} /> {t("top.logout")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { useNotificationsStore, selectUnreadCount, type NotifKind } from "@/store/useNotificationsStore";
import { useFireAlerts } from "@/hooks/useFireAlerts";
import { timeAgo } from "@/utils/time";
import { useT } from "@/i18n/translations";
import { Search, Bell, Plus, User, Settings, LogOut, AlertTriangle, Activity, Lightbulb, Flame, CheckCheck, BellOff } from "lucide-react";
import TerritorySelect from "./TerritorySelect";

const NOTIF_ICON: Record<NotifKind, { icon: typeof AlertTriangle; color: string }> = {
  flood: { icon: AlertTriangle, color: "text-rose-400" },
  energy: { icon: Activity, color: "text-amber-400" },
  opportunity: { icon: Lightbulb, color: "text-emerald-400" },
  fire: { icon: Flame, color: "text-orange-400" },
};

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
  const territoryId = useAppStore((s) => s.activeTerritoryId);
  const [openNotif, setOpenNotif] = useState(false);
  const [openUser, setOpenUser] = useState(false);

  const notifRef = useOutside(() => setOpenNotif(false));
  const userRef = useOutside(() => setOpenUser(false));

  // Génère de vraies alertes incendie (NASA FIRMS) pour le territoire actif.
  useFireAlerts(territoryId);

  const enabled = useNotificationsStore((s) => s.enabled);
  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = useNotificationsStore(selectUnreadCount);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  const openNotification = (id: string, link?: string) => {
    markRead(id);
    setOpenNotif(false);
    if (link) navigate(link);
  };

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
          {enabled && unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
          )}
        </button>
        {openNotif && (
          <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-white/10 bg-navy-light p-2 shadow-xl">
            <div className="flex items-center justify-between px-2 py-2">
              <p className="text-sm font-semibold">{t("top.notifications")}</p>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">{unreadCount}</span>
                )}
                {notifications.length > 0 && (
                  <button onClick={markAllRead} title="Tout marquer comme lu"
                    className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200">
                    <CheckCheck size={14} />
                  </button>
                )}
              </div>
            </div>

            {!enabled ? (
              <div className="flex flex-col items-center gap-2 px-2 py-6 text-center text-xs text-slate-500">
                <BellOff size={20} />
                Notifications désactivées.
                <button onClick={() => { navigate("/parametres"); setOpenNotif(false); }}
                  className="text-primary hover:underline">Réactiver dans les paramètres</button>
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-slate-500">Aucune notification.</p>
            ) : (
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {notifications.map((n) => {
                  const { icon: Icon, color } = NOTIF_ICON[n.kind];
                  return (
                    <button key={n.id} onClick={() => openNotification(n.id, n.link)}
                      className={`flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-white/5 ${n.read ? "opacity-60" : ""}`}>
                      <Icon size={16} className={`mt-0.5 shrink-0 ${color}`} />
                      <div className="flex-1">
                        <p className="text-sm">{n.title}</p>
                        <p className="text-xs text-slate-400">{n.zone} · {timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
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

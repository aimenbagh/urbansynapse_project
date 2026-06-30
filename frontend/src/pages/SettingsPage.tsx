import { User, Globe, Bell, Sun, Moon, Palette } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { useAuthStore } from "@/store/useAuthStore";
import { usePrefsStore, type Lang } from "@/store/usePrefsStore";
import { useT } from "@/i18n/translations";
import { useState } from "react";

const LANGS: { id: Lang; label: string }[] = [
  { id: "fr", label: "Français" },
  { id: "ar", label: "العربية" },
  { id: "en", label: "English" },
];

export default function SettingsPage() {
  const t = useT();
  const authUser = useAuthStore((s) => s.user);
  const { theme, lang, setTheme, setLang } = usePrefsStore();
  const [notif, setNotif] = useState(true);

  return (
    <div>
      <PageHeader title={t("set.title")} subtitle={t("set.prefs")} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={t("set.account")}>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
              <User className="text-primary" size={24} />
            </div>
            <div>
              <p className="font-medium">{authUser?.full_name ?? "Utilisateur"}</p>
              <p className="text-sm text-slate-400">{authUser?.email} · {authUser?.role}</p>
            </div>
          </div>
        </Panel>

        <Panel title={t("set.prefs")}>
          <div className="space-y-5">
            {/* Apparence (thème) */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Palette size={16} className="text-primary" /> {t("set.theme")}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setTheme("dark")}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm ${theme === "dark" ? "bg-primary text-white" : "bg-white/5 text-slate-400"}`}>
                  <Moon size={14} /> {t("set.theme_dark")}
                </button>
                <button onClick={() => setTheme("light")}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm ${theme === "light" ? "bg-primary text-white" : "bg-white/5 text-slate-400"}`}>
                  <Sun size={14} /> {t("set.theme_light")}
                </button>
              </div>
            </div>

            {/* Langue */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Globe size={16} className="text-primary" /> {t("set.language")}
              </span>
              <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}
                className="rounded-lg bg-white/5 px-3 py-1.5 text-sm outline-none">
                {LANGS.map((l) => <option key={l.id} value={l.id} className="bg-navy">{l.label}</option>)}
              </select>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Bell size={16} className="text-primary" /> {t("set.notifications")}
              </span>
              <button onClick={() => setNotif((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition ${notif ? "bg-primary" : "bg-white/10"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${notif ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

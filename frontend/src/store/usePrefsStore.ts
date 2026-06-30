import { create } from "zustand";

export type Theme = "dark" | "light";
export type Lang = "fr" | "ar" | "en";

interface PrefsState {
  theme: Theme;
  lang: Lang;
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
  toggleTheme: () => void;
}

const savedTheme = (localStorage.getItem("theme") as Theme) || "dark";
const savedLang = (localStorage.getItem("lang") as Lang) || "fr";

// Applique le thème et la direction au <html>
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.setAttribute("data-theme", theme);
}
function applyLang(lang: Lang) {
  const root = document.documentElement;
  root.setAttribute("lang", lang);
  root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
}
applyTheme(savedTheme);
applyLang(savedLang);

export const usePrefsStore = create<PrefsState>((set, get) => ({
  theme: savedTheme,
  lang: savedLang,
  setTheme: (theme) => { localStorage.setItem("theme", theme); applyTheme(theme); set({ theme }); },
  setLang: (lang) => { localStorage.setItem("lang", lang); applyLang(lang); set({ lang }); },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next); applyTheme(next); set({ theme: next });
  },
}));

import { usePrefsStore } from "@/store/usePrefsStore";

type Dict = Record<string, { fr: string; ar: string; en: string }>;

export const T: Dict = {
  // Navigation - sections
  "nav.overview": { fr: "Vue d'ensemble", ar: "نظرة عامة", en: "Overview" },
  "nav.analysis": { fr: "Analyse & Simulation", ar: "التحليل والمحاكاة", en: "Analysis & Simulation" },
  "nav.themes": { fr: "Thématiques", ar: "المواضيع", en: "Themes" },
  "nav.data": { fr: "Données & Rapports", ar: "البيانات والتقارير", en: "Data & Reports" },
  // Navigation - items
  "nav.dashboard": { fr: "Tableau de bord", ar: "لوحة القيادة", en: "Dashboard" },
  "nav.territorial": { fr: "Analyse territoriale", ar: "التحليل الإقليمي", en: "Territorial Analysis" },
  "nav.simulation": { fr: "Simulation urbaine", ar: "المحاكاة الحضرية", en: "Urban Simulation" },
  "nav.multicriteria": { fr: "Analyse multicritère", ar: "تحليل متعدد المعايير", en: "Multicriteria Analysis" },
  "nav.foresight": { fr: "Planification prospective", ar: "التخطيط الاستشرافي", en: "Foresight Planning" },
  "nav.energy": { fr: "Performance énergétique", ar: "الأداء الطاقوي", en: "Energy Performance" },
  "nav.mobility": { fr: "Mobilité & Accessibilité", ar: "التنقل وإمكانية الوصول", en: "Mobility & Access" },
  "nav.resilience": { fr: "Résilience urbaine", ar: "المرونة الحضرية", en: "Urban Resilience" },
  "nav.risks": { fr: "Risques naturels", ar: "المخاطر الطبيعية", en: "Natural Risks" },
  "nav.add": { fr: "Ajouter des données", ar: "إضافة بيانات", en: "Add Data" },
  "nav.reports": { fr: "Rapports", ar: "التقارير", en: "Reports" },
  "nav.settings": { fr: "Paramètres", ar: "الإعدادات", en: "Settings" },
  // Topbar
  "top.search": { fr: "Rechercher une analyse, un scénario…", ar: "ابحث عن تحليل أو سيناريو…", en: "Search an analysis, a scenario…" },
  "top.add": { fr: "Ajouter", ar: "إضافة", en: "Add" },
  "top.ai_active": { fr: "IA Active", ar: "ذكاء اصطناعي نشط", en: "AI Active" },
  "top.profile": { fr: "Mon profil", ar: "ملفي الشخصي", en: "My Profile" },
  "top.logout": { fr: "Déconnexion", ar: "تسجيل الخروج", en: "Logout" },
  "top.notifications": { fr: "Notifications", ar: "الإشعارات", en: "Notifications" },
  // Settings
  "set.title": { fr: "Paramètres", ar: "الإعدادات", en: "Settings" },
  "set.prefs": { fr: "Préférences", ar: "التفضيلات", en: "Preferences" },
  "set.language": { fr: "Langue", ar: "اللغة", en: "Language" },
  "set.theme": { fr: "Apparence", ar: "المظهر", en: "Appearance" },
  "set.theme_dark": { fr: "Sombre", ar: "داكن", en: "Dark" },
  "set.theme_light": { fr: "Clair", ar: "فاتح", en: "Light" },
  "set.notifications": { fr: "Notifications", ar: "الإشعارات", en: "Notifications" },
  "set.account": { fr: "Compte", ar: "الحساب", en: "Account" },
};

export function useT() {
  const lang = usePrefsStore((s) => s.lang);
  return (key: string) => T[key]?.[lang] ?? key;
}

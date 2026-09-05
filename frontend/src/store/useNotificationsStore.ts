import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotifKind = "flood" | "energy" | "opportunity" | "fire";

export interface AppNotification {
  id: string;            // identifiant stable -> permet le dédoublonnage
  kind: NotifKind;
  title: string;
  zone: string;
  createdAt: string;      // ISO 8601 — l'affichage "il y a Xmin" est recalculé, pas figé
  read: boolean;
  territoryId?: number;
  link?: string;          // route interne à ouvrir au clic (ex: /analyse-territoriale)
}

interface NotificationsState {
  enabled: boolean;
  notifications: AppNotification[];
  setEnabled: (v: boolean) => void;
  addNotification: (n: Omit<AppNotification, "read"> & { read?: boolean }) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

// Quelques notifications de démonstration à la première utilisation, avec de
// vraies dates ISO (donc "il y a Xmin" reste juste au lieu d'un texte figé).
const now = Date.now();
const seedNotifications: AppNotification[] = [
  {
    id: "seed-flood-1", kind: "flood",
    title: "Risque d'inondation élevé", zone: "Secteur Nord-Est",
    createdAt: new Date(now - 25 * 60 * 1000).toISOString(), read: false,
  },
  {
    id: "seed-energy-1", kind: "energy",
    title: "Consommation énergétique anormale", zone: "Zone industrielle",
    createdAt: new Date(now - 60 * 60 * 1000).toISOString(), read: false,
  },
  {
    id: "seed-opportunity-1", kind: "opportunity",
    title: "Opportunité d'optimisation", zone: "Transport public",
    createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(), read: false,
  },
];

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      enabled: true,
      notifications: seedNotifications,

      setEnabled: (enabled) => set({ enabled }),

      // Dédoublonne par id : une alerte incendie pour la même journée/territoire
      // ne sera donc ajoutée qu'une seule fois, même si le hook se redéclenche.
      addNotification: (n) =>
        set((state) => {
          if (state.notifications.some((x) => x.id === n.id)) return state;
          return { notifications: [{ ...n, read: n.read ?? false }, ...state.notifications].slice(0, 30) };
        }),

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllRead: () =>
        set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),

      clearAll: () => set({ notifications: [] }),
    }),
    { name: "urbansynapse-notifications" }
  )
);

export const selectUnreadCount = (s: NotificationsState) =>
  s.enabled ? s.notifications.filter((n) => !n.read).length : 0;

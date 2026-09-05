import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFireSummary } from "@/api/fires";
import { useNotificationsStore } from "@/store/useNotificationsStore";

const HIGH_RISK = new Set(["Élevé", "Critique"]);
const POLL_MS = 5 * 60 * 1000; // 5 min — cohérent avec le cache serveur (10 min)

/** Surveille le risque incendie temps réel (NASA FIRMS) du territoire actif
 * et ajoute une notification réelle (pas simulée) quand le risque est élevé. */
export function useFireAlerts(territoryId: number) {
  const addNotification = useNotificationsStore((s) => s.addNotification);

  const { data } = useQuery({
    queryKey: ["fire-summary", territoryId],
    queryFn: () => fetchFireSummary(territoryId),
    refetchInterval: POLL_MS,
    staleTime: POLL_MS,
  });

  useEffect(() => {
    if (!data || !data.is_live) return;
    if (!HIGH_RISK.has(data.risk_level)) return;

    const day = data.last_updated ? data.last_updated.slice(0, 10) : new Date().toISOString().slice(0, 10);
    addNotification({
      id: `fire-${territoryId}-${day}`,
      kind: "fire",
      title: `Feux actifs détectés (${data.risk_level.toLowerCase()}) — ${data.active_count} foyer(s)`,
      zone: data.territory_name,
      createdAt: data.last_updated ?? new Date().toISOString(),
      territoryId,
      link: "/analyse-territoriale",
    });
  }, [data, territoryId, addNotification]);
}

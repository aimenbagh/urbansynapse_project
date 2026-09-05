import { apiClient } from "./client";

export interface FireDetection {
  latitude: number;
  longitude: number;
  acq_date: string;
  acq_time: string;
  satellite?: string;
  instrument?: string;
  confidence?: string;
  frp?: number;
  daynight?: string;
}

export interface FireSummary {
  territory_id: number;
  territory_name: string;
  risk_level: "Faible" | "Modéré" | "Élevé" | "Critique" | "Indisponible" | string;
  active_count: number;
  max_frp?: number;
  bbox: [number, number, number, number];
  day_range: number;
  source: string;
  last_updated?: string | null;
  is_live: boolean;
  message?: string | null;
  source_url: string;
  fires: FireDetection[];
}

// Risque incendie temps réel (NASA FIRMS) pour un territoire.
export const fetchFireSummary = async (territoryId: number, refresh = false): Promise<FireSummary> => {
  const { data } = await apiClient.get<FireSummary>(`/territories/${territoryId}/fires`, {
    params: refresh ? { refresh: true } : undefined,
  });
  return data;
};

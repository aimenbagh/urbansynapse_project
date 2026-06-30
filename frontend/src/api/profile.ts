import { apiClient } from "./client";

export interface TerritoryProfile {
  territory: { id: number; name: string; wilaya_code: string };
  population: number;
  density: number | null;
  area_km2: number | null;
  energy_performance: number;
  risk: { global: number; flood: number; heat: number; seismic: number };
  analysis: string;
  chart: { dimension: string; value: number }[];
}

export const fetchProfile = async (territoryId: number): Promise<TerritoryProfile> => {
  const { data } = await apiClient.get<TerritoryProfile>(`/profile/${territoryId}`);
  return data;
};

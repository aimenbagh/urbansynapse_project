import { apiClient } from "./client";

export interface Territory {
  id: number;
  name: string;
  wilaya_code?: string;
  population?: number;
  area_km2?: number;
}

export interface TerritoryStats {
  territory_id: number;
  name: string;
  population?: number;
  area_km2?: number;
  density?: number;
  zones_count: number;
  buildings_count: number;
  avg_building_age?: number;
  avg_energy_class_score?: number;
}

export interface Building {
  id: number;
  construction_year?: number;
  floors?: number;
  surface_m2?: number;
  energy_class?: string;
  annual_kwh_m2?: number;
}

export const fetchTerritories = async (): Promise<Territory[]> => {
  const { data } = await apiClient.get<Territory[]>("/territories/");
  return data;
};

export const fetchTerritoryStats = async (id: number): Promise<TerritoryStats> => {
  const { data } = await apiClient.get<TerritoryStats>(`/territories/${id}/stats`);
  return data;
};

export const fetchBuildings = async (id: number): Promise<Building[]> => {
  const { data } = await apiClient.get<Building[]>(`/territories/${id}/buildings`);
  return data;
};

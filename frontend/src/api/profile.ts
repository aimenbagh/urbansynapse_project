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

export interface RisksDetail {
  territory_id: number;
  territory_name: string;
  wilaya_code: string;
  global: number;
  seismic_zone: string;
  hazards: { key: string; name: string; value: number; level: string; zone: string }[];
}

export const fetchRisksDetail = async (territoryId: number): Promise<RisksDetail> =>
  (await apiClient.get(`/profile/${territoryId}/risks-detail`)).data;

export interface RiskCommune { name: string; global: number; level: string; hazards: any[]; }
export interface RiskDaira { name: string; global: number; level: string; communes: RiskCommune[]; }
export interface RisksHierarchy extends RisksDetail {
  dairas: RiskDaira[];
  has_detail: boolean;
}

export const fetchRisksHierarchy = async (territoryId: number): Promise<RisksHierarchy> =>
  (await apiClient.get(`/profile/${territoryId}/risks-hierarchy`)).data;

export interface ResilienceDetail {
  territory_id: number; territory_name: string; wilaya_code: string;
  global: number; heat_zones: number; water_management: number; green_coverage: number;
  dimensions: { axis: string; score: number }[];
  dairas: {
    name: string; global: number; level: string;
    dimensions: { axis: string; score: number }[];
    communes: { name: string; global: number; level: string; dimensions: { axis: string; score: number }[] }[];
  }[];
  has_detail: boolean;
}

export const fetchResilience = async (territoryId: number): Promise<ResilienceDetail> =>
  (await apiClient.get(`/profile/${territoryId}/resilience`)).data;

export interface MobilityDetail {
  territory_id: number; territory_name: string; wilaya_code: string;
  traffic: number; transport_coverage: number; bike_km: number; pedestrian: number;
  modal_split: { mode: string; value: number }[];
  dairas: {
    name: string; score: number; level: string;
    modal_split: { mode: string; value: number }[];
    communes: { name: string; transport_coverage: number; pedestrian: number; score: number; level: string; modal_split: { mode: string; value: number }[] }[];
  }[];
  has_detail: boolean;
}

export const fetchMobilityDetail = async (territoryId: number): Promise<MobilityDetail> =>
  (await apiClient.get(`/profile/${territoryId}/mobility-detail`)).data;

export interface CompareData {
  territory_id: number; territory_name: string; wilaya_code: string;
  population: number; area_km2: number; density: number;
  energy_performance: number; risk_global: number; seismic_zone: string;
  resilience_global: number; transport_coverage: number; pedestrian: number; green_coverage: number;
  risk_hazards: any[]; resilience_dimensions: any[]; modal_split: any[];
}

export const fetchCompareData = async (territoryId: number): Promise<CompareData> =>
  (await apiClient.get(`/profile/${territoryId}/compare-data`)).data;

export interface CompareAnalysis {
  wilaya_a: string; wilaya_b: string;
  local: { source: string; summary: string; solutions: string[] };
  ai: { source: string; text: string } | null;
  ai_available: boolean;
}

export const fetchCompareAnalysis = async (idA: number, idB: number): Promise<CompareAnalysis> =>
  (await apiClient.get(`/profile/compare/${idA}/${idB}/analysis`)).data;

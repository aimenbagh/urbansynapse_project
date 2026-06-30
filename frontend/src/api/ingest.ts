import { apiClient } from "./client";

export const addTerritory = async (payload: {
  name: string; wilaya_code?: string; population?: number;
  area_km2?: number; center_lon?: number; center_lat?: number;
}) => (await apiClient.post("/ingest/territories", payload)).data;

export const addZone = async (payload: {
  territory_id: number; name: string; land_use: string; buildings_count: number;
  center_lon?: number; center_lat?: number;
}) => (await apiClient.post("/ingest/zones", payload)).data;

export const addIndicator = async (payload: {
  territory_id: number; key: string; value: number; unit?: string;
}) => (await apiClient.post("/ingest/indicators", payload)).data;

export const importEnergyBalance = async (payload: {
  territory_id: number; energy_performance?: number; resilience?: number;
  air_quality?: number; co2_avoided?: number; renewable_share?: number;
}) => (await apiClient.post("/ingest/energy-balance", payload)).data;

import { apiClient } from "./client";

export interface AlgeriaReference {
  co2_per_kwh: number;
  price_per_kwh_da: number;
  renewable_target_2030_pct: number;
  sector_consumption_pct: Record<string, number>;
  class_baseline_kwh_m2: Record<string, number>;
  electricity_production: Record<string, number>;
}

export const fetchAlgeriaReference = async (): Promise<AlgeriaReference> => {
  const { data } = await apiClient.get<AlgeriaReference>("/reference/algeria");
  return data;
};

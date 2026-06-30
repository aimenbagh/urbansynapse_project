import { apiClient } from "./client";

export interface RetrofitRequest {
  surface_m2: number;
  energy_class: string;
  measures: string[];
}

export interface RetrofitResult {
  before_kwh: number;
  after_kwh: number;
  saved_kwh: number;
  reduction_pct: number;
}

export const simulateRetrofit = async (
  payload: RetrofitRequest
): Promise<RetrofitResult> => {
  const { data } = await apiClient.post<RetrofitResult>("/energy/retrofit", payload);
  return data;
};

export interface TerritoryRetrofitResult {
  buildings_count: number;
  total_before_kwh: number;
  total_after_kwh: number;
  total_saved_kwh: number;
  reduction_pct: number;
  total_co2_avoided_t: number;
  total_investment_da: number;
  total_annual_savings_da: number;
  roi_years: number | null;
}

export const simulateTerritoryRetrofit = async (
  territory_id: number,
  measures: string[]
): Promise<TerritoryRetrofitResult> => {
  const { data } = await apiClient.post<TerritoryRetrofitResult>(
    "/energy/territory-retrofit",
    { territory_id, measures }
  );
  return data;
};

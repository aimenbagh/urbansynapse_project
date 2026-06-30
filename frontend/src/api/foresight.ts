import { apiClient } from "./client";

export interface ForecastPoint { year: number; value: number; }
export interface Forecast {
  metric: string;
  history: ForecastPoint[];
  forecast: ForecastPoint[];
  r2: number;
  historical_cagr_pct: number;
  model: string;
}
export interface Scenarios {
  indicator: string;
  current: number;
  trajectories: Record<string, ForecastPoint[]>;
}
export interface PlanResult {
  territory: string;
  horizon: number;
  source: "mistral" | "fallback";
  forecast_summary: { from: ForecastPoint; to: ForecastPoint; cagr_pct: number; r2: number };
  plan_markdown: string;
}

export const fetchForecast = async (territoryId: number, targetYear = 2035): Promise<Forecast> => {
  const { data } = await apiClient.get<Forecast>(`/foresight/${territoryId}/forecast`, {
    params: { target_year: targetYear },
  });
  return data;
};
export const fetchScenarios = async (territoryId: number, horizon = 10): Promise<Scenarios> => {
  const { data } = await apiClient.get<Scenarios>(`/foresight/${territoryId}/scenarios`, {
    params: { horizon },
  });
  return data;
};
export const generatePlan = async (territoryId: number, horizon = 10): Promise<PlanResult> => {
  const { data } = await apiClient.post<PlanResult>(`/foresight/${territoryId}/plan`, { horizon });
  return data;
};

export interface PlanAction {
  name: string; lever: string; budget_m_da: number; deadline: string; priority: string;
}
export interface PlanPhase {
  title: string; period: string; focus: string;
  actions: PlanAction[]; total_budget_m_da: number;
  target: { indicator: string; from: number; to: number };
}
export interface StructuredPlan {
  territory: string; horizon_years: number; period: string;
  summary: {
    current_performance: number; target_performance: number;
    current_resilience: number; renewable_target: number;
    total_budget_m_da: number; energy_forecast_2035_gwh: number | null;
  };
  phases: PlanPhase[];
  key_levers: string[];
}

export const fetchStructuredPlan = async (territoryId: number, horizon = 10): Promise<StructuredPlan> => {
  const { data } = await apiClient.post<StructuredPlan>(`/foresight/${territoryId}/structured-plan`, { horizon });
  return data;
};

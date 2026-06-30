import { apiClient } from "./client";

export interface Scenario {
  id: number;
  territory_id: number;
  name: string;
  description?: string;
  parameters?: Record<string, number>;
  results?: Record<string, number>;
  performance?: number;
}

export interface ScenarioCreate {
  territory_id: number;
  name: string;
  description?: string;
  parameters: Record<string, number>;
}

export const fetchScenarios = async (territoryId?: number): Promise<Scenario[]> => {
  const { data } = await apiClient.get<Scenario[]>("/scenarios/", {
    params: territoryId ? { territory_id: territoryId } : {},
  });
  return data;
};

export const createScenario = async (payload: ScenarioCreate): Promise<Scenario> => {
  const { data } = await apiClient.post<Scenario>("/scenarios/", payload);
  return data;
};

export const deleteScenario = async (id: number): Promise<void> => {
  await apiClient.delete(`/scenarios/${id}`);
};

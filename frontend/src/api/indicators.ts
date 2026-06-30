import { apiClient } from "./client";

export interface Indicator {
  key: string;
  value: number;
  unit: string;
}

export const fetchIndicators = async (territoryId?: number): Promise<Indicator[]> => {
  const { data } = await apiClient.get<Indicator[]>("/indicators/", {
    params: territoryId ? { territory_id: territoryId } : {},
  });
  return data;
};

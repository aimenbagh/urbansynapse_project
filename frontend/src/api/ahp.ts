import { apiClient } from "./client";

export interface AHPScoreResult {
  weights: Record<string, number>;
  consistency_ratio: number;
  is_consistent: boolean;
  global_score: number;
}

export const computeAhpScore = async (
  criteria: string[],
  matrix: number[][],
  values: Record<string, number>
): Promise<AHPScoreResult> => {
  const { data } = await apiClient.post<AHPScoreResult>("/ahp/score", {
    criteria, matrix, values,
  });
  return data;
};

export interface SavedAhp {
  id: number; name: string;
  criteria: string[]; matrix: number[][];
  weights: Record<string, number>;
  consistency_ratio: number | null;
  created_at: string;
}

export const saveAhp = async (payload: {
  name: string; criteria: string[]; matrix: number[][];
  weights: Record<string, number>; consistency_ratio?: number | null;
}): Promise<SavedAhp> => (await apiClient.post("/ahp/save", payload)).data;

export const fetchSavedAhp = async (): Promise<SavedAhp[]> =>
  (await apiClient.get("/ahp/saved")).data;

export const deleteAhp = async (id: number) =>
  (await apiClient.delete(`/ahp/saved/${id}`)).data;

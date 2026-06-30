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

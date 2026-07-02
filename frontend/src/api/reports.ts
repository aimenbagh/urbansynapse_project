import { apiClient } from "./client";

export interface SavedReport {
  id: number; title: string; territory_id: number; territory_name: string;
  population: number | null; energy_performance: number | null;
  risk_global: number | null; size_bytes: number;
  generated_by: string; created_at: string;
}

export const fetchReports = async (): Promise<SavedReport[]> =>
  (await apiClient.get("/reports")).data;

export const generateReport = async (territoryId: number): Promise<SavedReport> =>
  (await apiClient.post(`/reports/${territoryId}/generate`)).data;

export const deleteReport = async (id: number) =>
  (await apiClient.delete(`/reports/saved/${id}`)).data;

// Récupère le PDF d'un rapport sauvegardé (blob, pour visionneuse/téléchargement)
export const fetchReportBlob = async (id: number): Promise<Blob> =>
  (await apiClient.get(`/reports/saved/${id}/content`, { responseType: "blob" })).data;

import { apiClient } from "./client";

export interface Recommendation {
  category: string;
  priority: "Haute" | "Moyenne" | "Basse";
  title: string;
  detail: string;
  impact: string;
}

export const fetchRecommendations = async (
  territoryId: number
): Promise<Recommendation[]> => {
  const { data } = await apiClient.get<{ recommendations: Recommendation[] }>(
    `/planning/${territoryId}/recommendations`
  );
  return data.recommendations;
};

// Récupère le rapport Markdown et déclenche le téléchargement
export const downloadReport = async (territoryId: number, territoryName: string) => {
  const res = await apiClient.get(`/reports/${territoryId}`, { responseType: "text" });
  const blob = new Blob([res.data], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport_${territoryName}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// Télécharge le rapport au format PDF
export const downloadReportPDF = async (territoryId: number, territoryName: string) => {
  const res = await apiClient.get(`/reports/${territoryId}/pdf`, { responseType: "blob" });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rapport_${territoryName}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

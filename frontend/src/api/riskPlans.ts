import { apiClient } from "./client";

export interface RiskScenario {
  aléa: string; niveau: string; valeur: number | null;
  scénario: string; prévention: string[]; réponse_crise: string[];
}
export interface SingleRiskPlan {
  territoire: string; wilaya_code: string; zone_sismique: string; risque_global: number;
  niveau_admin?: string; wilaya_parent?: string;
  scénarios: RiskScenario[]; ai_plan: string | null; ai_available: boolean;
}
export interface GlobalRiskPlan {
  périmètre: string;
  wilayas_plus_risquées: { nom: string; risque_global: number; zone_sismique: string }[];
  zones_sismiques_élevées: string[];
  zones_inondation_élevée: string[];
  zones_feu_forêt_élevé: string[];
  priorités_nationales: string[];
  ai_plan: string | null; ai_available: boolean;
}

export const fetchSinglePlan = async (id: number): Promise<SingleRiskPlan> =>
  (await apiClient.get(`/risk-plans/single/${id}`)).data;
export const fetchGlobalPlan = async (): Promise<GlobalRiskPlan> =>
  (await apiClient.get(`/risk-plans/global`)).data;

export const singlePlanPdfUrl = (id: number) => `/risk-plans/single/${id}/pdf`;
export const globalPlanPdfUrl = () => `/risk-plans/global/pdf`;

// télécharge un PDF via apiClient (avec auth) → blob
export const downloadPlanPdf = async (path: string, filename: string) => {
  const res = await apiClient.get(path, { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};
export const openPlanPdf = async (path: string): Promise<string> => {
  const res = await apiClient.get(path, { responseType: "blob" });
  return URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
};

export interface Subdivisions {
  wilaya: string; wilaya_code: string;
  dairas: { nom: string; communes: string[] }[];
}
export const fetchSubdivisions = async (id: number): Promise<Subdivisions> =>
  (await apiClient.get(`/risk-plans/subdivisions/${id}`)).data;

export const fetchDairaPlan = async (id: number, daira: string): Promise<SingleRiskPlan> =>
  (await apiClient.get(`/risk-plans/daira/${id}/${encodeURIComponent(daira)}`)).data;
export const fetchCommunePlan = async (id: number, commune: string): Promise<SingleRiskPlan> =>
  (await apiClient.get(`/risk-plans/commune/${id}/${encodeURIComponent(commune)}`)).data;

export const dairaPlanPdfUrl = (id: number, daira: string) =>
  `/risk-plans/daira/${id}/${encodeURIComponent(daira)}/pdf`;
export const communePlanPdfUrl = (id: number, commune: string) =>
  `/risk-plans/commune/${id}/${encodeURIComponent(commune)}/pdf`;

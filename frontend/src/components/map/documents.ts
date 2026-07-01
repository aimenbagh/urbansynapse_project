import { apiClient } from "./client";

export interface DocMeta {
  id: number; title: string; filename: string; file_type: string;
  content_type: string; size_bytes: number; uploaded_by: string; created_at: string;
}

export const fetchDocuments = async (): Promise<DocMeta[]> =>
  (await apiClient.get("/documents")).data;

export const uploadDocument = async (title: string, file: File): Promise<DocMeta> => {
  const form = new FormData();
  form.append("title", title);
  form.append("file", file);
  return (await apiClient.post("/documents", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })).data;
};

export const deleteDocument = async (id: number) =>
  (await apiClient.delete(`/documents/${id}`)).data;

// URL de contenu (avec le token en query pour l'iframe/viewer)
export const documentContentUrl = (id: number, download = false) => {
  const base = apiClient.defaults.baseURL ?? "/api/v1";
  return `${base}/documents/${id}/content${download ? "?download=true" : ""}`;
};

// Récupère le contenu en blob (pour la visionneuse авec auth header)
export const fetchDocumentBlob = async (id: number): Promise<Blob> =>
  (await apiClient.get(`/documents/${id}/content`, { responseType: "blob" })).data;

import { apiClient } from "./client";

export interface ManagedUser {
  id: number; email: string; full_name: string; role: string;
  is_active: boolean; suspended_until: string | null; status: string;
}

export const fetchUsers = async (): Promise<ManagedUser[]> =>
  (await apiClient.get("/users")).data;

export const createUser = async (payload: {
  email: string; full_name: string; password: string; role: string;
}): Promise<ManagedUser> => (await apiClient.post("/users", payload)).data;

export const suspendUser = async (id: number, days: number) =>
  (await apiClient.post(`/users/${id}/suspend`, { days })).data;

export const unsuspendUser = async (id: number) =>
  (await apiClient.post(`/users/${id}/unsuspend`, {})).data;

export const blockUser = async (id: number) =>
  (await apiClient.post(`/users/${id}/block`, {})).data;

export const unblockUser = async (id: number) =>
  (await apiClient.post(`/users/${id}/unblock`, {})).data;

export const deleteUser = async (id: number) =>
  (await apiClient.delete(`/users/${id}`)).data;

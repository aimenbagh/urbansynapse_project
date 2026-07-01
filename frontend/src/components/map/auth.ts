import { apiClient } from "./client";

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", { email, password });
  return data;
};

export const register = async (
  email: string, full_name: string, password: string, role = "user"
): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", {
    email, full_name, password, role,
  });
  return data;
};

export const fetchMe = async (): Promise<AuthUser> => {
  const { data } = await apiClient.get<AuthUser>("/auth/me");
  return data;
};

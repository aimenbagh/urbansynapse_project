import { apiClient } from "./client";

export const fetchRiskLayer = async (territoryId: number) =>
  (await apiClient.get(`/layers/${territoryId}/risks`)).data;

export const fetchMobilityLayer = async (territoryId: number) =>
  (await apiClient.get(`/layers/${territoryId}/mobility`)).data;

export const fetchSocioLayer = async (territoryId: number) =>
  (await apiClient.get(`/layers/${territoryId}/socio`)).data;

export const fetchClimateLayer = async (territoryId: number, variable: "temperature" | "precipitation") =>
  (await apiClient.get(`/layers/${territoryId}/climate`, { params: { variable } })).data;

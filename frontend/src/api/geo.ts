import { apiClient } from "./client";

export interface GeoFeatureCollection {
  type: "FeatureCollection";
  territory: { id: number; name: string; center?: [number, number] | null };
  features: GeoJSON.Feature[];
}

export const fetchTerritoryGeoJSON = async (
  territoryId: number
): Promise<GeoFeatureCollection> => {
  const { data } = await apiClient.get<GeoFeatureCollection>(
    `/geo/territories/${territoryId}/geojson`
  );
  return data;
};

// Export GeoJSON téléchargeable (territoire entier ou zone précise)
export const exportGeoJSON = async (territoryId: number, territoryName: string, zoneId?: number) => {
  const { data } = await apiClient.get(`/geo/territories/${territoryId}/export`, {
    params: zoneId ? { zone_id: zoneId } : {},
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/geo+json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${territoryName}${zoneId ? "_zone" + zoneId : ""}.geojson`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};

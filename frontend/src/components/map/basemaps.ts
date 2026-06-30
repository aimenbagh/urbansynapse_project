/** Styles de fond de carte (gratuits, sans clé API). */
export type BasemapId = "dark" | "satellite" | "light";

export const BASEMAPS: Record<BasemapId, { label: string; style: any }> = {
  dark: {
    label: "Plan (sombre)",
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
  light: {
    label: "Plan (clair)",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  },
  satellite: {
    label: "Satellite (Esri)",
    // Style raster minimal pointant vers les tuiles satellite d'Esri (World Imagery)
    style: {
      version: 8,
      sources: {
        "esri-satellite": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics",
        },
      },
      layers: [{ id: "esri-satellite", type: "raster", source: "esri-satellite" }],
    },
  },
};

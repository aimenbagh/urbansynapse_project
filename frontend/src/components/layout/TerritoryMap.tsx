import { useMemo, useState, useRef } from "react";
import Map, { Source, Layer, Popup, NavigationControl, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useQuery } from "@tanstack/react-query";
import { fetchTerritoryGeoJSON } from "@/api/geo";
import { fetchRiskLayer, fetchMobilityLayer, fetchSocioLayer, fetchClimateLayer } from "@/api/layers";
import { exportGeoJSON } from "@/api/geo";
import { BASEMAPS, type BasemapId } from "./basemaps";
import { Layers as LayersIcon, Download, Image as ImageIcon, Thermometer, Box, Search, Ruler, Pentagon, Trash2 } from "lucide-react";
import * as turf from "@turf/turf";
import { useAppStore } from "@/store/useAppStore";
import { improvedClass } from "@/utils/energy";

const ENERGY_COLORS: any = [
  "match", ["get", "display_class"],
  "A", "#16a34a", "B", "#65a30d", "C", "#ca8a04", "D", "#d97706",
  "E", "#ea580c", "F", "#dc2626", "G", "#991b1b", "#94a3b8",
];

// Couleur des zones par priorité d'intervention (mode plan)
const PRIORITY_FILL: any = [
  "match", ["get", "priority"],
  "Haute", "#dc2626", "Moyenne", "#eab308", "Basse", "#22c55e", "#2da3e0",
];
const PRIORITY_LINE: any = [
  "match", ["get", "priority"],
  "Haute", "#ef4444", "Moyenne", "#facc15", "Basse", "#4ade80", "#2da3e0",
];

const RISK_COLOR: any = [
  "match", ["get", "level"],
  "Élevé", "#dc2626", "Modéré", "#eab308", "Faible", "#22c55e", "#94a3b8",
];

const CLIMATE_TEMP_COLOR: any = [
  "interpolate", ["linear"], ["get", "temperature"],
  25, "#3b82f6", 30, "#facc15", 35, "#f97316", 42, "#dc2626",
];
const CLIMATE_PRECIP_COLOR: any = [
  "interpolate", ["linear"], ["get", "precipitation"],
  50, "#fde047", 300, "#4ade80", 600, "#22d3ee", 800, "#2563eb",
];

const CENTERS: Record<number, [number, number]> = {
  1: [3.0588, 36.7538], 2: [-0.6331, 35.6987], 3: [6.6147, 36.365],
};

interface PopupInfo { lng: number; lat: number; props: Record<string, any>; }

// prop optionnelle : planMode = colorer les zones par priorité
export default function TerritoryMap({ planMode = false }: { planMode?: boolean }) {
  const territoryId = useAppStore((s) => s.activeTerritoryId);
  const simulation = useAppStore((s) => s.simulation);
  const activeLayers = useAppStore((s) => s.activeLayers);
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [showAfter, setShowAfter] = useState(false);
  const [basemap, setBasemap] = useState<BasemapId>("dark");
  const [climateVar, setClimateVar] = useState<"temperature" | "precipitation" | null>(null);
  const [is3D, setIs3D] = useState(false);
  const mapRef = useRef<any>(null);
  // Outils interactifs
  const [tool, setTool] = useState<null | "measure" | "draw">(null);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [searching, setSearching] = useState(false);

  const showRisks = activeLayers.includes("risks");
  const showMobility = activeLayers.includes("mobility");
  const showSocio = activeLayers.includes("socio");

  const { data } = useQuery({ queryKey: ["geojson", territoryId], queryFn: () => fetchTerritoryGeoJSON(territoryId) });
  const { data: risks } = useQuery({ queryKey: ["risks", territoryId], queryFn: () => fetchRiskLayer(territoryId), enabled: showRisks });
  const { data: mobility } = useQuery({ queryKey: ["mobility", territoryId], queryFn: () => fetchMobilityLayer(territoryId), enabled: showMobility });
  const { data: socio } = useQuery({ queryKey: ["socio", territoryId], queryFn: () => fetchSocioLayer(territoryId), enabled: showSocio });
  const { data: climate } = useQuery({
    queryKey: ["climate", territoryId, climateVar],
    queryFn: () => fetchClimateLayer(territoryId, climateVar!),
    enabled: climateVar !== null,
  });

  const measuresCount = simulation.measures.length;
  const simActive = measuresCount > 0;
  // en mode plan, on affiche toujours zones + bâtiments
  const showZones = planMode || activeLayers.includes("land_use");
  const showBuildings = planMode || activeLayers.includes("buildings") || activeLayers.includes("energy");

  const zones = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: data?.features.filter((f) => f.properties?.kind === "zone") ?? [],
  }), [data]);

  const buildings = useMemo(() => {
    const feats = (data?.features.filter((f) => f.properties?.kind === "building") ?? [])
      .map((f) => {
        const cur = f.properties?.energy_class ?? "D";
        const display = showAfter && simActive ? improvedClass(cur, measuresCount) : cur;
        return { ...f, properties: { ...f.properties, display_class: display } };
      });
    return { type: "FeatureCollection" as const, features: feats };
  }, [data, showAfter, simActive, measuresCount]);

  const dataCenter = (data as any)?.territory?.center as [number, number] | null | undefined;
  const center = dataCenter ?? CENTERS[territoryId] ?? [3.0588, 36.7538];

  const onClick = (e: MapLayerMouseEvent) => {
    // Mode outil actif : on ajoute des points au lieu d'ouvrir un popup
    if (tool === "measure" || tool === "draw") {
      setPoints((prev) => [...prev, [e.lngLat.lng, e.lngLat.lat]]);
      return;
    }
    const f = e.features?.[0];
    setPopup(f ? { lng: e.lngLat.lng, lat: e.lngLat.lat, props: f.properties ?? {} } : null);
  };

  // Recherche d'adresse/lieu via Nominatim (OpenStreetMap, gratuit)
  const doSearch = async () => {
    if (!searchQ.trim()) return;
    setSearching(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchQ + ", Algérie")}`
      );
      const results = await r.json();
      if (results?.[0]) {
        const { lon, lat } = results[0];
        mapRef.current?.getMap?.().flyTo({ center: [parseFloat(lon), parseFloat(lat)], zoom: 14 });
      } else {
        alert("Lieu introuvable.");
      }
    } catch {
      alert("Erreur de recherche.");
    } finally {
      setSearching(false);
    }
  };

  // Calculs de mesure/dessin (turf)
  const measureLine = points.length >= 2
    ? turf.length(turf.lineString(points), { units: "kilometers" }) : 0;
  const drawArea = points.length >= 3
    ? turf.area(turf.polygon([[...points, points[0]]])) / 1_000_000 : 0; // km²

  const clearTool = () => { setPoints([]); setTool(null); };

  // GeoJSON des points/lignes/polygones en cours de dessin
  const toolGeo = {
    type: "FeatureCollection" as const,
    features: [
      ...(points.length >= 2 && tool === "measure"
        ? [{ type: "Feature" as const, geometry: { type: "LineString" as const, coordinates: points }, properties: {} }] : []),
      ...(points.length >= 3 && tool === "draw"
        ? [{ type: "Feature" as const, geometry: { type: "Polygon" as const, coordinates: [[...points, points[0]]] }, properties: {} }] : []),
      ...points.map((p) => ({ type: "Feature" as const, geometry: { type: "Point" as const, coordinates: p }, properties: {} })),
    ],
  };

  // Export PNG : capture le canvas de la carte
  const exportPNG = () => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    map.once("render", () => {
      const canvas = map.getCanvas();
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url; a.download = `carte_territoire_${territoryId}.png`;
      document.body.appendChild(a); a.click(); a.remove();
    });
    map.triggerRepaint();
  };

  const territoryName = (data as any)?.territory?.name ?? `territoire_${territoryId}`;

  const interactive: string[] = [];
  if (showBuildings) interactive.push(is3D ? "buildings-3d" : "buildings-fill");
  if (showZones) interactive.push("zones-fill");
  if (showRisks) interactive.push("risks-fill");
  if (showMobility) interactive.push("mobility-line");
  if (showSocio) interactive.push("socio-circle");
  if (climateVar) interactive.push("climate-fill");

  return (
    <div className="relative h-full">
      {/* Barre de recherche de lieu (haut centre) */}
      <div className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-navy/90 p-1 backdrop-blur">
        <Search size={14} className="ml-2 text-slate-400" />
        <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="Rechercher un lieu…"
          className="w-44 bg-transparent px-1 py-1 text-xs outline-none placeholder:text-slate-500" />
        <button onClick={doSearch} disabled={searching}
          className="rounded bg-primary px-2 py-1 text-xs text-white">{searching ? "…" : "Aller"}</button>
      </div>

      {/* Outils : mesure + dessin (haut gauche, sous les stats) */}
      <div className="absolute left-3 top-16 z-20 flex flex-col gap-1">
        <button onClick={() => { setTool(tool === "measure" ? null : "measure"); setPoints([]); }}
          title="Mesurer une distance"
          className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs backdrop-blur ${tool === "measure" ? "bg-primary text-white" : "bg-navy/90 text-slate-300 hover:bg-white/10"}`}>
          <Ruler size={13} /> Mesurer
        </button>
        <button onClick={() => { setTool(tool === "draw" ? null : "draw"); setPoints([]); }}
          title="Dessiner une zone"
          className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs backdrop-blur ${tool === "draw" ? "bg-accent-2 text-white" : "bg-navy/90 text-slate-300 hover:bg-white/10"}`}>
          <Pentagon size={13} /> Dessiner
        </button>
        {tool && (
          <button onClick={clearTool} title="Effacer"
            className="flex items-center gap-1 rounded-lg bg-rose-600/80 px-2 py-1.5 text-xs text-white hover:bg-rose-600">
            <Trash2 size={13} /> Effacer
          </button>
        )}
      </div>

      {/* Résultat de mesure / surface (bas centre) */}
      {tool && points.length > 0 && (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-navy/95 px-4 py-2 text-xs backdrop-blur">
          {tool === "measure" ? (
            <span>Distance : <b className="text-primary">{measureLine.toFixed(2)} km</b>
              {points.length < 2 && <span className="text-slate-400"> — clique un 2e point</span>}</span>
          ) : (
            <span>Surface : <b className="text-accent-2">{drawArea.toFixed(3)} km²</b> ({(drawArea * 100).toFixed(1)} ha)
              {points.length < 3 && <span className="text-slate-400"> — clique au moins 3 points</span>}</span>
          )}
          <span className="ml-2 text-slate-500">· {points.length} point(s)</span>
        </div>
      )}

      {/* Contrôles : fond de carte, climat, export (haut droite) */}
      <div className="absolute right-3 top-3 z-10 space-y-2">
        <button onClick={() => setIs3D((v) => !v)}
          className={`flex w-full items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium backdrop-blur ${is3D ? "bg-accent-2 text-white" : "bg-navy/90 text-slate-300 hover:bg-white/10"}`}>
          <Box size={14} /> {is3D ? "Vue 3D activée" : "Vue 3D"}
        </button>
        <div className="rounded-lg bg-navy/90 p-2 text-xs backdrop-blur">
          <p className="mb-1 flex items-center gap-1 text-slate-300"><LayersIcon size={12} /> Fond de carte</p>
          <div className="flex flex-col gap-1">
            {(Object.keys(BASEMAPS) as BasemapId[]).map((id) => (
              <button key={id} onClick={() => setBasemap(id)}
                className={`rounded px-2 py-1 text-left ${basemap === id ? "bg-primary text-white" : "text-slate-400 hover:bg-white/5"}`}>
                {BASEMAPS[id].label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-navy/90 p-2 text-xs backdrop-blur">
          <p className="mb-1 flex items-center gap-1 text-slate-300"><Thermometer size={12} /> Climat</p>
          <div className="flex flex-col gap-1">
            <button onClick={() => setClimateVar(climateVar === "temperature" ? null : "temperature")}
              className={`rounded px-2 py-1 text-left ${climateVar === "temperature" ? "bg-orange-600 text-white" : "text-slate-400 hover:bg-white/5"}`}>Température</button>
            <button onClick={() => setClimateVar(climateVar === "precipitation" ? null : "precipitation")}
              className={`rounded px-2 py-1 text-left ${climateVar === "precipitation" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/5"}`}>Précipitations</button>
          </div>
        </div>
        <div className="rounded-lg bg-navy/90 p-2 text-xs backdrop-blur">
          <p className="mb-1 flex items-center gap-1 text-slate-300"><Download size={12} /> Exporter</p>
          <div className="flex flex-col gap-1">
            <button onClick={exportPNG}
              className="flex items-center gap-1 rounded px-2 py-1 text-left text-slate-400 hover:bg-white/5">
              <ImageIcon size={12} /> Image PNG
            </button>
            <button onClick={() => exportGeoJSON(territoryId, territoryName)}
              className="flex items-center gap-1 rounded px-2 py-1 text-left text-slate-400 hover:bg-white/5">
              <Download size={12} /> GeoJSON
            </button>
          </div>
        </div>
      </div>

      <div className="absolute left-3 top-3 z-10 space-y-2">
        <div className="rounded-lg bg-navy/90 px-3 py-2 text-xs backdrop-blur">
          <div className="flex gap-4">
            <span className="text-slate-300">Zones : <b className="text-primary">{zones.features.length}</b></span>
            <span className="text-slate-300">Bâtiments : <b className="text-primary">{buildings.features.length}</b></span>
            {is3D && <span className="rounded bg-accent-2/30 px-1.5 text-accent-2">3D</span>}
          </div>
        </div>
        {climateVar && (
          <div className="rounded-lg bg-navy/90 px-3 py-2 text-xs backdrop-blur">
            <p className="mb-1 text-slate-300">{climateVar === "temperature" ? "Température (°C)" : "Précipitations (mm/an)"}</p>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{climateVar === "temperature" ? "frais" : "sec"}</span>
              <span className="h-2 w-24 rounded"
                style={{ background: climateVar === "temperature"
                  ? "linear-gradient(90deg,#3b82f6,#facc15,#f97316,#dc2626)"
                  : "linear-gradient(90deg,#fde047,#4ade80,#22d3ee,#2563eb)" }} />
              <span className="text-slate-400">{climateVar === "temperature" ? "chaud" : "humide"}</span>
            </div>
          </div>
        )}
        {planMode && (
          <div className="rounded-lg bg-navy/90 px-3 py-2 text-xs backdrop-blur">
            <p className="mb-1 text-slate-300">Priorité d'intervention</p>
            <div className="flex gap-3">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-rose-600" /> Haute</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-yellow-500" /> Moyenne</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-emerald-500" /> Basse</span>
            </div>
          </div>
        )}
        {simActive && !planMode && (
          <div className="flex items-center gap-2 rounded-lg bg-navy/90 px-3 py-2 text-xs backdrop-blur">
            <span className="text-slate-300">Bâti :</span>
            <button onClick={() => setShowAfter(false)} className={`rounded px-2 py-1 ${!showAfter ? "bg-primary text-white" : "text-slate-400"}`}>Actuel</button>
            <button onClick={() => setShowAfter(true)} className={`rounded px-2 py-1 ${showAfter ? "bg-emerald-600 text-white" : "text-slate-400"}`}>Après rénovation</button>
          </div>
        )}
      </div>

      <Map ref={mapRef} reuseMaps key={`${territoryId}-${center[0].toFixed(3)}-${planMode}-${basemap}-${is3D}`}
        initialViewState={{ longitude: center[0], latitude: center[1], zoom: is3D ? 14 : 12, pitch: is3D ? 55 : 0, bearing: is3D ? -20 : 0 }}
        maxPitch={85}
        terrain={is3D ? { source: "terrain-dem", exaggeration: 1.3 } : undefined}
        mapStyle={BASEMAPS[basemap].style}
        preserveDrawingBuffer
        style={{ width: "100%", height: "100%", borderRadius: 12 }}
        interactiveLayerIds={interactive} onClick={onClick}>
        <NavigationControl position="bottom-right" showCompass />
        {points.length > 0 && (
          <Source id="tool-geo" type="geojson" data={toolGeo}>
            <Layer id="tool-fill" type="fill"
              paint={{ "fill-color": tool === "draw" ? "#7c4dff" : "#2da3e0", "fill-opacity": 0.2 }} />
            <Layer id="tool-line" type="line"
              paint={{ "line-color": tool === "draw" ? "#7c4dff" : "#2da3e0", "line-width": 2, "line-dasharray": [2, 1] }} />
            <Layer id="tool-points" type="circle"
              paint={{ "circle-radius": 4, "circle-color": "#ffffff", "circle-stroke-color": tool === "draw" ? "#7c4dff" : "#2da3e0", "circle-stroke-width": 2 }} />
          </Source>
        )}
        {is3D && (
          <Source id="terrain-dem" type="raster-dem"
            tiles={["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"]}
            tileSize={256} encoding="terrarium" maxzoom={15} />
        )}
        {climateVar && climate && (
          <Source id="climate" type="geojson" data={climate}>
            <Layer id="climate-fill" type="fill"
              paint={{ "fill-color": climateVar === "temperature" ? CLIMATE_TEMP_COLOR : CLIMATE_PRECIP_COLOR,
                       "fill-opacity": 0.45 }} />
            <Layer id="climate-line" type="line"
              paint={{ "line-color": "#ffffff", "line-width": 0.5, "line-opacity": 0.3 }} />
          </Source>
        )}


        {showZones && (
          <Source id="zones" type="geojson" data={zones}>
            <Layer id="zones-fill" type="fill"
              paint={{ "fill-color": planMode ? PRIORITY_FILL : "#2da3e0",
                       "fill-opacity": planMode ? 0.25 : 0.12 }} />
            <Layer id="zones-line" type="line"
              paint={{ "line-color": planMode ? PRIORITY_LINE : "#2da3e0",
                       "line-width": planMode ? 2 : 1.5 }} />
          </Source>
        )}
        {showBuildings && (
          <Source id="buildings" type="geojson" data={buildings}>
            {is3D ? (
              <Layer id="buildings-3d" type="fill-extrusion"
                paint={{
                  "fill-extrusion-color": ENERGY_COLORS,
                  "fill-extrusion-height": ["*", ["coalesce", ["get", "floors"], 3], 3],
                  "fill-extrusion-base": 0,
                  "fill-extrusion-opacity": 0.9,
                }} />
            ) : (
              <>
                <Layer id="buildings-fill" type="fill" paint={{ "fill-color": ENERGY_COLORS, "fill-opacity": planMode ? 0.7 : 0.85 }} />
                <Layer id="buildings-line" type="line" paint={{ "line-color": "#ffffff", "line-width": 0.3, "line-opacity": 0.4 }} />
              </>
            )}
          </Source>
        )}


        {showRisks && risks && (
          <Source id="risks" type="geojson" data={risks}>
            <Layer id="risks-fill" type="fill"
              paint={{ "fill-color": RISK_COLOR, "fill-opacity": 0.30 }} />
            <Layer id="risks-line" type="line"
              paint={{ "line-color": RISK_COLOR, "line-width": 1.5, "line-dasharray": [2, 1] }} />
          </Source>
        )}
        {showMobility && mobility && (
          <Source id="mobility" type="geojson" data={mobility}>
            <Layer id="mobility-line" type="line"
              paint={{ "line-color": "#06b6d4", "line-width": 3, "line-opacity": 0.8 }} />
          </Source>
        )}
        {showSocio && socio && (
          <Source id="socio" type="geojson" data={socio}>
            <Layer id="socio-circle" type="circle"
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["get", "buildings"], 0, 8, 10, 30],
                "circle-color": "#a855f7", "circle-opacity": 0.45,
                "circle-stroke-color": "#c084fc", "circle-stroke-width": 1.5,
              }} />
          </Source>
        )}



        {popup && (
          <Popup longitude={popup.lng} latitude={popup.lat} closeButton onClose={() => setPopup(null)} anchor="bottom" maxWidth="280px">
            <div className="text-xs text-slate-800">
              {popup.props.kind === "climate" ? (
                <>
                  <p className="font-semibold">{popup.props.zone}</p>
                  <p>Température estivale : {popup.props.temperature} °C</p>
                  <p>Précipitations : {popup.props.precipitation} mm/an</p>
                </>
              ) : popup.props.kind === "risk" ? (
                <>
                  <p className="font-semibold">Risque — {popup.props.zone}</p>
                  <p>Type : {popup.props.risk_type}</p>
                  <p>Niveau : <b style={{ color: popup.props.level === "Élevé" ? "#dc2626" : popup.props.level === "Modéré" ? "#b45309" : "#15803d" }}>{popup.props.level}</b></p>
                </>
              ) : popup.props.kind === "mobility" ? (
                <>
                  <p className="font-semibold">Mobilité — {popup.props.mode}</p>
                  <p>{popup.props.from} → {popup.props.to}</p>
                </>
              ) : popup.props.kind === "socio" ? (
                <>
                  <p className="font-semibold">Socio-éco — {popup.props.zone}</p>
                  <p>Bâtiments : {popup.props.buildings}</p>
                  <p>Densité estimée : {popup.props.density} hab</p>
                  <p>Usage : {popup.props.land_use}</p>
                </>
              ) : popup.props.kind === "zone" ? (
                <>
                  <p className="font-semibold">{popup.props.name}</p>
                  <p>Usage : {popup.props.land_use}</p>
                  {popup.props.priority && (
                    <p className="mt-1">
                      Priorité : <b style={{ color: popup.props.priority === "Haute" ? "#dc2626" : popup.props.priority === "Moyenne" ? "#b45309" : "#15803d" }}>{popup.props.priority}</b>
                    </p>
                  )}
                  {popup.props.actions && (
                    <div className="mt-1">
                      <p className="font-medium">Actions du plan :</p>
                      <ul className="ml-3 list-disc">
                        {(typeof popup.props.actions === "string" ? JSON.parse(popup.props.actions) : popup.props.actions).map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button onClick={() => exportGeoJSON(territoryId, territoryName, popup.props.id)}
                    className="mt-2 flex items-center gap-1 rounded bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300">
                    ⬇ Exporter cette zone (GeoJSON)
                  </button>
                </>
              ) : (
                <>
                  <p className="font-semibold">Bâtiment #{popup.props.id}</p>
                  <p>Classe actuelle : {popup.props.energy_class}</p>
                  {showAfter && simActive && <p className="text-emerald-700">Après rénovation : {popup.props.display_class}</p>}
                  <p>Année : {popup.props.construction_year}</p>
                  <p>Surface : {popup.props.surface_m2} m²</p>
                  <p>{popup.props.annual_kwh_m2} kWh/m²/an</p>
                </>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

import { create } from "zustand";
import type { TerritoryRetrofitResult } from "@/api/energy";

interface SimulationState {
  measures: string[];                       // mesures de rénovation actives
  result: TerritoryRetrofitResult | null;   // impact agrégé au territoire
}

interface AppState {
  activeLayers: string[];
  toggleLayer: (id: string) => void;
  activeTerritoryId: number;
  setActiveTerritory: (id: number) => void;

  // Simulation partagée entre les pages et la carte
  simulation: SimulationState;
  setSimulation: (sim: SimulationState) => void;
  clearSimulation: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeLayers: ["land_use", "buildings", "energy"],
  toggleLayer: (id) =>
    set((state) => ({
      activeLayers: state.activeLayers.includes(id)
        ? state.activeLayers.filter((x) => x !== id)
        : [...state.activeLayers, id],
    })),

  activeTerritoryId: 1,
  setActiveTerritory: (id) =>
    set({ activeTerritoryId: id, simulation: { measures: [], result: null } }),

  simulation: { measures: [], result: null },
  setSimulation: (simulation) => set({ simulation }),
  clearSimulation: () => set({ simulation: { measures: [], result: null } }),
}));

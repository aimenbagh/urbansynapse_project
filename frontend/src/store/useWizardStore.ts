import { create } from "zustand";

interface WizardState {
  completed: number[];             // étapes terminées (1..4)
  current: number;                 // étape courante
  markDone: (step: number) => void;
  setCurrent: (step: number) => void;
  reset: () => void;
}

const load = (): number[] => {
  try { return JSON.parse(localStorage.getItem("wizard_completed") || "[]"); }
  catch { return []; }
};

export const useWizardStore = create<WizardState>((set, get) => ({
  completed: load(),
  current: (load().length ? Math.min(load().length + 1, 4) : 1),
  markDone: (step) => {
    const c = Array.from(new Set([...get().completed, step])).sort();
    localStorage.setItem("wizard_completed", JSON.stringify(c));
    set({ completed: c, current: Math.min(step + 1, 4) });
  },
  setCurrent: (step) => set({ current: step }),
  reset: () => { localStorage.removeItem("wizard_completed"); set({ completed: [], current: 1 }); },
}));

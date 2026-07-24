import { create } from "zustand";

interface LoaderState {
  isLoading: boolean;
  generation: number;
  startTime: number | null;
  startLoading: () => number;
  stopLoading: (gen: number) => void;
  forceStop: () => void;
}

let completionTimeoutId: NodeJS.Timeout | null = null;
let failureTimeoutId: NodeJS.Timeout | null = null;

const MIN_DURATION = 1000;
const FAILURE_DURATION = 15000;

export const useLoaderStore = create<LoaderState>((set, get) => ({
  isLoading: true, // Start true for initial page load
  generation: 1,
  startTime: typeof window !== 'undefined' ? Date.now() : null,

  startLoading: () => {
    if (completionTimeoutId) clearTimeout(completionTimeoutId);
    if (failureTimeoutId) clearTimeout(failureTimeoutId);

    const nextGen = get().generation + 1;
    set({ isLoading: true, generation: nextGen, startTime: Date.now() });

    // Safe failure timeout to prevent permanent blocking
    failureTimeoutId = setTimeout(() => {
      if (get().generation === nextGen) {
        set({ isLoading: false, startTime: null });
      }
    }, FAILURE_DURATION);

    return nextGen;
  },

  stopLoading: (gen: number) => {
    const { generation, startTime } = get();
    // Ignore if a newer load has started
    if (gen !== generation) return;

    if (completionTimeoutId) clearTimeout(completionTimeoutId);
    if (failureTimeoutId) clearTimeout(failureTimeoutId);

    if (!startTime) {
      set({ isLoading: false });
      return;
    }

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, MIN_DURATION - elapsed);

    if (remaining > 0) {
      completionTimeoutId = setTimeout(() => {
        if (get().generation === gen) {
          set({ isLoading: false, startTime: null });
        }
      }, remaining);
    } else {
      set({ isLoading: false, startTime: null });
    }
  },

  forceStop: () => {
    if (completionTimeoutId) clearTimeout(completionTimeoutId);
    if (failureTimeoutId) clearTimeout(failureTimeoutId);
    set({ isLoading: false, startTime: null, generation: get().generation + 1 });
  }
}));

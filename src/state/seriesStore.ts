import { create } from "zustand";
import type { BookHandle, Series } from "../bindings";

// Cache of what bindings.ts commands have returned so far — not navigation
// state (that stays local useState in App.tsx, see its comment) and not a
// reimplementation of any parsing/validation mythoside-core already does.
interface SeriesStore {
  projectDir: string | null;
  series: Series | null;
  currentBook: BookHandle | null;
  setSeries: (series: Series, projectDir: string) => void;
  setCurrentBook: (book: BookHandle | null) => void;
}

export const useSeriesStore = create<SeriesStore>((set) => ({
  projectDir: null,
  series: null,
  currentBook: null,
  setSeries: (series, projectDir) => set({ series, projectDir }),
  setCurrentBook: (book) => set({ currentBook: book }),
}));

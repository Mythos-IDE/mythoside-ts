import { create } from "zustand";
import type { BookHandle, ChapterHandle, Character, Location, Note, Series } from "../bindings";

// Cache of what bindings.ts commands have returned so far — not navigation
// state (that stays local useState in App.tsx, see its comment) and not a
// reimplementation of any parsing/validation mythoside-core already does.
interface SeriesStore {
  projectDir: string | null;
  series: Series | null;
  currentBook: BookHandle | null;
  currentChapter: ChapterHandle | null;
  currentCharacter: Character | null;
  currentLocation: Location | null;
  currentNote: Note | null;
  setSeries: (series: Series, projectDir: string) => void;
  setCurrentBook: (book: BookHandle | null) => void;
  setCurrentChapter: (chapter: ChapterHandle | null) => void;
  setCurrentCharacter: (character: Character | null) => void;
  setCurrentLocation: (location: Location | null) => void;
  setCurrentNote: (note: Note | null) => void;
  reset: () => void;
}

export const useSeriesStore = create<SeriesStore>((set) => ({
  projectDir: null,
  series: null,
  currentBook: null,
  currentChapter: null,
  currentCharacter: null,
  currentLocation: null,
  currentNote: null,
  setSeries: (series, projectDir) => set({ series, projectDir }),
  setCurrentBook: (book) => set({ currentBook: book }),
  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
  setCurrentCharacter: (character) => set({ currentCharacter: character }),
  setCurrentLocation: (location) => set({ currentLocation: location }),
  setCurrentNote: (note) => set({ currentNote: note }),
  reset: () =>
    set({
      projectDir: null,
      series: null,
      currentBook: null,
      currentChapter: null,
      currentCharacter: null,
      currentLocation: null,
      currentNote: null,
    }),
}));

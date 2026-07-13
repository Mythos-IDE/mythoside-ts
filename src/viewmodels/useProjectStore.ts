import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Series, Book, Chapter, Character, Location, Note } from "../models/types";

interface ProjectState {
  // Data
  series: Series[];
  books: Book[];
  chapters: Chapter[];
  characters: Character[];
  locations: Location[];
  notes: Note[];

  // Active States
  activeSeriesId: string | null;
  activeBookId: string | null;
  activeChapterId: string | null;

  // Actions
  createSeries: (series: Series) => void;
  createBook: (book: Book) => void;
  createChapter: (chapter: Chapter) => void;
  createCharacter: (char: Character) => void;
  createLocation: (loc: Location) => void;
  createNote: (note: Note) => void;

  setActiveSeries: (id: string | null) => void;
  setActiveBook: (id: string | null) => void;
  setActiveChapter: (id: string | null) => void;

  updateChapterContent: (id: string, content: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      series: [],
      books: [],
      chapters: [],
      characters: [],
      locations: [],
      notes: [],

      activeSeriesId: null,
      activeBookId: null,
      activeChapterId: null,

      createSeries: (s) =>
        set((state) => ({
          series: [...state.series, s],
        })),

      createBook: (b) =>
        set((state) => ({
          books: [...state.books, b],
        })),

      createChapter: (c) =>
        set((state) => ({
          chapters: [...state.chapters, c],
        })),

      createCharacter: (char) =>
        set((state) => ({
          characters: [...(state.characters || []), char],
        })),

      createLocation: (loc) =>
        set((state) => ({
          locations: [...(state.locations || []), loc],
        })),

      createNote: (n) =>
        set((state) => ({
          notes: [...(state.notes || []), n],
        })),

      setActiveSeries: (id) =>
        set({ activeSeriesId: id, activeBookId: null, activeChapterId: null }),
      setActiveBook: (id) => set({ activeBookId: id, activeChapterId: null }),
      setActiveChapter: (id) => set({ activeChapterId: id }),

      updateChapterContent: (id, content) =>
        set((state) => ({
          chapters: state.chapters.map((ch) => (ch.id === id ? { ...ch, content } : ch)),
        })),
    }),
    {
      name: "mythoside-project",
    },
  ),
);

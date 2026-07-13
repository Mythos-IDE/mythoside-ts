import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Series, Book, Chapter, Character, Location, Note } from "../models/types";

interface CreateSeriesInput {
  title: string;
  description: string;
}

interface CreateBookInput {
  seriesId: string;
  title: string;
  synopsis?: string;
}

interface CreateChapterInput {
  bookId: string;
  title: string;
}

interface CreateCharacterInput {
  bookId: string;
  name: string;
  role: string;
  bio: string;
}

interface CreateLocationInput {
  bookId: string;
  name: string;
  description: string;
}

interface CreateNoteInput {
  bookId: string;
  title: string;
  content: string;
  type: "lore" | "timeline";
}

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

  // Actions — each owns id/createdAt generation (and, for chapters, order
  // computation) so Views never construct domain entities themselves. Each
  // returns the new id so a caller can immediately activate what it just
  // created without re-deriving it.
  createSeries: (input: CreateSeriesInput) => string;
  createBook: (input: CreateBookInput) => string;
  createChapter: (input: CreateChapterInput) => string;
  createCharacter: (input: CreateCharacterInput) => string;
  createLocation: (input: CreateLocationInput) => string;
  createNote: (input: CreateNoteInput) => string;

  setActiveSeries: (id: string | null) => void;
  setActiveBook: (id: string | null) => void;
  setActiveChapter: (id: string | null) => void;

  updateChapterContent: (id: string, content: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      series: [],
      books: [],
      chapters: [],
      characters: [],
      locations: [],
      notes: [],

      activeSeriesId: null,
      activeBookId: null,
      activeChapterId: null,

      createSeries: (input) => {
        const series: Series = {
          id: crypto.randomUUID(),
          title: input.title,
          description: input.description,
          createdAt: Date.now(),
        };
        set((state) => ({ series: [...state.series, series] }));
        return series.id;
      },

      createBook: (input) => {
        const book: Book = {
          id: crypto.randomUUID(),
          seriesId: input.seriesId,
          title: input.title,
          synopsis: input.synopsis ?? "",
          createdAt: Date.now(),
        };
        set((state) => ({ books: [...state.books, book] }));
        return book.id;
      },

      createChapter: (input) => {
        const order = get().chapters.filter((c) => c.bookId === input.bookId).length + 1;
        const chapter: Chapter = {
          id: crypto.randomUUID(),
          bookId: input.bookId,
          title: input.title,
          content: "",
          order,
          createdAt: Date.now(),
        };
        set((state) => ({ chapters: [...state.chapters, chapter] }));
        return chapter.id;
      },

      createCharacter: (input) => {
        const character: Character = {
          id: crypto.randomUUID(),
          bookId: input.bookId,
          name: input.name,
          role: input.role,
          bio: input.bio,
          attributes: {},
        };
        set((state) => ({ characters: [...(state.characters || []), character] }));
        return character.id;
      },

      createLocation: (input) => {
        const location: Location = {
          id: crypto.randomUUID(),
          bookId: input.bookId,
          name: input.name,
          description: input.description,
        };
        set((state) => ({ locations: [...(state.locations || []), location] }));
        return location.id;
      },

      createNote: (input) => {
        const note: Note = {
          id: crypto.randomUUID(),
          bookId: input.bookId,
          title: input.title,
          content: input.content,
          type: input.type,
        };
        set((state) => ({ notes: [...(state.notes || []), note] }));
        return note.id;
      },

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

export interface Series {
  id: string;
  title: string;
  description: string;
  createdAt: number;
}

export interface Book {
  id: string;
  seriesId: string;
  title: string;
  synopsis: string;
  order: number;
  createdAt: number;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  order: number;
  createdAt: number;
}

export interface Scene {
  id: string;
  chapterId: string;
  title: string;
  order: number;
  tags: string[];
  characters: string[]; // character ids mentioned in this scene
  createdAt: number;
  content: string; // Markdown body
}

export interface Character {
  id: string;
  bookId: string;
  name: string;
  role: string;
  attributes: Record<string, string>;
  createdAt: number;
  bio: string; // Markdown body
}

export interface Location {
  id: string;
  bookId: string;
  name: string;
  createdAt: number;
  description: string; // Markdown body
}

export interface Note {
  id: string;
  bookId: string;
  title: string;
  type: "lore" | "timeline";
  createdAt: number;
  content: string; // Markdown body
}

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
  createdAt: number;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  content: string;
  order: number;
  createdAt: number;
}

export interface Character {
  id: string;
  bookId: string; // Could be seriesId depending on scope, but keeping it simple for now
  name: string;
  role: string;
  bio: string;
  attributes: Record<string, string>;
}

export interface Location {
  id: string;
  bookId: string;
  name: string;
  description: string;
}

export interface Note {
  id: string;
  bookId: string;
  title: string;
  content: string;
}

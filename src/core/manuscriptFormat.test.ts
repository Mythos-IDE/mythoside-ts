import { describe, expect, it } from "vitest";
import {
  seriesCodec,
  bookCodec,
  chapterCodec,
  sceneCodec,
  characterCodec,
  locationCodec,
  noteCodec,
} from "./manuscriptFormat";
import type { Series, Book, Chapter, Scene, Character, Location, Note } from "../models/types";

describe("manuscriptFormat", () => {
  it("round-trips a Series through series.yaml", () => {
    const series: Series = {
      id: "series-1",
      title: "The Aethelgard Chronicles",
      description: "An epic fantasy series.",
      createdAt: 1720000000000,
    };
    const parsed = seriesCodec.parse(seriesCodec.serialize(series));
    expect(parsed).toEqual(series);
  });

  it("round-trips a Book through book.yaml", () => {
    const book: Book = {
      id: "book-1",
      seriesId: "series-1",
      title: "Shadow of the Void",
      synopsis: "The first book.",
      order: 1,
      createdAt: 1720000000000,
    };
    const parsed = bookCodec.parse(bookCodec.serialize(book));
    expect(parsed).toEqual(book);
  });

  it("round-trips a Chapter through chapter.yaml", () => {
    const chapter: Chapter = {
      id: "chapter-1",
      bookId: "book-1",
      title: "The Obsidian Gate",
      order: 1,
      createdAt: 1720000000000,
    };
    const parsed = chapterCodec.parse(chapterCodec.serialize(chapter));
    expect(parsed).toEqual(chapter);
  });

  it("round-trips a Scene through Markdown + frontmatter", () => {
    const scene: Scene = {
      id: "scene-1",
      chapterId: "chapter-1",
      title: "The Void Begins",
      order: 1,
      tags: ["action", "reveal"],
      characters: ["lyra-vance", "silas-thorne"],
      createdAt: 1720000000000,
      content: "The air in the chamber was heavy with the scent of ancient dust and ozone.",
    };
    const file = sceneCodec.serialize(scene);
    expect(file).toContain("---");
    expect(file).toContain("The air in the chamber");
    expect(sceneCodec.parse(file)).toEqual(scene);
  });

  it("round-trips a Character through Markdown + frontmatter", () => {
    const character: Character = {
      id: "lyra-vance",
      bookId: "book-1",
      name: "Lyra Vance",
      role: "Protagonist",
      attributes: { age: "24", home: "Aethelgard" },
      createdAt: 1720000000000,
      bio: "Stealthy, skilled in alchemy.",
    };
    const parsed = characterCodec.parse(characterCodec.serialize(character));
    expect(parsed).toEqual(character);
  });

  it("round-trips a Location through Markdown + frontmatter", () => {
    const location: Location = {
      id: "aethelgard",
      bookId: "book-1",
      name: "Aethelgard",
      createdAt: 1720000000000,
      description: "The last free city.",
    };
    const parsed = locationCodec.parse(locationCodec.serialize(location));
    expect(parsed).toEqual(location);
  });

  it("round-trips a lore Note through Markdown + frontmatter", () => {
    const note: Note = {
      id: "note-1",
      bookId: "book-1",
      title: "The Void Walker Prophecy",
      type: "lore",
      createdAt: 1720000000000,
      content: "Long ago, the Void Walker was sealed beneath Aethelgard.",
    };
    const parsed = noteCodec.parse(noteCodec.serialize(note));
    expect(parsed).toEqual(note);
  });

  it("round-trips a timeline Note through Markdown + frontmatter", () => {
    const note: Note = {
      id: "note-2",
      bookId: "book-1",
      title: "The Sealing",
      type: "timeline",
      createdAt: 1720000000000,
      content: "Year 0 of the Third Age.",
    };
    const parsed = noteCodec.parse(noteCodec.serialize(note));
    expect(parsed).toEqual(note);
  });

  it("defaults optional Scene fields when frontmatter omits them", () => {
    const file =
      "---\nid: scene-2\nchapterId: chapter-1\ntitle: Bare Scene\norder: 2\ncreatedAt: 1720000000000\n---\nJust prose.";
    const parsed = sceneCodec.parse(file);
    expect(parsed.tags).toEqual([]);
    expect(parsed.characters).toEqual([]);
  });

  it("rejects a Note file with an invalid type", () => {
    const file =
      "---\nid: note-3\nbookId: book-1\ntitle: Bad\ntype: mythical\ncreatedAt: 1720000000000\n---\nContent.";
    expect(() => noteCodec.parse(file)).toThrow();
  });

  it("rejects metadata missing a required field", () => {
    expect(() => bookCodec.parse("id: book-2\ntitle: Missing seriesId\norder: 1")).toThrow();
  });
});

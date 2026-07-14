import matter from "gray-matter";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { z } from "zod";
import type { Series, Book, Chapter, Scene, Character, Location, Note } from "../models/types";

// Pure-YAML metadata files (series.yaml, book.yaml, chapter.yaml) — no prose body.
function makeYamlCodec<T>(schema: z.ZodType<T>) {
  return {
    parse: (yamlText: string): T => schema.parse(parseYaml(yamlText)),
    serialize: (value: T): string => stringifyYaml(value),
  };
}

// Markdown + YAML frontmatter files (Scene/Character/Location/Note) — metadata
// up top, a single prose field as the file body. `bodyKey` names which field
// of T holds that prose so parse/serialize can round-trip it.
function makeFrontmatterCodec<Frontmatter extends Record<string, unknown>, BodyKey extends string>(
  frontmatterSchema: z.ZodType<Frontmatter>,
  bodyKey: BodyKey,
) {
  return {
    parse: (fileText: string): Frontmatter & Record<BodyKey, string> => {
      const { data, content } = matter(fileText);
      const meta = frontmatterSchema.parse(data);
      return { ...meta, [bodyKey]: content.trim() } as Frontmatter & Record<BodyKey, string>;
    },
    serialize: (value: Frontmatter & Record<BodyKey, string>): string => {
      const { [bodyKey]: body, ...meta } = value;
      return matter.stringify(`${String(body)}\n`, meta);
    },
  };
}

// --- Series: <project-root>/series.yaml ---
const seriesSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(""),
  createdAt: z.number(),
}) satisfies z.ZodType<Series>;

export const seriesCodec = makeYamlCodec(seriesSchema);

// --- Book: <project-root>/<book-slug>/book.yaml ---
const bookSchema = z.object({
  id: z.string(),
  seriesId: z.string(),
  title: z.string(),
  synopsis: z.string().default(""),
  order: z.number(),
  createdAt: z.number(),
}) satisfies z.ZodType<Book>;

export const bookCodec = makeYamlCodec(bookSchema);

// --- Chapter: .../chapters/<order>-<chapter-slug>/chapter.yaml ---
const chapterSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  title: z.string(),
  order: z.number(),
  createdAt: z.number(),
}) satisfies z.ZodType<Chapter>;

export const chapterCodec = makeYamlCodec(chapterSchema);

// --- Scene: .../chapters/<...>/<order>-<scene-slug>.md ---
const sceneFrontmatterSchema = z.object({
  id: z.string(),
  chapterId: z.string(),
  title: z.string(),
  order: z.number(),
  tags: z.array(z.string()).default([]),
  characters: z.array(z.string()).default([]),
  createdAt: z.number(),
}) satisfies z.ZodType<Omit<Scene, "content">>;

export const sceneCodec = makeFrontmatterCodec(sceneFrontmatterSchema, "content");

// --- Character: .../characters/<slug>.md ---
const characterFrontmatterSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  name: z.string(),
  role: z.string(),
  attributes: z.record(z.string(), z.string()).default({}),
  createdAt: z.number(),
}) satisfies z.ZodType<Omit<Character, "bio">>;

export const characterCodec = makeFrontmatterCodec(characterFrontmatterSchema, "bio");

// --- Location: .../locations/<slug>.md ---
const locationFrontmatterSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  name: z.string(),
  createdAt: z.number(),
}) satisfies z.ZodType<Omit<Location, "description">>;

export const locationCodec = makeFrontmatterCodec(locationFrontmatterSchema, "description");

// --- Note: .../notes/<slug>.md ---
const noteFrontmatterSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  title: z.string(),
  type: z.enum(["lore", "timeline"]),
  createdAt: z.number(),
}) satisfies z.ZodType<Omit<Note, "content">>;

export const noteCodec = makeFrontmatterCodec(noteFrontmatterSchema, "content");

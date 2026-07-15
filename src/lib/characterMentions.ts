import { commands, type ChapterHandle } from "../bindings";

export interface CharacterMention {
  bookTitle: string;
  chapter: ChapterHandle;
}

// Scans every chapter in every book of the series for a
// `mention:character:<id>` link in its Markdown content — the exact link
// shape blockNoteSchema.tsx's `toExternalHTML` writes when a `@Karakter`
// mention is inserted in the editor. No backend command for this:
// listBooks/listChapters already return full chapter content, so a
// client-side scan is enough at this app's scale (see CLAUDE.md on why
// SQLite/FTS5 indexing is deliberately deferred).
export async function findCharacterMentions(
  projectDir: string,
  characterId: string,
): Promise<CharacterMention[]> {
  const booksResult = await commands.listBooks(projectDir);
  if (booksResult.status !== "ok") return [];

  const needle = `mention:character:${characterId})`;
  const mentions: CharacterMention[] = [];

  for (const book of booksResult.data.books) {
    const chaptersResult = await commands.listChapters(book.bookDir);
    if (chaptersResult.status !== "ok") continue;
    for (const chapter of chaptersResult.data.chapters) {
      if (chapter.chapter.content.includes(needle)) {
        mentions.push({ bookTitle: book.book.title, chapter });
      }
    }
  }

  return mentions;
}

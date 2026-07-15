import { useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Banner } from "@astryxdesign/core/Banner";
import { commands } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import type { ViewProps } from "../state/navigation";

// `order` is never asked for here — create_chapter assigns it automatically,
// same "don't make the user supply what the system can compute" call as
// create_book/create_series.
//
// Goes straight into the editor after creating — the point of adding a
// chapter is to start writing, not to fill out a second form first.
export function AddChapterView({ onNavigate }: ViewProps) {
  const currentBook = useSeriesStore((state) => state.currentBook);
  const setCurrentChapter = useSeriesStore((state) => state.setCurrentChapter);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!currentBook) return;
    setError("");
    const chapterResult = await commands.createChapter({
      bookDir: currentBook.bookDir,
      bookId: currentBook.book.id,
      title,
      tags: [],
      characters: [],
      content: "",
    });
    if (chapterResult.status === "ok") {
      setCurrentChapter(chapterResult.data);
      onNavigate("chapter-editor");
    } else {
      setError(chapterResult.error);
    }
  };

  return (
    <SeriesAppShell activeView="add-chapter" onNavigate={onNavigate}>
      <VStack gap={6} maxWidth={480}>
        <Heading level={2}>Bölüm Ekle</Heading>
        <Card padding={6}>
          <VStack gap={4}>
            <TextInput label="Başlık" value={title} onChange={setTitle} />
            <HStack gap={2}>
              <Button
                label="Yazmaya Başla"
                variant="primary"
                clickAction={handleCreate}
                isDisabled={!title}
              />
              <Button
                label="Vazgeç"
                variant="secondary"
                clickAction={() => onNavigate("chapters")}
              />
            </HStack>
          </VStack>
        </Card>
        {error && <Banner status="error" title="Hata" description={error} />}
      </VStack>
    </SeriesAppShell>
  );
}

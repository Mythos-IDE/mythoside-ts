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
// Creating a chapter also creates its first scene (titled the same as the
// chapter) and goes straight into the editor for it — the point of adding a
// chapter is to start writing, not to fill out a second "add a scene" form
// first. Additional scenes within the chapter are still added from
// ScenesView's own "Yeni Sahne" button.
export function AddChapterView({ onNavigate }: ViewProps) {
  const currentBook = useSeriesStore((state) => state.currentBook);
  const setCurrentChapter = useSeriesStore((state) => state.setCurrentChapter);
  const setCurrentScene = useSeriesStore((state) => state.setCurrentScene);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!currentBook) return;
    setError("");
    const chapterResult = await commands.createChapter({
      bookDir: currentBook.bookDir,
      bookId: currentBook.book.id,
      title,
    });
    if (chapterResult.status !== "ok") {
      setError(chapterResult.error);
      return;
    }
    setCurrentChapter(chapterResult.data);

    const sceneResult = await commands.createScene({
      chapterDir: chapterResult.data.chapterDir,
      chapterId: chapterResult.data.chapter.id,
      title,
      tags: [],
      characters: [],
      content: "",
    });
    if (sceneResult.status === "ok") {
      setCurrentScene(sceneResult.data);
      onNavigate("scene-editor");
    } else {
      setError(sceneResult.error);
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

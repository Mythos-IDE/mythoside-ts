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

// Just a title — on create, goes straight into the editor (scene-editor)
// rather than back to the scene list, since the actual intent of "add a
// scene" in a writing tool is to start writing immediately.
export function AddSceneView({ onNavigate }: ViewProps) {
  const currentChapter = useSeriesStore((state) => state.currentChapter);
  const setCurrentScene = useSeriesStore((state) => state.setCurrentScene);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!currentChapter) return;
    setError("");
    const result = await commands.createScene({
      chapterDir: currentChapter.chapterDir,
      chapterId: currentChapter.chapter.id,
      title,
      tags: [],
      characters: [],
      content: "",
    });
    if (result.status === "ok") {
      setCurrentScene(result.data);
      onNavigate("scene-editor");
    } else {
      setError(result.error);
    }
  };

  return (
    <SeriesAppShell activeView="add-scene" onNavigate={onNavigate}>
      <VStack gap={6} maxWidth={480}>
        <Heading level={2}>Yeni Sahne</Heading>
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
              <Button label="Vazgeç" variant="secondary" clickAction={() => onNavigate("scenes")} />
            </HStack>
          </VStack>
        </Card>
        {error && <Banner status="error" title="Hata" description={error} />}
      </VStack>
    </SeriesAppShell>
  );
}

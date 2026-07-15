import { useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Banner } from "@astryxdesign/core/Banner";
import { commands } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import type { ViewProps } from "../state/navigation";

// Edit form mirroring AddTimelineNoteView's fields — type stays fixed to
// "timeline" here too, same "lore notes aren't surfaced in the UI yet"
// scoping decision as the add form.
export function TimelineNoteDetailView({ onNavigate }: ViewProps) {
  const projectDir = useSeriesStore((state) => state.projectDir);
  const currentNote = useSeriesStore((state) => state.currentNote);
  const [title, setTitle] = useState(currentNote?.title ?? "");
  const [content, setContent] = useState(currentNote?.content ?? "");
  const [error, setError] = useState("");

  if (!currentNote) {
    return (
      <SeriesAppShell activeView="timeline-note-detail" onNavigate={onNavigate}>
        <Text color="secondary">Bir girdi seçilmedi.</Text>
      </SeriesAppShell>
    );
  }

  const handleSave = async () => {
    if (!projectDir) return;
    setError("");
    const result = await commands.updateNote({
      projectDir,
      noteId: currentNote.id,
      title,
      type: "timeline",
      content,
    });
    if (result.status === "ok") {
      onNavigate("timeline");
    } else {
      setError(result.error);
    }
  };

  return (
    <SeriesAppShell activeView="timeline-note-detail" onNavigate={onNavigate}>
      <VStack gap={6} maxWidth={480}>
        <Heading level={2}>{currentNote.title}</Heading>
        <Card padding={6}>
          <VStack gap={4}>
            <TextInput label="Başlık" value={title} onChange={setTitle} />
            <TextArea label="İçerik" value={content} onChange={setContent} isOptional rows={4} />
            <HStack gap={2}>
              <Button
                label="Kaydet"
                variant="primary"
                clickAction={handleSave}
                isDisabled={!title}
              />
              <Button
                label="Vazgeç"
                variant="secondary"
                clickAction={() => onNavigate("timeline")}
              />
            </HStack>
          </VStack>
        </Card>
        {error && <Banner status="error" title="Hata" description={error} />}
      </VStack>
    </SeriesAppShell>
  );
}

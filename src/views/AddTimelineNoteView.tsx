import { useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Banner } from "@astryxdesign/core/Banner";
import { commands } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import type { ViewProps } from "../state/navigation";

// This entry point only ever creates a "timeline" note — the type isn't
// user-selectable here since the button that leads here already says
// "Zaman Çizgisi Ekle". Lore notes aren't surfaced in the UI this pass.
export function AddTimelineNoteView({ onNavigate }: ViewProps) {
  const projectDir = useSeriesStore((state) => state.projectDir);
  const series = useSeriesStore((state) => state.series);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!projectDir || !series) return;
    setError("");
    const result = await commands.createNote({
      projectDir,
      seriesId: series.id,
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
    <SeriesAppShell activeView="add-timeline-note" onNavigate={onNavigate}>
      <VStack gap={6} maxWidth={480}>
        <Heading level={2}>Zaman Çizgisi Ekle</Heading>
        <Card padding={6}>
          <VStack gap={4}>
            <TextInput label="Başlık" value={title} onChange={setTitle} />
            <TextArea label="İçerik" value={content} onChange={setContent} isOptional rows={4} />
            <HStack gap={2}>
              <Button
                label="Ekle"
                variant="primary"
                clickAction={handleCreate}
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

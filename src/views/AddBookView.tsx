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

// `order` is never asked for here — create_book assigns it automatically
// (count of existing books), the same "don't make the user supply what the
// system can compute" call as create_series's path resolution.
export function AddBookView({ onNavigate }: ViewProps) {
  const projectDir = useSeriesStore((state) => state.projectDir);
  const series = useSeriesStore((state) => state.series);
  const setCurrentBook = useSeriesStore((state) => state.setCurrentBook);
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!projectDir || !series) return;
    setError("");
    const result = await commands.createBook({
      projectDir,
      seriesId: series.id,
      title,
      synopsis,
    });
    if (result.status === "ok") {
      setCurrentBook(result.data);
      onNavigate("book-detail");
    } else {
      setError(result.error);
    }
  };

  return (
    <SeriesAppShell activeView="add-book" onNavigate={onNavigate}>
      <VStack gap={6} maxWidth={480}>
        <Heading level={2}>Kitap Ekle</Heading>
        <Card padding={6}>
          <VStack gap={4}>
            <TextInput label="Başlık" value={title} onChange={setTitle} />
            <TextArea label="Özet" value={synopsis} onChange={setSynopsis} isOptional rows={3} />
            <HStack gap={2}>
              <Button
                label="Kitap Oluştur"
                variant="primary"
                clickAction={handleCreate}
                isDisabled={!title}
              />
              <Button
                label="Vazgeç"
                variant="secondary"
                clickAction={() => onNavigate("series-dashboard")}
              />
            </HStack>
          </VStack>
        </Card>
        {error && <Banner status="error" title="Hata" description={error} />}
      </VStack>
    </SeriesAppShell>
  );
}

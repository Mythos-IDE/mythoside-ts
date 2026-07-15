import { useEffect, useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { commands, type ChapterHandle } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import type { ViewProps } from "../state/navigation";

// Book-scoped, unlike Character/Location/Note — a chapter belongs to
// exactly one book, so this lives under BookDetailView, not the series-
// level side nav.
export function ChaptersView({ onNavigate }: ViewProps) {
  const currentBook = useSeriesStore((state) => state.currentBook);
  const setCurrentChapter = useSeriesStore((state) => state.setCurrentChapter);
  const [chapters, setChapters] = useState<ChapterHandle[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const bookDir = currentBook?.bookDir ?? null;

  const reload = () => {
    if (!bookDir) return;
    commands.listChapters(bookDir).then((result) => {
      if (result.status === "ok") {
        setChapters(result.data.chapters);
        setWarnings(result.data.warnings);
      } else {
        setError(result.error);
      }
    });
  };

  useEffect(reload, [bookDir]);

  const openChapter = (handle: ChapterHandle) => {
    setCurrentChapter(handle);
    onNavigate("scenes");
  };

  const pendingChapter = chapters.find((c) => c.chapter.id === pendingDeleteId);

  const handleDelete = async () => {
    if (!pendingChapter) return;
    const result = await commands.deleteChapter(pendingChapter.chapterDir);
    setPendingDeleteId(null);
    if (result.status === "ok") {
      reload();
    } else {
      setError(result.error);
    }
  };

  return (
    <SeriesAppShell activeView="chapters" onNavigate={onNavigate}>
      <VStack gap={6} maxWidth={720}>
        <HStack justify="between" align="center">
          <Heading level={2}>Bölümler</Heading>
          <Button
            label="Bölüm Ekle"
            variant="primary"
            clickAction={() => onNavigate("add-chapter")}
          />
        </HStack>

        {error && <Banner status="error" title="Hata" description={error} />}
        {warnings.length > 0 && (
          <Banner
            status="warning"
            title="Bazı bölümler okunamadı"
            description={warnings.join("\n")}
          />
        )}

        {chapters.length === 0 && <Text color="secondary">Henüz bölüm eklenmedi.</Text>}

        <VStack gap={3}>
          {chapters.map((handle) => (
            <ClickableCard
              key={handle.chapter.id}
              label={`${handle.chapter.title} bölümünü aç`}
              onClick={() => openChapter(handle)}
            >
              <HStack justify="between" align="center">
                <Heading level={4}>
                  {handle.chapter.order}. {handle.chapter.title}
                </Heading>
                <Button
                  label="Sil"
                  variant="destructive"
                  clickAction={() => setPendingDeleteId(handle.chapter.id)}
                />
              </HStack>
            </ClickableCard>
          ))}
        </VStack>
      </VStack>

      <AlertDialog
        isOpen={pendingDeleteId !== null}
        onOpenChange={(isOpen) => !isOpen && setPendingDeleteId(null)}
        title="Bölümü sil"
        description={`"${pendingChapter?.chapter.title ?? ""}" bölümünü ve içindeki tüm sahneleri silmek istediğinizden emin misiniz? Bu işlem çöp kutusuna taşınarak geri alınabilir.`}
        actionLabel="Sil"
        onAction={handleDelete}
      />
    </SeriesAppShell>
  );
}

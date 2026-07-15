import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, Pencil } from "lucide-react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Banner } from "@astryxdesign/core/Banner";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { commands, type ChapterHandle } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import { RenameDialog } from "./RenameDialog";
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
  const [renamingId, setRenamingId] = useState<string | null>(null);

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

  // Goes straight to the writing surface — a chapter carries its own prose
  // directly, there's no separate scene list to browse first.
  const openChapter = (handle: ChapterHandle) => {
    setCurrentChapter(handle);
    onNavigate("chapter-editor");
  };

  const pendingChapter = chapters.find((c) => c.chapter.id === pendingDeleteId);
  const renamingChapter = chapters.find((c) => c.chapter.id === renamingId);

  const handleDelete = async () => {
    if (!pendingChapter) return;
    const result = await commands.deleteChapter(pendingChapter.chapterPath);
    setPendingDeleteId(null);
    if (result.status === "ok") {
      reload();
    } else {
      setError(result.error);
    }
  };

  const handleRename = async (title: string) => {
    if (!renamingChapter) return;
    const result = await commands.updateChapter({
      chapterPath: renamingChapter.chapterPath,
      title,
    });
    if (result.status === "ok") {
      reload();
    } else {
      setError(result.error);
    }
  };

  const handleMove = async (chapterId: string, direction: "up" | "down") => {
    if (!bookDir) return;
    const result = await commands.moveChapter(bookDir, chapterId, direction);
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
          {chapters.map((handle, index) => (
            <ClickableCard
              key={handle.chapter.id}
              label={`${handle.chapter.title} bölümünü aç`}
              onClick={() => openChapter(handle)}
            >
              <HStack justify="between" align="center">
                <Heading level={4}>
                  {handle.chapter.order}. {handle.chapter.title}
                </Heading>
                <HStack gap={1}>
                  <IconButton
                    label="Yukarı taşı"
                    tooltip="Yukarı taşı"
                    icon={<ChevronUp size={16} />}
                    variant="ghost"
                    isDisabled={index === 0}
                    onClick={() => handleMove(handle.chapter.id, "up")}
                  />
                  <IconButton
                    label="Aşağı taşı"
                    tooltip="Aşağı taşı"
                    icon={<ChevronDown size={16} />}
                    variant="ghost"
                    isDisabled={index === chapters.length - 1}
                    onClick={() => handleMove(handle.chapter.id, "down")}
                  />
                  <IconButton
                    label="Yeniden adlandır"
                    tooltip="Yeniden adlandır"
                    icon={<Pencil size={16} />}
                    variant="ghost"
                    onClick={() => setRenamingId(handle.chapter.id)}
                  />
                  <Button
                    label="Sil"
                    variant="destructive"
                    clickAction={() => setPendingDeleteId(handle.chapter.id)}
                  />
                </HStack>
              </HStack>
            </ClickableCard>
          ))}
        </VStack>
      </VStack>

      <AlertDialog
        isOpen={pendingDeleteId !== null}
        onOpenChange={(isOpen) => !isOpen && setPendingDeleteId(null)}
        title="Bölümü sil"
        description={`"${pendingChapter?.chapter.title ?? ""}" bölümünü ve içeriğini silmek istediğinizden emin misiniz? Bu işlem çöp kutusuna taşınarak geri alınabilir.`}
        actionLabel="Sil"
        onAction={handleDelete}
      />

      <RenameDialog
        isOpen={renamingId !== null}
        onOpenChange={(isOpen) => !isOpen && setRenamingId(null)}
        dialogTitle="Bölümü yeniden adlandır"
        initialValue={renamingChapter?.chapter.title ?? ""}
        onSave={handleRename}
      />
    </SeriesAppShell>
  );
}

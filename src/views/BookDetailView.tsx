import { useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { commands } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import type { ViewProps } from "../state/navigation";

// Characters/Locations/Timeline live at the series level now (see
// CharactersView etc.) — this screen is the book's own metadata, the entry
// point into its Chapters (genuinely book-scoped, unlike those three), and
// deleting it.
export function BookDetailView({ onNavigate }: ViewProps) {
  const currentBook = useSeriesStore((state) => state.currentBook);
  const setCurrentBook = useSeriesStore((state) => state.setCurrentBook);
  const [error, setError] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!currentBook) {
    return (
      <SeriesAppShell activeView="book-detail" onNavigate={onNavigate}>
        <Text color="secondary">Bir kitap seçilmedi.</Text>
      </SeriesAppShell>
    );
  }

  const handleDelete = async () => {
    const result = await commands.deleteBook(currentBook.bookDir);
    setIsConfirmingDelete(false);
    if (result.status === "ok") {
      setCurrentBook(null);
      onNavigate("series-dashboard");
    } else {
      setError(result.error);
    }
  };

  return (
    <SeriesAppShell activeView="book-detail" onNavigate={onNavigate}>
      <VStack gap={6} width="100%">
        <Card padding={6}>
          <VStack gap={4}>
            <Heading level={2}>{currentBook.book.title}</Heading>
            <Text color="secondary">{currentBook.book.synopsis || "Özet yok."}</Text>
            <HStack gap={2}>
              <Button
                label="Bölümler"
                variant="primary"
                clickAction={() => onNavigate("chapters")}
              />
              <Button
                label="Kitabı Sil"
                variant="destructive"
                clickAction={() => setIsConfirmingDelete(true)}
              />
            </HStack>
          </VStack>
        </Card>

        {error && <Banner status="error" title="Hata" description={error} />}
      </VStack>

      <AlertDialog
        isOpen={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title="Kitabı sil"
        description={`"${currentBook.book.title}" kitabını silmek istediğinizden emin misiniz? Bu işlem çöp kutusuna taşınarak geri alınabilir.`}
        actionLabel="Sil"
        onAction={handleDelete}
      />
    </SeriesAppShell>
  );
}

import { useEffect, useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { commands, type BookHandle } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { formatCreatedAt } from "../lib/formatDate";
import { SeriesAppShell } from "./SeriesAppShell";
import type { ViewProps } from "../state/navigation";

export function SeriesDashboardView({ onNavigate }: ViewProps) {
  const series = useSeriesStore((state) => state.series);
  const projectDir = useSeriesStore((state) => state.projectDir);
  const setCurrentBook = useSeriesStore((state) => state.setCurrentBook);
  const [books, setBooks] = useState<BookHandle[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const reload = () => {
    if (!projectDir) return;
    commands.listBooks(projectDir).then((result) => {
      if (result.status === "ok") {
        setBooks(result.data.books);
        setWarnings(result.data.warnings);
      } else {
        setError(result.error);
      }
    });
  };

  useEffect(reload, [projectDir]);

  const openBook = (book: BookHandle) => {
    setCurrentBook(book);
    onNavigate("book-detail");
  };

  const pendingBook = books.find((b) => b.book.id === pendingDeleteId);

  const handleDelete = async () => {
    if (!pendingBook) return;
    const result = await commands.deleteBook(pendingBook.bookDir);
    setPendingDeleteId(null);
    if (result.status === "ok") {
      reload();
    } else {
      setError(result.error);
    }
  };

  return (
    <SeriesAppShell activeView="series-dashboard" onNavigate={onNavigate}>
      <VStack gap={6} width="100%">
        <Card padding={6}>
          <VStack gap={2}>
            <Heading level={2}>{series?.title}</Heading>
            <Text color="secondary">{series?.description || "Açıklama yok."}</Text>
            {series && (
              <Text type="supporting" color="secondary">
                Oluşturulma: {formatCreatedAt(series.createdAt)}
              </Text>
            )}
          </VStack>
        </Card>

        {error && <Banner status="error" title="Hata" description={error} />}
        {warnings.length > 0 && (
          <Banner
            status="warning"
            title="Bazı kitaplar okunamadı"
            description={warnings.join("\n")}
          />
        )}

        <HStack justify="between" align="center">
          <Heading level={3}>Kitaplar</Heading>
          <Button label="Kitap Ekle" variant="primary" clickAction={() => onNavigate("add-book")} />
        </HStack>

        {books.length === 0 && <Text color="secondary">Henüz kitap eklenmedi.</Text>}

        <VStack gap={3}>
          {books.map((handle) => (
            <ClickableCard
              key={handle.book.id}
              label={`${handle.book.title} kitabını aç`}
              onClick={() => openBook(handle)}
            >
              <HStack justify="between" align="center">
                <VStack gap={1}>
                  <Heading level={4}>
                    {handle.book.order}. {handle.book.title}
                  </Heading>
                  <Text color="secondary">{handle.book.synopsis || "Özet yok."}</Text>
                </VStack>
                <Button
                  label="Sil"
                  variant="destructive"
                  clickAction={() => setPendingDeleteId(handle.book.id)}
                />
              </HStack>
            </ClickableCard>
          ))}
        </VStack>
      </VStack>

      <AlertDialog
        isOpen={pendingDeleteId !== null}
        onOpenChange={(isOpen) => !isOpen && setPendingDeleteId(null)}
        title="Kitabı sil"
        description={`"${pendingBook?.book.title ?? ""}" kitabını silmek istediğinizden emin misiniz? Bu işlem çöp kutusuna taşınarak geri alınabilir.`}
        actionLabel="Sil"
        onAction={handleDelete}
      />
    </SeriesAppShell>
  );
}

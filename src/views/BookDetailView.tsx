import { useEffect, useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { commands, type Character, type Location, type Note } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import type { ViewProps } from "../state/navigation";

export function BookDetailView({ onNavigate }: ViewProps) {
  const currentBook = useSeriesStore((state) => state.currentBook);
  const bookDir = currentBook?.bookDir ?? null;

  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookDir) return;
    setError("");
    setWarnings([]);

    Promise.all([
      commands.listCharacters(bookDir),
      commands.listLocations(bookDir),
      commands.listNotes(bookDir),
    ]).then(([charactersResult, locationsResult, notesResult]) => {
      const collectedWarnings: string[] = [];

      if (charactersResult.status === "ok") {
        setCharacters(charactersResult.data.characters);
        collectedWarnings.push(...charactersResult.data.warnings);
      } else {
        setError(charactersResult.error);
      }

      if (locationsResult.status === "ok") {
        setLocations(locationsResult.data.locations);
        collectedWarnings.push(...locationsResult.data.warnings);
      } else {
        setError(locationsResult.error);
      }

      if (notesResult.status === "ok") {
        setNotes(notesResult.data.notes.filter((note) => note.type === "timeline"));
        collectedWarnings.push(...notesResult.data.warnings);
      } else {
        setError(notesResult.error);
      }

      setWarnings(collectedWarnings);
    });
  }, [bookDir]);

  if (!currentBook) {
    return (
      <SeriesAppShell activeView="book-detail" onNavigate={onNavigate}>
        <Text color="secondary">Bir kitap seçilmedi.</Text>
      </SeriesAppShell>
    );
  }

  return (
    <SeriesAppShell activeView="book-detail" onNavigate={onNavigate}>
      <VStack gap={6} maxWidth={720}>
        <Card padding={6}>
          <VStack gap={2}>
            <Heading level={2}>{currentBook.book.title}</Heading>
            <Text color="secondary">{currentBook.book.synopsis || "Özet yok."}</Text>
          </VStack>
        </Card>

        {error && <Banner status="error" title="Hata" description={error} />}
        {warnings.length > 0 && (
          <Banner
            status="warning"
            title="Bazı dosyalar okunamadı"
            description={warnings.join("\n")}
          />
        )}

        <EntitySection
          title="Karakterler"
          addLabel="Karakter Ekle"
          onAdd={() => onNavigate("add-character")}
          emptyLabel="Henüz karakter eklenmedi."
        >
          {characters.map((character) => (
            <Card key={character.id} padding={4}>
              <VStack gap={1}>
                <Heading level={4}>{character.name}</Heading>
                <Text color="secondary">{character.role}</Text>
              </VStack>
            </Card>
          ))}
        </EntitySection>

        <EntitySection
          title="Lokasyonlar"
          addLabel="Lokasyon Ekle"
          onAdd={() => onNavigate("add-location")}
          emptyLabel="Henüz lokasyon eklenmedi."
        >
          {locations.map((location) => (
            <Card key={location.id} padding={4}>
              <VStack gap={1}>
                <Heading level={4}>{location.name}</Heading>
                <Text color="secondary">{location.description || "Açıklama yok."}</Text>
              </VStack>
            </Card>
          ))}
        </EntitySection>

        <EntitySection
          title="Zaman Çizgisi"
          addLabel="Zaman Çizgisi Ekle"
          onAdd={() => onNavigate("add-timeline-note")}
          emptyLabel="Henüz zaman çizgisi girdisi eklenmedi."
        >
          {notes.map((note) => (
            <Card key={note.id} padding={4}>
              <VStack gap={1}>
                <Heading level={4}>{note.title}</Heading>
                <Text color="secondary">{note.content}</Text>
              </VStack>
            </Card>
          ))}
        </EntitySection>
      </VStack>
    </SeriesAppShell>
  );
}

interface EntitySectionProps {
  title: string;
  addLabel: string;
  onAdd: () => void;
  emptyLabel: string;
  children: React.ReactNode[];
}

function EntitySection({ title, addLabel, onAdd, emptyLabel, children }: EntitySectionProps) {
  return (
    <VStack gap={3}>
      <HStack justify="between" align="center">
        <Heading level={3}>{title}</Heading>
        <Button label={addLabel} variant="secondary" clickAction={onAdd} />
      </HStack>
      {children.length === 0 ? (
        <Text color="secondary">{emptyLabel}</Text>
      ) : (
        <VStack gap={2}>{children}</VStack>
      )}
    </VStack>
  );
}

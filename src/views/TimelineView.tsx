import { useEffect, useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { commands, type Note } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import type { ViewProps } from "../state/navigation";

// Series-level, same reasoning as CharactersView/LocationsView. list_notes
// returns both lore and timeline notes; this screen filters client-side to
// "timeline" — lore notes aren't surfaced in the UI yet.
export function TimelineView({ onNavigate }: ViewProps) {
  const projectDir = useSeriesStore((state) => state.projectDir);
  const [notes, setNotes] = useState<Note[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const reload = () => {
    if (!projectDir) return;
    commands.listNotes(projectDir).then((result) => {
      if (result.status === "ok") {
        setNotes(result.data.notes.filter((note) => note.type === "timeline"));
        setWarnings(result.data.warnings);
      } else {
        setError(result.error);
      }
    });
  };

  useEffect(reload, [projectDir]);

  const handleDelete = async () => {
    if (!projectDir || !pendingDeleteId) return;
    const result = await commands.deleteNote(projectDir, pendingDeleteId);
    setPendingDeleteId(null);
    if (result.status === "ok") {
      reload();
    } else {
      setError(result.error);
    }
  };

  const pendingNote = notes.find((n) => n.id === pendingDeleteId);

  return (
    <SeriesAppShell activeView="timeline" onNavigate={onNavigate}>
      <VStack gap={6} maxWidth={720}>
        <HStack justify="between" align="center">
          <Heading level={2}>Zaman Çizgisi</Heading>
          <Button
            label="Zaman Çizgisi Ekle"
            variant="primary"
            clickAction={() => onNavigate("add-timeline-note")}
          />
        </HStack>

        {error && <Banner status="error" title="Hata" description={error} />}
        {warnings.length > 0 && (
          <Banner
            status="warning"
            title="Bazı girdiler okunamadı"
            description={warnings.join("\n")}
          />
        )}

        {notes.length === 0 && (
          <Text color="secondary">Henüz zaman çizgisi girdisi eklenmedi.</Text>
        )}

        <VStack gap={2}>
          {notes.map((note) => (
            <Card key={note.id} padding={4}>
              <HStack justify="between" align="center">
                <VStack gap={1}>
                  <Heading level={4}>{note.title}</Heading>
                  <Text color="secondary">{note.content}</Text>
                </VStack>
                <Button
                  label="Sil"
                  variant="destructive"
                  clickAction={() => setPendingDeleteId(note.id)}
                />
              </HStack>
            </Card>
          ))}
        </VStack>
      </VStack>

      <AlertDialog
        isOpen={pendingDeleteId !== null}
        onOpenChange={(isOpen) => !isOpen && setPendingDeleteId(null)}
        title="Zaman çizgisi girdisini sil"
        description={`"${pendingNote?.title ?? ""}" girdisini silmek istediğinizden emin misiniz? Bu işlem çöp kutusuna taşınarak geri alınabilir.`}
        actionLabel="Sil"
        onAction={handleDelete}
      />
    </SeriesAppShell>
  );
}

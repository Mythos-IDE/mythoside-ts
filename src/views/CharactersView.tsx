import { useEffect, useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { commands, type Character } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import type { ViewProps } from "../state/navigation";

// Series-level, not book-level — a character can recur across multiple
// books in the series, so it lives (and is listed) here rather than under
// a specific book's detail screen.
export function CharactersView({ onNavigate }: ViewProps) {
  const projectDir = useSeriesStore((state) => state.projectDir);
  const setCurrentCharacter = useSeriesStore((state) => state.setCurrentCharacter);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const reload = () => {
    if (!projectDir) return;
    commands.listCharacters(projectDir).then((result) => {
      if (result.status === "ok") {
        setCharacters(result.data.characters);
        setWarnings(result.data.warnings);
      } else {
        setError(result.error);
      }
    });
  };

  useEffect(reload, [projectDir]);

  const handleDelete = async () => {
    if (!projectDir || !pendingDeleteId) return;
    const result = await commands.deleteCharacter(projectDir, pendingDeleteId);
    setPendingDeleteId(null);
    if (result.status === "ok") {
      reload();
    } else {
      setError(result.error);
    }
  };

  const openCharacter = (character: Character) => {
    setCurrentCharacter(character);
    onNavigate("character-detail");
  };

  const pendingCharacter = characters.find((c) => c.id === pendingDeleteId);

  return (
    <SeriesAppShell activeView="characters" onNavigate={onNavigate}>
      <VStack gap={6} width="100%">
        <HStack justify="between" align="center">
          <Heading level={2}>Karakterler</Heading>
          <Button
            label="Karakter Ekle"
            variant="primary"
            clickAction={() => onNavigate("add-character")}
          />
        </HStack>

        {error && <Banner status="error" title="Hata" description={error} />}
        {warnings.length > 0 && (
          <Banner
            status="warning"
            title="Bazı karakterler okunamadı"
            description={warnings.join("\n")}
          />
        )}

        {characters.length === 0 && <Text color="secondary">Henüz karakter eklenmedi.</Text>}

        <VStack gap={2}>
          {characters.map((character) => (
            <ClickableCard
              key={character.id}
              label={`${character.name} karakterini aç`}
              onClick={() => openCharacter(character)}
            >
              <HStack justify="between" align="center">
                <VStack gap={1}>
                  <Heading level={4}>{character.name}</Heading>
                  <Text color="secondary">{character.role}</Text>
                </VStack>
                <Button
                  label="Sil"
                  variant="destructive"
                  clickAction={() => setPendingDeleteId(character.id)}
                />
              </HStack>
            </ClickableCard>
          ))}
        </VStack>
      </VStack>

      <AlertDialog
        isOpen={pendingDeleteId !== null}
        onOpenChange={(isOpen) => !isOpen && setPendingDeleteId(null)}
        title="Karakteri sil"
        description={`"${pendingCharacter?.name ?? ""}" karakterini silmek istediğinizden emin misiniz? Bu işlem çöp kutusuna taşınarak geri alınabilir.`}
        actionLabel="Sil"
        onAction={handleDelete}
      />
    </SeriesAppShell>
  );
}

import { useEffect, useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Banner } from "@astryxdesign/core/Banner";
import { commands } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { findCharacterMentions, type CharacterMention } from "../lib/characterMentions";
import { SeriesAppShell } from "./SeriesAppShell";
import type { ViewProps } from "../state/navigation";

// Edit form (mirrors AddCharacterView's fields — attributes still has no
// editor, so they're carried through unchanged from the loaded character
// rather than exposed here) plus the "@Karakter" mention system's first
// cross-reference view: every chapter that mentions this character, found
// by scanning listBooks/listChapters client-side (see characterMentions.ts
// for why no backend command was needed for this).
export function CharacterDetailView({ onNavigate }: ViewProps) {
  const projectDir = useSeriesStore((state) => state.projectDir);
  const currentCharacter = useSeriesStore((state) => state.currentCharacter);
  const setCurrentChapter = useSeriesStore((state) => state.setCurrentChapter);
  const [name, setName] = useState(currentCharacter?.name ?? "");
  const [role, setRole] = useState(currentCharacter?.role ?? "");
  const [bio, setBio] = useState(currentCharacter?.bio ?? "");
  const [error, setError] = useState("");
  const [mentions, setMentions] = useState<CharacterMention[]>([]);

  useEffect(() => {
    if (!projectDir || !currentCharacter) return;
    findCharacterMentions(projectDir, currentCharacter.id).then(setMentions);
  }, [projectDir, currentCharacter]);

  if (!currentCharacter) {
    return (
      <SeriesAppShell activeView="character-detail" onNavigate={onNavigate}>
        <Text color="secondary">Bir karakter seçilmedi.</Text>
      </SeriesAppShell>
    );
  }

  const handleSave = async () => {
    if (!projectDir) return;
    setError("");
    const result = await commands.updateCharacter({
      projectDir,
      characterId: currentCharacter.id,
      name,
      role,
      bio,
      attributes: currentCharacter.attributes,
    });
    if (result.status === "ok") {
      onNavigate("characters");
    } else {
      setError(result.error);
    }
  };

  const openChapter = (mention: CharacterMention) => {
    setCurrentChapter(mention.chapter);
    onNavigate("chapter-editor");
  };

  return (
    <SeriesAppShell activeView="character-detail" onNavigate={onNavigate}>
      <VStack gap={6} width="100%" maxWidth="clamp(320px, 85%, 560px)">
        <Heading level={2}>{currentCharacter.name}</Heading>
        <Card padding={6}>
          <VStack gap={4}>
            <TextInput label="İsim" value={name} onChange={setName} />
            <TextInput label="Rol" value={role} onChange={setRole} />
            <TextArea label="Biyografi" value={bio} onChange={setBio} isOptional rows={4} />
            <HStack gap={2}>
              <Button
                label="Kaydet"
                variant="primary"
                clickAction={handleSave}
                isDisabled={!name || !role}
              />
              <Button
                label="Vazgeç"
                variant="secondary"
                clickAction={() => onNavigate("characters")}
              />
            </HStack>
          </VStack>
        </Card>
        {error && <Banner status="error" title="Hata" description={error} />}

        <VStack gap={3}>
          <Heading level={4}>Nerede Geçiyor</Heading>
          {mentions.length === 0 && (
            <Text color="secondary">Bu karakter henüz hiçbir bölümde geçmiyor.</Text>
          )}
          <VStack gap={2}>
            {mentions.map((mention) => (
              <ClickableCard
                key={mention.chapter.chapterPath}
                label={`${mention.chapter.chapter.title} bölümünü aç`}
                onClick={() => openChapter(mention)}
              >
                <VStack gap={1}>
                  <Heading level={5}>{mention.chapter.chapter.title}</Heading>
                  <Text color="secondary">{mention.bookTitle}</Text>
                </VStack>
              </ClickableCard>
            ))}
          </VStack>
        </VStack>
      </VStack>
    </SeriesAppShell>
  );
}

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

// No attribute (key/value) editor in this pass — a proper one is a small
// project of its own; create_character still accepts attributes, this form
// just always sends an empty map.
export function AddCharacterView({ onNavigate }: ViewProps) {
  const projectDir = useSeriesStore((state) => state.projectDir);
  const series = useSeriesStore((state) => state.series);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!projectDir || !series) return;
    setError("");
    const result = await commands.createCharacter({
      projectDir,
      seriesId: series.id,
      name,
      role,
      bio,
      attributes: {},
    });
    if (result.status === "ok") {
      onNavigate("characters");
    } else {
      setError(result.error);
    }
  };

  return (
    <SeriesAppShell activeView="add-character" onNavigate={onNavigate}>
      <VStack gap={6} width="100%" maxWidth="clamp(320px, 85%, 560px)">
        <Heading level={2}>Karakter Ekle</Heading>
        <Card padding={6}>
          <VStack gap={4}>
            <TextInput label="İsim" value={name} onChange={setName} />
            <TextInput label="Rol" value={role} onChange={setRole} />
            <TextArea label="Biyografi" value={bio} onChange={setBio} isOptional rows={4} />
            <HStack gap={2}>
              <Button
                label="Karakter Oluştur"
                variant="primary"
                clickAction={handleCreate}
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
      </VStack>
    </SeriesAppShell>
  );
}

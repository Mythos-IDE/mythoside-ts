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

export function AddLocationView({ onNavigate }: ViewProps) {
  const projectDir = useSeriesStore((state) => state.projectDir);
  const series = useSeriesStore((state) => state.series);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!projectDir || !series) return;
    setError("");
    const result = await commands.createLocation({
      projectDir,
      seriesId: series.id,
      name,
      description,
    });
    if (result.status === "ok") {
      onNavigate("locations");
    } else {
      setError(result.error);
    }
  };

  return (
    <SeriesAppShell activeView="add-location" onNavigate={onNavigate}>
      <VStack gap={6} maxWidth={480}>
        <Heading level={2}>Lokasyon Ekle</Heading>
        <Card padding={6}>
          <VStack gap={4}>
            <TextInput label="İsim" value={name} onChange={setName} />
            <TextArea
              label="Açıklama"
              value={description}
              onChange={setDescription}
              isOptional
              rows={4}
            />
            <HStack gap={2}>
              <Button
                label="Lokasyon Oluştur"
                variant="primary"
                clickAction={handleCreate}
                isDisabled={!name}
              />
              <Button
                label="Vazgeç"
                variant="secondary"
                clickAction={() => onNavigate("locations")}
              />
            </HStack>
          </VStack>
        </Card>
        {error && <Banner status="error" title="Hata" description={error} />}
      </VStack>
    </SeriesAppShell>
  );
}

import { useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Banner } from "@astryxdesign/core/Banner";
import { commands } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import type { ViewProps } from "../state/navigation";

// Edit form mirroring AddLocationView's fields.
export function LocationDetailView({ onNavigate }: ViewProps) {
  const projectDir = useSeriesStore((state) => state.projectDir);
  const currentLocation = useSeriesStore((state) => state.currentLocation);
  const [name, setName] = useState(currentLocation?.name ?? "");
  const [description, setDescription] = useState(currentLocation?.description ?? "");
  const [error, setError] = useState("");

  if (!currentLocation) {
    return (
      <SeriesAppShell activeView="location-detail" onNavigate={onNavigate}>
        <Text color="secondary">Bir lokasyon seçilmedi.</Text>
      </SeriesAppShell>
    );
  }

  const handleSave = async () => {
    if (!projectDir) return;
    setError("");
    const result = await commands.updateLocation({
      projectDir,
      locationId: currentLocation.id,
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
    <SeriesAppShell activeView="location-detail" onNavigate={onNavigate}>
      <VStack gap={6} width="100%" maxWidth="clamp(320px, 85%, 560px)">
        <Heading level={2}>{currentLocation.name}</Heading>
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
                label="Kaydet"
                variant="primary"
                clickAction={handleSave}
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

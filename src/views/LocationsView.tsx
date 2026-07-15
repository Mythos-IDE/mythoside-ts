import { useEffect, useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { commands, type Location } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import type { ViewProps } from "../state/navigation";

// Series-level, not book-level — a location can recur across multiple
// books in the series, same reasoning as CharactersView.
export function LocationsView({ onNavigate }: ViewProps) {
  const projectDir = useSeriesStore((state) => state.projectDir);
  const setCurrentLocation = useSeriesStore((state) => state.setCurrentLocation);
  const [locations, setLocations] = useState<Location[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const reload = () => {
    if (!projectDir) return;
    commands.listLocations(projectDir).then((result) => {
      if (result.status === "ok") {
        setLocations(result.data.locations);
        setWarnings(result.data.warnings);
      } else {
        setError(result.error);
      }
    });
  };

  useEffect(reload, [projectDir]);

  const handleDelete = async () => {
    if (!projectDir || !pendingDeleteId) return;
    const result = await commands.deleteLocation(projectDir, pendingDeleteId);
    setPendingDeleteId(null);
    if (result.status === "ok") {
      reload();
    } else {
      setError(result.error);
    }
  };

  const openLocation = (location: Location) => {
    setCurrentLocation(location);
    onNavigate("location-detail");
  };

  const pendingLocation = locations.find((l) => l.id === pendingDeleteId);

  return (
    <SeriesAppShell activeView="locations" onNavigate={onNavigate}>
      <VStack gap={6} width="100%">
        <HStack justify="between" align="center">
          <Heading level={2}>Lokasyonlar</Heading>
          <Button
            label="Lokasyon Ekle"
            variant="primary"
            clickAction={() => onNavigate("add-location")}
          />
        </HStack>

        {error && <Banner status="error" title="Hata" description={error} />}
        {warnings.length > 0 && (
          <Banner
            status="warning"
            title="Bazı lokasyonlar okunamadı"
            description={warnings.join("\n")}
          />
        )}

        {locations.length === 0 && <Text color="secondary">Henüz lokasyon eklenmedi.</Text>}

        <VStack gap={2}>
          {locations.map((location) => (
            <ClickableCard
              key={location.id}
              label={`${location.name} lokasyonunu aç`}
              onClick={() => openLocation(location)}
            >
              <HStack justify="between" align="center">
                <VStack gap={1}>
                  <Heading level={4}>{location.name}</Heading>
                  <Text color="secondary">{location.description || "Açıklama yok."}</Text>
                </VStack>
                <Button
                  label="Sil"
                  variant="destructive"
                  clickAction={() => setPendingDeleteId(location.id)}
                />
              </HStack>
            </ClickableCard>
          ))}
        </VStack>
      </VStack>

      <AlertDialog
        isOpen={pendingDeleteId !== null}
        onOpenChange={(isOpen) => !isOpen && setPendingDeleteId(null)}
        title="Lokasyonu sil"
        description={`"${pendingLocation?.name ?? ""}" lokasyonunu silmek istediğinizden emin misiniz? Bu işlem çöp kutusuna taşınarak geri alınabilir.`}
        actionLabel="Sil"
        onAction={handleDelete}
      />
    </SeriesAppShell>
  );
}

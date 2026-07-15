import { useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Banner } from "@astryxdesign/core/Banner";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { commands } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import type { ViewProps } from "../state/navigation";

export function SeriesInfoView({ onNavigate }: ViewProps) {
  const series = useSeriesStore((state) => state.series);
  const projectDir = useSeriesStore((state) => state.projectDir);
  const setSeries = useSeriesStore((state) => state.setSeries);
  const reset = useSeriesStore((state) => state.reset);
  const [title, setTitle] = useState(series?.title ?? "");
  const [description, setDescription] = useState(series?.description ?? "");
  const [error, setError] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleSave = async () => {
    if (!projectDir) return;
    setError("");
    const result = await commands.updateSeries({ projectDir, title, description });
    if (result.status === "ok") {
      setSeries(result.data, projectDir);
      onNavigate("series-dashboard");
    } else {
      setError(result.error);
    }
  };

  const handleDelete = async () => {
    if (!projectDir) return;
    const result = await commands.deleteSeries(projectDir);
    setIsConfirmingDelete(false);
    if (result.status === "ok") {
      reset();
      onNavigate("landing");
    } else {
      setError(result.error);
    }
  };

  return (
    <SeriesAppShell activeView="series-info" onNavigate={onNavigate}>
      <VStack gap={6} width="100%" maxWidth="clamp(320px, 85%, 560px)">
        <Heading level={2}>Seri Bilgileri</Heading>
        <Card padding={6}>
          <VStack gap={4}>
            <TextInput label="Başlık" value={title} onChange={setTitle} />
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
                isDisabled={!title}
              />
              <Button
                label="Vazgeç"
                variant="secondary"
                clickAction={() => onNavigate("series-dashboard")}
              />
            </HStack>
          </VStack>
        </Card>

        <Card padding={6}>
          <VStack gap={3}>
            <Heading level={3}>Tehlikeli Bölge</Heading>
            <Button
              label="Seriyi Sil"
              variant="destructive"
              clickAction={() => setIsConfirmingDelete(true)}
            />
          </VStack>
        </Card>

        {error && <Banner status="error" title="Hata" description={error} />}
      </VStack>

      <AlertDialog
        isOpen={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title="Seriyi sil"
        description={`"${series?.title ?? ""}" serisini ve içindeki tüm kitap/karakter/lokasyon/notları silmek istediğinizden emin misiniz? Bu işlem çöp kutusuna taşınarak geri alınabilir.`}
        actionLabel="Sil"
        onAction={handleDelete}
      />
    </SeriesAppShell>
  );
}

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
import type { ViewProps } from "../state/navigation";

// Deliberately no "project folder" field: create_series resolves its own
// location under the OS Documents directory (see mythoside-core's
// CreateSeriesOutput doc comment) precisely so nobody has to type or pick a
// filesystem path just to start a series.
export function CreateSeriesView({ onNavigate }: ViewProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const setSeries = useSeriesStore((state) => state.setSeries);

  const handleCreate = async () => {
    setError("");
    const result = await commands.createSeries({ title, description });
    if (result.status === "ok") {
      setSeries(result.data.series, result.data.projectDir);
      onNavigate("series-dashboard");
    } else {
      setError(result.error);
    }
  };

  return (
    <VStack gap={6} padding={8} style={{ maxWidth: 480, margin: "0 auto" }}>
      <Heading level={1}>Yeni Seri</Heading>
      <Card padding={6}>
        <VStack gap={4}>
          <TextInput label="Başlık" value={title} onChange={setTitle} />
          <TextArea
            label="Açıklama"
            value={description}
            onChange={setDescription}
            isOptional
            rows={3}
          />
          <HStack gap={2}>
            <Button
              label="Seri Oluştur"
              variant="primary"
              clickAction={handleCreate}
              isDisabled={!title}
            />
          </HStack>
        </VStack>
      </Card>
      {error && <Banner status="error" title="Hata" description={error} />}
    </VStack>
  );
}

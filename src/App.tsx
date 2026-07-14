import { useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Banner } from "@astryxdesign/core/Banner";
import { commands, type Series } from "./bindings";

// Test harness for the create_series/get_series backend commands — not the
// app's real UI (no visual identity is decided yet, see CLAUDE.md). Just
// enough to prove the Tauri -> mythoside-core round trip works end to end.
function App() {
  const [projectDir, setProjectDir] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [series, setSeries] = useState<Series | null>(null);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setError("");
    const result = await commands.createSeries({ projectDir, title, description });
    if (result.status === "ok") {
      setSeries(result.data);
    } else {
      setError(result.error);
    }
  };

  const handleLoad = async () => {
    setError("");
    const result = await commands.getSeries(projectDir);
    if (result.status === "ok") {
      setSeries(result.data);
    } else {
      setError(result.error);
    }
  };

  return (
    <VStack gap={6} padding={8} style={{ maxWidth: 480, margin: "0 auto" }}>
      <Heading level={1}>Seri Test Arayüzü</Heading>

      <Card padding={6}>
        <VStack gap={4}>
          <TextInput
            label="Proje Klasörü"
            value={projectDir}
            onChange={setProjectDir}
            placeholder="/Users/.../my-series"
          />
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
              isDisabled={!projectDir || !title}
            />
            <Button
              label="Seriyi Yükle"
              variant="secondary"
              clickAction={handleLoad}
              isDisabled={!projectDir}
            />
          </HStack>
        </VStack>
      </Card>

      {error && <Banner status="error" title="Hata" description={error} />}

      {series && (
        <Card padding={6}>
          <VStack gap={2}>
            <Heading level={3}>{series.title}</Heading>
            <Text color="secondary">{series.description || "Açıklama yok."}</Text>
            <Text type="supporting" color="secondary">
              ID: {series.id}
            </Text>
            <Text type="supporting" color="secondary">
              Oluşturulma: {series.createdAt}
            </Text>
          </VStack>
        </Card>
      )}
    </VStack>
  );
}

export default App;

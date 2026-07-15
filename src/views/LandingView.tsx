import { useEffect, useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Card } from "@astryxdesign/core/Card";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Banner } from "@astryxdesign/core/Banner";
import { commands, type CreateSeriesOutput } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { formatCreatedAt } from "../lib/formatDate";
import type { ViewProps } from "../state/navigation";

// First screen: pick an existing series to reopen, or start a new one.
// Deliberately no "project folder" field anywhere here — create_series
// resolves its own location under the OS Documents directory, and
// list_series re-scans that same location, so nobody ever types or picks a
// filesystem path just to start or continue writing.
export function LandingView({ onNavigate }: ViewProps) {
  const setSeries = useSeriesStore((state) => state.setSeries);

  const [existing, setExisting] = useState<CreateSeriesOutput[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [listError, setListError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    commands.listSeries().then((result) => {
      if (result.status === "ok") {
        setExisting(result.data.series);
        setWarnings(result.data.warnings);
      } else {
        setListError(result.error);
      }
    });
  }, []);

  const openSeries = (handle: CreateSeriesOutput) => {
    setSeries(handle.series, handle.projectDir);
    onNavigate("series-dashboard");
  };

  const handleCreate = async () => {
    setCreateError("");
    const result = await commands.createSeries({ title, description });
    if (result.status === "ok") {
      setSeries(result.data.series, result.data.projectDir);
      onNavigate("series-dashboard");
    } else {
      setCreateError(result.error);
    }
  };

  return (
    <VStack
      gap={6}
      padding={8}
      width="100%"
      maxWidth="clamp(320px, 85%, 560px)"
      style={{ margin: "0 auto" }}
    >
      <Heading level={1}>MythosIDE</Heading>

      {listError && <Banner status="error" title="Hata" description={listError} />}
      {warnings.length > 0 && (
        <Banner status="warning" title="Bazı seriler okunamadı" description={warnings.join("\n")} />
      )}

      {existing.length > 0 && (
        <VStack gap={3}>
          <Heading level={3}>Serileriniz</Heading>
          <VStack gap={2}>
            {existing.map((handle) => (
              <ClickableCard
                key={handle.series.id}
                label={`${handle.series.title} serisini aç`}
                onClick={() => openSeries(handle)}
              >
                <VStack gap={1}>
                  <Heading level={4}>{handle.series.title}</Heading>
                  <Text type="supporting" color="secondary">
                    Oluşturulma: {formatCreatedAt(handle.series.createdAt)}
                  </Text>
                </VStack>
              </ClickableCard>
            ))}
          </VStack>
        </VStack>
      )}

      <Card padding={6}>
        <VStack gap={4}>
          <Heading level={3}>Yeni Seri</Heading>
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
      {createError && <Banner status="error" title="Hata" description={createError} />}
    </VStack>
  );
}

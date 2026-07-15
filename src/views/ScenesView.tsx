import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, Pencil } from "lucide-react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Banner } from "@astryxdesign/core/Banner";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { commands, type SceneHandle } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import { RenameDialog } from "./RenameDialog";
import type { ViewProps } from "../state/navigation";

export function ScenesView({ onNavigate }: ViewProps) {
  const currentChapter = useSeriesStore((state) => state.currentChapter);
  const setCurrentScene = useSeriesStore((state) => state.setCurrentScene);
  const [scenes, setScenes] = useState<SceneHandle[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const chapterDir = currentChapter?.chapterDir ?? null;

  const reload = () => {
    if (!chapterDir) return;
    commands.listScenes(chapterDir).then((result) => {
      if (result.status === "ok") {
        setScenes(result.data.scenes);
        setWarnings(result.data.warnings);
      } else {
        setError(result.error);
      }
    });
  };

  useEffect(reload, [chapterDir]);

  const openScene = (handle: SceneHandle) => {
    setCurrentScene(handle);
    onNavigate("scene-editor");
  };

  const pendingScene = scenes.find((s) => s.scene.id === pendingDeleteId);
  const renamingScene = scenes.find((s) => s.scene.id === renamingId);

  const handleDelete = async () => {
    if (!pendingScene) return;
    const result = await commands.deleteScene(pendingScene.scenePath);
    setPendingDeleteId(null);
    if (result.status === "ok") {
      reload();
    } else {
      setError(result.error);
    }
  };

  const handleRename = async (title: string) => {
    if (!renamingScene) return;
    const result = await commands.renameScene({ scenePath: renamingScene.scenePath, title });
    if (result.status === "ok") {
      reload();
    } else {
      setError(result.error);
    }
  };

  const handleMove = async (sceneId: string, direction: "up" | "down") => {
    if (!chapterDir) return;
    const result = await commands.moveScene(chapterDir, sceneId, direction);
    if (result.status === "ok") {
      reload();
    } else {
      setError(result.error);
    }
  };

  return (
    <SeriesAppShell activeView="scenes" onNavigate={onNavigate}>
      <VStack gap={6} maxWidth={720}>
        <HStack justify="between" align="center">
          <Heading level={2}>Sahneler</Heading>
          <Button
            label="Yeni Sahne"
            variant="primary"
            clickAction={() => onNavigate("add-scene")}
          />
        </HStack>

        {error && <Banner status="error" title="Hata" description={error} />}
        {warnings.length > 0 && (
          <Banner
            status="warning"
            title="Bazı sahneler okunamadı"
            description={warnings.join("\n")}
          />
        )}

        {scenes.length === 0 && <Text color="secondary">Henüz sahne eklenmedi.</Text>}

        <VStack gap={3}>
          {scenes.map((handle, index) => (
            <ClickableCard
              key={handle.scene.id}
              label={`${handle.scene.title} sahnesini aç`}
              onClick={() => openScene(handle)}
            >
              <HStack justify="between" align="center">
                <Heading level={4}>
                  {handle.scene.order}. {handle.scene.title}
                </Heading>
                <HStack gap={1}>
                  <IconButton
                    label="Yukarı taşı"
                    tooltip="Yukarı taşı"
                    icon={<ChevronUp size={16} />}
                    variant="ghost"
                    isDisabled={index === 0}
                    onClick={() => handleMove(handle.scene.id, "up")}
                  />
                  <IconButton
                    label="Aşağı taşı"
                    tooltip="Aşağı taşı"
                    icon={<ChevronDown size={16} />}
                    variant="ghost"
                    isDisabled={index === scenes.length - 1}
                    onClick={() => handleMove(handle.scene.id, "down")}
                  />
                  <IconButton
                    label="Yeniden adlandır"
                    tooltip="Yeniden adlandır"
                    icon={<Pencil size={16} />}
                    variant="ghost"
                    onClick={() => setRenamingId(handle.scene.id)}
                  />
                  <Button
                    label="Sil"
                    variant="destructive"
                    clickAction={() => setPendingDeleteId(handle.scene.id)}
                  />
                </HStack>
              </HStack>
            </ClickableCard>
          ))}
        </VStack>
      </VStack>

      <AlertDialog
        isOpen={pendingDeleteId !== null}
        onOpenChange={(isOpen) => !isOpen && setPendingDeleteId(null)}
        title="Sahneyi sil"
        description={`"${pendingScene?.scene.title ?? ""}" sahnesini silmek istediğinizden emin misiniz? Bu işlem çöp kutusuna taşınarak geri alınabilir.`}
        actionLabel="Sil"
        onAction={handleDelete}
      />

      <RenameDialog
        isOpen={renamingId !== null}
        onOpenChange={(isOpen) => !isOpen && setRenamingId(null)}
        dialogTitle="Sahneyi yeniden adlandır"
        initialValue={renamingScene?.scene.title ?? ""}
        onSave={handleRename}
      />
    </SeriesAppShell>
  );
}

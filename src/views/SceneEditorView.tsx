import { useEffect, useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Banner } from "@astryxdesign/core/Banner";
import { commands } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import type { ViewProps } from "../state/navigation";

const AUTOSAVE_DEBOUNCE_MS = 800;

// The actual writing surface: a block-based editor (BlockNote, built on
// ProseMirror — bold/italic via Ctrl/Cmd+B/I come from its default schema,
// no custom keymap needed here). The on-disk source of truth stays plain
// Markdown (scene.content) — this view converts Markdown -> blocks once on
// load and blocks -> Markdown on every autosave, so the block-editing
// experience never leaks into the file format itself.
export function SceneEditorView({ onNavigate }: ViewProps) {
  const currentScene = useSeriesStore((state) => state.currentScene);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSeededContent = useRef(false);

  const editor = useCreateBlockNote({}, [currentScene?.scenePath]);

  // Seeds the editor's initial content from the scene's Markdown exactly
  // once per mount — tryParseMarkdownToBlocks needs a live editor instance
  // to call it on, so this can't happen before useCreateBlockNote runs.
  useEffect(() => {
    if (!currentScene || hasSeededContent.current) return;
    hasSeededContent.current = true;
    const blocks = editor.tryParseMarkdownToBlocks(currentScene.scene.content);
    editor.replaceBlocks(editor.document, blocks);
  }, [currentScene, editor]);

  const save = async (scenePath: string) => {
    const content = editor.blocksToMarkdownLossy();
    const result = await commands.updateScene({ scenePath, content });
    if (result.status === "ok") {
      setSaveState("saved");
    } else {
      setError(result.error);
    }
  };

  useEffect(() => {
    // Flush a pending debounced save on unmount so a few keystrokes right
    // before navigating away aren't silently lost.
    return () => {
      if (saveTimeoutRef.current && currentScene) {
        clearTimeout(saveTimeoutRef.current);
        save(currentScene.scenePath);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene]);

  const handleChange = () => {
    if (!currentScene) return;
    setSaveState("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => save(currentScene.scenePath), AUTOSAVE_DEBOUNCE_MS);
  };

  if (!currentScene) {
    return (
      <SeriesAppShell activeView="scene-editor" onNavigate={onNavigate}>
        <Text color="secondary">Bir sahne seçilmedi.</Text>
      </SeriesAppShell>
    );
  }

  return (
    <SeriesAppShell activeView="scene-editor" onNavigate={onNavigate}>
      <VStack gap={4} maxWidth={720}>
        <HStack justify="between" align="center">
          <Heading level={2}>{currentScene.scene.title}</Heading>
          <Text type="supporting" color="secondary">
            {saveState === "saving" && "Kaydediliyor…"}
            {saveState === "saved" && "Kaydedildi"}
          </Text>
        </HStack>

        {error && <Banner status="error" title="Hata" description={error} />}

        <BlockNoteView editor={editor} onChange={handleChange} />
      </VStack>
    </SeriesAppShell>
  );
}

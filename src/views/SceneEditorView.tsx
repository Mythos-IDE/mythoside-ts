import { useEffect, useRef, useState } from "react";
import { useCreateBlockNote, SuggestionMenuController } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Banner } from "@astryxdesign/core/Banner";
import { commands, type Character } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";
import { SeriesAppShell } from "./SeriesAppShell";
import { schema } from "../lib/blockNoteSchema";
import type { ViewProps } from "../state/navigation";

const AUTOSAVE_DEBOUNCE_MS = 800;

// The actual writing surface: a block-based editor (BlockNote, built on
// ProseMirror — bold/italic via Ctrl/Cmd+B/I come from its default schema,
// no custom keymap needed here). The on-disk source of truth stays plain
// Markdown (scene.content) — this view converts Markdown -> blocks once on
// load and blocks -> Markdown on every autosave, so the block-editing
// experience never leaks into the file format itself. The custom `schema`
// (see lib/blockNoteSchema.tsx) adds the `@Karakter` mention inline
// content type on top of BlockNote's defaults.
export function SceneEditorView({ onNavigate }: ViewProps) {
  const currentScene = useSeriesStore((state) => state.currentScene);
  const projectDir = useSeriesStore((state) => state.projectDir);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [characters, setCharacters] = useState<Character[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSeededContent = useRef(false);
  const isSeedingRef = useRef(false);
  const latestMarkdownRef = useRef<string | null>(null);

  const editor = useCreateBlockNote({ schema }, [currentScene?.scenePath]);

  // Loaded once per mount for the "@" suggestion menu to filter client-side
  // — a series' character list is small, no need for a backend search
  // command or debouncing (this never touches the filesystem again after
  // the initial fetch).
  useEffect(() => {
    if (!projectDir) return;
    commands.listCharacters(projectDir).then((result) => {
      if (result.status === "ok") setCharacters(result.data.characters);
    });
  }, [projectDir]);

  // Seeds the editor's initial content from the scene's Markdown exactly
  // once per mount — tryParseMarkdownToBlocks needs a live editor instance
  // to call it on, so this can't happen before useCreateBlockNote runs.
  // BlockNote's onChange fires synchronously on ANY local transaction,
  // including this programmatic replaceBlocks call (confirmed by reading
  // @blocknote/core's EventManager source: it only filters remote/Yjs
  // transactions) — without the isSeedingRef guard, this seed would arm an
  // autosave that re-persists the just-loaded (pre-edit) content, racing
  // against and sometimes overwriting a real edit's save.
  useEffect(() => {
    if (!currentScene || hasSeededContent.current) return;
    hasSeededContent.current = true;
    const blocks = editor.tryParseMarkdownToBlocks(currentScene.scene.content);
    isSeedingRef.current = true;
    editor.replaceBlocks(editor.document, blocks);
    isSeedingRef.current = false;
  }, [currentScene, editor]);

  // Writes an already-exported Markdown string to disk — a plain async IPC
  // call, no editor/React rendering involved, so it's always safe to call
  // from anywhere (including an unmount cleanup).
  const persist = async (scenePath: string, content: string) => {
    const result = await commands.updateScene({ scenePath, content });
    if (result.status === "ok") {
      setSaveState("saved");
    } else {
      setError(result.error);
    }
  };

  useEffect(() => {
    // Flush a pending debounced save on unmount so a few keystrokes right
    // before navigating away aren't silently lost. This only reads the
    // already-computed latestMarkdownRef — it must NOT call
    // blocksToMarkdownLossy() here. That export renders each mention's
    // toExternalHTML through BlockNote's elementRenderer, a React flushSync
    // call under the hood, and flushSync cannot run while React is still
    // committing this very unmount (it warns "flushSync was called from
    // inside a lifecycle method" and silently skips the render — dropping
    // mentions from the output) — and by the time a deferred retry could
    // run, the child BlockNoteView has already torn down elementRenderer.
    return () => {
      if (saveTimeoutRef.current && currentScene && latestMarkdownRef.current !== null) {
        clearTimeout(saveTimeoutRef.current);
        persist(currentScene.scenePath, latestMarkdownRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene]);

  const handleChange = () => {
    if (!currentScene || isSeedingRef.current) return;
    setSaveState("saving");
    // Exported synchronously, in the same call stack as the live edit (a
    // DOM event, not a React commit/lifecycle phase) — the only context
    // proven safe for blocksToMarkdownLossy()'s flushSync-based rendering.
    // Cached so the debounced save below, and the unmount-flush above,
    // never need to re-export from a potentially unsafe context.
    latestMarkdownRef.current = editor.blocksToMarkdownLossy();
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (latestMarkdownRef.current !== null) {
        persist(currentScene.scenePath, latestMarkdownRef.current);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
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

        <BlockNoteView editor={editor} onChange={handleChange}>
          <SuggestionMenuController
            triggerCharacter="@"
            getItems={async (query) => {
              const lowerQuery = query.toLowerCase();
              return characters
                .filter((character) => character.name.toLowerCase().includes(lowerQuery))
                .map((character) => ({
                  title: character.name,
                  subtext: character.role,
                  onItemClick: () => {
                    editor.insertInlineContent([
                      {
                        type: "mention",
                        props: { characterId: character.id, name: character.name },
                      },
                      " ",
                    ]);
                  },
                }));
            }}
          />
        </BlockNoteView>
      </VStack>
    </SeriesAppShell>
  );
}

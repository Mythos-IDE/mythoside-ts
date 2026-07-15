import { commands, type ChapterHandle } from "../bindings";
import { useSeriesStore } from "../state/seriesStore";

// Shared by ChaptersView (clicking a chapter card) and SeriesAppShell
// (clicking the chapter breadcrumb) — both mean "enter this chapter", which
// jumps straight to its first scene by order, auto-creating one (titled
// after the chapter) if it has none yet, mirroring AddChapterView's own
// "create chapter -> straight to editor" pattern.
export async function openChapterInEditor(
  handle: ChapterHandle,
): Promise<{ status: "ok" } | { status: "error"; error: string }> {
  const { setCurrentChapter, setCurrentScene } = useSeriesStore.getState();
  setCurrentChapter(handle);

  const scenesResult = await commands.listScenes(handle.chapterDir);
  if (scenesResult.status !== "ok") {
    return { status: "error", error: scenesResult.error };
  }

  const [firstScene] = scenesResult.data.scenes;
  if (firstScene) {
    setCurrentScene(firstScene);
    return { status: "ok" };
  }

  const sceneResult = await commands.createScene({
    chapterDir: handle.chapterDir,
    chapterId: handle.chapter.id,
    title: handle.chapter.title,
    tags: [],
    characters: [],
    content: "",
  });
  if (sceneResult.status !== "ok") {
    return { status: "error", error: sceneResult.error };
  }
  setCurrentScene(sceneResult.data);
  return { status: "ok" };
}

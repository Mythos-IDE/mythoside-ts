import { useState } from "react";
import type { View } from "./state/navigation";
import { LandingView } from "./views/LandingView";
import { SeriesDashboardView } from "./views/SeriesDashboardView";
import { SeriesInfoView } from "./views/SeriesInfoView";
import { AddBookView } from "./views/AddBookView";
import { BookDetailView } from "./views/BookDetailView";
import { CharactersView } from "./views/CharactersView";
import { LocationsView } from "./views/LocationsView";
import { TimelineView } from "./views/TimelineView";
import { AddCharacterView } from "./views/AddCharacterView";
import { AddLocationView } from "./views/AddLocationView";
import { AddTimelineNoteView } from "./views/AddTimelineNoteView";
import { ChaptersView } from "./views/ChaptersView";
import { AddChapterView } from "./views/AddChapterView";
import { ScenesView } from "./views/ScenesView";
import { SceneEditorView } from "./views/SceneEditorView";

// No router library: a single-window desktop app with a handful of screens
// has no URL-addressable content to justify one (see state/navigation.ts).
// This is the single point in the tree that reads `view` and renders the
// matching screen; every screen gets series/book context from seriesStore,
// not through props threaded down from here.
function App() {
  const [view, setView] = useState<View>("landing");

  switch (view) {
    case "landing":
      return <LandingView onNavigate={setView} />;
    case "series-dashboard":
      return <SeriesDashboardView onNavigate={setView} />;
    case "series-info":
      return <SeriesInfoView onNavigate={setView} />;
    case "add-book":
      return <AddBookView onNavigate={setView} />;
    case "book-detail":
      return <BookDetailView onNavigate={setView} />;
    case "characters":
      return <CharactersView onNavigate={setView} />;
    case "locations":
      return <LocationsView onNavigate={setView} />;
    case "timeline":
      return <TimelineView onNavigate={setView} />;
    case "add-character":
      return <AddCharacterView onNavigate={setView} />;
    case "add-location":
      return <AddLocationView onNavigate={setView} />;
    case "add-timeline-note":
      return <AddTimelineNoteView onNavigate={setView} />;
    case "chapters":
      return <ChaptersView onNavigate={setView} />;
    case "add-chapter":
      return <AddChapterView onNavigate={setView} />;
    case "scenes":
      return <ScenesView onNavigate={setView} />;
    case "scene-editor":
      return <SceneEditorView onNavigate={setView} />;
  }
}

export default App;

// No router library: a single-window desktop app with a handful of screens
// has no URL-addressable content to justify one. App.tsx owns this as plain
// useState and renders whichever view matches; cross-cutting data (the
// loaded series/book) lives in seriesStore instead, not here — see its
// comment for why the two are kept separate.
export type View =
  | "create-series"
  | "series-dashboard"
  | "series-info"
  | "add-book"
  | "book-detail"
  | "add-character"
  | "add-location"
  | "add-timeline-note";

export interface ViewProps {
  onNavigate: (view: View) => void;
}

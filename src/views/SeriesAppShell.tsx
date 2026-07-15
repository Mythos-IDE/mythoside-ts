import type { ReactNode } from "react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import { TopNav } from "@astryxdesign/core/TopNav";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { Heading } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/Layout";
import { useSeriesStore } from "../state/seriesStore";
import type { View, ViewProps } from "../state/navigation";

interface SeriesAppShellProps extends ViewProps {
  activeView: View;
  children: ReactNode;
}

// Book-detail and everything under Chapters shows a book breadcrumb —
// add-character/add-location/add-timeline-note are series-scoped forms (a
// character can recur across multiple books), not entered "from inside" a
// specific book, so they're deliberately excluded.
const BOOK_SCOPED_VIEWS: View[] = ["book-detail", "chapters", "add-chapter", "chapter-editor"];
const CHAPTER_SCOPED_VIEWS: View[] = ["chapter-editor"];

// Persistent chrome for every screen once a series is loaded — "Seri
// Bilgileri" lives here (not as a dashboard-only tile) so it stays reachable
// from three levels deep in a book's detail screen too. "Serilerim" is the
// only way back out to the series picker (LandingView) — without it there
// was no way to leave a series once inside one.
export function SeriesAppShell({ activeView, onNavigate, children }: SeriesAppShellProps) {
  const series = useSeriesStore((state) => state.series);
  const currentBook = useSeriesStore((state) => state.currentBook);
  const currentChapter = useSeriesStore((state) => state.currentChapter);
  const reset = useSeriesStore((state) => state.reset);
  const showBookCrumb = BOOK_SCOPED_VIEWS.includes(activeView) && currentBook;
  const showChapterCrumb = CHAPTER_SCOPED_VIEWS.includes(activeView) && currentChapter;

  const goHome = () => {
    reset();
    onNavigate("landing");
  };

  return (
    <AppShell
      contentPadding={4}
      topNav={
        <TopNav
          heading={<Heading level={4}>MythosIDE</Heading>}
          startContent={
            <Breadcrumbs>
              <BreadcrumbItem onClick={goHome}>Serilerim</BreadcrumbItem>
              <BreadcrumbItem
                onClick={() => onNavigate("series-dashboard")}
                isCurrent={activeView === "series-dashboard"}
              >
                {series?.title ?? "Seri"}
              </BreadcrumbItem>
              {showBookCrumb && (
                <BreadcrumbItem
                  onClick={() => onNavigate("book-detail")}
                  isCurrent={activeView === "book-detail"}
                >
                  {currentBook.book.title}
                </BreadcrumbItem>
              )}
              {showChapterCrumb && (
                <BreadcrumbItem
                  onClick={() => onNavigate("chapter-editor")}
                  isCurrent={activeView === "chapter-editor"}
                >
                  {currentChapter.chapter.title}
                </BreadcrumbItem>
              )}
            </Breadcrumbs>
          }
        />
      }
      sideNav={
        <SideNav>
          <SideNavSection title="Seri">
            <SideNavItem label="Serilerim" onClick={goHome} />
            <SideNavItem
              label="Kitaplar"
              isSelected={activeView === "series-dashboard"}
              onClick={() => onNavigate("series-dashboard")}
            />
            <SideNavItem
              label="Karakterler"
              isSelected={activeView === "characters"}
              onClick={() => onNavigate("characters")}
            />
            <SideNavItem
              label="Lokasyonlar"
              isSelected={activeView === "locations"}
              onClick={() => onNavigate("locations")}
            />
            <SideNavItem
              label="Zaman Çizgisi"
              isSelected={activeView === "timeline"}
              onClick={() => onNavigate("timeline")}
            />
            <SideNavItem
              label="Seri Bilgileri"
              isSelected={activeView === "series-info"}
              onClick={() => onNavigate("series-info")}
            />
          </SideNavSection>
        </SideNav>
      }
    >
      {/* Every screen's own content stack sets a maxWidth but not centering
          — without this wrapper, content sticks to the left edge on any
          window wider than that maxWidth instead of sitting in the middle
          of the available space. */}
      <VStack width="100%" align="center">
        {children}
      </VStack>
    </AppShell>
  );
}

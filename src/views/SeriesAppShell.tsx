import type { ReactNode } from "react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import { TopNav } from "@astryxdesign/core/TopNav";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { Heading } from "@astryxdesign/core/Text";
import { useSeriesStore } from "../state/seriesStore";
import type { View, ViewProps } from "../state/navigation";

interface SeriesAppShellProps extends ViewProps {
  activeView: View;
  children: ReactNode;
}

const BOOK_SCOPED_VIEWS: View[] = [
  "book-detail",
  "add-character",
  "add-location",
  "add-timeline-note",
];

// Persistent chrome for every screen once a series is loaded — "Seri
// Bilgileri" lives here (not as a dashboard-only tile) so it stays reachable
// from three levels deep in a book's detail screen too.
export function SeriesAppShell({ activeView, onNavigate, children }: SeriesAppShellProps) {
  const series = useSeriesStore((state) => state.series);
  const currentBook = useSeriesStore((state) => state.currentBook);
  const showBookCrumb = BOOK_SCOPED_VIEWS.includes(activeView) && currentBook;

  return (
    <AppShell
      contentPadding={4}
      topNav={
        <TopNav
          heading={<Heading level={4}>MythosIDE</Heading>}
          startContent={
            <Breadcrumbs>
              <BreadcrumbItem
                onClick={() => onNavigate("series-dashboard")}
                isCurrent={activeView === "series-dashboard"}
              >
                {series?.title ?? "Seri"}
              </BreadcrumbItem>
              {showBookCrumb && <BreadcrumbItem isCurrent>{currentBook.book.title}</BreadcrumbItem>}
            </Breadcrumbs>
          }
        />
      }
      sideNav={
        <SideNav>
          <SideNavSection title="Seri">
            <SideNavItem
              label="Kitaplar"
              isSelected={activeView === "series-dashboard"}
              onClick={() => onNavigate("series-dashboard")}
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
      {children}
    </AppShell>
  );
}

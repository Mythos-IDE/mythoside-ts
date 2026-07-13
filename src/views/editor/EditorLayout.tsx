import { useState } from "react";
import { Layout, LayoutPanel, LayoutContent } from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Stack, VStack } from "@astryxdesign/core/Layout";
import { Button } from "@astryxdesign/core/Button";
import { useWorkspaceStore } from "../../viewmodels/useWorkspaceStore";
import { useProjectStore } from "../../viewmodels/useProjectStore";

type ActiveTab = "chapters" | "characters" | "locations" | "timeline" | "lore";

export default function EditorLayout() {
  const sidebarExpanded = useWorkspaceStore((state) => state.sidebarExpanded);
  const toggleSidebar = useWorkspaceStore((state) => state.toggleSidebar);

  const [activeTab, setActiveTab] = useState<ActiveTab>("chapters");

  const {
    books,
    activeBookId,
    setActiveBook,
    chapters,
    activeChapterId,
    setActiveChapter,
    createChapter,
    updateChapterContent,
    characters,
    locations,
    notes,
    createCharacter,
    createLocation,
    createNote,
  } = useProjectStore();

  const activeBook = books.find((b) => b.id === activeBookId);
  const bookChapters = chapters
    .filter((c) => c.bookId === activeBookId)
    .sort((a, b) => a.order - b.order);
  const activeChapter = chapters.find((c) => c.id === activeChapterId);

  const bookCharacters = Array.isArray(characters)
    ? characters.filter((c) => c.bookId === activeBookId)
    : [];
  const bookLocations = Array.isArray(locations)
    ? locations.filter((l) => l.bookId === activeBookId)
    : [];
  const bookNotes = Array.isArray(notes) ? notes.filter((n) => n.bookId === activeBookId) : [];
  // Lore and Timeline share the same underlying Note model but must not share
  // the same list on screen — split by `type` so a "Timeline Event" never
  // shows up under "Lore & Notes" and vice versa.
  const timelineEvents = bookNotes.filter((n) => n.type === "timeline");
  const loreNotes = bookNotes.filter((n) => n.type === "lore");

  if (!activeBook) return null;

  const handleCreateChapter = () => {
    const title = prompt("Enter chapter title:");
    if (!title || !activeBookId) return;

    const chapterId = createChapter({ bookId: activeBookId, title });
    setActiveChapter(chapterId);
    setActiveTab("chapters");
  };

  const handleCreateCharacter = () => {
    const name = prompt("Enter character name:");
    if (!name || !activeBookId) return;
    const role =
      prompt("Enter character role (e.g. Protagonist, Antagonist, Mentor):") || "Supporting";
    const bio = prompt("Enter character short description:") || "";

    createCharacter({ bookId: activeBookId, name, role, bio });
  };

  const handleCreateLocation = () => {
    const name = prompt("Enter location name:");
    if (!name || !activeBookId) return;
    const description = prompt("Enter location description:") || "";

    createLocation({ bookId: activeBookId, name, description });
  };

  const handleCreateNote = (type: "lore" | "timeline") => {
    const title = prompt(type === "timeline" ? "Enter timeline event title:" : "Enter note title:");
    if (!title || !activeBookId) return;
    const content =
      prompt(
        type === "timeline" ? "Enter event date / timeline details:" : "Enter note details:",
      ) || "";

    createNote({ bookId: activeBookId, title, content, type });
  };

  const getTabStyle = (tab: ActiveTab) => ({
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "6px",
    backgroundColor: activeTab === tab ? "rgba(0,0,0,0.05)" : "transparent",
    color: activeTab === tab ? "var(--color-text-primary)" : "var(--color-text-secondary)",
    fontWeight: activeTab === tab ? 500 : 400,
    transition: "all 0.1s ease",
  });

  return (
    <Layout
      start={
        <LayoutPanel
          width={sidebarExpanded ? 280 : 0}
          style={{
            borderRight: "1px solid var(--color-border-subtle)",
            backgroundColor: "var(--color-background-surface)",
            overflow: "hidden",
            transition: "width 0.2s ease",
          }}
        >
          <Stack padding={4} gap={4}>
            <Heading level={4} style={{ fontFamily: "var(--font-family-ui)", fontWeight: 600 }}>
              {activeBook.title}
            </Heading>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text type="supporting" color="secondary" style={{ fontWeight: 500 }}>
                Manuscript
              </Text>
              <Button
                variant="ghost"
                label="+"
                onClick={handleCreateChapter}
                style={{ padding: "0 8px" }}
              />
            </div>

            <Stack gap={1}>
              {bookChapters.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => {
                    setActiveChapter(ch.id);
                    setActiveTab("chapters");
                  }}
                  style={{
                    cursor: "pointer",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    backgroundColor:
                      activeChapterId === ch.id && activeTab === "chapters"
                        ? "rgba(198, 123, 92, 0.12)"
                        : "transparent",
                    color:
                      activeChapterId === ch.id && activeTab === "chapters"
                        ? "var(--color-accent)"
                        : "var(--color-text-secondary)",
                    fontWeight: activeChapterId === ch.id && activeTab === "chapters" ? 500 : 400,
                  }}
                >
                  <Text type="body">{ch.title}</Text>
                </div>
              ))}
            </Stack>

            <div
              style={{
                height: "1px",
                backgroundColor: "var(--color-border-subtle)",
                margin: "1rem 0",
              }}
            />

            <Text
              type="supporting"
              color="secondary"
              style={{ fontWeight: 500, marginBottom: "0.2rem" }}
            >
              Worldbuilding
            </Text>

            <Stack gap={1}>
              <div style={getTabStyle("characters")} onClick={() => setActiveTab("characters")}>
                <Text type="body">Characters</Text>
              </div>
              <div style={getTabStyle("locations")} onClick={() => setActiveTab("locations")}>
                <Text type="body">Locations</Text>
              </div>
              <div style={getTabStyle("timeline")} onClick={() => setActiveTab("timeline")}>
                <Text type="body">Timeline</Text>
              </div>
              <div style={getTabStyle("lore")} onClick={() => setActiveTab("lore")}>
                <Text type="body">Lore & Notes</Text>
              </div>
            </Stack>
          </Stack>
        </LayoutPanel>
      }
      content={
        <LayoutContent
          style={{
            backgroundColor: "var(--color-background-body)",
            fontFamily: "var(--font-family-paper)",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            height: "100%",
            padding: 0,
          }}
        >
          {/* Top Navigation Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem 2rem",
              borderBottom: "1px solid var(--color-border-subtle)",
              backgroundColor: "var(--color-background-surface)",
              fontFamily: "var(--font-family-ui)",
              zIndex: 10,
              width: "100%",
            }}
          >
            <Button
              variant="secondary"
              onClick={toggleSidebar}
              label={sidebarExpanded ? "Hide Sidebar" : "Show Sidebar"}
            />
            <Button variant="secondary" onClick={() => setActiveBook(null)} label="Back to Books" />
          </div>

          {/* Content Area */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "3rem 2rem",
              overflowY: "auto",
              width: "100%",
            }}
          >
            {!activeChapter && activeTab === "chapters" ? (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "20vh",
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-family-ui)",
                }}
              >
                <Heading
                  level={3}
                  style={{ marginBottom: "1rem", color: "var(--color-text-primary)" }}
                >
                  No Chapter Selected
                </Heading>
                <Text type="body">
                  Select a chapter from the sidebar or create a new one to start writing.
                </Text>
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  maxWidth: "76ch",
                  backgroundColor: "#FFFFFF",
                  padding: "5rem 4rem",
                  boxShadow: "0 10px 40px rgba(42, 39, 36, 0.04)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  minHeight: "80vh",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {activeTab === "chapters" && activeChapter && (
                  <>
                    <Heading
                      level={1}
                      style={{
                        fontFamily: "var(--font-family-ui)",
                        marginBottom: "3rem",
                        color: "var(--color-text-primary)",
                        textAlign: "center",
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {activeChapter.title}
                    </Heading>

                    <textarea
                      value={activeChapter.content}
                      onChange={(e) => updateChapterContent(activeChapter.id, e.target.value)}
                      style={{
                        width: "100%",
                        flex: 1,
                        minHeight: "50vh",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        fontFamily: "var(--font-family-body)",
                        fontSize: "1.15rem",
                        lineHeight: "1.9",
                        color: "var(--color-text-primary)",
                        padding: 0,
                      }}
                      placeholder="Start writing..."
                    />
                  </>
                )}

                {activeTab === "characters" && (
                  <VStack gap={6} width="100%">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Heading
                        level={2}
                        style={{
                          color: "var(--color-text-primary)",
                          fontFamily: "var(--font-family-ui)",
                        }}
                      >
                        Characters
                      </Heading>
                      <Button
                        variant="primary"
                        label="+ Add Character"
                        onClick={handleCreateCharacter}
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1.5rem",
                        width: "100%",
                      }}
                    >
                      {bookCharacters.length === 0 ? (
                        <div
                          style={{
                            gridColumn: "span 2",
                            textAlign: "center",
                            padding: "3rem 0",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          <Text type="body">No characters created yet.</Text>
                        </div>
                      ) : (
                        bookCharacters.map((char) => (
                          <div
                            key={char.id}
                            style={{
                              padding: "1.5rem",
                              border: "1px solid var(--color-border)",
                              borderRadius: "8px",
                              backgroundColor: "var(--color-background-body)",
                            }}
                          >
                            <Text
                              type="supporting"
                              color="secondary"
                              style={{
                                textTransform: "uppercase",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                color: "var(--color-accent)",
                              }}
                            >
                              {char.role}
                            </Text>
                            <Heading
                              level={4}
                              style={{
                                margin: "0.5rem 0 0.2rem 0",
                                color: "var(--color-text-primary)",
                              }}
                            >
                              {char.name}
                            </Heading>
                            <Text type="body" color="secondary">
                              {char.bio || "No description provided."}
                            </Text>
                          </div>
                        ))
                      )}
                    </div>
                  </VStack>
                )}

                {activeTab === "locations" && (
                  <VStack gap={6} width="100%">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Heading
                        level={2}
                        style={{
                          color: "var(--color-text-primary)",
                          fontFamily: "var(--font-family-ui)",
                        }}
                      >
                        Locations
                      </Heading>
                      <Button
                        variant="primary"
                        label="+ Add Location"
                        onClick={handleCreateLocation}
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1.5rem",
                        width: "100%",
                      }}
                    >
                      {bookLocations.length === 0 ? (
                        <div
                          style={{
                            gridColumn: "span 2",
                            textAlign: "center",
                            padding: "3rem 0",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          <Text type="body">No locations created yet.</Text>
                        </div>
                      ) : (
                        bookLocations.map((loc) => (
                          <div
                            key={loc.id}
                            style={{
                              padding: "1.5rem",
                              border: "1px solid var(--color-border)",
                              borderRadius: "8px",
                              backgroundColor: "var(--color-background-body)",
                            }}
                          >
                            <Heading
                              level={4}
                              style={{ margin: "0 0 0.5rem 0", color: "var(--color-text-primary)" }}
                            >
                              {loc.name}
                            </Heading>
                            <Text type="body" color="secondary">
                              {loc.description || "No description provided."}
                            </Text>
                          </div>
                        ))
                      )}
                    </div>
                  </VStack>
                )}

                {activeTab === "timeline" && (
                  <VStack gap={6} width="100%">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Heading
                        level={2}
                        style={{
                          color: "var(--color-text-primary)",
                          fontFamily: "var(--font-family-ui)",
                        }}
                      >
                        Timeline
                      </Heading>
                      <Button
                        variant="primary"
                        label="+ Add Event"
                        onClick={() => handleCreateNote("timeline")}
                      />
                    </div>

                    <VStack gap={4} width="100%">
                      {timelineEvents.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "3rem 0",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          <Text type="body">No timeline events created yet.</Text>
                        </div>
                      ) : (
                        timelineEvents.map((note) => (
                          <div
                            key={note.id}
                            style={{
                              display: "flex",
                              gap: "1.5rem",
                              padding: "1rem 0",
                              borderBottom: "1px solid var(--color-border-subtle)",
                            }}
                          >
                            <div
                              style={{
                                minWidth: "120px",
                                color: "var(--color-accent)",
                                fontWeight: 600,
                                fontSize: "0.95rem",
                              }}
                            >
                              {note.content}
                            </div>
                            <div style={{ flex: 1 }}>
                              <Heading
                                level={4}
                                style={{ margin: 0, color: "var(--color-text-primary)" }}
                              >
                                {note.title}
                              </Heading>
                            </div>
                          </div>
                        ))
                      )}
                    </VStack>
                  </VStack>
                )}

                {activeTab === "lore" && (
                  <VStack gap={6} width="100%">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Heading
                        level={2}
                        style={{
                          color: "var(--color-text-primary)",
                          fontFamily: "var(--font-family-ui)",
                        }}
                      >
                        Lore & Notes
                      </Heading>
                      <Button
                        variant="primary"
                        label="+ Add Note"
                        onClick={() => handleCreateNote("lore")}
                      />
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1.5rem",
                        width: "100%",
                      }}
                    >
                      {loreNotes.length === 0 ? (
                        <div
                          style={{
                            gridColumn: "span 2",
                            textAlign: "center",
                            padding: "3rem 0",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          <Text type="body">No notes created yet.</Text>
                        </div>
                      ) : (
                        loreNotes.map((note) => (
                          <div
                            key={note.id}
                            style={{
                              padding: "1.5rem",
                              border: "1px solid var(--color-border)",
                              borderRadius: "8px",
                              backgroundColor: "var(--color-background-body)",
                            }}
                          >
                            <Heading
                              level={4}
                              style={{ margin: "0 0 0.5rem 0", color: "var(--color-text-primary)" }}
                            >
                              {note.title}
                            </Heading>
                            <Text type="body" color="secondary">
                              {note.content || "No content provided."}
                            </Text>
                          </div>
                        ))
                      )}
                    </div>
                  </VStack>
                )}
              </div>
            )}
          </div>
        </LayoutContent>
      }
      end={
        <LayoutPanel
          width={300}
          style={{
            borderLeft: "1px solid var(--color-border-subtle)",
            backgroundColor: "var(--color-background-surface)",
          }}
        >
          <Stack padding={4} gap={4}>
            <Heading level={4}>Inspector</Heading>
            <Text type="supporting" color="secondary">
              Select text to analyze pacing, character arcs, and repetitions.
            </Text>
          </Stack>
        </LayoutPanel>
      }
    />
  );
}

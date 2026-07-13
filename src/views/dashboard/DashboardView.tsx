import { useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Layout";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { useProjectStore } from "../../viewmodels/useProjectStore";
import { useAppStore } from "../../viewmodels/useAppStore";
import VaultBackdrop from "../../design-system/VaultBackdrop";
import OnboardingView from "../onboarding/OnboardingView";

export default function DashboardView() {
  const { series, books, activeSeriesId, setActiveSeries, setActiveBook, createBook } =
    useProjectStore();
  const logout = useAppStore((state) => state.logout);
  const localUser = useAppStore((state) => state.localUser);

  const [isCreatingSeries, setIsCreatingSeries] = useState(false);

  // If they click "Create New Series", we mount the onboarding flow.
  if (isCreatingSeries) {
    return <OnboardingView onComplete={() => setIsCreatingSeries(false)} />;
  }

  const activeSeries = series.find((s) => s.id === activeSeriesId);
  const seriesBooks = books.filter((b) => b.seriesId === activeSeriesId);

  const handleCreateBook = () => {
    const title = prompt("Enter book title:");
    if (!title || !activeSeriesId) return;

    createBook({ seriesId: activeSeriesId, title });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ----------------------------------------------------
  // VIEW: BOOKS (When a series is selected)
  // ----------------------------------------------------
  if (activeSeriesId && activeSeries) {
    return (
      <VaultBackdrop>
        <VStack
          gap={8}
          style={{
            width: "100%",
            maxWidth: 1000,
            margin: "0 auto",
            padding: "var(--spacing-12) var(--spacing-6)",
            position: "relative",
            zIndex: 10,
          }}
        >
          <HStack hAlign="between" vAlign="center">
            <VStack gap={1}>
              <Button
                variant="ghost"
                label="← Back to Series"
                onClick={() => setActiveSeries(null)}
                style={{ alignSelf: "flex-start", marginLeft: "-1rem" }}
              />
              <Heading
                level={1}
                style={{
                  fontFamily: "var(--font-family-ui)",
                  color: "var(--color-text-primary)",
                  letterSpacing: "-0.02em",
                  fontWeight: 700,
                }}
              >
                {activeSeries.title}
              </Heading>
              <Text type="body" color="secondary">
                Books in this series
              </Text>
            </VStack>
            <Button label="Lock Vault" variant="secondary" onClick={logout} />
          </HStack>

          <Grid columns={3} gap={6} width="100%">
            <Card
              padding={6}
              className="native-card"
              onClick={handleCreateBook}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "200px",
                cursor: "pointer",
              }}
            >
              <VStack gap={3} hAlign="center">
                <div
                  style={{
                    fontSize: "2.5rem",
                    color: "var(--color-text-secondary)",
                    fontWeight: 300,
                  }}
                >
                  +
                </div>
                <Text
                  type="body"
                  weight="medium"
                  style={{ fontFamily: "var(--font-family-ui)", fontSize: "1.1rem" }}
                >
                  Add New Book
                </Text>
              </VStack>
            </Card>

            {seriesBooks.map((book) => (
              <Card
                key={book.id}
                padding={6}
                className="native-card"
                onClick={() => setActiveBook(book.id)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "200px",
                  cursor: "pointer",
                }}
              >
                <VStack gap={2} style={{ flexGrow: 1 }}>
                  <Heading
                    level={3}
                    style={{
                      fontFamily: "var(--font-family-ui)",
                      letterSpacing: "-0.02em",
                      fontWeight: 600,
                    }}
                  >
                    {book.title}
                  </Heading>
                  <Text
                    type="supporting"
                    color="secondary"
                    style={{
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {book.synopsis || "No synopsis provided."}
                  </Text>
                </VStack>
                <Text
                  type="supporting"
                  color="secondary"
                  style={{ marginTop: "auto", paddingTop: "var(--spacing-4)" }}
                >
                  Created {formatDate(book.createdAt)}
                </Text>
              </Card>
            ))}
          </Grid>
        </VStack>
      </VaultBackdrop>
    );
  }

  // ----------------------------------------------------
  // VIEW: SERIES (Default Dashboard)
  // ----------------------------------------------------
  return (
    <VaultBackdrop>
      <VStack
        gap={8}
        style={{
          width: "100%",
          maxWidth: 1000,
          margin: "0 auto",
          padding: "var(--spacing-12) var(--spacing-6)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <HStack hAlign="between" vAlign="center">
          <VStack gap={1}>
            <Heading
              level={1}
              style={{
                fontFamily: "var(--font-family-ui)",
                color: "var(--color-text-primary)",
                letterSpacing: "-0.02em",
                fontWeight: 700,
              }}
            >
              Your Series
            </Heading>
            <Text type="body" color="secondary">
              Vault unlocked: {localUser?.email}
            </Text>
          </VStack>
          <Button label="Lock Vault" variant="secondary" onClick={logout} />
        </HStack>

        <Grid columns={3} gap={6} width="100%">
          <Card
            padding={6}
            className="native-card"
            onClick={() => setIsCreatingSeries(true)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "200px",
              cursor: "pointer",
            }}
          >
            <VStack gap={3} hAlign="center">
              <div
                style={{
                  fontSize: "2.5rem",
                  color: "var(--color-text-secondary)",
                  fontWeight: 300,
                }}
              >
                +
              </div>
              <Text
                type="body"
                weight="medium"
                style={{ fontFamily: "var(--font-family-ui)", fontSize: "1.1rem" }}
              >
                Create New Series
              </Text>
            </VStack>
          </Card>

          {series.map((s) => (
            <Card
              key={s.id}
              padding={6}
              className="native-card"
              onClick={() => setActiveSeries(s.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: "200px",
                cursor: "pointer",
              }}
            >
              <VStack gap={2} style={{ flexGrow: 1 }}>
                <Heading
                  level={3}
                  style={{
                    fontFamily: "var(--font-family-ui)",
                    letterSpacing: "-0.02em",
                    fontWeight: 600,
                  }}
                >
                  {s.title}
                </Heading>
                <Text
                  type="supporting"
                  color="secondary"
                  style={{
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {s.description || "No description provided."}
                </Text>
              </VStack>
              <Text
                type="supporting"
                color="secondary"
                style={{ marginTop: "auto", paddingTop: "var(--spacing-4)" }}
              >
                Created {formatDate(s.createdAt)}
              </Text>
            </Card>
          ))}
        </Grid>
      </VStack>
    </VaultBackdrop>
  );
}

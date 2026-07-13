import { useState, type CSSProperties } from "react";
import { VStack } from "@astryxdesign/core/Layout";
import { Grid } from "@astryxdesign/core/Grid";
import { Card } from "@astryxdesign/core/Card";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { useProjectStore } from "../../viewmodels/useProjectStore";
import VaultBackdrop from "../../design-system/VaultBackdrop";

const titleStyle: CSSProperties = {
  fontFamily: "Merriweather, serif",
  fontWeight: 300,
  letterSpacing: "-0.02em",
};

// Wider than the auth card (contentStyle in LoginView) — this page hosts a
// feature grid, not a single compact form; the narrower steps center inside
// it via their own maxWidth.
const contentStyle: CSSProperties = {
  position: "relative",
  zIndex: 10,
  width: "100%",
  maxWidth: 720,
  maxHeight: "100vh",
  overflowY: "auto",
  padding: "var(--spacing-12) var(--spacing-6)",
};

const narrowStepStyle: CSSProperties = {
  maxWidth: 440,
};

const linkStyle: CSSProperties = {
  cursor: "pointer",
  textDecoration: "underline",
};

interface Feature {
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    title: "Chapters & Notes",
    description:
      "Draft your manuscript chapter by chapter, alongside living notes for lore and worldbuilding.",
  },
  {
    title: "Characters",
    description: "Track every character's bio, role, and custom attributes as your cast grows.",
  },
  {
    title: "Locations",
    description: "Map out the places that shape your story.",
  },
  {
    title: "Local & Encrypted",
    description: "Everything stays on this device, sealed behind your master password.",
  },
];

type OnboardingStep = "features" | "create" | "done";

interface OnboardingViewProps {
  // Called the moment a project is created, so the parent can keep this view
  // mounted through its "done" step instead of switching away the instant
  // `project` becomes non-null (App routes on project existence too).
  onComplete: () => void;
}

export default function OnboardingView({ onComplete }: OnboardingViewProps) {
  const createSeries = useProjectStore((state) => state.createSeries);
  const setActiveSeries = useProjectStore((state) => state.setActiveSeries);

  const [step, setStep] = useState<OnboardingStep>("features");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreate = () => {
    setErrorMsg("");
    if (!title.trim()) {
      setErrorMsg("Give your series a title to continue.");
      return;
    }

    const newSeries = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      createdAt: Date.now(),
    };

    createSeries(newSeries);
    setActiveSeries(newSeries.id);

    onComplete();
    setStep("done");
  };

  return (
    <VaultBackdrop>
      <VStack key={step} gap={8} hAlign="center" style={contentStyle}>
        {step === "features" && (
          <VStack gap={8} hAlign="center" width="100%" className="fade-enter">
            <VStack gap={2} hAlign="center">
              <Heading level={1} style={titleStyle}>
                Your Universe Awaits
              </Heading>
              <Text type="body" color="secondary" justify="center">
                A few things you can do inside your vault.
              </Text>
            </VStack>

            <Grid columns={2} gap={4} width="100%">
              {FEATURES.map((feature) => (
                <Card key={feature.title} padding={6}>
                  <VStack gap={1}>
                    <Text type="body" weight="bold">
                      {feature.title}
                    </Text>
                    <Text type="supporting" color="secondary">
                      {feature.description}
                    </Text>
                  </VStack>
                </Card>
              ))}
            </Grid>

            <Button
              label="Get Started"
              variant="primary"
              size="lg"
              onClick={() => setStep("create")}
              style={{ width: "100%", maxWidth: 320 }}
            />
          </VStack>
        )}

        {step === "create" && (
          <VStack
            gap={4}
            hAlign="center"
            width="100%"
            style={narrowStepStyle}
            className="fade-enter"
          >
            <VStack gap={2} hAlign="center">
              <Heading level={1} style={titleStyle}>
                Name Your Series
              </Heading>
              <Text type="body" color="secondary" justify="center">
                What epic are you building?
              </Text>
            </VStack>

            <VStack gap={4} width="100%">
              <TextInput
                label="Title"
                value={title}
                onChange={(v) => setTitle(v)}
                placeholder="The Lord of the Rings"
                status={errorMsg ? { type: "error", message: errorMsg } : undefined}
              />
              <TextArea
                label="Description"
                isOptional
                rows={3}
                value={description}
                onChange={(v) => setDescription(v)}
                placeholder="A short description of your series..."
              />
            </VStack>

            <Button
              label="Create Series"
              variant="primary"
              size="lg"
              onClick={handleCreate}
              style={{ width: "100%" }}
            />

            <Text
              type="supporting"
              color="secondary"
              style={linkStyle}
              onClick={() => {
                setStep("features");
                setErrorMsg("");
              }}
            >
              Back
            </Text>
          </VStack>
        )}

        {step === "done" && (
          <VStack
            gap={2}
            hAlign="center"
            width="100%"
            style={narrowStepStyle}
            className="fade-enter"
          >
            <Heading level={1} style={titleStyle}>
              {title || "Series Created"}
            </Heading>
            <Text type="body" color="secondary" justify="center">
              Your series has been created and saved to this device.
            </Text>
            <Text
              type="supporting"
              color="secondary"
              justify="center"
              style={{ marginTop: "var(--spacing-4)" }}
            >
              The writing workspace is coming soon.
            </Text>
          </VStack>
        )}
      </VStack>
    </VaultBackdrop>
  );
}

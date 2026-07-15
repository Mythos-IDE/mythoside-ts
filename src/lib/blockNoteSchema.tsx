import { BlockNoteSchema, defaultInlineContentSpecs } from "@blocknote/core";
import { createReactInlineContentSpec } from "@blocknote/react";

// A character mention — the first piece of the "@Karakter" signature
// feature (see CLAUDE.md). Rendered as a visually distinct chip in the
// editor, but exported to Markdown as a plain link — `[İsim](mention:
// character:<id>)` — so the file stays a normal, readable Markdown
// document even outside this app; `parse` recognizes that link shape on
// the way back in and reconstructs the mention instead of leaving it as
// plain link text.
const Mention = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: {
      characterId: { default: "" },
      name: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => (
      <span
        style={{
          backgroundColor: "var(--color-surface-secondary, #3a3a3a)",
          borderRadius: 4,
          padding: "0 4px",
          fontWeight: 600,
        }}
      >
        @{props.inlineContent.props.name}
      </span>
    ),
    toExternalHTML: (props) => (
      <a href={`mention:character:${props.inlineContent.props.characterId}`}>
        {props.inlineContent.props.name}
      </a>
    ),
    parse: (el) => {
      if (el.tagName !== "A") return undefined;
      const match = el.getAttribute("href")?.match(/^mention:character:(.+)$/);
      if (!match) return undefined;
      return { characterId: match[1], name: el.textContent ?? "" };
    },
  },
);

// Computed once at module load — not per-render, since it's passed as a
// stable reference into useCreateBlockNote.
export const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mention: Mention,
  },
});

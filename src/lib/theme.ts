import { defineTheme } from "@astryxdesign/core/theme";

// "Warm Nordic Editorial" — see DESIGN.md for the full palette/typography
// rationale (competitor analysis, "physical writing desk" concept). Light
// mode only, on purpose: the whole concept is a warm-paper aesthetic with
// no coherent dark counterpart designed yet, so every token below is a
// single value (applies the same regardless of OS light/dark preference)
// rather than a [light, dark] tuple — paired with <Theme mode="light"> in
// main.tsx so the app doesn't silently ignore a system dark-mode toggle.
export const warmNordicTheme = defineTheme({
  name: "warm-nordic-editorial",
  color: {
    accent: "#C67B5C", // Warm Terracotta / Sienna
    neutralStyle: "warm",
  },
  typography: {
    scale: { base: 14, ratio: 1.2 },
    // Inter is the "UI Element Font" for all app chrome (headings included
    // — screen titles/labels are UI, not manuscript prose). Already
    // self-hosted via @blocknote/core/fonts/inter.css (imported in
    // ChapterEditorView.tsx), so no new font loading here. The "Editor
    // Content Font" (Newsreader, for the manuscript prose itself) isn't a
    // global UI role — it's scoped to BlockNote's own .bn-editor container
    // in global.css instead.
    body: {
      family: "Inter",
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    heading: {
      family: "Inter",
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
  },
  tokens: {
    // Backgrounds — desk (canvas) -> stationery sheets (panels/cards) ->
    // writing paper (elevated interactive layer: dialogs, switches, etc.)
    "--color-background-body": "#F8F6F0", // Desk Backdrop / Warm Alabaster
    "--color-background-card": "#F0EDE4", // Stationery Sheets / Warm Sand
    "--color-background-muted": "#F0EDE4",
    "--color-background-surface": "#FFFFFF", // Writing Paper / Pure Cotton Paper
    "--color-background-popover": "#FFFFFF",

    "--color-text-primary": "#2A2724", // Deep Charcoal Umber
    "--color-text-secondary": "#7C756B", // Soft Earthy Taupe

    "--color-border": "#DFDBD3",
    "--color-border-emphasized": "#C9C2B4",

    "--color-success": "#4F675A", // Sage Forest Green

    "--radius-element": "8px", // buttons, inputs, list items
    "--radius-container": "12px", // cards

    "--shadow-low": "0 8px 30px rgba(0,0,0,0.03)",
    "--shadow-med": "0 12px 40px rgba(0,0,0,0.05)",
    "--shadow-high": "0 20px 60px rgba(0,0,0,0.08)",
  },
});

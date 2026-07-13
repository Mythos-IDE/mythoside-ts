# DESIGN.md: Era of Warm Nordic Editorial (Stationery & Zen)

## 1. Market Competitor & Organization Analysis

We analyzed the current market competitors for professional writing IDEs to understand their visual language and workflows:

| Competitor           | Visual Aesthetic                               | Strengths                                      | Weaknesses                                        | Our Strategic Response                                                                                         |
| :------------------- | :--------------------------------------------- | :--------------------------------------------- | :------------------------------------------------ | :------------------------------------------------------------------------------------------------------------- |
| **Ulysses**          | Minimalist, dark/light, borderless sheets      | Highly distraction-free, beautiful typography  | Lacks visual structural depth                     | We adopt the borderless clean typography sheet layout but place it on a structured desk backdrop.              |
| **Scrivener**        | Traditional desktop grid, heavy binder sidebar | Excellent complex hierarchy (corkboard/binder) | Cluttered, dated, steep learning curve            | We adopt the 3-panel architecture (Binder, Editor, Inspector) but simplify it into a modern minimal interface. |
| **Dabble / Noveler** | Web SaaS, colorful cards, typewriter mode      | Clean writing feel, target tracking            | Feels like a standard web app, not desktop-native | We design a "physical stationery" desktop-native feel (Tauri-based) using paper sheets and ambient shadows.    |

**MythosIDE Organization Direction:**
Mythos is a local-first creative space. It should feel like a premium physical writing desk: natural paper, high-quality pens, and a calm, focused environment. The visual system must evoke the tactile feeling of physical notebooks and cards laying on a clean wooden desk.

---

## 2. Design Language & Tokens: Warm Nordic Editorial

We are shifting from a generic light/dark macOS scheme to **Warm Nordic Editorial**. It uses organic tones, warm earthy grays, sienna accents, and elegant serif typography.

### A. Color Palette (Earthy & Textured)

- **Desk Backdrop (Canvas):** `#F8F6F0` (Warm Alabaster) — Evokes a natural linen/wood surface.
- **Stationery Sheets (Panels):** `#F0EDE4` (Warm Sand) — Slightly darker, creating a soft shadow hierarchy.
- **Writing Paper (Editor Canvas):** `#FFFFFF` (Pure Cotton Paper) — Floating in the center of the desk with a soft ambient shadow.
- **Primary Text:** `#2A2724` (Deep Charcoal Umber) — Warm, high-contrast, yet soft on the eyes.
- **Secondary Text:** `#7C756B` (Soft Earthy Taupe) — For labels, metadata, and supporting elements.
- **Accent Highlight:** `#C67B5C` (Warm Terracotta / Sienna) — Used for active selection and highlights.
- **Secondary Highlight:** `#4F675A` (Sage Forest Green) — Used for success states and secondary indicators.

### B. Typography

- **UI Element Font:** `Inter`, sans-serif (Clean, legible, modern).
- **Editor Content Font:** `Merriweather` or `Newsreader` (A premium editorial serif with excellent readability).

### C. Shapes & Borders

- **Border Radius:** `8px` for buttons, inputs, and list items. `12px` for cards. `0px` for the main paper edge.
- **Borders:** Thin, subtle divider lines (`1px solid #DFDBD3`).
- **Shadows:** Smooth ambient drops (`0 8px 30px rgba(0,0,0,0.03)`) simulating paper sheets lying on top of one another.

---

## 3. Implementation Checklist

- [x] Configure Firebase integration in `/src/services/firebase.ts`.
- [ ] Implement color variables in `native.css`.
- [ ] Restructure `EditorLayout.tsx` styling (3-panel alignment, desk-to-paper elevation, terracotta selection states).
- [ ] Add Worldbuilding tab views (Characters, Locations) showing cards/elements.

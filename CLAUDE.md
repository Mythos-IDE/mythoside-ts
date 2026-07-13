# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Tauri v2 desktop app: a local-first fiction/world-building writing tool (in-app strings reference "Mythos" / "MythosIDE" — e.g. placeholder email `author@mythos.com`, the auth localStorage key `mythoside-vault`, the project localStorage key `mythoside-project`). "Local-first" is the core constraint: auth is entirely client-side (email + SHA-256 password hash persisted via Zustand to localStorage, see `src/viewmodels/useAppStore.ts`), and there is no backend server actually wired into the app.

Caveat on that last point: `firebase` is installed and `src/services/firebase.ts` initializes a real Firebase app/Firestore/Auth client (with a live-looking API key and project id). As of now it is **not imported anywhere else in `src/`** — it's dead code / scaffolding, not an active backend. Don't assume data ever leaves the device; if you're about to wire this in, that's a deliberate architectural shift away from local-first and worth confirming with the user first.

The Rust side is still the unmodified Tauri template (one `greet` IPC command). The frontend, however, is past the login-screen-only stage: there's a working (if intentionally minimal) flow from auth → dashboard → writing workspace. See "Architecture" below for the actual shape before assuming a feature does or doesn't exist.

## Commands

All commands run from the repo root.

```bash
npm install              # or: vp install (also re-syncs vite-plus tooling)
npm run dev               # vp dev — Vite dev server only (browser, no Tauri shell)
npm run tauri dev         # full desktop app; auto-runs `npm run dev` for you (see beforeDevCommand) — prefer this over the two above when testing the actual app
npm run build              # tsc (type-check, no emit) && vp build
npm run tauri build       # produces installable desktop bundles (src-tauri/target)
vp check                  # format (Oxfmt) + lint (Oxlint) + typecheck in one pass
vp check --fix             # same, with autofix
vp test                    # Vitest run (no test files exist in the repo yet)
vp test watch              # Vitest watch mode
vp test run <path>         # run a single test file once one exists
```

`vp` is the Vite+ global CLI (wraps Vite/Rolldown/Vitest/Oxlint/Oxfmt); it is a separate tool from plain `vite`/`eslint`/`vitest` CLIs and is configured entirely inside `vite.config.ts` (there is deliberately no separate `vitest.config.ts` / eslint / prettier config — don't add one). Full docs are vendored at `node_modules/vite-plus/docs/guide/`.

Git commits are not "clean" by default: `vite.config.ts`'s `staged: { "*": "vp check --fix" }` is wired into a real pre-commit hook (`.vite-hooks/pre-commit` runs `vp staged`), so staged files get auto-formatted/fixed on every commit.

Design-system CLI (see rules below before writing any UI):

```bash
npx astryx build "<idea>"        # find the closest page/block/component kit — start here
npx astryx template <name>       # scaffold or inspect a page/block template
npx astryx component <Name>      # props + examples for one component
npx astryx search "<query>"      # find any component/hook/doc/template/block
npx astryx docs <topic>          # tokens, layout, color, spacing, motion, ...
npx astryx swizzle <Name>        # eject a component's source for deep customization
npx astryx theme build src/design-system/neutralTheme.ts   # recompile the theme after editing it
```

`package.json`'s `devEngines.packageManager` pins npm `12.0.1`, which in turn requires Node `^22.22.2 || ^24.15.0 || >=26.0.0` — plain `npm ...`/`npx ...` fail with `EBADDEVENGINES` on anything older (`onFail: "download"` isn't actually honored by npm; it just errors). A `.nvmrc` (`24.18.0`) is checked in for this — run `nvm use` (or `nvm install` first if you don't have that version) before any `npm`/`npx` command. If you can't/won't switch Node versions, workarounds that bypass npm's own gate: the global `vp` CLI directly (`vp dev`, not `npm run dev`); local binaries directly (`./node_modules/.bin/tsc --noEmit`); the astryx CLI's JS entrypoint directly (`node node_modules/@astryxdesign/cli/bin/astryx.mjs <command>`, same as the `astryx` script in `package.json`, just invoked without going through `npm run`).

`AGENTS.md` in the repo root is auto-synced by the vite-plus and Astryx CLIs (look for the `<!--VITE PLUS START/END-->` and `<!-- ASTRYX:START/END -->` markers) — it's tooling-generated agent instructions for non-Claude agents and duplicates the command info above. Don't hand-edit it; it gets overwritten by `vp install` / `astryx` commands.

## Architecture

**Two processes.** `src-tauri/` is the Rust/Tauri shell (window chrome, native IPC commands, `tauri.conf.json` for window/bundle config, `capabilities/default.json` for the permission allowlist). `src/` is the React 19 + TypeScript frontend that runs inside the Tauri webview. They talk via `#[tauri::command]` functions in `src-tauri/src/lib.rs` invoked from the frontend through `@tauri-apps/api`; currently only the template's `greet` command exists, so there is no established pattern yet for real IPC calls — pick one when the first real command is added.

**Frontend layering** follows a light MVVM split, one directory per layer:

- `src/models/` (`src/models/types.ts`) — plain TS interfaces only: `Series` → `Book` → `Chapter` (the manuscript hierarchy), plus `Character`, `Location`, and `Note` (all scoped by `bookId`). No logic. Note the naming: there's no generic `Project`/`Document` type anymore — `Series`/`Book`/`Chapter` replaced that earlier shape.
- `src/viewmodels/` — Zustand stores; this is where state _and_ actions live (not just data).
  - `useAppStore` — auth/session. Persisted to localStorage as `mythoside-vault`, but only the durable `localUser` record is persisted (`partialize`); `isAuthenticated` is intentionally excluded so a relaunch always requires re-entering the master password rather than rehydrating an unlocked vault.
  - `useProjectStore` — series/book/chapter/character/location/note domain data. **Also persisted** (localStorage key `mythoside-project`) — unlike in earlier drafts of this app, this is no longer in-memory-only.
  - `useWorkspaceStore` — transient UI state only (active document/character id, sidebar expanded) — not persisted, resets on reload.
- `src/views/` — React components, organized by feature area: `auth/LoginView`, `dashboard/DashboardView`, `onboarding/OnboardingView`, `editor/EditorLayout`.
- `src/services/` — framework-agnostic helper logic: `cryptoService.ts` (SHA-256 password hashing via Web Crypto), `firebase.ts` (configured but currently unused — see caveat above).
- `src/design-system/` — the local Astryx theme: `neutralTheme.ts` (hand-authored `defineTheme()` source — edit this) compiles via `astryx theme build src/design-system/neutralTheme.ts` into `neutral.css`/`neutral.js`/`neutral.d.ts`/`neutral.variants.d.ts` (generated output — don't hand-edit, they get overwritten). Also `native.css` (small hand-written layer for the couple of tokens Astryx doesn't have, plus `.native-card` hover polish — see below), `typography.css`, `icons.tsx` (the theme's icon registry — deliberately uses `createElement()` instead of JSX; `astryx theme build` loads this file outside the app's Vite pipeline and doesn't apply this project's automatic JSX runtime, so bare `<X />` fails there with "React is not defined"), and `VaultBackdrop.tsx` (the shared full-bleed background component behind auth/dashboard/onboarding).

**Routing (`App.tsx`) is a three-way switch, not binary:**

```
!isAuthenticated               → LoginView
isAuthenticated && !activeBookId → DashboardView   (series list → books-in-series list)
isAuthenticated && activeBookId  → EditorLayout     (chapters / characters / locations / timeline / lore)
```

`OnboardingView` (first-series creation flow) is **not** routed at the `App.tsx` level — it's mounted conditionally from inside `DashboardView` when the user clicks "Create New Series" (local `isCreatingSeries` state), then hands control back via an `onComplete` callback. Keep this in mind when tracing "how does a user get to X view" — it's not all in `App.tsx`.

`EditorLayout`'s data-entry flows (create chapter/character/location/note) currently use raw `window.prompt()` calls rather than real forms — this is intentional placeholder UX, not a bug, but also not a pattern to extend; if you're building out real forms for these, that's expected follow-up work, not a rewrite of something that was supposed to be finished.

**Design system rules (Astryx, `@astryxdesign/core` + `@astryxdesign/theme-neutral`, 149 components).** These are the documented constraints:

- No raw `<div>` for layout/spacing — components do that. Full page → `AppShell`; sidebar nav → `SideNav`.
- Pick the shell and budget regions in px _before_ writing content.
- Dense data (lists/tables) → `Table`/`List`+`Item` edge-to-edge, never `Card`-wrapped. `Card` is for dashboard widgets/galleries/settings groups only.
- Status → `StatusDot`/`Token`; `Badge` only for counts/enumerated states, never decoration.
- Styling: component props first, else `style`/`className` using tokens (`var(--color-*)`, `--spacing-*`, `--radius-*`). No raw hex/px, no Tailwind/utility-class usage (not wired into this project).
- Theming goes through `astryx theme`, never by overriding `--color-*` in `:root`.
- Reset/base CSS (`@astryxdesign/core/reset.css`, `astryx.css`) is imported once in `src/main.tsx` — don't re-import per component.

**The "Warm Nordic Editorial" palette (`DESIGN.md`) is implemented the right way: through `neutralTheme.ts`'s `tokens`/`radius` overrides, compiled by `astryx theme build`.** This used to be a `native.css` hack that hard-overrode Astryx's own `--color-*`/`--radius-*` tokens on `:root` with `!important` (including a blanket `* { border-radius: 12px !important; }` that clobbered even explicit inline `borderRadius` values, e.g. EditorLayout's writing-paper container). That's been migrated: the actual desk/paper/sienna-accent hex values now live as real theme tokens in `neutralTheme.ts`, and `native.css` only defines two tokens Astryx has no real equivalent for (`--color-background-base` — VaultBackdrop's page wash, distinct from `--color-background-card` — and `--color-border-subtle`, a third border tier) plus `.native-card` hover polish that isn't expressible through `defineTheme`'s `components` field. If you change the palette, edit `neutralTheme.ts` and re-run `node node_modules/@astryxdesign/cli/bin/astryx.mjs theme build src/design-system/neutralTheme.ts` (plain `npx astryx ...` currently fails on this machine — see the `devEngines` note in Commands) — don't hand-edit the generated `neutral.css`/`neutral.js`, and don't reach for another `native.css` `!important` override.

**Design-system compliance is uneven across views right now:** `LoginView`, `DashboardView`, and `OnboardingView` are built mostly correctly with Astryx layout primitives (`VStack`/`HStack`/`Grid`/`Card`/`Text`/`Button`/`TextInput`) plus token-based inline styles. `EditorLayout.tsx` is the outlier — it's heavy with raw `<div>`s for tab items and worldbuilding cards, and has a few hardcoded literals (`#FFFFFF`, `rgba(0,0,0,0.05)`, `rgba(198, 123, 92, 0.12)`) instead of tokens. This matches `DESIGN.md`'s own implementation checklist, which explicitly still lists "Restructure `EditorLayout.tsx` styling" as unfinished — treat `EditorLayout.tsx` as work-in-progress, not a pattern to copy.

**`DESIGN.md`** is the authoritative visual-direction brief ("Warm Nordic Editorial") with the actual hex palette, typography, and shape/shadow tokens for this product. Its checklist at the bottom is unreliable as a status signal — verify against the actual code, not the checklist, before doing design work.

**State management:** Zustand only (no Redux/Context-based global state). `useAppStore` and `useProjectStore` both use the `persist` middleware (to localStorage); `useWorkspaceStore` is in-memory and resets on reload.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Tauri v2 desktop app: a local-first fiction/world-building writing tool (in-app strings previously referenced "Mythos" / "MythosIDE"). "Local-first" is the intended core constraint going forward — no backend server, client-side auth, data stays on device.

**The entire UI layer was intentionally deleted to rebuild from scratch** (`src/views/`, `src/design-system/`, `src/models/`, `src/viewmodels/` are gone). `src/App.tsx` is a bare placeholder (`return null`) and `src/main.tsx` wires the vendor `@astryxdesign/theme-neutral` package directly (no local theme customization exists anymore — see "Architecture"). Do not assume any auth flow, data model, routing, or design-system customization exists; check the actual files before referencing prior behavior. The git history (before this reset) had a working Series → Book → Chapter manuscript model with Zustand-persisted stores and a full auth → dashboard → editor flow — useful as reference for "how was this solved before," not as current state.

`DESIGN.md`'s "Warm Nordic Editorial" direction is considered obsolete, as is a separate dark/purple "Chronicle"-branded mockup found on the org's website repo — **no visual identity is currently decided.** Don't default to either without checking with the user first.

**Target architecture (not yet implemented — this is where the rebuild is headed, per the `Mythos-IDE/mythoside-core` GitHub repo's README/roadmap and the project's own business plan):**

- Data hierarchy: Series → Book → Chapter → **Scene** (the pre-reset code stopped at Chapter, no Scene level).
- Source of truth: plain **Markdown files + YAML frontmatter on disk** — not Zustand/localStorage. This is the actual "local-first" guarantee (file ownership, no vendor lock-in), stronger than the old browser-storage approach.
- **SQLite + FTS5** as a background index/cache only, rebuilt incrementally from file mtimes — never the source of truth.
- A ProseMirror- or Monaco-based rich editor (not a plain `<textarea>`).
- Signature feature: `@Character` inline autocomplete + hover profile cards, a cross-reference panel ("where does X appear"), and a relationship graph (node-link, characters/factions).
- An export engine: DOCX → EPUB → print-ready PDF (with page-size templates), increasing in implementation complexity in that order.
- Business model: freemium + one-time "Pro" license (not subscription — conflicts with local-first trust), optional paid cloud sync as a separate recurring layer.

Roadmap priority per `mythoside-core`'s pinned issues: project structure → Markdown/YAML file format → SQLite/FTS5 indexing → `@mention` system → cross-reference view → graph/export/Pro tier.

What's untouched by the reset: `src/services/cryptoService.ts` (SHA-256 password hashing via Web Crypto) and `src/services/firebase.ts` (a configured but **unused** Firebase app/Firestore/Auth client — not imported anywhere in `src/`; local-first still holds). The Rust side is still the unmodified Tauri template (one `greet` IPC command) — no established pattern yet for real IPC calls.

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
npx astryx theme                 # scaffold a new custom theme, if/when one is wanted again
```

`package.json`'s `devEngines.packageManager` pins npm `12.0.1`, which in turn requires Node `^22.22.2 || ^24.15.0 || >=26.0.0` — plain `npm ...`/`npx ...` fail with `EBADDEVENGINES` on anything older (`onFail: "download"` isn't actually honored by npm; it just errors). A `.nvmrc` (`24.18.0`) is checked in for this — run `nvm use` (or `nvm install` first if you don't have that version) before any `npm`/`npx` command. If you can't/won't switch Node versions, workarounds that bypass npm's own gate: the global `vp` CLI directly (`vp dev`, not `npm run dev`); local binaries directly (`./node_modules/.bin/tsc --noEmit`); the astryx CLI's JS entrypoint directly (`node node_modules/@astryxdesign/cli/bin/astryx.mjs <command>`, same as the `astryx` script in `package.json`, just invoked without going through `npm run`).

`AGENTS.md` in the repo root is auto-synced by the vite-plus and Astryx CLIs (look for the `<!--VITE PLUS START/END-->` and `<!-- ASTRYX:START/END -->` markers) — it's tooling-generated agent instructions for non-Claude agents and duplicates the command info above. Don't hand-edit it; it gets overwritten by `vp install` / `astryx` commands.

## Architecture

**Two processes.** `src-tauri/` is the Rust/Tauri shell (window chrome, native IPC commands, `tauri.conf.json` for window/bundle config, `capabilities/default.json` for the permission allowlist). `src/` is the React 19 + TypeScript frontend that runs inside the Tauri webview. They talk via `#[tauri::command]` functions in `src-tauri/src/lib.rs` invoked from the frontend through `@tauri-apps/api`; currently only the template's `greet` command exists, so there is no established pattern yet for real IPC calls — pick one when the first real command is added.

**UI is still a blank slate**, post-reset — `src/App.tsx` is `return null`, `src/main.tsx` renders it inside Astryx's `<Theme>` using the **vendor** `@astryxdesign/theme-neutral` package directly (no local `src/design-system/` exists). No `src/viewmodels/` or `src/views/` exist either. Zustand is still a dependency if state management is wanted again, but nothing uses it. `src/global.css` (full-viewport reset) is still imported by `main.tsx`.

**The core data layer is being rebuilt first (see Project Overview's "Target architecture")** — this is real, working code, not a placeholder:

- `src/models/types.ts` — plain TS interfaces for the manuscript hierarchy: `Series` → `Book` → `Chapter` → `Scene`, plus `Character`/`Location`/`Note` (all scoped by `bookId`; `Note.type` is `"lore" | "timeline"`). `Scene`/`Character`/`Location`/`Note` each carry one Markdown prose field (`content`/`bio`/`description`/`content`) alongside their metadata.
- `src/core/manuscriptFormat.ts` — the actual Markdown+YAML file format (roadmap item: "Local Markdown + YAML file format definition"). Exports one `{ parse, serialize }` codec per entity, each validated with a Zod schema tied to the TS type via `satisfies z.ZodType<...>` (so the runtime schema and the type can't silently drift apart). Two shapes: `series.yaml`/`book.yaml`/`chapter.yaml` are pure YAML metadata (no prose) via `makeYamlCodec`; `Scene`/`Character`/`Location`/`Note` are Markdown files with YAML frontmatter (parsed with `gray-matter`) via `makeFrontmatterCodec`, which takes the name of whichever field holds that entity's prose body. See `src/core/manuscriptFormat.test.ts` for the on-disk shape of each file type and the actual folder layout convention (`<book-slug>/chapters/<order>-<chapter-slug>/<order>-<scene-slug>.md`, etc.) — the codecs only handle single-file parse/serialize, not yet walking a project directory or watching it for changes; that's the next slice of work.
- Not implemented yet: reading/writing these files from an actual project directory (and the Rust-vs-TS decision for where that file I/O and watching lives — see the `#[tauri::command]` note above, this would be the first real one), and the SQLite/FTS5 background index.

`src/services/` survived the reset unrelated to any of this: `cryptoService.ts` (SHA-256 hashing, unused right now) and `firebase.ts` (configured but unused Firebase client — see caveat in Project Overview).

**Astryx design system** (`@astryxdesign/core` + `@astryxdesign/theme-neutral`, 149 components, still installed) is available to build the new UI with — component/theme docs via `npx astryx docs <topic>` / `npx astryx component <Name>` / `npx astryx build "<idea>"`. Whether to keep the vendor neutral theme as-is, build a new custom theme (`astryx theme` — see Commands), or reconsider using Astryx's strict component/token rules at all for a solo local-first app is an open decision for whoever picks this back up — don't assume the old rules (no raw `<div>`, tokens-only styling, etc.) are still the agreed direction without checking with the user first.

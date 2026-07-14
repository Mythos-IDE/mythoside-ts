# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Tauri v2 desktop app: a local-first fiction/world-building writing tool (in-app strings previously referenced "Mythos" / "MythosIDE"). "Local-first" is the intended core constraint going forward — no backend server, client-side auth, data stays on device.

**The entire UI layer was intentionally deleted to rebuild from scratch** (`src/views/`, `src/design-system/`, `src/models/`, `src/viewmodels/` are gone). `src/App.tsx` is a bare placeholder (`return null`) and `src/main.tsx` wires the vendor `@astryxdesign/theme-neutral` package directly (no local theme customization exists anymore — see "Architecture"). Do not assume any auth flow, data model, routing, or design-system customization exists; check the actual files before referencing prior behavior. The git history (before this reset) had a working Series → Book → Chapter manuscript model with Zustand-persisted stores and a full auth → dashboard → editor flow — useful as reference for "how was this solved before," not as current state.

`DESIGN.md`'s "Warm Nordic Editorial" direction is considered obsolete, as is a separate dark/purple "Chronicle"-branded mockup found on the org's website repo — **no visual identity is currently decided.** Don't default to either without checking with the user first.

**Target architecture** (per the `Mythos-IDE/mythoside-core` GitHub repo's README/roadmap and the project's own business plan) — status noted per item, see "Architecture" for the implemented parts:

- Data hierarchy: Series → Book → Chapter → **Scene** (the pre-reset TS code stopped at Chapter, no Scene level) — **implemented**, in Rust (`src-tauri/src/manuscript/models.rs`).
- Source of truth: plain **Markdown files + YAML frontmatter on disk** — not Zustand/localStorage. This is the actual "local-first" guarantee (file ownership, no vendor lock-in) — **implemented** (`src-tauri/src/manuscript/format.rs`), but only single-file parse/serialize so far, not walking/loading a whole project directory yet.
- **SQLite + FTS5** as a background index/cache only, rebuilt incrementally from file mtimes, never the source of truth — **not started**.
- A ProseMirror- or Monaco-based rich editor (not a plain `<textarea>`) — **not started**, no UI exists at all yet.
- Signature feature: `@Character` inline autocomplete + hover profile cards, a cross-reference panel ("where does X appear"), and a relationship graph (node-link, characters/factions) — **not started**.
- An export engine: DOCX → EPUB → print-ready PDF (with page-size templates), increasing in implementation complexity in that order — **not started**.
- Business model: freemium + one-time "Pro" license (not subscription — conflicts with local-first trust), optional paid cloud sync as a separate recurring layer — a business decision, not code.

Roadmap priority per `mythoside-core`'s pinned issues: project structure → Markdown/YAML file format → SQLite/FTS5 indexing → `@mention` system → cross-reference view → graph/export/Pro tier.

What's untouched by the reset: `src/services/cryptoService.ts` (SHA-256 password hashing via Web Crypto, unused right now) and `src/services/firebase.ts` (`initializeApp` + `getAnalytics` for the real `mythoside` Firebase project — not Firestore/Auth, just usage analytics; not imported anywhere in `src/` yet, so still inert. A previous version of this file pointed at an unrelated Firebase project/db name that was clearly copy-pasted boilerplate — if you see that again, it's wrong, replace it).

**Explicit architecture split: Core = Rust entirely, TypeScript = purely frontend.** Not the default Tauri-template split (which leaves business logic in TS and Rust as a thin native-API shim). Here, Rust owns the manuscript data model, Markdown+YAML parsing/serialization, all file I/O and watching, and entity CRUD (e.g. `create_character`) — not just "things that need native capability." TS never hand-duplicates Rust's types; see `src/bindings.ts` below. Don't put parsing/validation/domain logic back in TS — that was tried (`src/core/manuscriptFormat.ts` + `src/models/types.ts`, deleted) and reversed on purpose.

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

**Two processes.** `src-tauri/` is the Rust/Tauri shell (window chrome, native IPC commands, `tauri.conf.json` for window/bundle config, `capabilities/default.json` for the permission allowlist). `src/` is the React 19 + TypeScript frontend that runs inside the Tauri webview. They talk via `#[tauri::command]` functions in `src-tauri/src/lib.rs` invoked from the frontend through `@tauri-apps/api`.

**`src-tauri/src/manuscript/`** is the Rust "core" — the actual manuscript hierarchy, file format, and entity operations, all Rust, all real (roadmap items "core project structure" + "Local Markdown + YAML file format definition"):

- `models.rs` — `Series`/`Book`/`Chapter`/`Scene`/`Character`/`Location`/`Note` structs. Every struct derives `specta::Type` alongside `Serialize`/`Deserialize` — that derive is what makes a struct exportable to TS at all (see bindings below); a struct used in a command's signature without it won't compile. `#[serde(rename_all = "camelCase")]` on every struct keeps on-disk YAML keys and the generated TS both camelCase, matching normal JS/YAML convention, while Rust code stays idiomatic snake_case. `Note.note_type` is `#[serde(rename = "type")]` (`type` is a Rust keyword). `created_at` is a `String` (RFC-3339/ISO-8601, via `chrono`) rather than a raw epoch number — two independent reasons: it keeps the on-disk YAML human-readable (a real "local-first, it's just plain files" selling point — `createdAt: "2024-07-03T10:26:40Z"` is legible in a text editor, `1720000000000` isn't), and specta forbids exporting 64-bit ints to TS at all (precision loss past 2^53) while exporting floats as `number | null` (`null` covers `NaN`/`Infinity`, which JSON can't represent) — a string sidesteps both.
- `format.rs` — one `parse_*`/`serialize_*` function pair per entity. `series.yaml`/`book.yaml`/`chapter.yaml` are pure YAML (via `serde_norway` — the maintained fork of the now-deprecated `serde_yaml`); `Scene`/`Character`/`Location`/`Note` are Markdown files with YAML frontmatter, split/joined by a small hand-rolled `split_frontmatter`/`join_frontmatter` (no crate needed for something this simple — starts with `---`, ends at the next line that's exactly `---`, rest is body). Each frontmatter entity has a private `*Meta` struct (metadata fields only, no prose field) used just for the YAML layer, so the public `Scene`/`Character`/etc. structs stay the real, full domain type. See the tests at the bottom of the file for the exact on-disk shape of every file type and the folder convention (`<book-slug>/chapters/<order>-<chapter-slug>/<order>-<scene-slug>.md`, etc.).
- `commands.rs` — `create_character` is the first entity-CRUD command (id via `uuid`, `created_at` via `chrono`, slug-from-name + short id suffix for the filename, writes `<book_dir>/characters/<slug>.md`, returns the created `Character`). The rest of the CRUD surface (series/book/chapter/scene/location/note create, plus read/update/delete for all of them) doesn't exist yet — `create_character` is a template for the pattern, not a complete feature.
- Not yet implemented: walking an existing project directory into these types (so opening a project actually loads it), wiring the watcher's change events (`src-tauri/src/watcher.rs`) to anything, and the SQLite/FTS5 background index.

**TS gets Rust's types via generated bindings, never by hand.** `src-tauri/src/lib.rs` builds a `tauri_specta::Builder` registering every command (`collect_commands![...]`) and exports it to **`src/bindings.ts`** — regenerated by `cargo build`/`cargo run` in debug builds, and also by a dedicated `cargo test` (`tests::exports_typescript_bindings` in `lib.rs`) so it doesn't require running the full windowed app. `src/bindings.ts` itself is generated — never hand-edit it, it says so at the top of the file. Adding a new command means: write it in Rust with both `#[tauri::command]` and `#[specta::specta]` (both required — the latter is what specta needs to capture the type signature), add its struct(s) with `#[derive(specta::Type)]`, add it to the `collect_commands![...]` list in `lib.rs`, then `cargo test`/`cargo build` to regenerate bindings.

Rust-side testing/quality: `cargo test` (from `src-tauri/`) and `cargo fmt -- --check` / `cargo clippy` for formatting/lint — there's no pre-commit hook wiring these yet (unlike the TS side's `vp check --fix`), so run them manually after Rust changes. Expect `cargo build`/`cargo clippy` to show a handful of "never constructed"/"never used" warnings for `Series`/`Book`/`Chapter`/`Scene`/`Location`/`Note`/`NoteType` right now — real code, exercised by tests, just not wired to a command yet (only `Character` is); not a regression to chase down.

`src-tauri/src/watcher.rs` — native filesystem watching via the `notify` crate (not a JS/community fs-watch plugin — real OS file-watch APIs, FSEvents/inotify/ReadDirectoryChangesW). `start_watching(path)` watches a directory recursively and emits a `"manuscript://file-changed"` Tauri event per change (`{ kind: "create"|"modify"|"remove"|"other"|"error", paths: string[] }`); `stop_watching()` drops the active watcher (there's no separate unwatch call in `notify` — dropping the `RecommendedWatcher` stops it, see `WatcherState`). The watch-setup logic itself (`watch()`, private) takes a plain callback and has zero Tauri dependency on purpose, so it's unit-testable with `cargo test` without spinning up an app — see the tests at the bottom of that file, including why they drain events until a match instead of asserting on the first one received (native watch backends don't guarantee event ordering/first-event-relevance, a real flakiness source worth knowing about before adding more watcher-dependent tests). Not yet exposed: reading a changed file's new content (only the path + change kind is emitted so far) and starting the watcher from the frontend on project open.

**UI is still a blank slate**, post-reset — `src/App.tsx` is `return null`, `src/main.tsx` renders it inside Astryx's `<Theme>` using the **vendor** `@astryxdesign/theme-neutral` package directly (no local `src/design-system/` exists). No `src/viewmodels/` or `src/views/` exist either — and no `src/models/`/`src/core/` either now (see the architecture split above; those held hand-written TS domain types/parsing that got deleted once the Rust equivalents landed). Zustand is still a dependency if state management is wanted again, but nothing uses it — and any future store should hold UI state or a cache of what `src/bindings.ts` commands return, not reimplement parsing/validation. `src/global.css` (full-viewport reset) is still imported by `main.tsx`.

`src/services/` is unrelated to any of this: `cryptoService.ts` (SHA-256 hashing, unused right now) and `firebase.ts` (configured but unused — see caveat in Project Overview).

**Astryx design system** (`@astryxdesign/core` + `@astryxdesign/theme-neutral`, 149 components, still installed) is available to build the new UI with — component/theme docs via `npx astryx docs <topic>` / `npx astryx component <Name>` / `npx astryx build "<idea>"`. Whether to keep the vendor neutral theme as-is, build a new custom theme (`astryx theme` — see Commands), or reconsider using Astryx's strict component/token rules at all for a solo local-first app is an open decision for whoever picks this back up — don't assume the old rules (no raw `<div>`, tokens-only styling, etc.) are still the agreed direction without checking with the user first.

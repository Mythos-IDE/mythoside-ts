# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Tauri v2 desktop app: a local-first fiction/world-building writing tool (in-app strings previously referenced "Mythos" / "MythosIDE"). "Local-first" is the intended core constraint going forward — no backend server, client-side auth, data stays on device.

**The entire UI layer was intentionally deleted to rebuild from scratch** (`src/views/`, `src/design-system/`, `src/models/`, `src/viewmodels/` are gone). `src/App.tsx` is a bare placeholder (`return null`) and `src/main.tsx` wires the vendor `@astryxdesign/theme-neutral` package directly (no local theme customization exists anymore — see "Architecture"). Do not assume any auth flow, data model, routing, or design-system customization exists; check the actual files before referencing prior behavior. The git history (before this reset) had a working Series → Book → Chapter manuscript model with Zustand-persisted stores and a full auth → dashboard → editor flow — useful as reference for "how was this solved before," not as current state.

`DESIGN.md`'s "Warm Nordic Editorial" direction is considered obsolete, as is a separate dark/purple "Chronicle"-branded mockup found on the org's website repo — **no visual identity is currently decided.** Don't default to either without checking with the user first.

**Target architecture** (per the `Mythos-IDE/mythoside-core` GitHub repo's README/roadmap and the project's own business plan) — status noted per item, see "Architecture" for the implemented parts:

- Data hierarchy: Series → Book → Chapter → **Scene** (the pre-reset TS code stopped at Chapter, no Scene level) — **implemented**, in Rust (`mythoside-core/src/manuscript/models.rs`).
- Source of truth: plain **Markdown files + YAML frontmatter on disk** — not Zustand/localStorage. This is the actual "local-first" guarantee (file ownership, no vendor lock-in) — **implemented** (`mythoside-core/src/manuscript/format.rs`), but only single-file parse/serialize so far, not walking/loading a whole project directory yet.
- **SQLite + FTS5** as a background index/cache only, rebuilt incrementally from file mtimes, never the source of truth — **not started**.
- A ProseMirror- or Monaco-based rich editor (not a plain `<textarea>`) — **not started**, no UI exists at all yet.
- Signature feature: `@Character` inline autocomplete + hover profile cards, a cross-reference panel ("where does X appear"), and a relationship graph (node-link, characters/factions) — **not started**.
- An export engine: DOCX → EPUB → print-ready PDF (with page-size templates), increasing in implementation complexity in that order — **not started**.
- Business model: freemium + one-time "Pro" license (not subscription — conflicts with local-first trust), optional paid cloud sync as a separate recurring layer — a business decision, not code.

Roadmap priority per `mythoside-core`'s pinned issues: project structure → Markdown/YAML file format → SQLite/FTS5 indexing → `@mention` system → cross-reference view → graph/export/Pro tier.

What's untouched by the reset: `src/services/cryptoService.ts` (SHA-256 password hashing via Web Crypto, unused right now) and `src/services/firebase.ts` (`initializeApp` + `getAnalytics` for the real `mythoside` Firebase project — not Firestore/Auth, just usage analytics; not imported anywhere in `src/` yet, so still inert. A previous version of this file pointed at an unrelated Firebase project/db name that was clearly copy-pasted boilerplate — if you see that again, it's wrong, replace it).

**Client/server split, both local: `mythoside-core` is a standalone server process, `mythoside-ts` (this repo) is its client.** Not the default Tauri-template shape (frontend + thin native shim in one binary) — deliberately two OS processes. `mythoside-core` (its own Cargo workspace member, headed toward its own GitHub repo eventually — see below) owns the manuscript data model, Markdown+YAML parsing/serialization, file watching, and entity CRUD (e.g. `create_character`); the Tauri app (`src-tauri/`) spawns it as a child process and proxies to it. TS never hand-duplicates Rust's types; see `src/bindings.ts` below.

**Why stdio, not HTTP, between them:** an HTTP server — even bound to `127.0.0.1` — is a listening port any other local process (including, via DNS-rebinding-style tricks, a browser tab) can attempt to reach. For an app whose entire pitch is "your manuscript never leaves this device," that's a real posture cost for zero current benefit (there's no second client — mobile, web — today). `mythoside-core` instead speaks a small JSON-RPC-ish protocol over its own stdin/stdout, readable only by the parent process that spawned it (`src-tauri`) — no port, nothing to probe. If a real second client ever needs the same engine, swapping the transport later is a bounded change; the domain logic wouldn't need to.

Don't put parsing/validation/domain logic in `src/` (TS) or directly in `src-tauri/` — both were tried and reversed on purpose (see git history: `src/core/manuscriptFormat.ts` + `src/models/types.ts`, then `src-tauri/src/manuscript/` before the client/server split). It belongs in `mythoside-core/`.

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

**Three pieces, one Cargo workspace (root `Cargo.toml`, members `src-tauri` + `mythoside-core`).**

**`mythoside-core/`** — the local server. A standalone binary (`src/main.rs`) plus a library (`src/lib.rs`) that the binary and `src-tauri` both depend on (`src-tauri` uses it only for the shared types, not the binary):

- `src/manuscript/models.rs` — `Series`/`Book`/`Chapter`/`Scene`/`Character`/`Location`/`Note` structs. Every struct derives `specta::Type` alongside `Serialize`/`Deserialize` — needed so `src-tauri` can re-export these exact types to TS later (see bindings below); a struct used in a command's signature without it won't compile. `#[serde(rename_all = "camelCase")]` on every struct keeps on-disk YAML keys and the generated TS both camelCase, matching normal JS/YAML convention, while Rust code stays idiomatic snake_case. `Note.note_type` is `#[serde(rename = "type")]` (`type` is a Rust keyword). `created_at` is a `String` (RFC-3339/ISO-8601, via `chrono`) rather than a raw epoch number — two independent reasons: it keeps the on-disk YAML human-readable (a real "local-first, it's just plain files" selling point — `createdAt: "2024-07-03T10:26:40Z"` is legible in a text editor, `1720000000000` isn't), and specta forbids exporting 64-bit ints to TS at all (precision loss past 2^53) while exporting floats as `number | null` (`null` covers `NaN`/`Infinity`, which JSON can't represent) — a string sidesteps both.
- `src/manuscript/format.rs` — one `parse_*`/`serialize_*` function pair per entity. `series.yaml`/`book.yaml`/`chapter.yaml` are pure YAML (via `serde_norway` — the maintained fork of the now-deprecated `serde_yaml`); `Scene`/`Character`/`Location`/`Note` are Markdown files with YAML frontmatter, split/joined by a small hand-rolled `split_frontmatter`/`join_frontmatter` (no crate needed for something this simple). Each frontmatter entity has a private `*Meta` struct (metadata fields only, no prose field) used just for the YAML layer, so the public `Scene`/`Character`/etc. structs stay the real, full domain type. See the tests at the bottom of the file for the exact on-disk shape of every file type and the folder convention (`<book-slug>/chapters/<order>-<chapter-slug>/<order>-<scene-slug>.md`, etc.).
- `src/manuscript/commands.rs` — `create_character` is the first entity-CRUD operation (id via `uuid`, `created_at` via `chrono`, slug-from-name + short id suffix for the filename, writes `<book_dir>/characters/<slug>.md`, returns the created `Character`). Plain function, no Tauri anywhere in this crate — the rest of the CRUD surface (series/book/chapter/scene/location/note create, plus read/update/delete) doesn't exist yet; this is a template for the pattern.
- `src/watcher.rs` — native filesystem watching via the `notify` crate (not a JS/community fs-watch plugin — real OS file-watch APIs, FSEvents/inotify/ReadDirectoryChangesW). `start_watching(state, path, on_event)` watches a directory recursively, invoking `on_event(FileChangeEvent)` per change (`{ kind: "create"|"modify"|"remove"|"other"|"error", paths: string[] }`) — the caller (see `rpc.rs`) supplies the callback, so this module has zero transport dependency. `stop_watching(state)` drops the active watcher (there's no separate unwatch call in `notify` — dropping the `RecommendedWatcher` stops it, see `WatcherState`). The private `watch()` helper is unit-tested directly with `cargo test`; see the tests for why they drain events until a match instead of asserting on the first one received (native watch backends don't guarantee event ordering/first-event-relevance, a real flakiness source hit and fixed here — worth knowing before adding more watcher-dependent tests).
- `src/rpc.rs` — the wire protocol. `Request { id, method, params }` in, `Response { id, result | error }` out, one JSON object per line (newline-delimited) over stdin/stdout; `Notification { method, params }` (no `id`) for server-initiated messages like watcher events. `dispatch(method, params, watcher_state, notifier)` is the method-name router — add a new RPC-callable operation by adding a `match` arm here, not by adding a new Tauri command directly. Both `Request`/`Response`/`Notification` derive `Serialize` _and_ `Deserialize` even though within this crate only one direction is used each — the other direction is used by `src-tauri`'s client side, which imports these same types rather than redeclaring the protocol.
- `src/main.rs` — the actual server: reads stdin line-by-line, calls `dispatch`, writes a `Response` line back. Not yet implemented: walking an existing project directory into these types (so opening a project actually loads it) and the SQLite/FTS5 background index.

**`src-tauri/`** — the Tauri desktop shell. Owns window chrome (`tauri.conf.json`, `capabilities/default.json`) and is a _thin proxy_ to `mythoside-core` — it has no manuscript logic of its own:

- `src/core_client.rs` — `CoreClient::spawn(app)` launches the sibling `mythoside-core` binary as a child process (found next to `current_exe()` — both crates land in the same workspace `target/{debug,release}/`; a `cargo test` harness binary's `current_exe()` is one level down in `target/debug/deps/`, handled as a fallback) and starts a background task reading its stdout: lines with an `id` fulfill a pending request (tracked in a `HashMap<u64, oneshot::Sender<Response>>`), lines without one are `Notification`s re-emitted as real Tauri events (`app.emit("manuscript://file-changed", ...)`) so the frontend-facing behavior is unchanged from before the client/server split. `.call(method, params)` is the one method Tauri commands use to talk to the core process.
- `src/commands.rs` — the actual `#[tauri::command]` functions (`create_character`, `start_watching`, `stop_watching`). Each just serializes its arguments, calls `CoreClient::call`, and deserializes the JSON result back into `mythoside_core`'s own types (`Character`, etc. — imported, never redeclared). Signatures are identical to pre-split, so `src/bindings.ts` didn't need to change shape.
- Not yet solved: production app bundles. A packaged build needs `mythoside-core` bundled as a proper Tauri "sidecar" (`tauri.conf.json`'s `bundle.externalBin`, with the target-triple-suffixed binary naming Tauri's bundler expects) — `resolve_core_binary_path()` only handles the dev-mode same-`target/`-directory case right now.

**TS gets Rust's types via generated bindings, never by hand.** `src-tauri/src/lib.rs` builds a `tauri_specta::Builder` registering every command (`collect_commands![...]`) and exports it to **`src/bindings.ts`** — regenerated by `cargo build`/`cargo run` in debug builds, and also by a dedicated `cargo test` (`tests::exports_typescript_bindings` in `lib.rs`) so it doesn't require running the full windowed app. `src/bindings.ts` itself is generated — never hand-edit it, it says so at the top of the file. Adding a new command means: add the RPC method in `mythoside-core/src/rpc.rs`'s `dispatch`, add a matching thin proxy fn in `src-tauri/src/commands.rs` with both `#[tauri::command]` and `#[specta::specta]` (both required), add it to the `collect_commands![...]` list in `src-tauri/src/lib.rs`, then `cargo test`/`cargo build` to regenerate bindings.

Rust-side testing/quality: `cargo test`/`cargo build`/`cargo fmt -- --check`/`cargo clippy` from the **repo root** now run across the whole workspace (both crates) since the root `Cargo.toml` was added — there's no pre-commit hook wiring these yet (unlike the TS side's `vp check --fix`), so run them manually after Rust changes. `src-tauri`'s test suite includes an integration test (`core_client::tests::spawns_the_real_core_binary_and_round_trips_a_request`) that spawns the actual compiled `mythoside-core` binary and does a real request/response round trip — the thing most likely to silently break if the two crates' `rpc.rs` types ever drift (they can't, today, since `src-tauri` imports them from `mythoside-core` rather than redeclaring them, but this test would catch it if that ever changed). Expect a handful of "never constructed"/"never used" warnings for `Series`/`Book`/`Chapter`/`Scene`/`Location`/`Note`/`NoteType` in `mythoside-core` right now — real code, exercised by tests, just not wired to an RPC method yet (only `Character` is); not a regression to chase down.

**UI is still a blank slate**, post-reset — `src/App.tsx` is `return null`, `src/main.tsx` renders it inside Astryx's `<Theme>` using the **vendor** `@astryxdesign/theme-neutral` package directly (no local `src/design-system/` exists). No `src/viewmodels/` or `src/views/` exist either — and no `src/models/`/`src/core/` either now (that logic lives in `mythoside-core/` now, see above). Zustand is still a dependency if state management is wanted again, but nothing uses it — and any future store should hold UI state or a cache of what `src/bindings.ts` commands return, not reimplement parsing/validation. `src/global.css` (full-viewport reset) is still imported by `main.tsx`.

`src/services/` is unrelated to any of this: `cryptoService.ts` (SHA-256 hashing, unused right now) and `firebase.ts` (configured but unused — see caveat in Project Overview).

**Astryx design system** (`@astryxdesign/core` + `@astryxdesign/theme-neutral`, 149 components, still installed) is available to build the new UI with — component/theme docs via `npx astryx docs <topic>` / `npx astryx component <Name>` / `npx astryx build "<idea>"`. Whether to keep the vendor neutral theme as-is, build a new custom theme (`astryx theme` — see Commands), or reconsider using Astryx's strict component/token rules at all for a solo local-first app is an open decision for whoever picks this back up — don't assume the old rules (no raw `<div>`, tokens-only styling, etc.) are still the agreed direction without checking with the user first.

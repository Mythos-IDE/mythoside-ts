# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Tauri v2 desktop app: a local-first fiction/world-building writing tool (in-app strings previously referenced "Mythos" / "MythosIDE"). "Local-first" is the intended core constraint going forward — no backend server, client-side auth, data stays on device.

**The entire UI layer was intentionally deleted to rebuild from scratch** (`src/views/`, `src/design-system/`, `src/models/`, `src/viewmodels/` are gone). `src/App.tsx` is a bare placeholder (`return null`) and `src/main.tsx` wires the vendor `@astryxdesign/theme-neutral` package directly (no local theme customization exists anymore — see "Architecture"). Do not assume any auth flow, data model, routing, or design-system customization exists; check the actual files before referencing prior behavior. The git history (before this reset) had a working Series → Book → Chapter manuscript model with Zustand-persisted stores and a full auth → dashboard → editor flow — useful as reference for "how was this solved before," not as current state.

`DESIGN.md`'s "Warm Nordic Editorial" direction is considered obsolete, as is a separate dark/purple "Chronicle"-branded mockup found on the org's website repo — **no visual identity is currently decided.** Don't default to either without checking with the user first.

**Target architecture** (per the `Mythos-IDE/mythoside-core` GitHub repo's README/roadmap and the project's own business plan) — status noted per item, see "Architecture" for the implemented parts:

- Data hierarchy: Series → Book → Chapter → **Scene** (the pre-reset TS code stopped at Chapter, no Scene level) — **implemented**, in Rust, in the separate [`mythoside-core`](https://github.com/Mythos-IDE/mythoside-core) repo (`src/manuscript/models.rs` there).
- Source of truth: plain **Markdown files + YAML frontmatter on disk** — not Zustand/localStorage. This is the actual "local-first" guarantee (file ownership, no vendor lock-in) — **implemented** (`mythoside-core`'s `src/manuscript/format.rs`), but only single-file parse/serialize so far, not walking/loading a whole project directory yet.
- **SQLite + FTS5** as a background index/cache only, rebuilt incrementally from file mtimes, never the source of truth — **not started**.
- A ProseMirror- or Monaco-based rich editor (not a plain `<textarea>`) — **not started**, no UI exists at all yet.
- Signature feature: `@Character` inline autocomplete + hover profile cards, a cross-reference panel ("where does X appear"), and a relationship graph (node-link, characters/factions) — **not started**.
- An export engine: DOCX → EPUB → print-ready PDF (with page-size templates), increasing in implementation complexity in that order — **not started**.
- Business model: freemium + one-time "Pro" license (not subscription — conflicts with local-first trust), optional paid cloud sync as a separate recurring layer — a business decision, not code.

Roadmap priority per `mythoside-core`'s pinned issues: project structure → Markdown/YAML file format → SQLite/FTS5 indexing → `@mention` system → cross-reference view → graph/export/Pro tier.

What's untouched by the reset: `src/services/cryptoService.ts` (SHA-256 password hashing via Web Crypto, unused right now) and `src/services/firebase.ts` (`initializeApp` + `getAnalytics` for the real `mythoside` Firebase project — not Firestore/Auth, just usage analytics; not imported anywhere in `src/` yet, so still inert. A previous version of this file pointed at an unrelated Firebase project/db name that was clearly copy-pasted boilerplate — if you see that again, it's wrong, replace it).

**Client/server split, both local, in two separate repos: [`Mythos-IDE/mythoside-core`](https://github.com/Mythos-IDE/mythoside-core) is a standalone server process, `mythoside-ts` (this repo) is its client.** Not the default Tauri-template shape (frontend + thin native shim in one binary) — deliberately two OS processes, two repos. `mythoside-core` owns the manuscript data model, Markdown+YAML parsing/serialization, file watching, and entity CRUD (e.g. `create_character`); the Tauri app (`src-tauri/`) bundles/spawns its binary as a managed sidecar and proxies to it. TS never hand-duplicates Rust's types; see `src/bindings.ts` below.

**Why stdio, not HTTP, between them:** an HTTP server — even bound to `127.0.0.1` — is a listening port any other local process (including, via DNS-rebinding-style tricks, a browser tab) can attempt to reach. For an app whose entire pitch is "your manuscript never leaves this device," that's a real posture cost for zero current benefit (there's no second client — mobile, web — today). `mythoside-core` instead speaks a small JSON-RPC-ish protocol over its own stdin/stdout, readable only by the parent process that spawned it (`src-tauri`) — no port, nothing to probe. If a real second client ever needs the same engine, swapping the transport later is a bounded change; the domain logic wouldn't need to.

Don't put parsing/validation/domain logic in `src/` (TS) or directly in `src-tauri/` — both were tried and reversed on purpose (see git history: `src/core/manuscriptFormat.ts` + `src/models/types.ts`, then `src-tauri/src/manuscript/` before the client/server split). It belongs in the separate [`mythoside-core`](https://github.com/Mythos-IDE/mythoside-core) repo.

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

**Two repos, one dependency direction.** [`Mythos-IDE/mythoside-core`](https://github.com/Mythos-IDE/mythoside-core) is a standalone Rust crate (lib + bin, its own `[workspace]` table so it's never accidentally folded into a parent workspace when checked out elsewhere) with zero Tauri/UI dependency — it owns the manuscript data model, Markdown+YAML parsing, file watching, and entity CRUD. This repo (`mythoside-ts`) is a Cargo workspace of one member, `src-tauri`, which depends on `mythoside-core` as a **git dependency** (`Cargo.toml`: `mythoside-core = { git = "https://github.com/Mythos-IDE/mythoside-core", branch = "main" }`) purely for its shared types, and bundles/spawns its compiled binary as a Tauri **sidecar** process. If you need to change `mythoside-core`'s own logic (models, format, watcher, RPC methods), that happens in _its_ repo/checkout, not here — clone it separately, same as any other upstream dependency.

**`mythoside-core`'s shape** (for context; its own CLAUDE.md/README is authoritative if this drifts):

- `src/manuscript/models.rs` — `Series`/`Book`/`Chapter`/`Scene`/`Character`/`Location`/`Note` structs, each deriving `specta::Type` (needed so `src-tauri` can re-export these exact types to TS — see bindings below) alongside `Serialize`/`Deserialize`. `#[serde(rename_all = "camelCase")]` keeps on-disk YAML keys and generated TS both camelCase while Rust stays snake_case. `created_at` is an RFC-3339 `String` (via `chrono`), not a raw epoch number: keeps on-disk YAML human-readable, and sidesteps specta forbidding 64-bit int export (precision loss) while exporting floats as `number | null` (neither fits a timestamp well).
- `src/manuscript/format.rs` — one `parse_*`/`serialize_*` pair per entity. `series.yaml`/`book.yaml`/`chapter.yaml` are pure YAML (`serde_norway`, the maintained fork of deprecated `serde_yaml`); `Scene`/`Character`/`Location`/`Note` are Markdown + YAML frontmatter, split/joined by a small hand-rolled `split_frontmatter`/`join_frontmatter`. See its tests for the exact on-disk shape and folder convention (`<book-slug>/chapters/<order>-<chapter-slug>/<order>-<scene-slug>.md`, etc.).
- `src/manuscript/commands.rs` — `create_character`, the first entity-CRUD operation. A template for the pattern, not a complete CRUD surface.
- `src/watcher.rs` — native filesystem watching via `notify` (real OS APIs, not a JS fs-watch plugin). `start_watching(state, path, on_event)` takes a plain callback, no transport dependency.
- `src/rpc.rs` — the wire protocol: `Request{id,method,params}` in, `Response{id,result|error}` out, `Notification{method,params}` (no `id`) for server-initiated messages like watcher events — newline-delimited JSON. `dispatch()` is the method-name router.
- `src/main.rs` — the server binary: read a stdin line, dispatch, write a `Response` line.
- Not yet implemented (there): walking an existing project directory into these types, and the SQLite/FTS5 background index.

**`src-tauri/`** — the Tauri desktop shell, a thin proxy with no manuscript logic of its own:

- `src/core_client.rs` — `CoreClient::spawn(app)` launches `mythoside-core` as a Tauri **sidecar** (`app.shell().sidecar(SIDECAR_NAME).spawn()`, from `tauri-plugin-shell`) and reads its `CommandEvent` stream: `Stdout(bytes)` lines with an `id` fulfill a pending request (tracked in `HashMap<u64, oneshot::Sender<Response>>`), lines without one are `Notification`s re-emitted as real Tauri events (`app.emit("manuscript://file-changed", ...)`) — frontend-facing behavior is unchanged from before the client/server split. `.call(method, params)` is what Tauri commands use to talk to the core process. **`SIDECAR_NAME` is `"mythoside-core"` — deliberately _not_ the same string as `tauri.conf.json`'s `bundle.externalBin` entry (`"binaries/mythoside-core"`).** That config value is where the _build_ looks for the source file to bundle (`src-tauri/binaries/mythoside-core-<target-triple>`); at _runtime_, `tauri-plugin-shell` resolves a sidecar relative to the running executable's own directory with the triple stripped and no `binaries/` prefix — confirmed by actually inspecting both a `cargo run` dev session (`target/debug/mythoside-core`, which a plain workspace build already produces) and a real `tauri build` output (`.app/Contents/MacOS/mythoside-core`, sitting right next to the main executable) — don't "fix" this apparent mismatch by making the two strings match, that breaks it.
- `src/commands.rs` — the `#[tauri::command]` functions (`create_character`, `start_watching`, `stop_watching`). Each serializes its arguments, calls `CoreClient::call`, deserializes the result back into `mythoside_core`'s own types (imported, never redeclared).
- `capabilities/default.json` — a `shell:allow-execute` permission scoped to `{ "name": "mythoside-core", "sidecar": true, "args": true }`, required for the sidecar spawn to be allowed at all.

**`scripts/prepare-sidecar.mjs`** — run automatically via `tauri.conf.json`'s `beforeDevCommand`/`beforeBuildCommand` (chained before the existing `npm run dev`/`npm run build`), on every `tauri dev`/`tauri build`. Clones (or fetches + `reset --hard`s) `mythoside-core` into `.mythoside-core-src/` (gitignored, not this repo's source — just a build cache), runs `cargo build` (`--release` when `TAURI_ENV_DEBUG=false`), and copies the resulting binary to `src-tauri/binaries/mythoside-core-<target-triple>[.exe]` — the exact path/name Tauri's bundler validates and packages from. This means `mythoside-core` gets compiled twice on a change (once here for the bundleable binary, once by Cargo as `src-tauri`'s lib dependency) — an accepted duplication: there's no single Cargo build step that produces both a linked lib and a standalone bundle-ready binary for a non-workspace git dependency.

**TS gets Rust's types via generated bindings, never by hand.** `src-tauri/src/lib.rs` builds a `tauri_specta::Builder` registering every command (`collect_commands![...]`) and exports it to **`src/bindings.ts`** — regenerated by `cargo build`/`cargo run` in debug builds, and also by a dedicated `cargo test` (`tests::exports_typescript_bindings` in `lib.rs`) so it doesn't require running the full windowed app. `src/bindings.ts` itself is generated — never hand-edit it, it says so at the top of the file. Adding a new command means: add the RPC method in `mythoside-core`'s `rpc.rs::dispatch` (its own repo), add a matching thin proxy fn in `src-tauri/src/commands.rs` with both `#[tauri::command]` and `#[specta::specta]` (both required), add it to the `collect_commands![...]` list in `src-tauri/src/lib.rs`, then `cargo test`/`cargo build` to regenerate bindings.

Rust-side testing/quality: `cargo test`/`cargo build`/`cargo fmt -- --check`/`cargo clippy` from the **repo root**. There's no pre-commit hook wiring these yet (unlike the TS side's `vp check --fix`), so run them manually after Rust changes. `src-tauri`'s test suite includes an integration test (`core_client::tests::spawns_the_real_core_binary_and_round_trips_a_request`) that locates the same sidecar binary `prepare-sidecar.mjs` produces and spawns it directly (not through `CoreClient`/Tauri, which needs a live `AppHandle`) to do a real request/response round trip — the thing most likely to silently break if `mythoside-core`'s `rpc.rs` protocol ever changes shape upstream without `src-tauri` noticing. Run `node scripts/prepare-sidecar.mjs` at least once before `cargo test` if `src-tauri/binaries/` is empty (fresh clone).

**Both dev and packaged-app sidecar spawning have been verified end-to-end**, not just reasoned about: `npm run tauri dev` and a full `npm run tauri build` (producing a real signed-for-local-use `.app`/`.dmg`) were both run, and in both cases the `mythoside-core` process was confirmed alive via `ps aux` alongside `tauri-app`/the packaged binary.

**UI is still a blank slate**, post-reset — `src/App.tsx` is `return null`, `src/main.tsx` renders it inside Astryx's `<Theme>` using the **vendor** `@astryxdesign/theme-neutral` package directly (no local `src/design-system/` exists). No `src/viewmodels/` or `src/views/` exist either — and no `src/models/`/`src/core/` either now (that logic lives in the separate `mythoside-core` repo now, see above). Zustand is still a dependency if state management is wanted again, but nothing uses it — and any future store should hold UI state or a cache of what `src/bindings.ts` commands return, not reimplement parsing/validation. `src/global.css` (full-viewport reset) is still imported by `main.tsx`.

`src/services/` is unrelated to any of this: `cryptoService.ts` (SHA-256 hashing, unused right now) and `firebase.ts` (configured but unused — see caveat in Project Overview).

**Astryx design system** (`@astryxdesign/core` + `@astryxdesign/theme-neutral`, 149 components, still installed) is available to build the new UI with — component/theme docs via `npx astryx docs <topic>` / `npx astryx component <Name>` / `npx astryx build "<idea>"`. Whether to keep the vendor neutral theme as-is, build a new custom theme (`astryx theme` — see Commands), or reconsider using Astryx's strict component/token rules at all for a solo local-first app is an open decision for whoever picks this back up — don't assume the old rules (no raw `<div>`, tokens-only styling, etc.) are still the agreed direction without checking with the user first.

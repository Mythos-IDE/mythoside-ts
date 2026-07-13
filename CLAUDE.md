# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Tauri v2 desktop app: a local-first fiction/world-building writing tool (in-app strings previously referenced "Mythos" / "MythosIDE"). "Local-first" is the intended core constraint going forward — no backend server, client-side auth, data stays on device.

**The entire UI layer was intentionally deleted to rebuild from scratch** (`src/views/`, `src/design-system/`, `src/models/`, `src/viewmodels/` are gone). `src/App.tsx` is a bare placeholder (`return null`) and `src/main.tsx` wires the vendor `@astryxdesign/theme-neutral` package directly (no local theme customization exists anymore — see "Architecture"). Do not assume any auth flow, data model, routing, or design-system customization exists; check the actual files before referencing prior behavior. The git history (before this reset) had a working Series → Book → Chapter manuscript model with Zustand-persisted stores and a full auth → dashboard → editor flow — useful as reference for "how was this solved before," not as current state.

`DESIGN.md` still describes a "Warm Nordic Editorial" visual direction (warm desk/paper palette, terracotta accent, serif editor font) from before the reset. It is a design brief, not implemented code right now — decide with the user whether to follow it when rebuilding, rather than assuming it's already wired in.

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

**Frontend is currently a blank slate**, post-reset:

- `src/App.tsx` — `return null`. No routing, no auth gate, nothing rendered. Replace this once there's a first real screen.
- `src/main.tsx` — renders `<App />` inside Astryx's `<Theme>` using the **vendor** `@astryxdesign/theme-neutral` package directly (`theme.css` + `/built` import), not a local custom theme — there is no `src/design-system/` anymore. This mirrors the project's very first scaffold commit, before any local theme customization existed.
- No `src/models/`, `src/viewmodels/`, `src/views/`, or `src/design-system/` exist. Zustand is still a dependency (`package.json`) if state management is wanted again, but nothing currently uses it.
- `src/services/` survived the reset: `cryptoService.ts` (SHA-256 password hashing via Web Crypto, unused right now but self-contained and reusable) and `firebase.ts` (configured but unused Firebase client — see caveat in Project Overview).
- `src/global.css` (html/body/#root full-viewport reset) is still imported by `main.tsx`.

**Astryx design system** (`@astryxdesign/core` + `@astryxdesign/theme-neutral`, 149 components, still installed) is available to build the new UI with — component/theme docs via `npx astryx docs <topic>` / `npx astryx component <Name>` / `npx astryx build "<idea>"`. Whether to keep the vendor neutral theme as-is, build a new custom theme (`astryx theme` — see Commands), or reconsider using Astryx's strict component/token rules at all for a solo local-first app is an open decision for whoever picks this back up — don't assume the old rules (no raw `<div>`, tokens-only styling, etc.) are still the agreed direction without checking with the user first.

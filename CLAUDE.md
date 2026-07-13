# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Tauri v2 desktop app: a local-first fiction/world-building writing tool (in-app strings reference "Mythos" — e.g. placeholder email `author@mythos.com`, the auth localStorage key `mythoside-vault`). "Local-first" is a real constraint here, not a slogan: auth is entirely client-side (email + SHA-256 password hash persisted via Zustand to localStorage, see `src/viewmodels/useAppStore.ts`), and there is no backend server anywhere in the stack.

The project is very early-stage: the Rust side is still the unmodified Tauri template (one `greet` IPC command), and the frontend currently only renders a login screen — see "Current State" below before assuming any feature exists.

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
```

## Architecture

**Two processes.** `src-tauri/` is the Rust/Tauri shell (window chrome, native IPC commands, `tauri.conf.json` for window/bundle config, `capabilities/default.json` for the permission allowlist). `src/` is the React 19 + TypeScript frontend that runs inside the Tauri webview. They talk via `#[tauri::command]` functions in `src-tauri/src/lib.rs` invoked from the frontend through `@tauri-apps/api`; currently only the template's `greet` command exists, so there is no established pattern yet for real IPC calls — pick one when the first real command is added.

**Frontend layering** follows a light MVVM split, one directory per layer:

- `src/models/` — plain TS interfaces only (`Project`, `Character`, `Location`, `Document`). No logic.
- `src/viewmodels/` — Zustand stores; this is where state _and_ actions live (not just data). `useAppStore` (auth/session, persisted), `useProjectStore` (project/character/location/document domain data — currently seeded with dummy content), `useWorkspaceStore` (transient UI state: active doc/character id, sidebar toggle — not persisted).
- `src/views/` — React components, organized by feature area (e.g. `views/auth/`).
- `src/services/` — framework-agnostic helper logic (e.g. `cryptoService.ts`).
- `src/design-system/` — the local Astryx neutral theme (`neutralTheme.ts`, generated CSS/JS/d.ts — treat as generated, don't hand-edit) plus custom icons.

`App.tsx` is the root switch: it reads `useAppStore().isAuthenticated` and renders `LoginView` when false. **There is currently no `else` branch** — a previous `views/EditorLayout.tsx` (the post-login workspace) was deleted in the working tree and not yet replaced, so the authenticated state renders nothing. Building/restoring that workspace view is the obvious next real task in this codebase.

**Design system rules (Astryx, `@astryxdesign/core` + `@astryxdesign/theme-neutral`, 149 components).** These are hard constraints, not suggestions:

- No raw `<div>` for layout/spacing — components do that. Full page → `AppShell`; sidebar nav → `SideNav`.
- Pick the shell and budget regions in px _before_ writing content.
- Dense data (lists/tables) → `Table`/`List`+`Item` edge-to-edge, never `Card`-wrapped. `Card` is for dashboard widgets/galleries/settings groups only.
- Status → `StatusDot`/`Token`; `Badge` only for counts/enumerated states, never decoration.
- Styling: component props first, else `style`/`className` using tokens (`var(--color-*)`, `--spacing-*`, `--radius-*`). No raw hex/px, no Tailwind/utility-class usage (not wired into this project).
- Theming goes through `astryx theme`, never by overriding `--color-*` in `:root`.
- Reset/base CSS (`@astryxdesign/core/reset.css`, `astryx.css`) is imported once in `src/main.tsx` — don't re-import per component.

Note: `src/views/auth/LoginView.tsx` predates/bypasses these rules (raw `<div>`s, inline `CSSProperties` objects, hardcoded hex colors) — treat it as legacy, not as the pattern to copy for new views.

**State management:** Zustand only (no Redux/Context-based global state). Only `useAppStore` uses the `persist` middleware; `useProjectStore`/`useWorkspaceStore` are in-memory and reset on reload.

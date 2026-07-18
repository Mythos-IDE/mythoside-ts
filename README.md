<div align="center">
  <img src="assets/readme/hero.svg" alt="MythosIDE Desktop — the Tauri + React client where novelists write" width="100%" />
</div>

# MythosIDE Desktop (`mythoside-ts`)

[![License: FSL-1.1-ALv2](https://img.shields.io/badge/license-FSL--1.1--ALv2-C9A24B)](./LICENSE.md)

<p align="center">English · <a href="./README.TR.md">Türkçe</a></p>

<p align="center">
  <a href="https://github.com/Mythos-IDE">Ecosystem</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/Mythos-IDE/mythoside-core">Core engine</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/Mythos-IDE/mythoside-website">Website</a>
</p>

The desktop client for **MythosIDE** — the calm, editor-like surface where novelists actually write. It's a Tauri + React + TypeScript app that hosts the [`mythoside-core`](https://github.com/Mythos-IDE/mythoside-core) Rust engine as a managed **sidecar** and proxies to it, so all the heavy lifting (parsing, file watching, relationships) stays in the engine and this repo stays focused on the interface.

> **Status:** early development. The UI is being rebuilt; expect rough edges.

## How it fits together

```text
mythoside-ts (this repo)          mythoside-core (sidecar)
┌───────────────────────┐  stdio  ┌────────────────────────┐
│  React 19 UI + editor │ ◂─────▸ │  Rust engine, no port   │
│  Tauri shell          │  JSON   │  Markdown + YAML on disk│
└───────────────────────┘  -RPC   └────────────────────────┘
```

The engine never opens a network port — the app talks to it over standard input/output, so your world stays a private local process.

## Stack

| Layer | Tooling |
| --- | --- |
| Shell | Tauri 2 |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Build | Vite |
| Data | Proxies to the local `mythoside-core` binary via a managed sidecar |

## Run locally

You'll need Node.js, npm, Rust, and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your platform.

```bash
git clone https://github.com/Mythos-IDE/mythoside-ts.git
cd mythoside-ts
npm install
npm run tauri dev
```

## Project layout

```text
src/         React frontend — components, hooks, editor surface
src-tauri/   Tauri setup, sidecar management, and the Rust ↔ TS bridge
```

## License

Source-available under the [Functional Source License, v1.1 (ALv2 Future License)](./LICENSE.md) — use, read, modify, and self-host it for your own writing; you just can't repackage it as a competing product. Each release converts to Apache 2.0 two years after publication.

## Contributing & security

See [CONTRIBUTING.md](https://github.com/Mythos-IDE/.github/blob/main/CONTRIBUTING.md) and [SECURITY.md](https://github.com/Mythos-IDE/.github/blob/main/SECURITY.md).

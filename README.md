<div align="center">
  <img src="assets/readme/hero.svg" alt="MythosIDE Desktop Client" width="100%" />
</div>

# MythosIDE Desktop Client (`mythoside-ts`)

This repository is the graphical frontend for MythosIDE, built with Tauri, React, and TypeScript.

It serves as a sidecar host to the [`mythoside-core`](https://github.com/Mythos-IDE/mythoside-core) Rust engine. It provides the distraction-free, editor-like experience where novelists actually write, while the heavy lifting of data modeling and relationships is delegated to the core engine.

## Stack

- **Framework**: Tauri 2 + Vite
- **UI**: React 19, TypeScript, Tailwind CSS v4
- **Backend**: Proxies to the local `mythoside-core` binary via a managed sidecar process

## Running Locally

To run the desktop application, you need Node.js, npm, Rust, and Tauri dependencies.

```bash
# Clone the repository
git clone https://github.com/Mythos-IDE/mythoside-ts.git
cd mythoside-ts

# Install dependencies
npm install

# Start the desktop app in development mode
npm run tauri dev
```

## Architecture

- `src/` — React frontend, components, and hooks.
- `src-tauri/` — Tauri application setup, sidecar management, and Rust-to-TS bridge.

## License

MythosIDE is source-available under the [Functional Source License, v1.1 (ALv2 Future License)](./LICENSE.md).

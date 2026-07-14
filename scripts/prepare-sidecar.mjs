#!/usr/bin/env node
// Builds mythoside-core (from its own repo — see CLAUDE.md) and copies the
// resulting binary into src-tauri/binaries/ under the filename Tauri's
// "sidecar" convention expects: <name>-<target-triple>[.exe]. Run
// automatically via tauri.conf.json's beforeDevCommand/beforeBuildCommand —
// Tauri's bundler only picks up externalBin entries from that exact
// path/name shape, in both dev and packaged builds.
//
// mythoside-core is a git dependency of src-tauri (for the shared Rust
// types), not a workspace member, so `cargo build -p mythoside-core` isn't
// available here — this script clones/updates its own throwaway build
// checkout instead (.mythoside-core-src/, gitignored) and builds the
// standalone binary from there. That means mythoside-core gets compiled
// twice on a change (once as src-tauri's lib dependency, once here for the
// bundleable binary) — an accepted duplication, not an oversight; there's
// no single Cargo build step that produces both a linked lib and a
// standalone bundle-ready binary for a non-workspace dependency.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const CORE_REPO = "https://github.com/Mythos-IDE/mythoside-core.git";
const CORE_BRANCH = "main";
const coreCheckoutDir = join(rootDir, ".mythoside-core-src");

function hostTriple() {
  const output = execFileSync("rustc", ["-vV"], { encoding: "utf8" });
  const match = output.match(/^host: (\S+)$/m);
  if (!match) {
    throw new Error("could not determine host target triple from `rustc -vV`");
  }
  return match[1];
}

if (!existsSync(join(coreCheckoutDir, ".git"))) {
  execFileSync("git", ["clone", "--branch", CORE_BRANCH, CORE_REPO, coreCheckoutDir], {
    stdio: "inherit",
  });
} else {
  execFileSync("git", ["fetch", "origin", CORE_BRANCH], { cwd: coreCheckoutDir, stdio: "inherit" });
  execFileSync("git", ["reset", "--hard", `origin/${CORE_BRANCH}`], {
    cwd: coreCheckoutDir,
    stdio: "inherit",
  });
}

const isRelease = process.env.TAURI_ENV_DEBUG === "false";
const profile = isRelease ? "release" : "debug";
const triple = process.env.TAURI_ENV_TARGET_TRIPLE ?? hostTriple();
const isWindows = triple.includes("windows");
const binaryExt = isWindows ? ".exe" : "";

execFileSync("cargo", ["build", ...(isRelease ? ["--release"] : [])], {
  cwd: coreCheckoutDir,
  stdio: "inherit",
});

const source = join(coreCheckoutDir, "target", profile, `mythoside-core${binaryExt}`);
if (!existsSync(source)) {
  throw new Error(
    `expected mythoside-core binary at ${source} after cargo build, but it's missing`,
  );
}

const binariesDir = join(rootDir, "src-tauri", "binaries");
mkdirSync(binariesDir, { recursive: true });

const destination = join(binariesDir, `mythoside-core-${triple}${binaryExt}`);
copyFileSync(source, destination);
console.log(`prepare-sidecar: ${source} -> ${destination}`);

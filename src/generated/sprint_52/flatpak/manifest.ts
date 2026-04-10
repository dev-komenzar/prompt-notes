// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 52-1
// @task-title: Flatpak でインストール・起動可能
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import type { FlatpakManifest } from "./types";

export const APP_ID = "com.promptnotes.PromptNotes";
export const RUNTIME = "org.gnome.Platform";
export const SDK = "org.gnome.Sdk";
export const RUNTIME_VERSION = "47";

export function buildManifest(version: string, sourceRef: string): FlatpakManifest {
  return {
    id: APP_ID,
    runtime: RUNTIME,
    "runtime-version": RUNTIME_VERSION,
    sdk: SDK,
    command: "promptnotes",
    "finish-args": [
      // Display and input
      "--socket=wayland",
      "--socket=fallback-x11",
      "--device=dri",
      "--share=ipc",
      // Notes storage: default dir and user home for custom dir via settings
      "--filesystem=~/.local/share/promptnotes:create",
      "--filesystem=home",
      // Clipboard access (for 1-click copy button — core UX)
      "--socket=pulseaudio",
      // No network: PromptNotes is fully local, no cloud sync
    ],
    "build-options": {
      "append-path": "/usr/lib/sdk/rust-stable/bin:/usr/lib/sdk/node20/bin",
      env: {
        CARGO_HOME: "/run/build/promptnotes/cargo",
        RUSTUP_HOME: "/run/build/promptnotes/rustup",
        npm_config_cache: "/run/build/promptnotes/npm-cache",
      },
    },
    cleanup: [
      "/include",
      "/lib/pkgconfig",
      "/man",
      "/share/doc",
      "/share/gtk-doc",
      "/share/man",
      "/share/pkgconfig",
      "*.la",
      "*.a",
    ],
    modules: [
      rustSdkExtensionModule(),
      nodeSdkExtensionModule(),
      promptNotesModule(version, sourceRef),
    ],
  };
}

function rustSdkExtensionModule() {
  return {
    name: "rust-stable",
    buildsystem: "simple",
    "build-commands": [],
    sources: [] as never[],
  };
}

function nodeSdkExtensionModule() {
  return {
    name: "node20",
    buildsystem: "simple",
    "build-commands": [],
    sources: [] as never[],
  };
}

function promptNotesModule(version: string, sourceRef: string) {
  return {
    name: "promptnotes",
    buildsystem: "simple",
    "build-options": {
      env: {
        CARGO_TARGET_X86_64_UNKNOWN_LINUX_GNU_LINKER: "x86_64-unknown-linux-gnu-gcc",
        CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER: "aarch64-unknown-linux-gnu-gcc",
      },
    },
    "build-commands": [
      // Install npm dependencies
      "npm ci --offline",
      // Build the Tauri app for Linux
      "npm run tauri build -- --bundles deb",
      // Install the binary
      "install -Dm755 src-tauri/target/release/promptnotes ${FLATPAK_DEST}/bin/promptnotes",
      // Install desktop entry
      `install -Dm644 packaging/linux/${APP_ID}.desktop ${FLATPAK_DEST}/share/applications/${APP_ID}.desktop`,
      // Install AppStream metadata
      `install -Dm644 packaging/linux/${APP_ID}.appdata.xml ${FLATPAK_DEST}/share/appdata/${APP_ID}.appdata.xml`,
      // Install icon
      `install -Dm644 src-tauri/icons/128x128.png ${FLATPAK_DEST}/share/icons/hicolor/128x128/apps/${APP_ID}.png`,
      `install -Dm644 src-tauri/icons/32x32.png ${FLATPAK_DEST}/share/icons/hicolor/32x32/apps/${APP_ID}.png`,
    ],
    sources: [
      {
        type: "git" as const,
        url: "https://github.com/dev-komenzar/promptnotes.git",
        tag: `v${version}`,
        commit: sourceRef,
      },
      {
        type: "file" as const,
        path: "npm-deps/package-lock.json",
        dest: ".",
        "dest-filename": "package-lock.json",
      },
    ],
  };
}

export function renderYaml(manifest: FlatpakManifest): string {
  const lines: string[] = [];
  lines.push(`id: ${manifest.id}`);
  lines.push(`runtime: ${manifest.runtime}`);
  lines.push(`runtime-version: '${manifest["runtime-version"]}'`);
  lines.push(`sdk: ${manifest.sdk}`);
  lines.push(`command: ${manifest.command}`);
  lines.push("");
  lines.push("finish-args:");
  for (const arg of manifest["finish-args"]) {
    lines.push(`  - ${arg}`);
  }
  lines.push("");

  if (manifest["build-options"]) {
    const opts = manifest["build-options"];
    lines.push("build-options:");
    if (opts["append-path"]) {
      lines.push(`  append-path: ${opts["append-path"]}`);
    }
    if (opts.env) {
      lines.push("  env:");
      for (const [k, v] of Object.entries(opts.env)) {
        lines.push(`    ${k}: ${v}`);
      }
    }
    lines.push("");
  }

  if (manifest.cleanup?.length) {
    lines.push("cleanup:");
    for (const item of manifest.cleanup) {
      lines.push(`  - '${item}'`);
    }
    lines.push("");
  }

  lines.push("modules:");
  for (const mod of manifest.modules) {
    lines.push(`  - name: ${mod.name}`);
    if (mod.buildsystem) {
      lines.push(`    buildsystem: ${mod.buildsystem}`);
    }
    if (mod["build-commands"]?.length) {
      lines.push("    build-commands:");
      for (const cmd of mod["build-commands"]) {
        lines.push(`      - ${JSON.stringify(cmd)}`);
      }
    }
    if (mod["build-options"]) {
      const bo = mod["build-options"] as Record<string, unknown>;
      lines.push("    build-options:");
      if (bo.env) {
        lines.push("      env:");
        for (const [k, v] of Object.entries(bo.env as Record<string, string>)) {
          lines.push(`        ${k}: ${v}`);
        }
      }
    }
    if (mod.sources?.length) {
      lines.push("    sources:");
      for (const src of mod.sources) {
        lines.push(`      - type: ${src.type}`);
        if (src.url) lines.push(`        url: ${src.url}`);
        if (src.tag) lines.push(`        tag: ${src.tag}`);
        if (src.commit) lines.push(`        commit: ${src.commit}`);
        if (src.path) lines.push(`        path: ${src.path}`);
        if (src.dest) lines.push(`        dest: ${src.dest}`);
        if (src["dest-filename"]) lines.push(`        dest-filename: ${src["dest-filename"]}`);
      }
    }
  }

  return lines.join("\n") + "\n";
}

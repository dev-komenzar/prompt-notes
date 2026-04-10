// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 53-1
// @task-title: NixOS でインストール・起動可能
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// Sprint 53 — NixOS derivation types and constants

export interface NixPackageMeta {
  pname: string;
  version: string;
  description: string;
  longDescription: string;
  homepage: string;
  license: string;
  platforms: string[];
  maintainers: string[];
}

export const PACKAGE_META: NixPackageMeta = {
  pname: "promptnotes",
  version: "0.1.0",
  description: "A local note-taking app for AI prompts",
  longDescription: `
    PromptNotes is a minimal desktop note-taking application
    designed to quickly capture prompts for AI tools.
    Built with Tauri (Rust + WebView) and Svelte.
    All data is stored locally as .md files.
  `,
  homepage: "https://github.com/dev-komenzar/promptnotes",
  license: "MIT",
  platforms: ["x86_64-linux", "aarch64-linux"],
  maintainers: [],
};

/** System library dependencies required by Tauri on NixOS (webkit2gtk + GTK3 stack) */
export const TAURI_SYSTEM_DEPS = [
  "pkg-config",
  "openssl",
  "openssl.dev",
  "webkit2gtk_4_1",
  "gtk3",
  "glib-networking",
  "gdk-pixbuf",
  "librsvg",
  "libayatana-appindicator",
  "xdotool",
] as const;

/** Runtime-only wrapping libs for the installed binary */
export const TAURI_RUNTIME_LIBS = [
  "webkit2gtk_4_1",
  "gtk3",
  "glib-networking",
  "openssl",
  "gdk-pixbuf",
  "librsvg",
  "libayatana-appindicator",
] as const;

export type TauriSystemDep = (typeof TAURI_SYSTEM_DEPS)[number];
export type TauriRuntimeLib = (typeof TAURI_RUNTIME_LIBS)[number];

export interface NixBuildEnv {
  /** Passed as PKG_CONFIG_PATH */
  pkgConfigPath: string;
  /** Disable compositing to avoid GPU crashes in CI / headless NixOS */
  webkitDisableCompositingMode: boolean;
  /** GIO_MODULE_DIR so glib-networking TLS works */
  gioModuleDir: string;
}

export const DEFAULT_BUILD_ENV: NixBuildEnv = {
  pkgConfigPath: "${pkgs.openssl.dev}/lib/pkgconfig:${pkgs.glib.dev}/lib/pkgconfig:${pkgs.webkit2gtk_4_1.dev}/lib/pkgconfig",
  webkitDisableCompositingMode: true,
  gioModuleDir: "${pkgs.glib-networking}/lib/gio/modules",
};

export interface DesktopEntry {
  name: string;
  genericName: string;
  exec: string;
  icon: string;
  comment: string;
  categories: string[];
  terminal: boolean;
  startupNotify: boolean;
  startupWmClass: string;
}

export const DESKTOP_ENTRY: DesktopEntry = {
  name: "PromptNotes",
  genericName: "Note Taking",
  exec: "promptnotes %U",
  icon: "promptnotes",
  comment: "Local note-taking app for AI prompts",
  categories: ["Utility", "TextEditor"],
  terminal: false,
  startupNotify: true,
  startupWmClass: "promptnotes",
};

/** Generate the .desktop file content from the entry definition */
export function renderDesktopEntry(entry: DesktopEntry): string {
  return [
    "[Desktop Entry]",
    "Type=Application",
    "Version=1.0",
    `Name=${entry.name}`,
    `GenericName=${entry.genericName}`,
    `Exec=${entry.exec}`,
    `Icon=${entry.icon}`,
    `Comment=${entry.comment}`,
    `Categories=${entry.categories.join(";")};`,
    `Terminal=${entry.terminal}`,
    `StartupNotify=${entry.startupNotify}`,
    `StartupWMClass=${entry.startupWmClass}`,
  ].join("\n");
}

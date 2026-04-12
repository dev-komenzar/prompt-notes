// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 58-1
// @task-title: パッケージング
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @generated-by: codd implement --sprint 58

export interface NixDerivationConfig {
  pname: string;
  version: string;
  description: string;
  homepage: string;
  license: string;
  platforms: string[];
  cargoHash: string;
  npmDepsHash: string;
  buildInputs: {
    linux: string[];
    darwin: string[];
    common: string[];
  };
  nativeBuildInputs: string[];
  runtimeDependencies: {
    linux: string[];
    darwin: string[];
  };
  env: Record<string, string>;
  meta: {
    mainProgram: string;
    longDescription: string;
  };
}

export const derivationConfig: NixDerivationConfig = {
  pname: "promptnotes",
  version: "0.1.0",
  description: "A local desktop note-taking app for storing AI prompts quickly",
  homepage: "https://github.com/dev-komenzar/promptnotes",
  license: "MIT",
  // Targets Linux and macOS; Windows is out of scope per platform conventions.
  platforms: ["x86_64-linux", "aarch64-linux", "x86_64-darwin", "aarch64-darwin"],
  // Placeholder hashes — update after first build with `lib.fakeHash` substitution.
  cargoHash: "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  npmDepsHash: "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  buildInputs: {
    // Linux runtime: Tauri requires WebKitGTK for the WebView layer (framework:tauri).
    linux: [
      "webkitgtk_4_1",
      "gtk3",
      "libsoup_3",
      "glib",
      "cairo",
      "pango",
      "atk",
      "gdk-pixbuf",
      "openssl",
      "librsvg",
    ],
    // macOS: WKWebView is provided by the OS; only supplemental libs needed.
    darwin: [
      "darwin.apple_sdk.frameworks.WebKit",
      "darwin.apple_sdk.frameworks.AppKit",
      "darwin.apple_sdk.frameworks.CoreServices",
      "darwin.apple_sdk.frameworks.Security",
      "darwin.apple_sdk.frameworks.SystemConfiguration",
      "libiconv",
    ],
    common: ["openssl"],
  },
  nativeBuildInputs: [
    "pkg-config",
    "rustPlatform.cargoSetupHook",
    "cargo",
    "rustc",
    "nodejs",
    "pnpm.configHook",
    "wrapGAppsHook",
  ],
  runtimeDependencies: {
    // dbus-glib and at-spi2-atk are needed at runtime on Linux for accessibility/IPC.
    linux: ["dbus", "at-spi2-atk", "xdg-utils"],
    darwin: [],
  },
  env: {
    // Allow Tauri to locate WebKitGTK on Linux via pkg-config.
    PKG_CONFIG_ALLOW_CROSS: "1",
    // Ensure the Tauri build picks up the correct target directory.
    CARGO_BUILD_TARGET_DIR: "target",
  },
  meta: {
    mainProgram: "promptnotes",
    longDescription: `
      PromptNotes is a local-only desktop note application designed for quickly
      capturing AI prompts. It provides a distraction-free plain-text editor
      (CodeMirror 6), a Pinterest-style grid overview with full-text search,
      and one-click clipboard copy of note body. All data is stored as local
      Markdown files; no cloud sync or AI API calls are performed.
      Built with Tauri (Rust + WebView) and Svelte.
    `,
  },
};

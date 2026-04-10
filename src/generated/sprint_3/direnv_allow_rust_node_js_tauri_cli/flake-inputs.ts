// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 3-1
// @task-title: `direnv allow` 後に Rust ツールチェイン・Node.js・Tauri CLI がすべて利用可能
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 3
// @task: 3-1
// @description: Nix flake devShell package declarations for PromptNotes development environment

export interface NixPackageSpec {
  readonly nixpkgsAttr: string;
  readonly purpose: string;
  readonly module: string;
}

/**
 * Canonical list of nix packages required in the flake.nix devShell.
 * This serves as the source of truth for what `flake.nix` must provide
 * so that `direnv allow` results in a fully functional dev environment.
 *
 * Platform targets: linux, macos (darwin).
 * Windows is explicitly out of scope.
 */
export const FLAKE_DEV_PACKAGES: readonly NixPackageSpec[] = [
  {
    nixpkgsAttr: 'rustc',
    purpose: 'Rust compiler for Tauri backend',
    module: 'shell',
  },
  {
    nixpkgsAttr: 'cargo',
    purpose: 'Rust package manager',
    module: 'shell',
  },
  {
    nixpkgsAttr: 'rust-analyzer',
    purpose: 'Rust LSP for development',
    module: 'shell',
  },
  {
    nixpkgsAttr: 'nodejs',
    purpose: 'Node.js runtime for Svelte frontend',
    module: 'editor',
  },
  {
    nixpkgsAttr: 'nodePackages.npm',
    purpose: 'Node package manager',
    module: 'editor',
  },
  {
    nixpkgsAttr: 'cargo-tauri',
    purpose: 'Tauri CLI for `tauri dev` and `tauri build`',
    module: 'shell',
  },
  {
    nixpkgsAttr: 'pkg-config',
    purpose: 'Build dependency resolution for native libraries',
    module: 'shell',
  },
  {
    nixpkgsAttr: 'openssl',
    purpose: 'TLS library required by Tauri build',
    module: 'shell',
  },
  {
    nixpkgsAttr: 'webkitgtk',
    purpose: 'WebView backend for Tauri on Linux',
    module: 'shell',
  },
  {
    nixpkgsAttr: 'gtk3',
    purpose: 'GTK3 for Tauri window management on Linux',
    module: 'shell',
  },
  {
    nixpkgsAttr: 'libsoup',
    purpose: 'HTTP library required by WebKitGTK',
    module: 'shell',
  },
  {
    nixpkgsAttr: 'glib-networking',
    purpose: 'GIO networking module for libsoup',
    module: 'shell',
  },
] as const;

/**
 * Linux-only packages (not needed on macOS where WebView is provided by the OS).
 */
export const LINUX_ONLY_PACKAGES: readonly string[] = [
  'webkitgtk',
  'gtk3',
  'libsoup',
  'glib-networking',
] as const;

/**
 * Generates the expected nix `buildInputs` / `nativeBuildInputs` attribute list
 * suitable for embedding in flake.nix devShell.
 */
export function generateNixPackageList(targetPlatform: 'linux' | 'darwin'): readonly NixPackageSpec[] {
  if (targetPlatform === 'darwin') {
    return FLAKE_DEV_PACKAGES.filter(
      (pkg) => !(LINUX_ONLY_PACKAGES as readonly string[]).includes(pkg.nixpkgsAttr),
    );
  }
  return FLAKE_DEV_PACKAGES;
}

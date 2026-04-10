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
// @description: .envrc template content for direnv integration with nix flake

/**
 * The canonical `.envrc` content for PromptNotes.
 * After placing this file in the project root and running `direnv allow`,
 * the nix flake devShell is activated, providing:
 *   - Rust toolchain (rustc, cargo)
 *   - Node.js + npm
 *   - Tauri CLI (cargo-tauri)
 *   - Platform-specific native dependencies (WebKitGTK on Linux, etc.)
 */
export const ENVRC_CONTENT = `# PromptNotes development environment
# Requires: nix (with flakes enabled) + direnv
# Run \`direnv allow\` after cloning to activate.

if has nix; then
  use flake
else
  echo "WARNING: nix not found. Install nix with flakes support for the dev environment."
  echo "See: https://nixos.org/download.html"
fi
` as const;

/**
 * Minimal flake.nix shell snippet for reference.
 * The actual flake.nix lives at the project root; this constant
 * documents the expected devShell structure.
 */
export const FLAKE_NIX_DEVSHELL_TEMPLATE = `{
  description = "PromptNotes development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs { inherit system overlays; };
        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rust-analyzer" ];
          targets = [];
        };
      in {
        devShells.default = pkgs.mkShell {
          nativeBuildInputs = with pkgs; [
            rustToolchain
            cargo-tauri
            nodejs
            nodePackages.npm
            pkg-config
          ];

          buildInputs = with pkgs; [
            openssl
          ] ++ pkgs.lib.optionals pkgs.stdenv.isLinux [
            webkitgtk
            gtk3
            libsoup
            glib-networking
          ] ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
            darwin.apple_sdk.frameworks.WebKit
            darwin.apple_sdk.frameworks.AppKit
          ];

          shellHook = ''
            echo "PromptNotes dev environment loaded"
            echo "  rustc: $(rustc --version)"
            echo "  node:  $(node --version)"
            echo "  cargo-tauri: $(cargo-tauri --version 2>/dev/null || echo 'not found')"
          '';
        };
      });
}` as const;

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

/**
 * Generates the flake.nix overlay fragment for promptnotes.
 *
 * Users can consume this package in their NixOS configuration by adding
 * the promptnotes flake as an input and using the overlay or the package
 * output directly.
 *
 * Platform support: Linux and macOS only (Windows excluded per requirements).
 */
function renderFlakeNix(): string {
  return `{
  description = "PromptNotes — local AI-prompt note-taking app (Tauri + Svelte)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    # Windows is out of scope; restrict to Linux and macOS systems.
    flake-utils.lib.eachSystem [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ]
      (system:
        let
          overlays = [ (import rust-overlay) ];
          pkgs = import nixpkgs { inherit system overlays; };

          # Pin the Rust toolchain to the version declared in rust-toolchain.toml.
          rustToolchain = pkgs.rust-bin.fromRustupToolchainFile ./rust-toolchain.toml;

          promptnotes = pkgs.callPackage ./nix/default.nix {
            # Override cargo / rustc with the pinned toolchain so the derivation
            # uses the same version as the dev environment.
            cargo = rustToolchain;
            rustc = rustToolchain;
          };
        in
        {
          packages = {
            default = promptnotes;
            inherit promptnotes;
          };

          # Development shell: provides all build-time dependencies for
          # \`nix develop\` / direnv integration.
          devShells.default = pkgs.mkShell {
            inputsFrom = [ promptnotes ];
            packages = [
              rustToolchain
              pkgs.cargo-tauri
              pkgs.nodejs
              pkgs.pnpm
            ];
          };

          # NixOS module for system-wide installation.
          nixosModules.default = { config, lib, pkgs, ... }: {
            options.programs.promptnotes = {
              enable = lib.mkEnableOption "PromptNotes AI prompt note-taking app";
            };
            config = lib.mkIf config.programs.promptnotes.enable {
              environment.systemPackages = [ promptnotes ];
            };
          };
        });
}
`;
}

if (require.main === module) {
  process.stdout.write(renderFlakeNix());
}

export { renderFlakeNix };

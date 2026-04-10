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

// @generated-from: docs/design/system_design.md, docs/governance/adr_tech_stack.md
// Sprint 53 — Generates flake.nix content for NixOS packaging

import { PACKAGE_META, DEFAULT_BUILD_ENV, TAURI_SYSTEM_DEPS } from "./nix-derivation";

/** The full flake.nix text for development shell + installable package */
export function generateFlakeNix(): string {
  return `# This file is generated — see src/generated/sprint_53/nixos/flake-generator.ts
# Run: node -e "require('./src/generated/sprint_53/nixos/flake-generator.js').writeFlakeNix()" to refresh.
{
  description = "${PACKAGE_META.description}";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, rust-overlay, flake-utils }:
    flake-utils.lib.eachSystem [ ${PACKAGE_META.platforms.map((p) => `"${p}"`).join(" ")} ] (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs { inherit system overlays; };

        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rust-analyzer" ];
        };

        tauriSystemDeps = with pkgs; [
          ${TAURI_SYSTEM_DEPS.map((d) => `          ${d}`).join("\n").trimStart()}
        ];

        # Build the frontend assets (Svelte/Vite) before the Rust build
        frontendAssets = pkgs.buildNpmPackage {
          pname = "${PACKAGE_META.pname}-frontend";
          version = "${PACKAGE_META.version}";
          src = self;
          npmDepsHash = ""; # fill in with nix-prefetch after first npm ci
          buildPhase = ''
            npm run build
          '';
          installPhase = ''
            mkdir -p $out
            cp -r dist $out/
          '';
        };

        promptnotes = pkgs.rustPlatform.buildRustPackage {
          pname = "${PACKAGE_META.pname}";
          version = "${PACKAGE_META.version}";
          src = self;

          cargoLock = {
            lockFile = ./src-tauri/Cargo.lock;
          };

          # Point Tauri to pre-built frontend assets
          TAURI_FRONTEND_BUILD_DIR = "\${frontendAssets}/dist";

          nativeBuildInputs = with pkgs; [
            pkg-config
            wrapGAppsHook
            gobject-introspection
          ];

          buildInputs = tauriSystemDeps;

          PKG_CONFIG_PATH = "${DEFAULT_BUILD_ENV.pkgConfigPath}";
          WEBKIT_DISABLE_COMPOSITING_MODE = "${DEFAULT_BUILD_ENV.webkitDisableCompositingMode ? "1" : "0"}";
          GIO_MODULE_DIR = "${DEFAULT_BUILD_ENV.gioModuleDir}";

          buildAndTestSubdir = "src-tauri";

          postInstall = ''
            install -Dm644 \\
              src-tauri/icons/128x128.png \\
              $out/share/pixmaps/${PACKAGE_META.pname}.png

            install -Dm644 \\
              packaging/linux/${PACKAGE_META.pname}.desktop \\
              $out/share/applications/${PACKAGE_META.pname}.desktop
          '';

          meta = with pkgs.lib; {
            description = "${PACKAGE_META.description}";
            homepage = "${PACKAGE_META.homepage}";
            license = licenses.mit;
            maintainers = [];
            platforms = [ ${PACKAGE_META.platforms.map((p) => `"${p}"`).join(" ")} ];
          };
        };
      in
      {
        packages = {
          default = promptnotes;
          "${PACKAGE_META.pname}" = promptnotes;
        };

        # Development shell: \`nix develop\` or \`direnv allow\`
        devShells.default = pkgs.mkShell {
          buildInputs = tauriSystemDeps ++ [
            rustToolchain
            pkgs.nodejs_20
            pkgs.nodePackages.npm
            pkgs.tauri-cli
          ];

          PKG_CONFIG_PATH = "${DEFAULT_BUILD_ENV.pkgConfigPath}";
          WEBKIT_DISABLE_COMPOSITING_MODE = "${DEFAULT_BUILD_ENV.webkitDisableCompositingMode ? "1" : "0"}";
          GIO_MODULE_DIR = "${DEFAULT_BUILD_ENV.gioModuleDir}";

          shellHook = ''
            echo "PromptNotes dev shell — run: cargo tauri dev"
          '';
        };

        # \`nix run\` support
        apps.default = flake-utils.lib.mkApp {
          drv = promptnotes;
          exePath = "/bin/${PACKAGE_META.pname}";
        };
      }
    );
}
`;
}

/** Generate the packaging/linux/promptnotes.desktop file content */
export function generateDesktopFile(): string {
  return `[Desktop Entry]
Type=Application
Version=1.0
Name=PromptNotes
GenericName=Note Taking
Exec=promptnotes %U
Icon=promptnotes
Comment=Local note-taking app for AI prompts
Categories=Utility;TextEditor;
Terminal=false
StartupNotify=true
StartupWMClass=promptnotes
`;
}

/** Write flake.nix and the .desktop file to the filesystem (Node.js runtime) */
export async function writeNixFiles(projectRoot: string): Promise<void> {
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");

  const flakeContent = generateFlakeNix();
  await writeFile(join(projectRoot, "flake.nix"), flakeContent, "utf-8");

  const desktopDir = join(projectRoot, "packaging", "linux");
  await mkdir(desktopDir, { recursive: true });
  await writeFile(
    join(desktopDir, "promptnotes.desktop"),
    generateDesktopFile(),
    "utf-8"
  );
}

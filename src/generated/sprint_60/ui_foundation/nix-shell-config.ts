// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 60-1
// @task-title: Linux
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=60, task=60-1, module=ui_foundation
// Dependency: governance:adr_tech_stack — Tauri confirmed framework
// Convention: framework:tauri — Tauri (Rust + WebView); platform:linux — NixOS dev environment

import { NIX_BUILD_INPUTS } from './nix-package-config';

export interface NixDevShellConfig {
  readonly packages: readonly string[];
  readonly shellHook: string;
  readonly envVars: Record<string, string>;
}

/**
 * Development shell configuration for NixOS contributors.
 * Provides all dependencies needed to build the Tauri application.
 */
export function createNixDevShellConfig(): NixDevShellConfig {
  const allPackages = [
    ...NIX_BUILD_INPUTS.nativeBuildInputs,
    ...NIX_BUILD_INPUTS.buildInputs,
    'rustup',
    'cargo-tauri',
    'nodePackages.npm',
  ];

  const libraryPathPackages = [
    'openssl',
    'glib',
    'gtk3',
    'webkitgtk_4_1',
    'libsoup_3',
    'gdk-pixbuf',
    'cairo',
    'pango',
    'atk',
  ];

  const shellHook = `
    export LD_LIBRARY_PATH=\${lib.makeLibraryPath [
      ${libraryPathPackages.map((p) => `pkgs.${p}`).join('\n      ')}
    ]}:\$LD_LIBRARY_PATH

    export GIO_MODULE_DIR="\${pkgs.glib-networking}/lib/gio/modules"
    export GSETTINGS_SCHEMA_DIR="\${pkgs.gsettings-desktop-schemas}/share/glib-2.0/schemas"

    echo "PromptNotes NixOS development shell"
    echo "Run 'npm install' then 'cargo tauri dev' to start development"
  `.trim();

  return {
    packages: allPackages,
    shellHook,
    envVars: {
      WEBKIT_DISABLE_COMPOSITING_MODE: '1',
    },
  };
}

/**
 * Generates the shell.nix content for developers on NixOS.
 */
export function generateShellNix(): string {
  const config = createNixDevShellConfig();

  return `{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    # Rust toolchain
    rustup
    cargo
    rustc
    pkg-config

    # Node.js for frontend build
    nodejs
    nodePackages.npm

    # Tauri CLI
    cargo-tauri

    # GTK/WebKit build dependencies
    wrapGAppsHook
    gobject-introspection
  ];

  buildInputs = with pkgs; [
    # Tauri runtime dependencies
    openssl
    glib
    gtk3
    webkitgtk_4_1
    libsoup_3
    gdk-pixbuf
    cairo
    pango
    atk
    libappindicator

    # GSettings schemas for file dialogs
    gsettings-desktop-schemas
    glib-networking
  ];

  shellHook = ''
    export LD_LIBRARY_PATH=\${pkgs.lib.makeLibraryPath [
      pkgs.openssl
      pkgs.glib
      pkgs.gtk3
      pkgs.webkitgtk_4_1
      pkgs.libsoup_3
      pkgs.gdk-pixbuf
      pkgs.cairo
      pkgs.pango
      pkgs.atk
    ]}:\$LD_LIBRARY_PATH

    export GIO_MODULE_DIR="\${pkgs.glib-networking}/lib/gio/modules"
    export GSETTINGS_SCHEMA_DIR="\${pkgs.gsettings-desktop-schemas}/share/glib-2.0/schemas"
    export WEBKIT_DISABLE_COMPOSITING_MODE=1

    echo ""
    echo "  PromptNotes NixOS development shell loaded"
    echo "  Run: npm install && cargo tauri dev"
    echo ""
  '';
}
`;
}

/**
 * Generates the flake.nix devShell section.
 */
export function generateFlakeDevShell(): string {
  return `devShells.default = pkgs.mkShell {
          nativeBuildInputs = with pkgs; [
            rustup cargo rustc pkg-config
            nodejs nodePackages.npm
            cargo-tauri
            wrapGAppsHook gobject-introspection
          ];

          buildInputs = with pkgs; [
            openssl glib gtk3 webkitgtk_4_1 libsoup_3
            gdk-pixbuf cairo pango atk libappindicator
            gsettings-desktop-schemas glib-networking
          ];

          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath (with pkgs; [
            openssl glib gtk3 webkitgtk_4_1 libsoup_3
            gdk-pixbuf cairo pango atk
          ]);

          GIO_MODULE_DIR = "\${pkgs.glib-networking}/lib/gio/modules";
          GSETTINGS_SCHEMA_DIR = "\${pkgs.gsettings-desktop-schemas}/share/glib-2.0/schemas";
          WEBKIT_DISABLE_COMPOSITING_MODE = "1";
        };`;
}

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
// Dependency: governance:adr_tech_stack — Tauri confirmed framework, NixOS distribution required
// Convention: framework:tauri — Tauri (Rust + WebView) confirmed; platform:linux — NixOS package

import { packageMeta, PACKAGE_NAME, PACKAGE_IDENTIFIER } from './package-meta';

export interface NixDerivationMeta {
  readonly pname: string;
  readonly version: string;
  readonly description: string;
  readonly homepage: string;
  readonly license: string;
  readonly mainProgram: string;
  readonly platforms: readonly string[];
}

export interface NixBuildInputs {
  readonly nativeBuildInputs: readonly string[];
  readonly buildInputs: readonly string[];
  readonly runtimeDependencies: readonly string[];
}

export interface NixDesktopIntegration {
  readonly desktopName: string;
  readonly desktopFile: string;
  readonly iconSizes: readonly number[];
  readonly categories: readonly string[];
  readonly mimeTypes: readonly string[];
}

export interface NixPackageConfig {
  readonly meta: NixDerivationMeta;
  readonly buildInputs: NixBuildInputs;
  readonly desktopIntegration: NixDesktopIntegration;
  readonly tauriBundle: TauriBundleConfig;
}

export interface TauriBundleConfig {
  readonly identifier: string;
  readonly targets: readonly string[];
  readonly resources: readonly string[];
}

export const NIX_DERIVATION_META: Readonly<NixDerivationMeta> = {
  pname: PACKAGE_NAME,
  version: packageMeta.version,
  description: packageMeta.description,
  homepage: packageMeta.homepage,
  license: 'mit',
  mainProgram: PACKAGE_NAME,
  platforms: ['x86_64-linux', 'aarch64-linux'],
} as const;

/**
 * Build inputs required for compiling a Tauri application on NixOS.
 * Tauri v2 requires WebKitGTK for the Linux WebView layer.
 */
export const NIX_BUILD_INPUTS: Readonly<NixBuildInputs> = {
  nativeBuildInputs: [
    'cargo',
    'rustc',
    'pkg-config',
    'nodejs',
    'npm',
    'wrapGAppsHook',
    'makeBinaryWrapper',
  ],
  buildInputs: [
    'openssl',
    'glib',
    'gtk3',
    'webkitgtk_4_1',
    'libsoup_3',
    'gdk-pixbuf',
    'cairo',
    'pango',
    'atk',
    'libappindicator',
  ],
  runtimeDependencies: [
    'gtk3',
    'webkitgtk_4_1',
    'glib',
    'libsoup_3',
  ],
} as const;

export const NIX_DESKTOP_INTEGRATION: Readonly<NixDesktopIntegration> = {
  desktopName: 'PromptNotes',
  desktopFile: `${PACKAGE_NAME}.desktop`,
  iconSizes: [16, 32, 48, 64, 128, 256, 512],
  categories: ['Utility', 'TextEditor', 'Office'],
  mimeTypes: ['text/markdown', 'text/plain'],
} as const;

export const TAURI_BUNDLE_CONFIG: Readonly<TauriBundleConfig> = {
  identifier: PACKAGE_IDENTIFIER,
  targets: ['deb', 'appimage'],
  resources: [],
} as const;

export const NIX_PACKAGE_CONFIG: Readonly<NixPackageConfig> = {
  meta: NIX_DERIVATION_META,
  buildInputs: NIX_BUILD_INPUTS,
  desktopIntegration: NIX_DESKTOP_INTEGRATION,
  tauriBundle: TAURI_BUNDLE_CONFIG,
} as const;

/**
 * Generates the Nix derivation content as a string for the package.
 * This is consumed by the CI/CD pipeline to produce the actual .nix file.
 */
export function generateNixExpression(config: NixPackageConfig): string {
  const { meta, buildInputs, desktopIntegration } = config;

  const nativeBuildInputsList = buildInputs.nativeBuildInputs
    .map((dep) => `    ${dep}`)
    .join('\n');

  const buildInputsList = buildInputs.buildInputs
    .map((dep) => `    ${dep}`)
    .join('\n');

  const runtimeDepsList = buildInputs.runtimeDependencies
    .map((dep) => `    ${dep}`)
    .join('\n');

  const categoriesStr = desktopIntegration.categories.join(';') + ';';
  const mimeTypesStr = desktopIntegration.mimeTypes.join(';') + ';';

  return `{ lib
, stdenv
, fetchFromGitHub
, cargo
, rustc
, rustPlatform
, pkg-config
, nodejs
, npm
, wrapGAppsHook
, makeBinaryWrapper
, openssl
, glib
, gtk3
, webkitgtk_4_1
, libsoup_3
, gdk-pixbuf
, cairo
, pango
, atk
, libappindicator
}:

stdenv.mkDerivation rec {
  pname = "${meta.pname}";
  version = "${meta.version}";

  src = fetchFromGitHub {
    owner = "promptnotes";
    repo = "promptnotes";
    rev = "v\${version}";
    hash = lib.fakeHash;
  };

  nativeBuildInputs = [
${nativeBuildInputsList}
  ];

  buildInputs = [
${buildInputsList}
  ];

  postFixup = ''
    wrapProgram $out/bin/${meta.pname} \\
      --prefix LD_LIBRARY_PATH : \${lib.makeLibraryPath [
${runtimeDepsList}
      ]}
  '';

  desktopItems = [
    (makeDesktopItem {
      name = "${meta.pname}";
      desktopName = "${desktopIntegration.desktopName}";
      comment = "${meta.description}";
      exec = "${meta.pname}";
      icon = "${meta.pname}";
      terminal = false;
      type = "Application";
      categories = [ ${desktopIntegration.categories.map((c) => `"${c}"`).join(' ')} ];
      mimeTypes = [ ${desktopIntegration.mimeTypes.map((m) => `"${m}"`).join(' ')} ];
    })
  ];

  meta = with lib; {
    description = "${meta.description}";
    homepage = "${meta.homepage}";
    license = licenses.${meta.license};
    maintainers = with maintainers; [ ];
    mainProgram = "${meta.mainProgram}";
    platforms = [ ${meta.platforms.map((p) => `"${p}"`).join(' ')} ];
  };
}
`;
}

/**
 * Generates a Nix flake overlay snippet for inclusion in a flake.nix.
 */
export function generateFlakeOverlay(config: NixPackageConfig): string {
  return `{
  description = "${config.meta.description}";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachSystem [ ${config.meta.platforms.map((p) => `"${p}"`).join(' ')} ] (system:
      let
        pkgs = nixpkgs.legacyPackages.\${system};
      in {
        packages.default = pkgs.callPackage ./package.nix { };
        packages.${config.meta.pname} = pkgs.callPackage ./package.nix { };

        apps.default = {
          type = "app";
          program = "\${self.packages.\${system}.default}/bin/${config.meta.mainProgram}";
        };
      });
}
`;
}

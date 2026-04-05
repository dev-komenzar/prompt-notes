// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 10-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint:10 task:10-1 module:ci-pipeline
// Design refs: design:system-design §2.7, governance:adr_tech_stack ADR-006
// Convention: Linux: AppImage, deb, Flatpak, NixOS; macOS: dmg, Homebrew Cask

import type { Platform, DistributionFormat } from "./types";

export interface FlatpakManifest {
  readonly appId: string;
  readonly runtime: string;
  readonly runtimeVersion: string;
  readonly sdk: string;
  readonly command: string;
  readonly finishArgs: readonly string[];
}

export interface HomebrewCaskConfig {
  readonly name: string;
  readonly desc: string;
  readonly homepage: string;
  readonly appName: string;
  readonly artifactName: string;
}

export interface NixPackageConfig {
  readonly pname: string;
  readonly description: string;
  readonly license: string;
  readonly platforms: readonly string[];
}

const FLATPAK_MANIFEST: FlatpakManifest = {
  appId: "com.promptnotes.PromptNotes",
  runtime: "org.gnome.Platform",
  runtimeVersion: "46",
  sdk: "org.gnome.Sdk",
  command: "promptnotes",
  finishArgs: [
    "--share=ipc",
    "--socket=fallback-x11",
    "--socket=wayland",
    "--device=dri",
    "--filesystem=home",
  ],
} as const;

const HOMEBREW_CASK_CONFIG: HomebrewCaskConfig = {
  name: "promptnotes",
  desc: "Local-first prompt note-taking app for AI workflows",
  homepage: "https://github.com/promptnotes/promptnotes",
  appName: "PromptNotes.app",
  artifactName: "promptnotes.dmg",
} as const;

const NIX_PACKAGE_CONFIG: NixPackageConfig = {
  pname: "promptnotes",
  description: "Local-first prompt note-taking app built with Tauri",
  license: "mit",
  platforms: ["x86_64-linux", "aarch64-linux", "aarch64-darwin", "x86_64-darwin"],
} as const;

export function getFlatpakManifest(): FlatpakManifest {
  return FLATPAK_MANIFEST;
}

export function getHomebrewCaskConfig(): HomebrewCaskConfig {
  return HOMEBREW_CASK_CONFIG;
}

export function getNixPackageConfig(): NixPackageConfig {
  return NIX_PACKAGE_CONFIG;
}

export function getDistributionFormats(platform: Platform): readonly DistributionFormat[] {
  switch (platform) {
    case "linux":
      return ["appimage", "deb", "flatpak", "nix"];
    case "macos":
      return ["dmg", "homebrew-cask"];
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

export function generateFlatpakManifestJson(version: string, sha256: string): string {
  const manifest = getFlatpakManifest();
  return JSON.stringify(
    {
      "app-id": manifest.appId,
      runtime: manifest.runtime,
      "runtime-version": manifest.runtimeVersion,
      sdk: manifest.sdk,
      command: manifest.command,
      "finish-args": manifest.finishArgs,
      modules: [
        {
          name: "promptnotes",
          buildsystem: "simple",
          "build-commands": ["install -Dm755 promptnotes /app/bin/promptnotes"],
          sources: [
            {
              type: "archive",
              url: `https://github.com/promptnotes/promptnotes/releases/download/v${version}/promptnotes-${version}-linux-x86_64.tar.gz`,
              sha256,
            },
          ],
        },
      ],
    },
    null,
    2
  );
}

export function generateHomebrewCaskFormula(
  version: string,
  sha256: string,
  downloadUrl: string
): string {
  const config = getHomebrewCaskConfig();
  return `cask "${config.name}" do
  version "${version}"
  sha256 "${sha256}"

  url "${downloadUrl}"
  name "PromptNotes"
  desc "${config.desc}"
  homepage "${config.homepage}"

  app "${config.appName}"

  zap trash: [
    "~/Library/Application Support/promptnotes",
    "~/Library/Caches/promptnotes",
  ]
end
`;
}

export function generateNixDerivation(
  version: string,
  sha256: string,
  src: string
): string {
  const config = getNixPackageConfig();
  return `{ lib, stdenv, fetchurl, webkitgtk, gtk3, pkg-config, openssl, ... }:

stdenv.mkDerivation rec {
  pname = "${config.pname}";
  version = "${version}";

  src = fetchurl {
    url = "${src}";
    sha256 = "${sha256}";
  };

  nativeBuildInputs = [ pkg-config ];
  buildInputs = [ webkitgtk gtk3 openssl ];

  installPhase = ''
    mkdir -p $out/bin
    cp promptnotes $out/bin/
  '';

  meta = with lib; {
    description = "${config.description}";
    license = licenses.${config.license};
    platforms = [ ${config.platforms.map((p) => `"${p}"`).join(" ")} ];
    mainProgram = "promptnotes";
  };
}
`;
}

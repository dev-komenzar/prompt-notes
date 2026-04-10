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

// @generated-from: docs/requirements/requirements.md (AC-DI-01)
// Sprint 53 — NixOS installation validation and README snippet generation

import { PACKAGE_META } from "./nix-derivation";

export interface NixInstallMethod {
  id: string;
  label: string;
  /** Shell commands to show in documentation */
  commands: string[];
  /** Prerequisites the user must have */
  prerequisites: string[];
}

/** All supported NixOS / Nix installation paths for promptnotes */
export const NIX_INSTALL_METHODS: NixInstallMethod[] = [
  {
    id: "nix-run",
    label: "Run without installing (nix run)",
    prerequisites: ["Nix 2.4+ with flakes enabled"],
    commands: [
      `nix run github:dev-komenzar/promptnotes`,
    ],
  },
  {
    id: "nix-profile",
    label: "Install to user profile (nix profile)",
    prerequisites: ["Nix 2.4+ with flakes enabled"],
    commands: [
      `nix profile install github:dev-komenzar/promptnotes`,
    ],
  },
  {
    id: "nixos-flake",
    label: "NixOS system configuration (flake-based)",
    prerequisites: ["NixOS with flakes enabled in configuration.nix"],
    commands: [
      `# In flake.nix inputs:`,
      `promptnotes.url = "github:dev-komenzar/promptnotes";`,
      ``,
      `# In nixosConfigurations.<host>.modules:`,
      `environment.systemPackages = [ inputs.promptnotes.packages.\${system}.default ];`,
    ],
  },
  {
    id: "nixos-home-manager",
    label: "Home Manager",
    prerequisites: ["home-manager with flakes"],
    commands: [
      `# In home.nix (via flake input):`,
      `home.packages = [ inputs.promptnotes.packages.\${system}.default ];`,
    ],
  },
  {
    id: "dev-shell",
    label: "Development shell (contributors)",
    prerequisites: ["Nix 2.4+", "direnv (recommended)"],
    commands: [
      `git clone https://github.com/dev-komenzar/promptnotes`,
      `cd promptnotes`,
      `direnv allow   # or: nix develop`,
      `cargo tauri dev`,
    ],
  },
];

/** Validate that a Nix flake.nix exists at the given path */
export async function validateFlakeExists(projectRoot: string): Promise<boolean> {
  const { access } = await import("fs/promises");
  const { join } = await import("path");
  try {
    await access(join(projectRoot, "flake.nix"));
    return true;
  } catch {
    return false;
  }
}

/** Validate that the Cargo.lock used in the derivation exists */
export async function validateCargoLock(projectRoot: string): Promise<boolean> {
  const { access } = await import("fs/promises");
  const { join } = await import("path");
  try {
    await access(join(projectRoot, "src-tauri", "Cargo.lock"));
    return true;
  } catch {
    return false;
  }
}

/** Generate the "## Download → Nix" section for README.md */
export function generateReadmeNixSection(): string {
  const lines: string[] = [
    "### Nix / NixOS",
    "",
    `PromptNotes supports Nix flakes. The package targets **Linux x86\_64 and aarch64** only.`,
    "",
    "#### Enable flakes",
    "",
    "Add to `/etc/nix/nix.conf` or `~/.config/nix/nix.conf`:",
    "",
    "```",
    "experimental-features = nix-command flakes",
    "```",
    "",
  ];

  for (const method of NIX_INSTALL_METHODS) {
    lines.push(`#### ${method.label}`);
    lines.push("");
    if (method.prerequisites.length > 0) {
      lines.push(`**Prerequisites:** ${method.prerequisites.join(", ")}`);
      lines.push("");
    }
    lines.push("```sh");
    for (const cmd of method.commands) {
      lines.push(cmd);
    }
    lines.push("```");
    lines.push("");
  }

  lines.push(`> **Default notes directory on Linux:** \`~/.local/share/${PACKAGE_META.pname}/notes/\``);
  lines.push("");

  return lines.join("\n");
}

/** Summarise the NixOS packaging status for CI reporting */
export interface NixPackageReport {
  flakeExists: boolean;
  cargoLockExists: boolean;
  installMethods: number;
  ready: boolean;
  issues: string[];
}

export async function buildNixPackageReport(
  projectRoot: string
): Promise<NixPackageReport> {
  const flakeExists = await validateFlakeExists(projectRoot);
  const cargoLockExists = await validateCargoLock(projectRoot);

  const issues: string[] = [];
  if (!flakeExists) issues.push("flake.nix is missing — run the flake-generator script");
  if (!cargoLockExists) issues.push("src-tauri/Cargo.lock is missing — run `cargo generate-lockfile` inside src-tauri/");

  return {
    flakeExists,
    cargoLockExists,
    installMethods: NIX_INSTALL_METHODS.length,
    ready: issues.length === 0,
    issues,
  };
}

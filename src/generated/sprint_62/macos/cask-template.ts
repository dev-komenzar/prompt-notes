// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 62-1
// @task-title: macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Generated from sprint 62 – macOS Homebrew Cask 定義作成
// CoDD trace: plan:implementation_plan > 62-1

import type {
  CaskConfig,
  CaskCaveats,
  CaskDependsOn,
  CaskLivecheck,
  CaskZap,
} from "./cask-config";

function indent(level: number): string {
  return "  ".repeat(level);
}

function rubyString(value: string): string {
  if (value.includes("#{")) {
    return `"${value}"`;
  }
  return `"${value}"`;
}

function renderUrl(config: CaskConfig): string {
  const urlTemplate = `${config.artifactBaseUrl}/v#{version}/${config.dmgFilenamePattern}`;
  return `${indent(1)}url ${rubyString(urlTemplate)}`;
}

function renderSha256Placeholder(): string {
  return `${indent(1)}sha256 "SHA256_PLACEHOLDER"`;
}

function renderSha256(sha256: string): string {
  if (sha256 === ":no_check") {
    return `${indent(1)}sha256 :no_check`;
  }
  return `${indent(1)}sha256 ${rubyString(sha256)}`;
}

function renderDependsOn(dep: CaskDependsOn): string {
  const parts: string[] = [];
  if (dep.macos) {
    parts.push(`${indent(1)}depends_on macos: ${rubyString(dep.macos)}`);
  }
  if (dep.arch && dep.arch.length > 0) {
    const archList = dep.arch
      .map((a) => (a === "arm64" ? ":arm64" : ":intel"))
      .join(", ");
    parts.push(`${indent(1)}depends_on arch: ${archList}`);
  }
  return parts.join("\n");
}

function renderZap(zap: CaskZap): string {
  if (zap.trash.length === 0) {
    return "";
  }
  const lines: string[] = [];
  lines.push(`${indent(1)}zap trash: [`);
  zap.trash.forEach((path, index) => {
    const comma = index < zap.trash.length - 1 ? "," : "";
    lines.push(`${indent(3)}${rubyString(path)}${comma}`);
  });
  lines.push(`${indent(2)}]`);
  return lines.join("\n");
}

function renderCaveats(caveats: CaskCaveats): string {
  const lines: string[] = [];
  lines.push(`${indent(1)}caveats <<~EOS`);
  for (const line of caveats.lines) {
    lines.push(`${indent(2)}${line}`);
  }
  lines.push(`${indent(1)}EOS`);
  return lines.join("\n");
}

function renderLivecheck(livecheck: CaskLivecheck): string {
  const lines: string[] = [];
  lines.push(`${indent(1)}livecheck do`);
  lines.push(`${indent(2)}url ${rubyString(livecheck.url)}`);
  lines.push(`${indent(2)}strategy :${livecheck.strategy}`);
  if (livecheck.regex) {
    lines.push(`${indent(2)}regex(%r{${livecheck.regex}}i)`);
  }
  lines.push(`${indent(1)}end`);
  return lines.join("\n");
}

export interface RenderCaskOptions {
  readonly config: CaskConfig;
  readonly sha256?: string;
}

export function renderCaskDefinition(options: RenderCaskOptions): string {
  const { config, sha256 } = options;
  const sections: string[] = [];

  sections.push(`cask ${rubyString(config.token)} do`);
  sections.push(`${indent(1)}version ${rubyString(config.version)}`);

  if (sha256) {
    sections.push(renderSha256(sha256));
  } else {
    sections.push(renderSha256Placeholder());
  }

  sections.push("");
  sections.push(renderUrl(config));
  sections.push(`${indent(1)}name ${rubyString("PromptNotes")}`);
  sections.push(`${indent(1)}desc ${rubyString(config.description)}`);
  sections.push(`${indent(1)}homepage ${rubyString(config.homepage)}`);

  if (config.dependsOn) {
    sections.push("");
    sections.push(renderDependsOn(config.dependsOn));
  }

  sections.push("");
  sections.push(`${indent(1)}app ${rubyString(config.appTarget.name)}`);

  if (config.zap.trash.length > 0) {
    sections.push("");
    sections.push(renderZap(config.zap));
  }

  if (config.caveats) {
    sections.push("");
    sections.push(renderCaveats(config.caveats));
  }

  if (config.livecheck) {
    sections.push("");
    sections.push(renderLivecheck(config.livecheck));
  }

  sections.push("end");
  sections.push("");

  return sections.join("\n");
}

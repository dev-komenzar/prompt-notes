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

import { readFile, writeFile } from "node:fs/promises";
import { validateSha256 } from "./cask-validator";

export interface CaskUpdateFields {
  readonly version?: string;
  readonly sha256?: string;
}

const VERSION_LINE_PATTERN = /^(\s*version\s+)"[^"]*"/m;
const SHA256_LINE_PATTERN = /^(\s*sha256\s+)"[a-f0-9]{64}"/m;
const SHA256_PLACEHOLDER_PATTERN = /^(\s*sha256\s+)"SHA256_PLACEHOLDER"/m;

export function updateCaskVersion(
  content: string,
  newVersion: string
): string {
  if (!VERSION_LINE_PATTERN.test(content)) {
    throw new Error("Could not locate version stanza in cask file");
  }
  return content.replace(
    VERSION_LINE_PATTERN,
    `$1"${newVersion}"`
  );
}

export function updateCaskSha256(content: string, newSha256: string): string {
  if (!validateSha256(newSha256)) {
    throw new Error(`Invalid SHA256 hash: ${newSha256}`);
  }

  if (SHA256_PLACEHOLDER_PATTERN.test(content)) {
    return content.replace(SHA256_PLACEHOLDER_PATTERN, `$1"${newSha256}"`);
  }

  if (!SHA256_LINE_PATTERN.test(content)) {
    throw new Error("Could not locate sha256 stanza in cask file");
  }

  return content.replace(SHA256_LINE_PATTERN, `$1"${newSha256}"`);
}

export function updateCaskFields(
  content: string,
  fields: CaskUpdateFields
): string {
  let updated = content;
  if (fields.version) {
    updated = updateCaskVersion(updated, fields.version);
  }
  if (fields.sha256) {
    updated = updateCaskSha256(updated, fields.sha256);
  }
  return updated;
}

export async function updateCaskFile(
  filePath: string,
  fields: CaskUpdateFields
): Promise<string> {
  const content = await readFile(filePath, "utf-8");
  const updated = updateCaskFields(content, fields);
  await writeFile(filePath, updated, "utf-8");
  return updated;
}

export function extractCaskVersion(content: string): string | null {
  const match = content.match(/^\s*version\s+"([^"]+)"/m);
  return match ? match[1] : null;
}

export function extractCaskSha256(content: string): string | null {
  const match = content.match(/^\s*sha256\s+"([a-f0-9]{64})"/m);
  return match ? match[1] : null;
}

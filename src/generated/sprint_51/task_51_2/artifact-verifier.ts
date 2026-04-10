// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 51-2
// @task-title: 動作確認済み
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd implement --sprint 51

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { execSync } from "child_process";

export interface ArtifactInfo {
  path: string;
  size: number;
  sha256: string;
  exists: boolean;
}

export interface VerificationResult {
  platform: "linux" | "macos";
  artifacts: Record<string, ArtifactInfo>;
  passed: boolean;
  errors: string[];
}

function sha256File(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

function statArtifact(filePath: string): ArtifactInfo {
  const exists = fs.existsSync(filePath);
  if (!exists) {
    return { path: filePath, size: 0, sha256: "", exists: false };
  }
  const stat = fs.statSync(filePath);
  return {
    path: filePath,
    size: stat.size,
    sha256: sha256File(filePath),
    exists: true,
  };
}

const LINUX_ARTIFACT_PATTERNS = {
  deb: /promptnotes[_-][\d.]+.*\.deb$/,
  appimage: /promptnotes[_-][\d.]+.*\.AppImage$/i,
};

const MACOS_ARTIFACT_PATTERNS = {
  dmg: /promptnotes[_-][\d.]+.*\.dmg$/i,
  app_tar: /promptnotes[_-][\d.]+.*\.app\.tar\.gz$/i,
};

function findArtifacts(
  dir: string,
  patterns: Record<string, RegExp>
): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const [key, pattern] of Object.entries(patterns)) {
    result[key] = null;
  }
  if (!fs.existsSync(dir)) return result;

  const files = fs.readdirSync(dir, { recursive: true }) as string[];
  for (const file of files) {
    for (const [key, pattern] of Object.entries(patterns)) {
      if (pattern.test(path.basename(file))) {
        result[key] = path.join(dir, file);
      }
    }
  }
  return result;
}

export function verifyLinuxArtifacts(bundleDir: string): VerificationResult {
  const errors: string[] = [];
  const found = findArtifacts(bundleDir, LINUX_ARTIFACT_PATTERNS);
  const artifacts: Record<string, ArtifactInfo> = {};

  for (const [key, filePath] of Object.entries(found)) {
    if (!filePath) {
      errors.push(`Missing Linux artifact: ${key}`);
      artifacts[key] = { path: "", size: 0, sha256: "", exists: false };
      continue;
    }
    const info = statArtifact(filePath);
    artifacts[key] = info;
    if (!info.exists) {
      errors.push(`Artifact file not found: ${filePath}`);
    } else if (info.size < 1024 * 1024) {
      errors.push(
        `Artifact suspiciously small (${info.size} bytes): ${filePath}`
      );
    }
  }

  // Verify .deb structure if present
  if (artifacts.deb?.exists) {
    try {
      execSync(`dpkg-deb --info "${artifacts.deb.path}"`, { stdio: "pipe" });
    } catch {
      errors.push(`Invalid .deb package structure: ${artifacts.deb.path}`);
    }
  }

  // Verify .AppImage is executable
  if (artifacts.appimage?.exists) {
    const mode = fs.statSync(artifacts.appimage.path).mode;
    const isExecutable = (mode & 0o111) !== 0;
    if (!isExecutable) {
      errors.push(
        `AppImage is not executable: ${artifacts.appimage.path}`
      );
    }
  }

  return {
    platform: "linux",
    artifacts,
    passed: errors.length === 0,
    errors,
  };
}

export function verifyMacosArtifacts(bundleDir: string): VerificationResult {
  const errors: string[] = [];
  const found = findArtifacts(bundleDir, MACOS_ARTIFACT_PATTERNS);
  const artifacts: Record<string, ArtifactInfo> = {};

  for (const [key, filePath] of Object.entries(found)) {
    if (!filePath) {
      errors.push(`Missing macOS artifact: ${key}`);
      artifacts[key] = { path: "", size: 0, sha256: "", exists: false };
      continue;
    }
    const info = statArtifact(filePath);
    artifacts[key] = info;
    if (!info.exists) {
      errors.push(`Artifact file not found: ${filePath}`);
    } else if (info.size < 1024 * 1024) {
      errors.push(
        `Artifact suspiciously small (${info.size} bytes): ${filePath}`
      );
    }
  }

  return {
    platform: "macos",
    artifacts,
    passed: errors.length === 0,
    errors,
  };
}

export function writeChecksumFile(
  result: VerificationResult,
  outputPath: string
): void {
  const lines: string[] = [];
  for (const [name, info] of Object.entries(result.artifacts)) {
    if (info.exists && info.sha256) {
      lines.push(`${info.sha256}  ${path.basename(info.path)}`);
    }
  }
  fs.writeFileSync(outputPath, lines.join("\n") + "\n", "utf-8");
}

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

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

export interface Sha256Result {
  readonly hash: string;
  readonly fileSize: number;
  readonly filePath: string;
}

export async function computeSha256FromFile(
  filePath: string
): Promise<Sha256Result> {
  const fileInfo = await stat(filePath);
  if (!fileInfo.isFile()) {
    throw new Error(`Path is not a file: ${filePath}`);
  }

  const hash = createHash("sha256");
  const stream = createReadStream(filePath);

  return new Promise<Sha256Result>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => {
      hash.update(chunk);
    });
    stream.on("end", () => {
      resolve({
        hash: hash.digest("hex"),
        fileSize: fileInfo.size,
        filePath,
      });
    });
    stream.on("error", (err: Error) => {
      reject(new Error(`Failed to read file for SHA256: ${err.message}`));
    });
  });
}

export function computeSha256FromBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function verifySha256(
  filePath: string,
  expectedHash: string
): Promise<boolean> {
  const result = await computeSha256FromFile(filePath);
  return result.hash === expectedHash.toLowerCase();
}

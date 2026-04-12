// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 56-1
// @task-title: パッケージング
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md sprint:56 task:56-1
// @generated-by: codd implement --sprint 56

import { execSync } from "node:child_process";
import * as os from "node:os";

export type SupportedPlatform = "linux" | "macos";

export interface PlatformInfo {
  platform: SupportedPlatform;
  arch: string;
  rustTarget: string;
}

export function detectPlatform(): PlatformInfo {
  const platform = os.platform();
  const arch = os.arch();

  if (platform === "linux") {
    const rustTarget =
      arch === "x64" ? "x86_64-unknown-linux-gnu" : "aarch64-unknown-linux-gnu";
    return { platform: "linux", arch, rustTarget };
  }

  if (platform === "darwin") {
    const rustTarget =
      arch === "arm64" ? "aarch64-apple-darwin" : "x86_64-apple-darwin";
    return { platform: "macos", arch, rustTarget };
  }

  throw new Error(
    `Unsupported platform: ${platform}. Only Linux and macOS are supported. Windows is out of scope.`
  );
}

export function assertLinuxDependencies(): void {
  const required = ["dpkg-deb", "fakeroot"];
  for (const cmd of required) {
    try {
      execSync(`which ${cmd}`, { stdio: "ignore" });
    } catch {
      throw new Error(
        `Missing Linux packaging dependency: ${cmd}. Install with: sudo apt-get install dpkg fakeroot`
      );
    }
  }
}

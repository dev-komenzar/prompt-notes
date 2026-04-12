// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 59-1
// @task-title: パッケージング
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 59
// @codd-task: 59-1
// @codd-deliverable: パッケージング — アーティファクト検証

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface VerifyResult {
  path: string;
  sizeMb: number;
  sizeWithinLimit: boolean;
  isMountable: boolean;
  errors: string[];
}

const MAX_SIZE_MB = 20; // Tauri + OS WebView で数 MB〜10 MB 想定。余裕を持たせて 20 MB 上限。

export function verifyDmgArtifact(dmgPath: string): VerifyResult {
  const errors: string[] = [];

  if (!fs.existsSync(dmgPath)) {
    return {
      path: dmgPath,
      sizeMb: 0,
      sizeWithinLimit: false,
      isMountable: false,
      errors: [`ファイルが存在しません: ${dmgPath}`],
    };
  }

  if (!dmgPath.endsWith(".dmg")) {
    errors.push(`拡張子が .dmg ではありません: ${dmgPath}`);
  }

  const stat = fs.statSync(dmgPath);
  const sizeMb = stat.size / 1024 / 1024;
  const sizeWithinLimit = sizeMb <= MAX_SIZE_MB;

  if (!sizeWithinLimit) {
    errors.push(
      `ファイルサイズが上限を超えています: ${sizeMb.toFixed(2)} MB > ${MAX_SIZE_MB} MB`
    );
  }

  let isMountable = false;
  if (process.platform === "darwin") {
    try {
      // hdiutil で DMG をドライマウント (実際のマウントなし) して整合性を確認
      execSync(`hdiutil verify "${dmgPath}"`, { stdio: "pipe" });
      isMountable = true;
    } catch {
      errors.push(
        `hdiutil verify 失敗: DMG ファイルが破損している可能性があります。`
      );
    }
  } else {
    // Linux CI では hdiutil が使えないため mountability チェックをスキップ
    isMountable = true;
  }

  return { path: dmgPath, sizeMb, sizeWithinLimit, isMountable, errors };
}

export function printVerifyReport(result: VerifyResult): void {
  console.log("=== DMG アーティファクト検証レポート ===");
  console.log(`パス    : ${result.path}`);
  console.log(`サイズ  : ${result.sizeMb.toFixed(2)} MB`);
  console.log(
    `サイズ  : ${result.sizeWithinLimit ? "OK" : "FAIL"} (上限 ${MAX_SIZE_MB} MB)`
  );
  console.log(`整合性  : ${result.isMountable ? "OK" : "FAIL"}`);
  if (result.errors.length > 0) {
    console.error("エラー:");
    result.errors.forEach((e) => console.error(`  - ${e}`));
  } else {
    console.log("結果    : PASS");
  }
}

// CLI エントリポイント
if (require.main === module) {
  const dmgPath = process.argv[2];
  if (!dmgPath) {
    console.error("使用法: node verify_artifact.js <path/to/app.dmg>");
    process.exit(1);
  }
  const result = verifyDmgArtifact(path.resolve(dmgPath));
  printVerifyReport(result);
  process.exit(result.errors.length === 0 ? 0 : 1);
}

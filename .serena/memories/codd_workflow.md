# CoDD Workflow (このプロジェクトの肝)

**Coherence-Driven Development** — 上流 (requirements) が下流 (design → code → test) を一方向に決定。変更時は依存グラフで影響範囲を追跡する、ハーネス非依存の方法論。

参照: https://github.com/yohey-w/codd-dev/blob/main/README.md

## 依存宣言
- 各 artifact は Markdown frontmatter の `depends_on` で依存関係を宣言
- `codd/codd.yaml` の `wave_config` が Wave 依存グラフを保持
- ノードID例: `req:promptnotes-requirements`, `test:acceptance_criteria`, `design:system-design`

## Wave 構成 (設計書の依存順)
| Wave | 内容 | 依存元 |
|---|---|---|
| 1 | 受入基準 + ADR | requirements |
| 2 | システム設計 | req + Wave 1 |
| 3 | DB 設計 + API 設計 (detailed_design) | req + Wave 1-2 |
| 4 | UI/UX 設計 | req + Wave 1-3 |
| 5 | 実装計画 | 全上流 |

現状は detail:* が Wave 3、plan:implementation_plan が Wave 4 に置かれている (`codd.yaml` 参照)。

## 検証 (V-Model)
下から積み上げ: **Unit (詳細設計) → Integration (システム設計) → E2E (requirements + 受入基準)**

## グリーンフィールド手順
1. `codd init --requirements <file>`
2. `codd plan --init` — wave_config 生成
3. `codd generate --wave N` — Wave 順に設計書生成
4. `codd validate` — frontmatter整合性 / TODO検出
5. `codd implement --sprint N` — 設計書から Sprint 単位コード生成 (`src/generated/sprint_N/**`)
6. `codd assemble` — src/ 正式配置へ組み立て

## 変更時の追従
- **上流編集** (requirements/設計書): `codd impact` → Green/Amber/Gray → `codd generate --wave N --force`
- **下流編集** (source): `codd propagate` → CEG グラフで影響設計書特定 → `--update` で AI が追従更新
- **グラフ再構築**: `codd scan` (Edit/Write hook で自動実行推奨)

## AI コマンド (`codd.yaml` より)
- generate: `claude --print --model claude-opus-4-6 --tools "" --system-prompt "..."`
- implement: `claude --print --model claude-sonnet-4-6 --tools ""`
- フェーズ別にモデルを分けている (recent commit `dc7d5aa`)

## 伝播設定
- `propagation.max_depth: 10`
- `stop_at_contract_boundary: true`
- Band 閾値: green (confidence≥0.9, evidence≥2), amber (confidence≥0.5)

## 重要原則 (feedback memory にも保存済み)
- **仕様書が source of truth**。テスト通過のためにプロダクションコードへ機能追加してはいけない。仕様 → 設計 → 実装 → テストの一方向のみ。

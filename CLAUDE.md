## 基本的な開発手法

[CoDD](https://github.com/yohey-w/codd-dev/blob/main/README.md) (Coherence-Driven Development) を利用している。上流 (requirements) が下流 (design → code → test) を一方向に決定し、変更時は依存グラフで影響範囲を追跡するハーネス非依存の方法論。

### グリーンフィールドワークフロー

新規プロジェクトは以下のコマンドを順に実行する。各 artifact は Markdown frontmatter の `depends_on` で依存関係を宣言し、CoDD が依存グラフを管理する。

1. `codd init --requirements <file>` — requirements を取り込んで初期化
2. `codd plan --init` — AI が wave_config (設計書の依存グラフ) を生成
3. `codd generate --wave N` — Wave 順に設計書を生成 (下記参照)
4. `codd validate` — frontmatter 整合性と TODO/プレースホルダ検出
5. `codd implement --sprint N` — 設計書から Sprint 単位でコード生成
6. `codd assemble` — コード断片を buildable なプロジェクトに組み立て

### Wave 構成 (設計書の依存順)

| Wave | 内容 | 依存元 |
|---|---|---|
| 1 | 受入基準 + ADR | requirements |
| 2 | システム設計 | req + Wave 1 |
| 3 | DB 設計 + API 設計 | req + Wave 1-2 |
| 4 | UI/UX 設計 | req + Wave 1-3 |
| 5 | 実装計画 | 全上流 |

検証は V-Model で下から積み上げる: Unit (詳細設計) → Integration (システム設計) → E2E (requirements + 受入基準)。

### 変更時の追従

- requirements/設計書を編集 → `codd impact` で影響範囲を Green/Amber/Gray で分類 → 影響を受けた Wave を `codd generate --wave N --force` で再生成
- ソースコードを編集 → `codd propagate` で CEG グラフを辿って影響する設計書を特定 → `--update` で AI が設計書を追従更新
- `codd scan` で依存グラフを再構築 (Edit/Write 時に hook で自動実行するのが推奨)

### ナレッジ

- [codd generate の挙動](knowledge/codd-generate-behavior.md) — `--wave` 単位で動作し node_id 指定不可。force 無しは exists 判定で skip、依存追従には `--force` が必要。

## コミット

### コミットメッセージのテンプレート

それぞれの場合に応じてコミットメッセージを作成すること。

#### [仕様書](docs/requirements/requirements.md)の更新の場合

簡潔にタイトルと箇条書き5行以内での説明を書く。

```markdown
update: タイトル

- 変更点1
- 変更点2
- 変更点3
- 変更点4
- 変更点5
```

#### その他のdocs/以下ドキュメントが生成された場合

```markdown
update: タイトル

## 生成コマンド

codd generate --wave 1 --force

## 変更点

- 変更点1
- 変更点2
- 変更点3
- 変更点4
- 変更点5
```

### Sprintでコードを生成した場合

```markdwon
update: Sprint XX コード生成

## 生成コマンド

codd implement --sprint XX

## 変更点

- 変更点1
- 変更点2
- 変更点3
- 変更点4
- 変更点5
```

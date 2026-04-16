# `codd generate --wave N` の挙動まとめ

`codd generate` コマンドのソースコード（[generator.py](../../../../.local/share/uv/tools/codd-dev/lib/python3.14/site-packages/codd/generator.py) / [cli.py](../../../../.local/share/uv/tools/codd-dev/lib/python3.14/site-packages/codd/cli.py)）を読み解いた結果のメモ。

## 結論（先に要点）

- `codd generate` は **wave 単位**で動作する。`node_id` を直接指定するオプションは存在しない
- `--force` 無しの場合、**出力ファイルが既に存在するノードは無条件に skip**（mtime 比較も frontmatter diff も無し）
- `--force` を付けると **指定 wave の全ノードが一括再生成**される（未変更ノードも AI が書き直す）
- 依存元を更新したときの追従は `codd generate --wave N --force` が基本。ただし wave 粒度の一括再生成なので `codd impact` で影響範囲を確認してから実行するのが安全

## CLI 引数

| オプション | 型 | 説明 |
|---|---|---|
| `--wave` | int (>=1, 必須) | 対象の wave 番号 |
| `--path` | str | プロジェクトルート（既定: `.`） |
| `--force` | flag | 既存出力ファイルを上書き |
| `--ai-cmd` | str | AI CLI コマンドを上書き |
| `--feedback` | str | `codd review` から渡すレビュー指摘 |

`node_id` を指定する引数は**無い**。

## 処理フロー

### 1. CLI 層（[cli.py:201-238](../../../../.local/share/uv/tools/codd-dev/lib/python3.14/site-packages/codd/cli.py#L201-L238)）

- `project_root` を解決、`.codd/` の存在確認
- `codd.yaml` に `wave_config` が無ければ `plan_init` で自動生成
- `generate_wave(project_root, wave, force, ai_command, feedback)` を呼ぶ
- 結果を `generated` / `skipped` にカウントして各 artifact を 1 行ずつエコー、最後に `Wave N: X generated, Y skipped` を表示

### 2. `generate_wave()` の前処理（[generator.py:109-128](../../../../.local/share/uv/tools/codd-dev/lib/python3.14/site-packages/codd/generator.py#L109-L128)）

1. `codd.yaml` をロード
2. `wave_config` の全エントリを `WaveArtifact`（wave / node_id / output / title / depends_on / conventions / modules）に正規化
3. 指定 wave のエントリのみ抽出。空なら `ValueError`
4. AI コマンドを解決。**優先順位: `--ai-cmd` > `ai_commands.generate` > `ai_command` > DEFAULT**
5. `_build_depended_by_map` — **後ろの wave**に自分を `depends_on` しているノードから逆リンクを構築（同一 wave・前の wave からの逆リンクは含まれない）
6. `build_document_node_path_map` — scanner が既存ドキュメントの `node_id → path` マップを作成

### 3. artifact ごとのループ（[generator.py:131-155](../../../../.local/share/uv/tools/codd-dev/lib/python3.14/site-packages/codd/generator.py#L131-L155)）

```python
for artifact in selected:
    output_path = project_root / artifact.output
    if output_path.exists() and not force:
        results.append(GenerationResult(..., status="skipped"))
        continue
    # ↓ 未存在 or --force のときだけ実行
```

**`--force` 無しの分岐ポイント**：

- 判定は「ファイルが存在するか」の 1 ビットのみ
- 依存元が最近更新されていても、自分が存在すれば skip される
- skip 時は AI subprocess も呼ばれずコスト 0

未存在 or `--force` のときだけ：

1. `_load_dependency_documents` — `depends_on` 各ノードを `document_node_paths` で解決し本文を読み込む。**解決できない id があれば即 `ValueError`**
2. 出力ディレクトリを `mkdir(parents=True, exist_ok=True)`
3. `combined_conventions = global + artifact.conventions`
4. `_generate_document_body`:
   - `_build_generation_prompt` — title + 依存本文 + conventions + feedback を連結
   - `_invoke_ai_command` — `shlex.split(ai_command)` → `subprocess.run(command, input=prompt, text=True)`。非ゼロ終了 / 空 stdout は `ValueError`
   - `_sanitize_generated_body` — markdown フェンス剥がし、タイトル重複除去、プレアンブル除去
5. `_render_document`:
   - `.spec.ts` / `.test.py` 等のテストコード出力は `// @generated-from:` コメントヘッダ形式
   - それ以外は `_infer_doc_type`（`docs/<dir>/...` 第 2 階層でタイプ推定）→ `codd:` キー配下に `node_id / type / depends_on / depended_by / conventions / modules` を YAML frontmatter として組み立て、`---\n<fm>---\n\n<body>\n` で結合
6. `output_path.write_text(content, encoding="utf-8")`

## 実務で覚えておきたいこと

### 単一ノードだけ再生成したいとき

`codd generate` には node_id 指定オプションが無いが、**exists 判定で skip される挙動**を利用して実質的に 1 ノードだけ再生成できる：

```bash
rm docs/design/system_design.md
codd generate --wave 2
# → system_design.md だけ再生成、他ノードは skip
```

### wave 全体を再生成するとき（依存元を更新した後など）

```bash
codd generate --wave N --force
```

`--force` は wave 内の全ノードを AI に書き直させる。このプロジェクトでは [scripts/codd-generate-wrapper.sh](../scripts/codd-generate-wrapper.sh) が `ai_command` として設定されており、**既存の document body を prompt に注入して AI に「差分を最小化しろ」と指示する**ことで、未変更ノードの不要な書き換えを抑制している（[codd/codd.yaml](../codd/codd.yaml) の `ai_commands.generate` 参照）。

### ソース起点の変更追従

ソースコードを編集してから設計書を追従させたい場合は `codd propagate --update`。CEG グラフを辿って影響する設計書を AI が更新する。

### 判断ガイド

| 状況 | 推奨コマンド |
|---|---|
| requirements / 設計書を編集した | `codd impact` で影響確認 → `codd generate --wave N --force` |
| 新しいノードを wave_config に追加した | `codd generate --wave N`（force 無し：既存は skip される） |
| 特定の 1 ファイルだけ再生成したい | 対象ファイルを `rm` → `codd generate --wave N` |
| ソースコードを編集した | `codd propagate --update` |
| 依存グラフが壊れていそう | `codd scan`（Edit/Write hook で自動化推奨） |

## 留意点

- `--force` 無しの skip 判定は **ファイル存在のみ**。依存元の鮮度は見ていないので、「依存元更新済み・自分は古いまま」の状態を検出する責務はこのコマンドには無い → `codd impact` や `codd validate` など別コマンドで補う設計
- `depended_by` フロントマターは**後ろの wave からの逆リンクだけ**が書かれる。wave 再生成の順序に依存するため、wave 間で相互に依存するような構造は想定外
- AI コマンドが空出力を返すとエラー。wrapper scripts ではプレフィックスや末尾の装飾を抑制する system prompt を渡しておく必要がある

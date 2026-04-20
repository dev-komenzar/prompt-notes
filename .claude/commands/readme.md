`tasks/003-make-readme.md` を唯一の真実 (SSOT) として、`README.md` (英語) と `README_ja.md` (日本語) を生成または更新してください。

## 前提

- `tasks/003-make-readme.md` が README の SSOT です。README 本体を直接手編集した変更は存在しない前提で扱います。
- 項目単位の差分 (`R-<SECTION>-<NN>`) で README を更新します。
- `README.md` (英語) と `README_ja.md` (日本語) を並列生成します。片方の翻訳ではなく、項目の意味内容から両言語それぞれを自然に起こします。
- 変更されていない項目に対応する段落は一切触りません (語尾・句点・改行も保持)。

## 手順

1. `tasks/003-make-readme.md` の全文を読む。運用ルール・採番規約・禁止事項・セクション定義を把握する。
2. `README.md` と `README_ja.md` が既存か確認する。
3. **初回生成** (どちらか、または両方が未存在): task の全項目から両言語 README を一括生成する。
4. **差分更新** (両方が既存): 以下を実施する。
   - `git log -- README.md README_ja.md tasks/003-make-readme.md` で直近の変更を確認し、task のどの項目が変更/追加/削除されたかを特定する。
   - 変更された `R-<SECTION>-<NN>` に対応する段落のみ `Edit` ツールで両言語を同時に書き換える。
   - 新規追加項目は該当セクションの記述順位置に段落を追加する。
   - 削除項目は対応する段落を削除する。
   - 変更されていない項目に対応する段落は一切触らない。
5. `docs/images/` 配下の画像を確認し、未配置のものは `<!-- TODO: screenshot pending -->` で代替する。
6. `docs/requirements/requirements.md` に記載されていない機能を追加していないかセルフチェックする (特に Configuration セクション)。
7. 完了後、変更内容を 3 行以内で報告する (初回生成か差分更新か、触った項目 ID、画像の TODO 有無)。

## 禁止事項

- `README.md` / `README_ja.md` を本コマンド以外の経路で手編集しない。
- `docs/requirements/requirements.md` に無い機能を README に追加しない。
- 変更されていない段落を書き換えない (揺り戻しによるノイズ差分禁止)。
- 欠番を再利用しない。

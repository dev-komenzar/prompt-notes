## 基本的な開発手法

[CoDD](https://github.com/yohey-w/codd-dev/blob/main/README.md)を利用している。

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
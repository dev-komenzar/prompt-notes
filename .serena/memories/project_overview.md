# PromptNotes — Project Overview

## Purpose
AIへ渡すプロンプトを素早く書き溜めるためのローカルノートアプリ。タイトル不要、本文だけ。書いたらすぐ次へ。振り返りはグリッドで。ターミナルやIDEにプロンプトをペーストする用途を想定しており、**AI呼び出し機能は持たない**。

## Tech Stack
- **フレームワーク**: Tauri 2 (Rust + WebView) — Electronより軽量、IME/カーソル/コピー周りをWebViewに任せるため
- **フロントエンド**: SvelteKit 2 + Svelte 5 + TypeScript 5
- **ビルド**: Vite 6 + `@sveltejs/adapter-static` (SPAモード、`fallback: 'index.html'`)
- **エディタ**: CodeMirror 6 (`@codemirror/lang-markdown` 他)
- **バックエンド**: Rust (Cargo 2021 edition)
  - `tauri-plugin-dialog`, `serde`, `serde_yaml`, `chrono`, `dirs`
- **データ保存**: ローカル `.md` ファイル (`YYYY-MM-DDTHHMMSS.md`)
- **検索**: ファイル全走査
- **テスト**: Vitest (unit), WebdriverIO 9 (E2E), svelte-check (type)
- **配布**: Linux (binary / Flatpak / NixOS), macOS (binary / Homebrew Cask)。Windowsは将来対応。
- **環境**: Nix flake (`flake.nix`) + direnv (`.envrc`)

## スコープ外 (実装禁止)
- AI呼び出し機能
- クラウド同期 / DB
- Markdownプレビュー（レンダリング）
- タイトル入力欄
- モバイル対応
- Windows対応（将来対応）

## 核となるUX (未実装ならリリース不可)
- Cmd+N / Ctrl+N で即時新規ノート作成 + フォーカス移動
- 1クリックコピーボタンで本文全体をクリップボードへ
- frontmatter領域は背景色で視覚的に区別
- Pinterestスタイル可変高カードグリッド、デフォルト直近7日間フィルタ
- タグ/日付フィルタ、全文検索
- 自動保存 (明示的な保存操作は不要)

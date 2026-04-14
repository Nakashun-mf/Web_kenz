# 図面検図ツール

PDF・TIF 形式の図面ファイルに注釈を付けたり、旧版と新版を並べて比較したりする、ブラウザで動くデスクトップライクなツールです。

## 機能

### 検図モード
- PDF / TIF (マルチフレーム対応) ファイルの読み込み（ドラッグ&ドロップ対応）
- ページサムネイルパネルによるページ移動
- 注釈ツール: 選択・フリーハンド・直線・矩形・楕円・テキスト
- テキスト注釈の書式設定（フォントサイズ・枠線・背景色）
- アンドゥ / リドゥ（最大 50 ステップ）
- 注釈を埋め込んだ PDF としてエクスポート
- 検図中のファイルを比較モードへ送る機能

### 比較モード
- 旧版・新版 2 つのファイルを同時に読み込み
- 並列表示（サイドバイサイド）／重ね表示（オーバーレイ）の切り替え
- オーバーレイ時の透過率スライダー
- 注釈対象パネル（旧版 / 新版）の切り替え
- 各パネルへの個別 PDF エクスポート

### 共通
| キー | 操作 |
|------|------|
| `V` | 選択ツール |
| `P` | フリーハンド |
| `L` | 直線 |
| `R` | 矩形 |
| `O` | 楕円 |
| `T` | テキスト |
| `Ctrl / ⌘` + `Z` | アンドゥ |
| `Ctrl / ⌘` + `Y` / `Shift+Z` | リドゥ |

## 技術スタック

| カテゴリ | ライブラリ |
|----------|-----------|
| UI フレームワーク | React 19 + TypeScript 6 |
| ビルドツール | Vite 8 |
| スタイリング | Tailwind CSS 4 + Radix UI |
| 状態管理 | Zustand 5 + Immer |
| PDF 描画 | pdfjs-dist |
| PDF 生成・書き出し | pdf-lib |
| TIFF デコード | utif2 |
| テスト | Vitest + Testing Library |

## セットアップ

**動作要件**: Node.js 18 以上

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## 開発コマンド

```bash
npm run dev          # 開発サーバー起動 (HMR あり)
npm run build        # 型チェック + プロダクションビルド
npm run preview      # ビルド成果物のプレビュー
npm run lint         # ESLint
npm run test         # テストを一度実行
npm run test:watch   # テストをウォッチモードで実行
npm run test:ui      # Vitest UI でテストを実行
```

## ディレクトリ構成

```
src/
├── components/
│   ├── dropzone/       FileDropzone, GlobalDropZone
│   ├── sidebar/        ThumbnailPanel
│   ├── toolbar/        AnnotationToolbar（縦型・横型）
│   ├── ui/             汎用 UI コンポーネント（Radix UI ベース）
│   └── viewer/         DocumentViewer, AnnotationLayer, PageCanvas, ViewerControls
├── hooks/
│   ├── useDocument.ts  ドキュメント操作フック
│   └── useKeyboard.ts  キーボードショートカット
├── lib/
│   ├── coordinateUtils.ts  pt ↔ スクリーン座標変換
│   ├── exportPdf.ts        注釈付き PDF 書き出し
│   ├── fileValidator.ts    ファイルバリデーション（形式・サイズ）
│   ├── pdfLoader.ts        PDF 読み込み・サムネイル生成
│   ├── tifLoader.ts        TIF デコード・サムネイル生成
│   └── utils.ts            共通ユーティリティ
├── pages/
│   ├── InspectionPage.tsx  検図モード画面
│   └── ComparisonPage.tsx  比較モード画面
├── store/
│   ├── annotationStore.ts  注釈・アンドゥ/リドゥ管理
│   ├── documentStore.ts    単一ドキュメント状態
│   └── comparisonStore.ts  比較モード状態
├── tests/                  ユニットテスト
├── types/                  TypeScript 型定義
└── App.tsx                 ルートコンポーネント（タブ切り替え）
```

## ファイル制限

| 項目 | 制限 |
|------|------|
| 対応形式 | PDF, TIF / TIFF |
| 最大ファイルサイズ | 100 MB |
| 比較時のページ数 | 旧版・新版で同一ページ数かつ同一サイズ（±2 pt 許容）|

## アーキテクチャメモ

- **座標系**: 注釈は PDF 論理座標（pt）で保持し、描画時にズーム倍率と DPR を掛けてスクリーン座標に変換します。
- **アンドゥ/リドゥ**: `annotationStore` が各ミューテーションの前後スナップショット（`{ before, after }`）を最大 50 ステップ保持します。
- **注釈キー**: `"${fileId}:${pageIndex}"` をキーとして、ファイルとページを跨いだ注釈マップを管理します。
- **PDF 書き出し**: `pdf-lib` で元 PDF に注釈を合成し、TIF の場合は白紙ページを生成してから注釈を乗せます。

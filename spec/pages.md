# ページ構成

## 概要

本アプリケーションは3つの主要ページで構成されるSPAです。
UXを重視し、ページ遷移を最小限に抑え、モーダル/ダイアログやインラインコンポーネントを活用します。

## UX設計の方針

### 新規メモ作成
- ホーム画面のFAB（Floating Action Button）から直接作成
- 空のメモをDBに保存し、即座に `/memos/:id` に遷移
- ユーザーはすぐに編集を開始できる

### タグ管理
- 別ページではなく、ホーム画面のサイドバーで管理
- ページ遷移なしでフィルタリングが可能
- タグクリックで即座に絞り込み

### リビジョン履歴
- 別ページではなく、メモ詳細ページ内のダイアログで表示
- コンテキストを保持しながら履歴を確認・復元

### 検索機能
- ホーム画面のヘッダーに常設
- 検索結果はメモ一覧として表示（ページ遷移なし）
- リアルタイム検索でUXを向上

## ページ一覧

---

## 1. ホーム（メモ一覧）

### 基本情報
- **ページ名**: ホーム（メモ一覧）
- **パス**: `/`
- **概要**: メモをタイムライン形式で一覧表示し、閲覧・検索・フィルタリングを行う中心ページ

### ユースケース一覧

#### メモ管理
- `getMemos`: メモ一覧を取得（ページネーション付き）
- `sortMemos`: メモをソートする（作成日/更新日、昇順/降順）
- `createMemo`: 新規メモを作成（空のメモをDBに保存）

#### タグ管理
- `getTags`: タグ一覧を取得
- `filterMemosByTags`: タグでメモをフィルタリング（複数タグのAND検索）

#### 検索
- `searchMemos`: メモを全文検索
- `searchMemosByTags`: タグで検索
- `combinedSearch`: 全文検索とタグ検索を組み合わせ

#### データベース管理
- `openDatabase`: 既存のDBファイルを開く
- `createDatabase`: 新規DBファイルを作成

#### エクスポート（一括）
- `exportMemosAsMarkdown`: 選択したメモを一括でMarkdownエクスポート
- `exportMemosAsPDF`: 選択したメモを一括でPDFエクスポート

### コンポーネント一覧

#### レイアウト
- `HomeLayout`: ホーム画面全体のレイアウト
  - ヘッダー
  - サイドバー
  - メインコンテンツエリア

#### ヘッダー
- `HomeHeader`: ヘッダーコンポーネント
  - `AppLogo`: アプリケーションロゴ
  - `SearchBar`: 検索バー（全文検索）
  - `SortSelect`: ソート順選択ドロップダウン
  - `DatabaseInfo`: 現在のDBファイル情報表示
  - `DatabaseMenu`: DB管理メニュー（開く、新規作成）
  - `SettingsLink`: 設定ページへのリンク

#### サイドバー
- `TagSidebar`: タグ管理サイドバー
  - `TagList`: タグ一覧表示
  - `TagItem`: 個別タグ表示（名前、使用回数）
  - `TagFilter`: 選択中のタグフィルター表示
  - `ClearFilterButton`: フィルタークリアボタン

#### メインコンテンツ
- `MemoList`: メモ一覧表示
  - `MemoCard`: 個別メモカード
    - Markdownプレビュー（一部、グラデーションで隠す）
    - 作成日時または更新日時
    - タグ表示
  - `InfiniteScroll`: 無限スクロール機能
  - `LoadingIndicator`: 読み込み中表示
  - `EmptyState`: メモがない場合の表示

#### アクション
- `CreateMemoFAB`: 新規メモ作成FAB（Floating Action Button）
- `BulkSelectMode`: 一括選択モード
  - `SelectCheckbox`: 選択用チェックボックス
  - `BulkActionBar`: 一括操作バー（エクスポート等）

#### ダイアログ・モーダル
- `DatabasePickerDialog`: DBファイル選択ダイアログ（File System Access API）
- `ExportOptionsDialog`: エクスポート形式選択ダイアログ

### 共通レイアウト
- アプリケーション全体のヘッダー
- トーストノーティフィケーション（エラー、成功メッセージ）

---

## 2. メモ詳細・編集

### 基本情報
- **ページ名**: メモ詳細・編集
- **パス**: `/memos/:id`
- **概要**: メモの閲覧と編集を行うページ。Tiptapエディターでリッチテキスト編集が可能

### ユースケース一覧

#### メモ管理
- `getMemo`: メモを取得（ID指定）
- `updateMemo`: メモを更新（自動保存）
- `deleteMemo`: メモを削除

#### リビジョン管理
- `getRevisions`: メモのリビジョン一覧を取得
- `getRevision`: 特定のリビジョンを取得
- `restoreRevision`: リビジョンからメモを復元

#### エクスポート
- `exportMemoAsMarkdown`: メモをMarkdownとしてエクスポート
- `exportMemoAsPDF`: メモをPDFとしてエクスポート

#### 画像管理
- `uploadImage`: 画像をアップロード
- `saveImageToFileSystem`: 画像をローカルファイルシステムに保存

### コンポーネント一覧

#### レイアウト
- `EditorLayout`: エディターページ全体のレイアウト
  - ヘッダー
  - エディターコンテンツエリア

#### ヘッダー
- `EditorHeader`: エディターヘッダーコンポーネント
  - `BackButton`: ホームに戻るボタン
  - `MemoTitle`: メモタイトル表示（本文から自動抽出）
  - `SaveStatusIndicator`: 保存状態表示（保存中、保存済み）
  - `RevisionButton`: リビジョン履歴ボタン
  - `ExportButton`: エクスポートボタン
  - `DeleteButton`: 削除ボタン

#### エディター
- `TiptapEditor`: Tiptapエディターコンポーネント
  - `EditorToolbar`: エディターツールバー
    - フォーマットボタン（見出し、太字、斜体等）
    - 画像挿入ボタン
    - リンク挿入ボタン
  - `EditorContent`: エディターコンテンツ表示エリア
  - `ViewModeToggle`: 閲覧/編集モード切り替え

#### ダイアログ・モーダル
- `RevisionHistoryDialog`: リビジョン履歴ダイアログ
  - `RevisionList`: リビジョン一覧
  - `RevisionItem`: 個別リビジョン表示（日時、プレビュー）
  - `RevisionPreview`: リビジョンプレビュー
  - `RestoreButton`: 復元ボタン
- `DeleteConfirmDialog`: 削除確認ダイアログ
- `ExportOptionsDialog`: エクスポート形式選択ダイアログ
- `ImageUploadDialog`: 画像アップロードダイアログ（File System Access API）

### 共通レイアウト
- トーストノーティフィケーション（保存状態、エラーメッセージ）

---

## 3. 設定

### 基本情報
- **ページ名**: 設定
- **パス**: `/settings`
- **概要**: アプリケーション設定とDB管理を行うページ

### ユースケース一覧

#### データベース管理
- `getDatabasePath`: DBファイルパスを取得
- `changeDatabasePath`: DBファイルパスを変更
- `exportDatabase`: DBファイルをエクスポート
- `importDatabase`: DBファイルをインポート

#### アプリケーション設定
- `getSettings`: アプリケーション設定を取得
- `updateSettings`: アプリケーション設定を更新
  - デフォルトソート順
  - エディター設定（フォントサイズ、テーマ等）
  - 自動保存間隔
  - リビジョン保存間隔

### コンポーネント一覧

#### レイアウト
- `SettingsLayout`: 設定ページ全体のレイアウト
  - ヘッダー
  - サイドバー（設定カテゴリー）
  - メインコンテンツエリア

#### ヘッダー
- `SettingsHeader`: 設定ヘッダーコンポーネント
  - `BackButton`: ホームに戻るボタン
  - `SettingsTitle`: 設定タイトル

#### サイドバー
- `SettingsSidebar`: 設定カテゴリーサイドバー
  - `SettingsCategoryList`: カテゴリー一覧
  - `SettingsCategoryItem`: 個別カテゴリー（データベース、一般設定等）

#### メインコンテンツ
- `DatabaseSettings`: データベース設定セクション
  - `CurrentDatabaseInfo`: 現在のDB情報表示
  - `ChangeDatabaseButton`: DBファイル変更ボタン
  - `ExportDatabaseButton`: DBエクスポートボタン
  - `ImportDatabaseButton`: DBインポートボタン
- `GeneralSettings`: 一般設定セクション
  - `SortOrderSelect`: デフォルトソート順選択
  - `AutoSaveIntervalInput`: 自動保存間隔入力
  - `RevisionIntervalInput`: リビジョン保存間隔入力
- `EditorSettings`: エディター設定セクション
  - `FontSizeSelect`: フォントサイズ選択
  - `ThemeSelect`: テーマ選択（ライト/ダーク）

#### ダイアログ・モーダル
- `DatabasePickerDialog`: DBファイル選択ダイアログ（File System Access API）

### 共通レイアウト
- アプリケーション全体のヘッダー
- トーストノーティフィケーション

---

## 共通レイアウト

全ページで共有されるレイアウト要素：

### グローバルヘッダー（オプション）
ページによってヘッダーの内容は異なるが、以下の要素は共通的に使用される：
- アプリケーションロゴ/タイトル
- ナビゲーション
- DB情報表示

### トーストノーティフィケーション
全ページで表示可能な通知システム：
- 成功メッセージ（保存完了、エクスポート完了等）
- エラーメッセージ（保存失敗、DB接続エラー等）
- 情報メッセージ（保存中、読み込み中等）

### グローバルコンテキスト
全ページで共有されるコンテキスト：
- データベース接続状態
- 現在のDBファイルパス
- アプリケーション設定
- 保存状態

---

## ルーティング構造

```
/                          # ホーム（メモ一覧）
/memos/:id                 # メモ詳細・編集
/settings                  # 設定
```

### ルーティングに関する注意事項

- タグフィルターは URL クエリパラメータで管理: `/?tags=tag1,tag2`
- 検索は URL クエリパラメータで管理: `/?q=search-term`
- ソート順は URL クエリパラメータで管理: `/?sort=created_desc`
- これにより、URL共有やブラウザの戻る/進むボタンが正しく動作する

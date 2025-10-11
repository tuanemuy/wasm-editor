# Export ドメイン

## 概要

Exportドメインは、ノートのエクスポート（Markdown、PDF）を担当します。
ノートの内容を指定された形式に変換し、ローカルファイルシステムに保存します。

## 責務

- ノートをMarkdownファイルに変換してエクスポート
- ノートをPDFファイルに変換してエクスポート（Markdownのレンダリング、画像の埋め込み）
- エクスポートファイル名の生成（タイトルまたは作成日時）
- 複数ノートの一括エクスポート

## エンティティ

Exportドメインは、データの変換とエクスポートを行うため、独自のエンティティは持ちません。
NoteドメインとAssetドメインのエンティティを使用します。

---

## 値オブジェクト

### ExportFormat

エクスポート形式を表す値オブジェクト。

```typescript
const exportFormatSchema = z.enum(["markdown", "pdf"]);
type ExportFormat = z.infer<typeof exportFormatSchema>;
```

---

### ExportFileName

エクスポートファイル名を表す値オブジェクト。

```typescript
const exportFileNameSchema = z.string().min(1).max(255);
type ExportFileName = z.infer<typeof exportFileNameSchema>;
```

**生成ルール**:
- ノートの最初の見出し（`# タイトル`）を使用
- 見出しがない場合は、作成日時を使用（例: `2024-01-01_12-00-00`）
- ファイル名に使用できない文字は除去または置換

---

## ポート（インターフェース）

### MarkdownExporter

Markdownファイルの生成を担当するインターフェース。

```typescript
interface MarkdownExporter {
  export(
    note: Note,
    assets: Asset[]
  ): Promise<Result<string, ExternalServiceError>>;

  exportMultiple(
    notes: Note[],
    assetsByNoteId: Map<NoteId, Asset[]>
  ): Promise<Result<string[], ExternalServiceError>>;
}
```

**メソッド**:
- `export`: 単一ノートをMarkdown文字列に変換
- `exportMultiple`: 複数ノートをMarkdown文字列の配列に変換

---

### PdfExporter

PDFファイルの生成を担当するインターフェース。

```typescript
interface PdfExporter {
  export(
    note: Note,
    assets: Asset[]
  ): Promise<Result<Blob, ExternalServiceError>>;

  exportMultiple(
    notes: Note[],
    assetsByNoteId: Map<NoteId, Asset[]>
  ): Promise<Result<Blob[], ExternalServiceError>>;
}
```

**メソッド**:
- `export`: 単一ノートをPDFファイル（Blob）に変換
- `exportMultiple`: 複数ノートをPDFファイル（Blob）の配列に変換

**実装方針**:
- MarkdownをレンダリングしてHTML化
- HTMLをPDFに変換（jsPDF、pdfmake、html2pdf.js など）
- 画像を埋め込み

---

### FileSystemManager

ファイルの保存を担当するインターフェース（Assetドメインと共有）。

```typescript
interface FileSystemManager {
  saveFile(
    file: File,
    destinationPath: FilePath
  ): Promise<Result<FilePath, ExternalServiceError>>;

  saveFileWithDialog(
    file: File,
    suggestedName: string
  ): Promise<Result<FilePath, ExternalServiceError>>;
}
```

**メソッド**:
- `saveFile`: ファイルを指定パスに保存
- `saveFileWithDialog`: ユーザーにファイル保存先を選択させて保存（File System Access API の `showSaveFilePicker()` を使用）

---

## ユースケース

### exportNoteAsMarkdown

単一ノートをMarkdownファイルとしてエクスポートします。

```typescript
type ExportNoteAsMarkdownInput = {
  noteId: NoteId;
};

async function exportNoteAsMarkdown(
  context: Context,
  input: ExportNoteAsMarkdownInput
): Promise<Result<void, ApplicationError>>
```

**処理フロー**:
1. リポジトリからノートを取得
2. ノートが存在しない場合はエラーを返す
3. リポジトリからノートに紐づくアセットを取得
4. MarkdownExporter でノートをMarkdown文字列に変換
5. エクスポートファイル名を生成
6. ユーザーにファイル保存先を選択させる（FileSystemManager.saveFileWithDialog）
7. Markdown文字列をファイルとして保存
8. void を返す

**エラー**:
- RepositoryError: DB取得失敗
- ExternalServiceError: エクスポート失敗、ファイル保存失敗
- ApplicationError: ノートが存在しない

---

### exportNoteAsPDF

単一ノートをPDFファイルとしてエクスポートします。

```typescript
type ExportNoteAsPDFInput = {
  noteId: NoteId;
};

async function exportNoteAsPDF(
  context: Context,
  input: ExportNoteAsPDFInput
): Promise<Result<void, ApplicationError>>
```

**処理フロー**:
1. リポジトリからノートを取得
2. ノートが存在しない場合はエラーを返す
3. リポジトリからノートに紐づくアセットを取得
4. PdfExporter でノートをPDFファイル（Blob）に変換
5. エクスポートファイル名を生成
6. ユーザーにファイル保存先を選択させる（FileSystemManager.saveFileWithDialog）
7. PDFファイルを保存
8. void を返す

**エラー**:
- RepositoryError: DB取得失敗
- ExternalServiceError: エクスポート失敗、ファイル保存失敗
- ApplicationError: ノートが存在しない

---

### exportNotesAsMarkdown

複数ノートを一括でMarkdownファイルとしてエクスポートします。

```typescript
type ExportNotesAsMarkdownInput = {
  noteIds: NoteId[];
};

async function exportNotesAsMarkdown(
  context: Context,
  input: ExportNotesAsMarkdownInput
): Promise<Result<void, ApplicationError>>
```

**処理フロー**:
1. リポジトリから各ノートを取得
2. リポジトリから各ノートに紐づくアセットを取得
3. MarkdownExporter で各ノートをMarkdown文字列に変換
4. 各ノートのエクスポートファイル名を生成
5. ユーザーにディレクトリを選択させる（File System Access API の `showDirectoryPicker()` を使用）
6. 各Markdown文字列をファイルとして保存
7. void を返す

**エラー**:
- RepositoryError: DB取得失敗
- ExternalServiceError: エクスポート失敗、ファイル保存失敗
- ApplicationError: ノートが存在しない

---

### exportNotesAsPDF

複数ノートを一括でPDFファイルとしてエクスポートします。

```typescript
type ExportNotesAsPDFInput = {
  noteIds: NoteId[];
};

async function exportNotesAsPDF(
  context: Context,
  input: ExportNotesAsPDFInput
): Promise<Result<void, ApplicationError>>
```

**処理フロー**:
1. リポジトリから各ノートを取得
2. リポジトリから各ノートに紐づくアセットを取得
3. PdfExporter で各ノートをPDFファイル（Blob）に変換
4. 各ノートのエクスポートファイル名を生成
5. ユーザーにディレクトリを選択させる（File System Access API の `showDirectoryPicker()` を使用）
6. 各PDFファイルを保存
7. void を返す

**エラー**:
- RepositoryError: DB取得失敗
- ExternalServiceError: エクスポート失敗、ファイル保存失敗
- ApplicationError: ノートが存在しない

---

## 実装のポイント

### Markdownエクスポート

- ノートの内容をそのままMarkdownファイルとして保存
- 画像はMarkdownの画像記法（`![alt](path)`）で参照
  - 画像のパスはエクスポート先に応じて調整（相対パスまたは絶対パス）

### PDFエクスポート

以下のライブラリを使用してPDFを生成：
- **jsPDF**: シンプルなPDF生成（テキストベース）
- **pdfmake**: レイアウト機能が豊富
- **html2pdf.js**: HTMLをPDFに変換（Markdownをレンダリングしてから変換）

**推奨**: html2pdf.js を使用
- MarkdownをレンダリングしてHTML化（marked.js や unified を使用）
- CSSでスタイリング
- html2pdf.js でPDF化

**PDFの内容**:
- タイトル（ノートの最初の見出し）
- 作成日時・更新日時
- ノート本文（フォーマット済み）
- 画像（埋め込み）

### エクスポートファイル名の生成

1. ノートの最初の見出しを抽出（`# タイトル` 形式）
   - 正規表現: `/^#\s+(.+)$/m`
2. 見出しがない場合は、作成日時を使用
   - 形式: `YYYY-MM-DD_HH-mm-ss`
3. ファイル名に使用できない文字を除去
   - 除去する文字: `/[\\/:"*?<>|]/g`
   - スペースはアンダースコアに置換

### File System Access API

- `showSaveFilePicker()`: 単一ファイルの保存先を選択
- `showDirectoryPicker()`: ディレクトリを選択（複数ファイルの保存）
- ブラウザの対応状況に注意（Chrome、Edge は対応、Firefox、Safari は部分的）

---

## データベーススキーマ

Exportドメインは独自のテーブルを持ちません。
NoteドメインとAssetドメインのテーブルを使用します。

---

## 関連するドメイン

- **Note**: エクスポートするノートのデータを使用
- **Asset**: エクスポートするノートに含まれる画像を使用

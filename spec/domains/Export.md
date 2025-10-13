# Export ドメイン

## 概要

Exportドメインは、ノートのMarkdownファイルへのエクスポートを担当します。
ノートの内容をMarkdown形式に変換し、ローカルファイルシステムに保存します。

## 責務

- ノートをMarkdownファイルに変換してエクスポート
- エクスポートファイル名の生成（タイトルまたは作成日時）
- 複数ノートの一括エクスポート

## エンティティ

Exportドメインは、データの変換とエクスポートを行うため、独自のエンティティは持ちません。
NoteドメインとAssetドメインのエンティティを使用します。

---

## 値オブジェクト

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

### ExportStorageManager

Export用のストレージ管理を担当するインターフェース。

```typescript
interface ExportStorageManager {
  save(
    file: File,
    destinationPath: Path
  ): Promise<Result<Path, ExternalServiceError>>;

  saveWithDialog(
    file: File,
    suggestedName: string
  ): Promise<Result<Path, ExternalServiceError>>;
}
```

**メソッド**:
- `save`: データを指定パスに保存
- `saveWithDialog`: ユーザーにダイアログで保存先を選択させて保存

**実装例**: File System Access API、Cloud Storage API、IndexedDB など

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
6. ExportStorageManager を使ってユーザーに保存先を選択させる
7. Markdown文字列を保存
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
5. ExportStorageManager を使ってユーザーにディレクトリを選択させる
6. 各Markdown文字列を保存
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

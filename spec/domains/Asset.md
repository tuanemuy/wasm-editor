# Asset ドメイン

## 概要

Assetドメインは、画像などのファイル資産の管理を担当します。
画像のアップロード、ローカルファイルシステムへの保存、メモとの関連付けを行います。

## 責務

- 画像のアップロード処理
- 画像のローカルファイルシステムへの保存
- 画像のサイズ制限（10MB以下）
- 画像の参照管理（メモとの関連付け）
- 画像の取得と削除

## エンティティ

### Asset

画像などのファイル資産を表すエンティティ。

```typescript
type Asset = Readonly<{
  id: AssetId;
  noteId: NoteId;
  path: Path;
  fileName: FileName;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}>;
```

**プロパティ**:
- `id`: アセットの一意識別子（UUID v7）
- `noteId`: アセットが紐づくノートのID
- `path`: ストレージパス（相対パス）
- `fileName`: ファイル名
- `fileSize`: ファイルサイズ（バイト）
- `mimeType`: MIMEタイプ（例: "image/png", "image/jpeg"）
- `createdAt`: アセットの作成日時

**ファクトリ関数**:
- `createAsset(params: CreateAssetParams): Result<Asset, ValidationError>`
  - 新規アセットを作成
  - ファイルサイズが10MBを超える場合はエラー

- `reconstructAsset(data: RawAssetData): Result<Asset, ValidationError>`
  - DBから取得した生データからアセットエンティティを再構築

---

## 値オブジェクト

### AssetId

アセットの一意識別子。

```typescript
const assetIdSchema = z.uuid().brand<"AssetId">();
type AssetId = z.infer<typeof assetIdSchema>;

function generateAssetId(): AssetId {
  return uuidv7() as AssetId;
}
```

---

### NoteId

ノートの一意識別子（Noteドメインから参照）。

```typescript
const noteIdSchema = z.uuid().brand<"NoteId">();
type NoteId = z.infer<typeof noteIdSchema>;
```

---

### Path

ストレージパス。

```typescript
const pathSchema = z.string().min(1);
type Path = z.infer<typeof pathSchema>;
```

**形式**:
- 相対パス（例: `assets/images/abc123.png`）
- ストレージのルートディレクトリからの相対パス

---

### FileName

ファイル名。

```typescript
const fileNameSchema = z.string().min(1).max(255);
type FileName = z.infer<typeof fileNameSchema>;
```

---

## ポート（インターフェース）

### AssetRepository

アセットの永続化を担当するリポジトリインターフェース。

```typescript
interface AssetRepository {
  create(asset: Asset): Promise<Result<Asset, RepositoryError>>;

  findById(id: AssetId): Promise<Result<Asset | null, RepositoryError>>;

  findByNoteId(noteId: NoteId): Promise<Result<Asset[], RepositoryError>>;

  delete(id: AssetId): Promise<Result<void, RepositoryError>>;

  deleteByNoteId(noteId: NoteId): Promise<Result<void, RepositoryError>>;
}
```

**メソッド**:
- `create`: 新規アセットを作成
- `findById`: IDでアセットを取得
- `findByNoteId`: ノートIDに紐づくすべてのアセットを取得
- `delete`: アセットを削除
- `deleteByNoteId`: ノートIDに紐づくすべてのアセットを削除（ノート削除時に使用）

---

### AssetStorageManager

Asset用のストレージ管理を担当するインターフェース。

```typescript
interface AssetStorageManager {
  save(
    file: File,
    destinationPath: Path
  ): Promise<Result<Path, ExternalServiceError>>;

  read(
    path: Path
  ): Promise<Result<File, ExternalServiceError>>;

  delete(
    path: Path
  ): Promise<Result<void, ExternalServiceError>>;

  getUrl(path: Path): Promise<Result<string, ExternalServiceError>>;
}
```

**メソッド**:
- `save`: データを保存
- `read`: データを読み込み
- `delete`: データを削除
- `getUrl`: データのURLを取得（表示用）

**実装例**: File System Access API、Cloud Storage API、IndexedDB など

---

## ユースケース

### uploadImage

画像をアップロードして保存します。

```typescript
type UploadImageInput = {
  noteId: NoteId;
  file: File;
};

async function uploadImage(
  context: Context,
  input: UploadImageInput
): Promise<Result<Asset, ApplicationError>>
```

**処理フロー**:
1. ファイルサイズを検証（10MB以下）
2. ファイルタイプを検証（image/png, image/jpeg, image/gif など）
3. ファイル名を生成（UUID + 拡張子）
4. AssetStorageManager を使ってデータを保存
5. アセットエンティティを作成
6. アセットをリポジトリに保存
7. 保存されたアセットを返す

**エラー**:
- ValidationError: ファイルサイズ超過、ファイルタイプ不正
- ExternalServiceError: ファイルシステムへの保存失敗
- RepositoryError: DB保存失敗

---

### getAsset

IDでアセットを取得します。

```typescript
type GetAssetInput = {
  id: AssetId;
};

async function getAsset(
  context: Context,
  input: GetAssetInput
): Promise<Result<Asset | null, ApplicationError>>
```

**処理フロー**:
1. リポジトリからアセットを取得
2. アセットが存在しない場合は null を返す

**エラー**:
- RepositoryError: DB取得失敗

---

### getAssetsByNoteId

ノートに紐づくアセット一覧を取得します。

```typescript
type GetAssetsByNoteIdInput = {
  noteId: NoteId;
};

async function getAssetsByNoteId(
  context: Context,
  input: GetAssetsByNoteIdInput
): Promise<Result<Asset[], ApplicationError>>
```

**処理フロー**:
1. リポジトリからノートIDに紐づくアセットを取得
2. アセットのリストを返す

**エラー**:
- RepositoryError: DB取得失敗

---

### deleteAsset

アセットを削除します。

```typescript
type DeleteAssetInput = {
  id: AssetId;
};

async function deleteAsset(
  context: Context,
  input: DeleteAssetInput
): Promise<Result<void, ApplicationError>>
```

**処理フロー**:
1. リポジトリからアセットを取得
2. アセットが存在しない場合はエラーを返す
3. AssetStorageManager を使ってデータを削除
4. リポジトリからアセットを削除
5. void を返す

**エラー**:
- ExternalServiceError: ファイルシステムからの削除失敗
- RepositoryError: DB削除失敗
- ApplicationError: アセットが存在しない

---

### getImageUrl

画像のURLを取得します（表示用）。

```typescript
type GetImageUrlInput = {
  id: AssetId;
};

async function getImageUrl(
  context: Context,
  input: GetImageUrlInput
): Promise<Result<string, ApplicationError>>
```

**処理フロー**:
1. リポジトリからアセットを取得
2. アセットが存在しない場合はエラーを返す
3. AssetStorageManager を使ってデータのURLを取得
4. URLを返す

**エラー**:
- ExternalServiceError: URLの取得失敗
- RepositoryError: DB取得失敗
- ApplicationError: アセットが存在しない

---

## データベーススキーマ

### assets テーブル

```typescript
const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  noteId: text("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// インデックス: noteId で高速検索
const noteIdIndex = index("assets_note_id_idx").on(assets.noteId);
```

---

## 実装のポイント

### ストレージアクセス

- ブラウザで動作するため、Node.js の `fs` モジュールは使用できません
- File System Access API などを使用してストレージにアクセス
- ユーザーにディレクトリの選択を促し、そのディレクトリ内にファイルを保存

### パスの管理

- DBには相対パス（`assets/images/abc123.png`）を保存
- 実際のストレージのルートディレクトリは、Databaseドメインで管理
- ファイルの保存先は、DBファイルと同じディレクトリまたはサブディレクトリ

### ファイルサイズの制限

- 画像のサイズは10MB以下に制限
- アップロード時にバリデーションを実施

### 画像の表示

- 画像を表示する際は、アクセス可能なURLまたは Blob URL を生成して使用
- Blob URL は `URL.createObjectURL()` で生成
- 使用後は `URL.revokeObjectURL()` で解放

### 孤立したアセットの削除

- ノートが削除された場合、関連するアセットも自動的に削除される（`onDelete: "cascade"`）
- ストレージからも削除する必要があるため、ノート削除時にアセットのファイルも削除

### サポートする画像形式

以下の画像形式をサポート：
- PNG (`image/png`)
- JPEG (`image/jpeg`)
- GIF (`image/gif`)
- WebP (`image/webp`)
- SVG (`image/svg+xml`)

---

## 関連するドメイン

- **Note**: アセットはノートに埋め込まれる
- **Export**: エクスポート時に画像を埋め込む
- **Database**: アセットのメタデータを永続化

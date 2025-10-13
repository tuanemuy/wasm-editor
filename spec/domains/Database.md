# Database ドメイン

## 概要

Databaseドメインは、データベース接続とDBファイルの管理を担当します。
@tursodatabase/database-wasm を使用してブラウザ内でSQLiteデータベースを動作させます。

## 責務

- DBファイルの作成、オープン、クローズ
- DBファイルパスの管理
- データベース接続状態の管理
- データベース接続の提供（他のドメインへの依存性注入）

## エンティティ

### DatabaseConnection

データベース接続を表すエンティティ。

```typescript
type DatabaseConnection = Readonly<{
  dbPath: DatabasePath;
  isOpen: boolean;
  createdAt: Date;
}>;
```

**プロパティ**:
- `dbPath`: DBファイルのパス（ローカルファイルシステム）
- `isOpen`: 接続が開いているかどうか
- `createdAt`: 接続の作成日時

**ファクトリ関数**:
- `createDatabaseConnection(params: CreateDatabaseConnectionParams): Result<DatabaseConnection, ValidationError>`
  - 新規データベース接続を作成

- `reconstructDatabaseConnection(data: RawDatabaseConnectionData): Result<DatabaseConnection, ValidationError>`
  - DBから取得した生データからデータベース接続エンティティを再構築

---

## 値オブジェクト

### DatabasePath

DBファイルのパス。

```typescript
const databasePathSchema = z.string().min(1);
type DatabasePath = z.infer<typeof databasePathSchema>;
```

**形式**:
- ストレージパス
- File System Access API などを使用してアクセス

---

## ポート（インターフェース）

### DatabaseManager

データベース接続の管理を担当するインターフェース。

```typescript
interface DatabaseManager {
  create(
    dbPath: DatabasePath
  ): Promise<Result<DatabaseConnection, ExternalServiceError>>;

  open(
    dbPath: DatabasePath
  ): Promise<Result<DatabaseConnection, ExternalServiceError>>;

  close(): Promise<Result<void, ExternalServiceError>>;

  getConnection(): Result<DatabaseConnection | null, ExternalServiceError>;

  isOpen(): boolean;

}
```

**メソッド**:
- `create`: 新規DBファイルを作成して接続
- `open`: 既存のDBファイルを開いて接続
- `close`: データベース接続を閉じる
- `getConnection`: 現在の接続を取得
- `isOpen`: 接続が開いているかどうかを確認

---

### DatabaseStorageManager

Database用のストレージ管理を担当するインターフェース。

```typescript
interface DatabaseStorageManager {
  openWithDialog(): Promise<Result<File, ExternalServiceError>>;

  saveWithDialog(
    file: File,
    suggestedName: string
  ): Promise<Result<DatabasePath, ExternalServiceError>>;
}
```

**メソッド**:
- `openWithDialog`: ユーザーにダイアログで選択させて開く
- `saveWithDialog`: ユーザーにダイアログで保存先を選択させて保存

**実装例**: File System Access API、Cloud Storage API、IndexedDB など

---

## ユースケース

### createDatabase

新規DBファイルを作成します。

```typescript
type CreateDatabaseInput = {
  dbPath?: DatabasePath;
};

async function createDatabase(
  context: Context,
  input: CreateDatabaseInput
): Promise<Result<DatabaseConnection, ApplicationError>>
```

**処理フロー**:
1. dbPath が指定されていない場合、DatabaseStorageManager を使ってユーザーに保存先を選択させる
2. DatabaseManager で新規DBファイルを作成
3. データベース接続を返す

**エラー**:
- ExternalServiceError: DBファイルの作成失敗
- ApplicationError: ユーザーがファイル選択をキャンセル

---

### openDatabase

既存のDBファイルを開きます。

```typescript
type OpenDatabaseInput = {
  dbPath?: DatabasePath;
};

async function openDatabase(
  context: Context,
  input: OpenDatabaseInput
): Promise<Result<DatabaseConnection, ApplicationError>>
```

**処理フロー**:
1. dbPath が指定されていない場合、DatabaseStorageManager を使ってユーザーにファイルを選択させる
2. DatabaseManager で既存のDBファイルを開く
3. データベース接続を返す

**エラー**:
- ExternalServiceError: DBファイルのオープン失敗
- ApplicationError: ユーザーがファイル選択をキャンセル、DBファイルが存在しない

---

### closeDatabase

データベース接続を閉じます。

```typescript
async function closeDatabase(
  context: Context
): Promise<Result<void, ApplicationError>>
```

**処理フロー**:
1. DatabaseManager でデータベース接続を閉じる
2. void を返す

**エラー**:
- ExternalServiceError: 接続のクローズ失敗

---

### getDatabasePath

現在のDBファイルパスを取得します。

```typescript
async function getDatabasePath(
  context: Context
): Promise<Result<DatabasePath | null, ApplicationError>>
```

**処理フロー**:
1. DatabaseManager から現在の接続を取得
2. 接続が存在しない場合は null を返す
3. 接続が存在する場合は dbPath を返す

**エラー**:
- ExternalServiceError: 接続の取得失敗

---

### changeDatabasePath

DBファイルパスを変更します（別のDBファイルに切り替え）。

```typescript
type ChangeDatabasePathInput = {
  newDbPath?: DatabasePath;
};

async function changeDatabasePath(
  context: Context,
  input: ChangeDatabasePathInput
): Promise<Result<DatabaseConnection, ApplicationError>>
```

**処理フロー**:
1. 現在の接続を閉じる
2. newDbPath が指定されていない場合、DatabaseStorageManager を使ってユーザーにファイルを選択させる
3. 新しいDBファイルを開く
4. 新しいデータベース接続を返す

**エラー**:
- ExternalServiceError: 接続のクローズ失敗、DBファイルのオープン失敗
- ApplicationError: ユーザーがファイル選択をキャンセル

---

## 実装のポイント

### @tursodatabase/database-wasm の使用

- ブラウザ内でSQLiteデータベースを動作させるためのWASMライブラリ
- DBファイルはストレージに保存される
- File System Access API などを使用してファイルの読み書きを行う

**初期化例**:
```typescript
import { createClient } from "@tursodatabase/database-wasm";

const db = await createClient({
  url: "file:///path/to/database.db",
});
```

### File System Access API

- `showOpenFilePicker()`: ファイルを開く
- `showSaveFilePicker()`: ファイルを保存
- `showDirectoryPicker()`: ディレクトリを選択

**ブラウザ対応**:
- Chrome、Edge: 完全サポート
- Firefox、Safari: 部分的サポート

### データベース接続の管理

- データベース接続は、アプリケーション全体で1つのみ
- Context オブジェクトに接続を保持
- 接続が開かれていない場合、各ユースケースでエラーを返す

---

## データベーススキーマ

Databaseドメイン自体は独自のテーブルを持ちませんが、以下のメタデータテーブルを定義します。

### database_metadata テーブル

```typescript
const databaseMetadata = sqliteTable("database_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});
```

**用途**:
- データベースのバージョン管理
- 作成日時の記録
- その他のメタデータ

**例**:
```typescript
{ key: "version", value: "1.0.0" }
{ key: "created_at", value: "2024-01-01T00:00:00Z" }
```

---

## 関連するドメイン

- **すべてのドメイン**: すべてのドメインがDatabaseドメインを通じてデータを永続化

# Database ドメイン

## 概要

**ドメイン名**: Database

データベースファイルの管理と接続を担当するドメイン。
ユーザーは任意の場所にDBファイルを保存でき、アプリケーション起動時に既存のDBファイルを開くことができる。

## エンティティ

### Database

データベース接続を表すエンティティ。

**属性**:
- `handle: FileSystemFileHandle` - ファイルシステムハンドル（File System Access API）
- `name: DatabaseName` - データベース名（ファイル名）
- `path: DatabasePath` - データベースファイルのパス
- `isConnected: boolean` - 接続状態
- `lastAccessedAt: Timestamp` - 最終アクセス日時

**不変条件**:
- handleは有効なFileSystemFileHandleでなければならない
- nameは空でない文字列
- 接続中は常にisConnected = true

**ビジネスルール**:
- 同時に開けるデータベースは1つのみ
- データベースを切り替える場合は現在のデータベースを閉じる必要がある

## 値オブジェクト

### DatabaseName

データベース名。

**型**: `string`

**バリデーション**:
- 空文字列ではないこと
- 拡張子は `.db` または `.sqlite`
- ファイル名として有効な文字のみ

### DatabasePath

データベースファイルのパス。

**型**: `string`

**バリデーション**:
- 絶対パスであること
- 有効なファイルパスであること

### Timestamp

日時を表す値オブジェクト。

**型**: `Date`

## ポート

### FileSystemAccessPort

ファイルシステムへのアクセスを提供するポート（File System Access API）。

**メソッド**:

```typescript
interface FileSystemAccessPort {
  // ファイル選択ダイアログを表示してDBファイルを開く
  // @throws {SystemError}
  openFilePicker(options?: {
    accept?: { [key: string]: string[] }
    suggestedName?: string
  }): Promise<FileSystemFileHandle>

  // 新規ファイル保存ダイアログを表示してDBファイルを作成
  // @throws {SystemError}
  saveFilePicker(options?: {
    suggestedName?: string
    types?: { description: string; accept: { [key: string]: string[] } }[]
  }): Promise<FileSystemFileHandle>

  // ファイルハンドルからファイルを読み込む
  // @throws {SystemError}
  readFile(handle: FileSystemFileHandle): Promise<ArrayBuffer>

  // ファイルハンドルにデータを書き込む
  // @throws {SystemError}
  writeFile(handle: FileSystemFileHandle, data: ArrayBuffer): Promise<void>

  // パーミッションを確認・要求
  // @throws {SystemError}
  verifyPermission(handle: FileSystemFileHandle, mode: 'read' | 'readwrite'): Promise<boolean>

  // ファイル名を取得
  getFileName(handle: FileSystemFileHandle): string

  // ファイルパスを取得（可能な場合）
  // @throws {SystemError}
  getFilePath(handle: FileSystemFileHandle): Promise<string | null>
}
```

### DatabaseConnectionPort

データベース接続を管理するポート。

**メソッド**:

```typescript
interface DatabaseConnectionPort {
  // データベースに接続
  // @throws {SystemError}
  connect(handle: FileSystemFileHandle): Promise<void>

  // データベースから切断
  // @throws {SystemError}
  disconnect(): Promise<void>

  // 接続状態を確認
  isConnected(): boolean

  // 現在の接続を取得
  getCurrentConnection(): DatabaseConnection | null

  // データベースを初期化（テーブル作成）
  // @throws {SystemError}
  initialize(): Promise<void>

  // データベースのマイグレーション
  // @throws {SystemError}
  migrate(targetVersion: number): Promise<void>
}
```

### DatabaseStoragePort

データベースメタデータの永続化を担当するポート（localStorage等）。

**メソッド**:

```typescript
interface DatabaseStoragePort {
  // 最後に開いたDBファイルのハンドルを保存
  // @throws {SystemError}
  saveLastOpenedHandle(handle: FileSystemFileHandle): Promise<void>

  // 最後に開いたDBファイルのハンドルを取得
  // @throws {SystemError}
  getLastOpenedHandle(): Promise<FileSystemFileHandle | null>

  // 最後に開いたDBファイルのハンドルをクリア
  // @throws {SystemError}
  clearLastOpenedHandle(): Promise<void>

  // 最近開いたDBファイルのリストを保存
  // @throws {SystemError}
  saveRecentDatabase(info: { name: string; path: string }): Promise<void>

  // 最近開いたDBファイルのリストを取得
  // @throws {SystemError}
  getRecentDatabases(): Promise<Array<{ name: string; path: string }>>
}
```

## ユースケース

### openDatabase

既存のデータベースファイルを開く。

**入力**:
- なし（ファイル選択ダイアログから選択）

**出力**:
- `Promise<Database>`

**処理フロー**:
1. 現在のデータベース接続がある場合は切断
2. FileSystemAccessPort.openFilePickerでファイル選択ダイアログを表示
3. ユーザーがファイルを選択
4. FileSystemAccessPort.verifyPermissionでreadwriteパーミッションを確認
5. パーミッションがない場合は要求
6. DatabaseConnectionPort.connectで接続
7. データベース名とパスを取得
8. Databaseエンティティを作成
9. DatabaseStoragePort.saveLastOpenedHandleで最後に開いたファイルとして保存
10. DatabaseStoragePort.saveRecentDatabaseで最近開いたファイルリストに追加
11. 作成したDatabaseエンティティを返す

**例外**:
- `ValidationError`: ファイルが不正なフォーマットの場合に投げる
- `SystemError`: ファイルアクセスエラー、接続エラーの場合に投げる

### createDatabase

新規データベースファイルを作成する。

**入力**:
- `suggestedName: string` - 推奨ファイル名（オプション、デフォルト: "notes.db"）

**出力**:
- `Promise<Database>`

**処理フロー**:
1. 現在のデータベース接続がある場合は切断
2. FileSystemAccessPort.saveFilePickerでファイル保存ダイアログを表示
3. ユーザーが保存先を選択
4. 空のデータベースファイルを作成
5. DatabaseConnectionPort.connectで接続
6. DatabaseConnectionPort.initializeでテーブルを作成
7. データベース名とパスを取得
8. Databaseエンティティを作成
9. DatabaseStoragePort.saveLastOpenedHandleで最後に開いたファイルとして保存
10. DatabaseStoragePort.saveRecentDatabaseで最近開いたファイルリストに追加
11. 作成したDatabaseエンティティを返す

**例外**:
- `ValidationError`: ファイル名のバリデーションエラーの場合に投げる
- `SystemError`: ファイル作成エラー、初期化エラーの場合に投げる

### closeDatabase

現在のデータベース接続を閉じる。

**入力**:
- なし

**出力**:
- `Promise<void>`

**処理フロー**:
1. DatabaseConnectionPort.isConnectedで接続状態を確認
2. 接続中の場合:
   a. 保留中のトランザクションをコミット
   b. DatabaseConnectionPort.disconnectで切断
3. 接続していない場合は何もしない

**例外**:
- `SystemError`: 切断エラーの場合に投げる

### getCurrentDatabase

現在接続中のデータベース情報を取得する。

**入力**:
- なし

**出力**:
- `Promise<Database | null>`

**処理フロー**:
1. DatabaseConnectionPort.getCurrentConnectionで現在の接続を取得
2. 接続がない場合はnullを返す
3. 接続情報からDatabaseエンティティを構築して返す

**例外**:
- `SystemError`: 取得エラーの場合に投げる

### getDatabaseInfo

データベースの情報を取得する。

**入力**:
- なし

**出力**:
- `Promise<DatabaseInfo>`

**処理フロー**:
1. 現在のデータベース接続を取得
2. 接続がない場合はエラーを投げる
3. データベースの統計情報を取得:
   - メモの総数
   - タグの総数
   - リビジョンの総数
   - データベースファイルサイズ
4. 情報を返す

**例外**:
- `SystemError`: 接続エラー、情報取得エラーの場合に投げる

### reopenLastDatabase

最後に開いたデータベースを再度開く。

**入力**:
- なし

**出力**:
- `Promise<Database | null>`

**処理フロー**:
1. DatabaseStoragePort.getLastOpenedHandleで最後に開いたファイルハンドルを取得
2. ハンドルがない場合はnullを返す
3. FileSystemAccessPort.verifyPermissionでパーミッションを確認
4. パーミッションがない場合は要求
5. パーミッションが拒否された場合はnullを返す
6. DatabaseConnectionPort.connectで接続
7. Databaseエンティティを作成して返す

**例外**:
- `SystemError`: ファイルアクセスエラー、接続エラーの場合に投げる

### getRecentDatabases

最近開いたデータベースのリストを取得する。

**入力**:
- なし

**出力**:
- `Promise<Array<{ name: string; path: string }>>`

**処理フロー**:
1. DatabaseStoragePort.getRecentDatabasesでリストを取得
2. リストを返す（最大10件）

**例外**:
- `SystemError`: 取得エラーの場合に投げる

## 他ドメインとの関係

### すべてのドメイン

- すべてのドメインがDatabaseドメインの接続に依存
- データベースが接続されていない場合、他のドメインの操作は実行できない

### Settings ドメイン

- データベースパスの設定を保存

## ビジネスルールの補足

### File System Access API

- ブラウザのFile System Access APIを使用
- ユーザーの明示的な許可が必要
- パーミッションは永続化されるが、再度要求が必要な場合がある

### データベース接続の制限

- 同時に開けるデータベースは1つのみ
- 新しいデータベースを開く前に既存の接続を閉じる
- 接続の切り替え時にデータ損失がないように注意

### オフライン対応

- データベースファイルはローカルに保存される
- ネットワーク接続は不要
- すべてのデータはローカルで完結

### セキュリティ考慮

- ユーザーが選択したファイルのみアクセス可能
- ブラウザのサンドボックス内で動作
- ファイルシステムへの直接アクセスは制限される

### パフォーマンス考慮

- データベース接続は一度確立したら保持
- 頻繁な接続・切断は避ける
- 大きなトランザクションはバッチ処理

### エラーハンドリング

- ファイルが見つからない場合
- パーミッションが拒否された場合
- データベースファイルが破損している場合
- ストレージ容量が不足している場合

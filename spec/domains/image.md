# Image ドメイン

## 概要

**ドメイン名**: Image

画像のアップロード、ローカルストレージへの保存、メモへの埋め込みを管理するドメイン。
アップロードされた画像はローカルファイルシステムに保存され、メモから参照される。

## エンティティ

### Image

画像を表すエンティティ。

**属性**:
- `id: ImageId` - 画像の一意識別子
- `fileName: FileName` - 元のファイル名
- `mimeType: MimeType` - MIMEタイプ（例: image/jpeg, image/png）
- `size: FileSize` - ファイルサイズ（バイト）
- `width: number` - 画像の幅（ピクセル）
- `height: number` - 画像の高さ（ピクセル）
- `storagePath: StoragePath` - ローカルストレージ上のパス
- `uploadedAt: Timestamp` - アップロード日時

**不変条件**:
- IDは一意でなければならない
- mimeTypeは画像形式でなければならない
- sizeは0より大きくなければならない
- widthとheightは0より大きくなければならない

**ビジネスルール**:
- アップロードされた画像は変更不可（イミュータブル）
- 画像が削除されるとストレージからも削除される

## 値オブジェクト

### ImageId

画像の一意識別子。

**型**: `string` (UUID v4)

**バリデーション**:
- UUID v4 形式であること

### FileName

ファイル名。

**型**: `string`

**バリデーション**:
- 空文字列ではないこと
- ファイル名として有効な文字のみ
- 拡張子を含むこと

### MimeType

MIMEタイプ。

**型**: `string`

**バリデーション**:
- `image/jpeg`, `image/png`, `image/gif`, `image/webp` のいずれか

### FileSize

ファイルサイズ。

**型**: `number` (バイト)

**バリデーション**:
- 0より大きいこと
- 最大サイズ以下であること（デフォルト: 10MB）

### StoragePath

ストレージ上のパス。

**型**: `string`

**バリデーション**:
- 空文字列ではないこと
- 相対パスであること

### Timestamp

日時を表す値オブジェクト。

**型**: `Date`

## ポート

### ImageStoragePort

画像ファイルの保存と取得を担当するポート（File System Access API）。

**メソッド**:

```typescript
interface ImageStoragePort {
  // ファイル選択ダイアログを表示して画像を選択
  // @throws {SystemError}
  pickImage(options?: {
    accept?: string[]
    multiple?: boolean
  }): Promise<File[]>

  // 画像を保存
  // @throws {SystemError}
  saveImage(id: ImageId, file: File): Promise<StoragePath>

  // 画像を読み込み
  // @throws {SystemError}
  loadImage(storagePath: StoragePath): Promise<Blob>

  // 画像を削除
  // @throws {SystemError}
  deleteImage(storagePath: StoragePath): Promise<void>

  // 画像のURLを生成（表示用）
  createImageUrl(blob: Blob): string

  // 画像URLを解放
  revokeImageUrl(url: string): void

  // 画像ディレクトリを初期化
  // @throws {SystemError}
  initializeImageDirectory(): Promise<void>
}
```

### ImageRepository

画像メタデータの永続化を担当するリポジトリインターフェース。

**メソッド**:

```typescript
interface ImageRepository {
  // 画像メタデータを作成
  // @throws {SystemError}
  create(image: Image): Promise<Image>

  // 画像メタデータを削除
  // @throws {SystemError}
  delete(id: ImageId): Promise<void>

  // IDで画像メタデータを取得
  // @throws {SystemError}
  findById(id: ImageId): Promise<Image | null>

  // すべての画像メタデータを取得
  // @throws {SystemError}
  findAll(): Promise<Image[]>

  // メモで使用されている画像IDのリストを取得
  // @throws {SystemError}
  findUsedImageIds(): Promise<ImageId[]>

  // 使用されていない画像を削除
  // @throws {SystemError}
  deleteUnusedImages(usedIds: ImageId[]): Promise<number>
}
```

### ImageProcessingPort

画像処理を担当するポート。

**メソッド**:

```typescript
interface ImageProcessingPort {
  // 画像の寸法を取得
  // @throws {SystemError}
  getImageDimensions(file: File): Promise<{ width: number; height: number }>

  // 画像をリサイズ（必要に応じて）
  // @throws {SystemError}
  resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<Blob>

  // 画像を最適化
  // @throws {SystemError}
  optimizeImage(file: File, quality: number): Promise<Blob>
}
```

## ユースケース

### uploadImage

画像をアップロードしてローカルストレージに保存する。

**入力**:
- `file: File` - 画像ファイル（オプション、指定なしの場合はファイル選択ダイアログを表示）

**出力**:
- `Promise<Image>`

**処理フロー**:
1. fileが指定されていない場合:
   a. ImageStoragePort.pickImageでファイル選択ダイアログを表示
   b. ユーザーが画像を選択
2. ファイルのバリデーション:
   a. MIMEタイプが画像形式か確認
   b. ファイルサイズが制限以下か確認
3. ImageProcessingPort.getImageDimensionsで画像の寸法を取得
4. 必要に応じてImageProcessingPort.optimizeImageで最適化
5. 新しいImageエンティティを生成:
   - IDを自動生成
   - ファイル名、MIMEタイプ、サイズを設定
   - 寸法を設定
   - uploadedAtに現在時刻を設定
6. ImageStoragePort.saveImageでストレージに保存
7. storagePathを取得
8. ImageRepository.createでメタデータを保存
9. 作成したImageエンティティを返す

**例外**:
- `ValidationError`: ファイル形式・サイズのバリデーションエラーを投げる
- `SystemError`: ファイル保存エラーを投げる

### getImage

画像メタデータを取得する。

**入力**:
- `id: ImageId` - 画像ID

**出力**:
- `Promise<Image>`

**処理フロー**:
1. ImageRepository.findByIdで画像メタデータを取得
2. 画像が存在しない場合はNotFoundErrorを投げる
3. 画像メタデータを返す

**例外**:
- `NotFoundError`: 画像が見つからない場合に投げる
- `SystemError`: DB取得エラーを投げる

### getImageUrl

画像の表示用URLを取得する。

**入力**:
- `id: ImageId` - 画像ID

**出力**:
- `Promise<string>`

**処理フロー**:
1. ImageRepository.findByIdで画像メタデータを取得
2. 画像が存在しない場合はNotFoundErrorを投げる
3. ImageStoragePort.loadImageで画像データを読み込む
4. ImageStoragePort.createImageUrlでBlob URLを生成
5. URLを返す

**注意**: 使用後は `revokeImageUrl` で解放する必要がある

**例外**:
- `NotFoundError`: 画像が見つからない場合に投げる
- `SystemError`: ファイル読み込みエラーを投げる

### deleteImage

画像を削除する（メタデータとストレージの両方）。

**入力**:
- `id: ImageId` - 画像ID

**出力**:
- `Promise<void>`

**処理フロー**:
1. ImageRepository.findByIdで画像メタデータを取得
2. 画像が存在しない場合はNotFoundErrorを投げる
3. ImageStoragePort.deleteImageでストレージから削除
4. ImageRepository.deleteでメタデータを削除

**例外**:
- `NotFoundError`: 画像が見つからない場合に投げる
- `SystemError`: 削除エラーを投げる

### getAllImages

すべての画像メタデータを取得する。

**入力**:
- なし

**出力**:
- `Promise<Image[]>`

**処理フロー**:
1. ImageRepository.findAllで画像メタデータ一覧を取得
2. 一覧を返す

**例外**:
- `SystemError`: DB取得エラーを投げる

### cleanupUnusedImages

メモで使用されていない画像を削除する。

**入力**:
- なし

**出力**:
- `Promise<number>` - 削除した画像の数

**処理フロー**:
1. すべてのメモの本文を取得
2. 本文から画像参照（`![alt](image://id)` 形式）を抽出
3. 使用されている画像IDのリストを作成
4. ImageRepository.findAllですべての画像メタデータを取得
5. 使用されていない画像を特定
6. 各未使用画像について:
   a. ImageStoragePort.deleteImageでストレージから削除
   b. ImageRepository.deleteでメタデータを削除
7. 削除した画像の数を返す

**例外**:
- `SystemError`: 削除エラーを投げる

### getImageMarkdown

画像のMarkdown埋め込みコードを生成する。

**入力**:
- `id: ImageId` - 画像ID
- `alt: string` - 代替テキスト（オプション）

**出力**:
- `Promise<string>`

**処理フロー**:
1. ImageRepository.findByIdで画像メタデータを取得
2. 画像が存在しない場合はNotFoundErrorを投げる
3. Markdownコードを生成: `![alt](image://${id})`
4. Markdownコードを返す

**例外**:
- `NotFoundError`: 画像が見つからない場合に投げる
- `SystemError`: DB取得エラーを投げる

## 他ドメインとの関係

### Note ドメイン

- メモ本文に画像参照が埋め込まれる
- メモ削除時に関連する未使用画像のクリーンアップを検討

### Settings ドメイン

- 最大画像サイズの設定を参照
- 画像保存先ディレクトリの設定を参照

## ビジネスルールの補足

### 画像の保存場所

- データベースファイルと同じディレクトリに `images/` フォルダを作成
- 画像ファイルは `{UUID}.{拡張子}` の形式で保存
- ディレクトリ構造:
  ```
  /notes.db
  /images/
    /550e8400-e29b-41d4-a716-446655440000.jpg
    /550e8400-e29b-41d4-a716-446655440001.png
  ```

### 画像の参照形式

- メモ本文では `![alt text](image://{ImageId})` の形式で参照
- エディター表示時に `image://` プロトコルを実際のBlob URLに変換
- エクスポート時は画像を埋め込むか、相対パスに変換

### サポートする画像形式

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)

### サイズ制限

- デフォルト最大サイズ: 10MB
- 設定で変更可能（1MB〜50MB）
- 大きすぎる画像は自動的にリサイズ

### 画像の最適化

- アップロード時に自動的に最適化
- JPEG品質: 85%
- PNG: 可逆圧縮
- WebP: 優先的に使用

### 未使用画像のクリーンアップ

- 定期的に未使用画像をチェック
- メモから参照されていない画像を自動削除
- ユーザーが手動でクリーンアップを実行可能

### エラーハンドリング

- 画像が見つからない場合: プレースホルダー画像を表示
- 読み込みエラー: エラーメッセージを表示
- サイズ超過: エラーメッセージと許容サイズを表示
- 形式エラー: サポートされる形式を表示

### パフォーマンス考慮

- 画像の遅延読み込み
- サムネイル生成（将来的な最適化）
- Blob URLのキャッシュ管理
- 不要なBlob URLの適切な解放

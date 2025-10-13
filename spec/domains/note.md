# Note ドメイン

## 概要

**ドメイン名**: Note

メモの作成、編集、削除、閲覧、検索を管理する本アプリケーションの中核ドメイン。
メモは Markdown 形式で記述され、タグを含むことができる。

## エンティティ

### Note

メモを表すエンティティ。

**属性**:
- `id: NoteId` - メモの一意識別子
- `body: NoteBody` - メモの本文（Markdown形式）
- `createdAt: Timestamp` - 作成日時
- `updatedAt: Timestamp` - 更新日時
- `tags: Tag[]` - 紐付けられたタグのリスト

**不変条件**:
- IDは一意でなければならない
- 本文は空でも良い（作成直後は空）
- createdAtは変更不可
- updatedAtは更新のたびに更新される
- tagsは本文から自動解析される

**ビジネスルール**:
- メモの更新時は自動的にupdatedAtが更新される
- メモの削除は論理削除ではなく物理削除

## 値オブジェクト

### NoteId

メモの一意識別子。

**型**: `string` (UUID v4)

**バリデーション**:
- UUID v4 形式であること

### NoteBody

メモの本文。

**型**: `string` (Markdown)

**バリデーション**:
- なし（空文字列も許可）

**ビジネスロジック**:
- Markdownからタグを抽出する機能を持つ

### Timestamp

日時を表す値オブジェクト。

**型**: `Date`

### SortOrder

メモのソート順を表す。

**型**: `enum`
- `CREATED_ASC` - 作成日昇順
- `CREATED_DESC` - 作成日降順
- `UPDATED_ASC` - 更新日昇順
- `UPDATED_DESC` - 更新日降順

### SearchQuery

検索クエリを表す。

**型**: `string`

**バリデーション**:
- 最大長: 500文字

### PaginationParams

ページネーションパラメータ。

**属性**:
- `offset: number` - オフセット（デフォルト: 0）
- `limit: number` - 取得件数（デフォルト: 20）

**バリデーション**:
- offsetは0以上
- limitは1以上100以下

## ポート

### NoteRepository

メモの永続化を担当するリポジトリインターフェース。

**メソッド**:

```typescript
interface NoteRepository {
  // メモの作成
  // @throws {SystemError} DB保存エラー
  create(note: Note): Promise<Note>

  // メモの更新
  // @throws {SystemError} DB保存エラー
  update(note: Note): Promise<Note>

  // メモの削除
  // @throws {SystemError} DB削除エラー
  delete(id: NoteId): Promise<void>

  // IDでメモを取得
  // @throws {SystemError} DB取得エラー
  findById(id: NoteId): Promise<Note | null>

  // メモ一覧を取得（ページネーション付き）
  // @throws {SystemError} DB取得エラー
  findAll(params: {
    sortOrder: SortOrder
    pagination: PaginationParams
  }): Promise<Note[]>

  // メモの総数を取得
  // @throws {SystemError} DB取得エラー
  count(): Promise<number>

  // 全文検索
  // @throws {SystemError} DB検索エラー
  search(query: SearchQuery, params: {
    sortOrder: SortOrder
    pagination: PaginationParams
  }): Promise<Note[]>

  // タグで検索（AND検索）
  // @throws {SystemError} DB検索エラー
  findByTags(tagNames: string[], params: {
    sortOrder: SortOrder
    pagination: PaginationParams
  }): Promise<Note[]>

  // 複合検索（全文検索 + タグ検索）
  // @throws {SystemError} DB検索エラー
  searchWithTags(query: SearchQuery, tagNames: string[], params: {
    sortOrder: SortOrder
    pagination: PaginationParams
  }): Promise<Note[]>
}
```

### ExportPort

メモのエクスポート機能を提供するポート。

**メソッド**:

```typescript
interface ExportPort {
  // 単一メモをMarkdownファイルとしてエクスポート
  // @throws {SystemError} エクスポートエラー
  exportAsMarkdown(note: Note, fileName: string): Promise<void>

  // 複数メモを一括でMarkdownファイルとしてエクスポート
  // @throws {SystemError} エクスポートエラー
  exportMultipleAsMarkdown(notes: Note[], directoryName: string): Promise<void>
}
```

## ユースケース

### createNote

新規メモを作成する。

**入力**:
- `body: string` - 初期本文（オプション、デフォルト: ""）

**出力**:
- `Promise<Note>`

**処理フロー**:
1. 新しいNoteエンティティを生成
   - IDを自動生成
   - createdAt, updatedAtに現在時刻を設定
   - bodyを設定（空でも良い）
2. 本文からタグを抽出（TagドメインのextractTagsを呼び出し）
3. NoteRepositoryに保存
4. 保存したメモを返す

**例外**:
- `ValidationError`: バリデーションエラー
- `SystemError`: DB保存エラー

### getNote

IDでメモを取得する。

**入力**:
- `id: NoteId`

**出力**:
- `Promise<Note>`

**処理フロー**:
1. NoteRepository.findByIdでメモを取得
2. メモが存在しない場合はNotFoundErrorを投げる
3. メモを返す

**例外**:
- `NotFoundError`: メモが見つからない
- `SystemError`: DB取得エラー

### getNotes

メモ一覧を取得する（ページネーション付き）。

**入力**:
- `sortOrder: SortOrder` - ソート順
- `pagination: PaginationParams` - ページネーションパラメータ

**出力**:
- `Promise<{ notes: Note[], total: number }>`

**処理フロー**:
1. paginationをバリデート
2. NoteRepository.findAllでメモ一覧を取得
3. NoteRepository.countで総数を取得
4. メモ一覧と総数を返す

**例外**:
- `ValidationError`: バリデーションエラー
- `SystemError`: DB取得エラー

### updateNote

既存メモを更新する。

**入力**:
- `id: NoteId`
- `body: string` - 新しい本文

**出力**:
- `Promise<Note>`

**処理フロー**:
1. NoteRepository.findByIdで既存メモを取得
2. メモが存在しない場合はNotFoundErrorを投げる
3. 本文を更新
4. updatedAtを現在時刻に更新
5. 本文からタグを再抽出
6. NoteRepository.updateで保存
7. 更新したメモを返す

**例外**:
- `NotFoundError`: メモが見つからない
- `ValidationError`: バリデーションエラー
- `SystemError`: DB保存エラー

### deleteNote

メモを削除する。

**入力**:
- `id: NoteId`

**出力**:
- `Promise<void>`

**処理フロー**:
1. NoteRepository.findByIdで既存メモを確認
2. メモが存在しない場合はNotFoundErrorを投げる
3. NoteRepository.deleteで削除
4. 関連するリビジョンも削除（Revisionドメイン経由）

**例外**:
- `NotFoundError`: メモが見つからない
- `SystemError`: DB削除エラー

### searchNotes

メモを全文検索する。

**入力**:
- `query: SearchQuery` - 検索クエリ
- `sortOrder: SortOrder` - ソート順
- `pagination: PaginationParams` - ページネーションパラメータ

**出力**:
- `Promise<Note[]>`

**処理フロー**:
1. クエリをバリデート
2. NoteRepository.searchで検索
3. 検索結果を返す

**例外**:
- `ValidationError`: バリデーションエラー
- `SystemError`: DB検索エラー

### searchNotesByTags

タグでメモを検索する（AND検索）。

**入力**:
- `tagNames: string[]` - タグ名のリスト
- `sortOrder: SortOrder` - ソート順
- `pagination: PaginationParams` - ページネーションパラメータ

**出力**:
- `Promise<Note[]>`

**処理フロー**:
1. タグ名をバリデート
2. NoteRepository.findByTagsで検索
3. 検索結果を返す

**例外**:
- `ValidationError`: バリデーションエラー
- `SystemError`: DB検索エラー

### combinedSearch

全文検索とタグ検索を組み合わせて検索する。

**入力**:
- `query: SearchQuery` - 検索クエリ
- `tagNames: string[]` - タグ名のリスト
- `sortOrder: SortOrder` - ソート順
- `pagination: PaginationParams` - ページネーションパラメータ

**出力**:
- `Promise<Note[]>`

**処理フロー**:
1. クエリとタグ名をバリデート
2. NoteRepository.searchWithTagsで検索
3. 検索結果を返す

**例外**:
- `ValidationError`: バリデーションエラー
- `SystemError`: DB検索エラー

### exportNoteAsMarkdown

メモをMarkdownファイルとしてエクスポートする。

**入力**:
- `id: NoteId`
- `fileName: string` - ファイル名（オプション）

**出力**:
- `Promise<void>`

**処理フロー**:
1. NoteRepository.findByIdでメモを取得
2. メモが存在しない場合はNotFoundErrorを投げる
3. ファイル名が指定されていない場合は、作成日時から生成
4. ExportPort.exportAsMarkdownでエクスポート

**例外**:
- `NotFoundError`: メモが見つからない
- `SystemError`: エクスポートエラー

### exportNotesAsMarkdown

複数メモを一括でMarkdownファイルとしてエクスポートする。

**入力**:
- `ids: NoteId[]` - メモIDのリスト
- `directoryName: string` - ディレクトリ名（オプション）

**出力**:
- `Promise<void>`

**処理フロー**:
1. 各IDに対してNoteRepository.findByIdでメモを取得
2. 存在するメモのみを対象とする
3. ディレクトリ名が指定されていない場合は、現在時刻から生成
4. ExportPort.exportMultipleAsMarkdownでエクスポート

**例外**:
- `SystemError`: エクスポートエラー

## 他ドメインとの関係

### Tag ドメイン

- Noteの本文からタグを自動抽出する際にTagドメインのextractTagsFromContentを使用
- タグ検索時にTagドメインのTagNameを使用

### Revision ドメイン

- メモ更新時にリビジョンを作成（Revisionドメイン経由）
- メモ削除時に関連リビジョンも削除

### Image ドメイン

- メモ本文に画像が含まれている場合、Imageドメインを通じて画像を参照

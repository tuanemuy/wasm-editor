# Note ドメイン

## 概要

**ドメイン名:** Note (メモ)

Noteドメインは、メモの作成、編集、削除、閲覧、検索を担当するコアドメインです。
アプリケーションの中心的な機能を提供し、ユーザーのメモ管理を支援します。

## エンティティ

### Note (メモ)

メモエンティティは、ユーザーが作成・管理するメモの情報を表現します。
Noteは集約ルートであり、タグとの関連を所有します。

**属性:**
- `id: NoteId` - メモの一意識別子 (UUID v7)
- `content: NoteContent` - メモの本文 (Markdown形式)
- `tagIds: TagId[]` - 関連付けられたタグのIDリスト
- `createdAt: Date` - 作成日時
- `updatedAt: Date` - 更新日時

**ビジネスルール:**
1. メモの本文は空であってはならない (最低1文字必要)
2. メモの本文の最大長は100,000文字とする
3. 作成日時は変更不可
4. 更新日時は自動更新される
5. tagIdsは重複を許さない（Set的な振る舞い）

**エンティティ操作:**
- `createNote(params: CreateNoteParams): Note` - 新規メモを作成
- `updateContent(note: Note, content: string): Note` - メモ本文を更新
- `updateTagIds(note: Note, tagIds: TagId[]): Note` - タグIDリストを更新

```typescript
export type Note = {
  id: NoteId;
  content: NoteContent;
  tagIds: TagId[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreateNoteParams = {
  content: string;
  tagIds?: TagId[];
};
```

## 値オブジェクト

### NoteId (メモID)

メモを一意に識別するID。UUID v7形式を使用。

**生成ルール:**
- UUID v7を使用 (時系列でソート可能)
- 自動生成されるため、ユーザーが指定することはない

```typescript
export type NoteId = string & { readonly brand: "NoteId" };

export function createNoteId(id: string): NoteId;
export function generateNoteId(): NoteId;
```

### NoteContent (メモ本文)

メモの本文を表す値オブジェクト。Markdown形式。

**バリデーションルール:**
1. 空文字列は許可しない (最低1文字必要)
2. 最大長は100,000文字
3. 文字列型であること

```typescript
export type NoteContent = string & { readonly brand: "NoteContent" };

export function createNoteContent(content: string): NoteContent;
```

### SortOrder (ソート順)

メモ一覧のソート順（昇順/降順）を表す値オブジェクト。

**取りうる値:**
- `asc` - 昇順 (古い順)
- `desc` - 降順 (新しい順)

```typescript
export type SortOrder = "asc" | "desc";

export function createSortOrder(order: string): SortOrder;
export function getDefaultSortOrder(): SortOrder; // "desc"
```

### OrderBy (ソート対象)

メモ一覧のソート対象フィールドを表す値オブジェクト。

**取りうる値:**
- `created_at` - 作成日時
- `updated_at` - 更新日時

```typescript
export type OrderBy = "created_at" | "updated_at";

export function createOrderBy(field: string): OrderBy;
export function getDefaultOrderBy(): OrderBy; // "created_at"
```

## エラーコード

Noteドメインで発生するエラーコードを定義します。

```typescript
export const NoteErrorCode = {
  // 本文関連
  ContentEmpty: "NOTE_CONTENT_EMPTY",
  ContentTooLong: "NOTE_CONTENT_TOO_LONG",

  // ソート関連
  InvalidSortOrder: "NOTE_INVALID_SORT_ORDER",
  InvalidOrderBy: "NOTE_INVALID_ORDER_BY",
} as const;
```

## ポート (インターフェース)

### NoteRepository (メモリポジトリ)

メモの永続化を担当するポート。

**責務:**
- メモの保存、取得、削除
- メモの一覧取得 (ページネーション、ソート付き)
- 単一エンティティの CRUD と基本的な操作

```typescript
import type { Pagination, PaginationResult } from "@/lib/pagination";

export interface NoteRepository {
  /**
   * メモを保存 (作成または更新)
   */
  save(note: Note): Promise<void>;

  /**
   * IDでメモを取得
   * @throws NotFoundError メモが見つからない場合
   */
  findById(id: NoteId): Promise<Note>;

  /**
   * メモ一覧を取得 (ページネーション、ソート付き)
   */
  findAll(params: {
    pagination: Pagination;
    order: SortOrder;
    orderBy: OrderBy;
  }): Promise<PaginationResult<Note>>;

  /**
   * メモを削除
   * @throws NotFoundError メモが見つからない場合
   */
  delete(id: NoteId): Promise<void>;

  /**
   * メモが存在するかチェック
   */
  exists(id: NoteId): Promise<boolean>;
}
```

### NoteQueryService (メモクエリサービス)

複雑な検索クエリを担当するポート。読み取り専用の複雑なクエリを実装します。

**責務:**
- 全文検索とタグ検索を組み合わせた複合検索
- 効率的なページネーション付き検索
- 複数エンティティを横断する複雑なクエリ
- JOIN を使用した効率的なクエリの実装

```typescript
import type { Pagination, PaginationResult } from "@/lib/pagination";

export interface NoteQueryService {
  /**
   * 全文検索とタグ検索を組み合わせた複合検索
   *
   * @param query - 検索クエリ（空文字列の場合は全文検索なし）
   * @param tagIds - タグIDのリスト（空配列の場合はタグ検索なし）
   * @param pagination - ページネーション設定
   * @param order - ソート順（昇順/降順）
   * @param orderBy - ソート対象（作成日時/更新日時）
   *
   * @returns 検索結果とページネーション情報
   *
   * @description
   * - query と tagIds の両方が指定された場合は AND 検索
   * - query のみ指定された場合は全文検索
   * - tagIds のみ指定された場合はタグ検索
   * - 両方とも空の場合は全件取得（findAll相当）
   * - タグ検索は noteTagRelations テーブルをJOINして実装
   */
  combinedSearch(params: {
    query: string;
    tagIds: TagId[];
    pagination: Pagination;
    order: SortOrder;
    orderBy: OrderBy;
  }): Promise<PaginationResult<Note>>;

  /**
   * タグに関連付けられたメモIDを取得
   *
   * @param tagId - タグID
   * @returns メモIDのリスト
   *
   * @description
   * noteTagRelations テーブルをJOINしてメモIDを取得
   */
  findNoteIdsByTagId(tagId: TagId): Promise<NoteId[]>;

  /**
   * 複数タグに関連付けられたメモIDを取得 (AND検索)
   *
   * @param tagIds - タグIDのリスト
   * @returns すべてのタグを持つメモIDのリスト
   *
   * @description
   * - すべてのタグを持つメモのみを返す (AND検索)
   * - noteTagRelations テーブルをJOINして実装
   */
  findNoteIdsByTagIds(tagIds: TagId[]): Promise<NoteId[]>;
}
```

### ExportPort (エクスポート)

メモをMarkdownファイルとしてエクスポートするポート。

**責務:**
- メモを個別にエクスポート
- 複数メモを一括エクスポート
- ファイル名の生成

```typescript
export type ExportedFile = {
  filename: string;
  content: string;
};

export interface ExportPort {
  /**
   * メモをMarkdownファイルとしてエクスポート
   */
  exportAsMarkdown(note: Note): Promise<ExportedFile>;

  /**
   * 複数メモを一括エクスポート (ZIPファイル)
   */
  exportMultipleAsMarkdown(notes: Note[]): Promise<Blob>;
}
```

## ユースケース

Noteドメインで提供されるユースケース一覧。

### 1. createNote (メモ作成)

新規メモを作成します。

**入力:**
- `content: string` - メモ本文 (Markdown)

**出力:**
- `Note` - 作成されたメモ

**ビジネスルール:**
- 空のメモは作成できない (最低1文字必要)
- 本文の最大長は100,000文字

**エラー:**
- `BusinessRuleError(ContentEmpty)` - 本文が空
- `BusinessRuleError(ContentTooLong)` - 本文が長すぎる
- `SystemError` - 保存に失敗

**実装パス:** `app/core/application/note/createNote.ts`

---

### 2. updateNote (メモ更新)

既存メモを更新します。

**入力:**
- `id: NoteId` - メモID
- `content: string` - 新しいメモ本文

**出力:**
- `Note` - 更新されたメモ

**ビジネスルール:**
- 空のメモには更新できない
- 本文の最大長は100,000文字
- 更新日時は自動更新される

**エラー:**
- `NotFoundError` - メモが見つからない
- `BusinessRuleError(ContentEmpty)` - 本文が空
- `BusinessRuleError(ContentTooLong)` - 本文が長すぎる
- `SystemError` - 保存に失敗

**実装パス:** `app/core/application/note/updateNote.ts`

---

### 3. deleteNote (メモ削除)

メモを削除します。

**入力:**
- `id: NoteId` - メモID

**出力:**
- `void`

**ビジネスルール:**
- メモが存在しない場合はエラー

**エラー:**
- `NotFoundError` - メモが見つからない
- `SystemError` - 削除に失敗

**実装パス:** `app/core/application/note/deleteNote.ts`

---

### 4. getNote (メモ取得)

IDでメモを取得します。

**入力:**
- `id: NoteId` - メモID

**出力:**
- `Note` - メモ

**エラー:**
- `NotFoundError` - メモが見つからない
- `SystemError` - 取得に失敗

**実装パス:** `app/core/application/note/getNote.ts`

---

### 5. getNotes (メモ一覧取得)

メモ一覧を取得します (ページネーション、ソート付き)。

**入力:**
- `pagination: Pagination` - ページネーション設定
- `order: SortOrder` - ソート順（昇順/降順）
- `orderBy: OrderBy` - ソート対象（作成日時/更新日時）

**出力:**
- `PaginationResult<Note>` - メモ一覧とページネーション情報

**ビジネスルール:**
- デフォルトのソート順は `desc`（降順）
- デフォルトのソート対象は `created_at`（作成日時）
- ページサイズのデフォルトは20

**エラー:**
- `SystemError` - 取得に失敗

**実装パス:** `app/core/application/note/getNotes.ts`

---

### 6. combinedSearch (複合検索)

全文検索とタグ検索を組み合わせた検索を実行します。

**入力:**
- `query: string` - 検索クエリ（空文字列の場合は全文検索なし）
- `tagIds: TagId[]` - タグIDのリスト（空配列の場合はタグ検索なし）
- `pagination: Pagination` - ページネーション設定
- `order: SortOrder` - ソート順（昇順/降順）
- `orderBy: OrderBy` - ソート対象（作成日時/更新日時）

**出力:**
- `PaginationResult<Note>` - 検索結果

**ビジネスルール:**
- query と tagIds の両方が指定された場合は AND 検索
- query のみ指定された場合は全文検索のみ
- tagIds のみ指定された場合はタグ検索のみ
- 両方とも空の場合は全件取得（getNotes相当）
- 検索対象（全文検索）: メモ本文
- 部分一致検索、大文字小文字を区別しない
- 複数タグ指定時は AND 検索（すべてのタグIDを持つメモのみ）

**処理フロー:**
1. NoteQueryService の `combinedSearch()` を呼び出し
2. 内部で noteTagRelations テーブルをJOINしてタグ検索を実行
3. query が指定されている場合は content カラムで全文検索
4. ページネーションとソートを適用

**エラー:**
- `SystemError` - 検索に失敗

**実装パス:** `app/core/application/note/combinedSearch.ts`

---

### 7. exportNoteAsMarkdown (Markdownエクスポート)

メモをMarkdownファイルとしてエクスポートします。

**入力:**
- `id: NoteId` - メモID

**出力:**
- `ExportedFile` - エクスポートされたファイル情報

**ビジネスルール:**
- ファイル名は本文から自動抽出したタイトル、または作成日時を使用
- ファイル拡張子は `.md`

**エラー:**
- `NotFoundError` - メモが見つからない
- `SystemError` - エクスポートに失敗

**実装パス:** `app/core/application/note/exportNoteAsMarkdown.ts`

---

### 8. exportNotesAsMarkdown (一括エクスポート)

複数メモを一括でMarkdownファイルとしてエクスポートします (ZIPファイル)。

**入力:**
- `noteIds: NoteId[]` - メモIDのリスト

**出力:**
- `Blob` - ZIPファイル

**ビジネスルール:**
- 各メモを個別のMarkdownファイルとしてエクスポート
- ZIPファイルにまとめて返す
- 存在しないメモIDはスキップ

**エラー:**
- `SystemError` - エクスポートに失敗

**実装パス:** `app/core/application/note/exportNotesAsMarkdown.ts`

---

### 9. searchNotesByTag (タグ検索)

タグに関連付けられたメモを検索します。

**入力:**
- `tagName: string` - タグ名
- `pagination: Pagination` - ページネーション設定
- `order: SortOrder` - ソート順（昇順/降順）
- `orderBy: OrderBy` - ソート対象（作成日時/更新日時）

**出力:**
- `PaginationResult<Note>` - 検索結果

**ビジネスルール:**
- タグが存在しない場合は空の結果を返す
- 大文字小文字は区別する

**処理フロー:**
1. TagRepository の `findByName()` でタグを検索
2. タグが存在しない場合は空の結果を返す
3. `combinedSearch()` に空のクエリと検索したタグIDを渡して検索

**エラー:**
- `SystemError` - 検索に失敗

**実装パス:** `app/core/application/note/searchNotesByTag.ts`

---

### 10. searchNotesByTags (複数タグ検索)

複数タグに関連付けられたメモを検索します (AND検索)。

**入力:**
- `tagNames: string[]` - タグ名のリスト
- `pagination: Pagination` - ページネーション設定
- `order: SortOrder` - ソート順（昇順/降順）
- `orderBy: OrderBy` - ソート対象（作成日時/更新日時）

**出力:**
- `PaginationResult<Note>` - 検索結果

**ビジネスルール:**
- すべてのタグを持つメモのみを返す (AND検索)
- いずれかのタグが存在しない場合は空の結果を返す
- 大文字小文字は区別する

**処理フロー:**
1. 各タグ名に対して TagRepository の `findByName()` でタグを検索
2. いずれかのタグが存在しない場合は空の結果を返す
3. `combinedSearch()` に空のクエリと検索したタグIDのリストを渡して検索

**エラー:**
- `SystemError` - 検索に失敗

**実装パス:** `app/core/application/note/searchNotesByTags.ts`

## データモデル

### DBテーブル定義

```typescript
// app/core/adapters/drizzleSqlite/schema.ts

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});

// メモとタグの関連テーブル（実装詳細、Note集約の一部として管理）
export const noteTagRelations = sqliteTable(
  "note_tag_relations",
  {
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.noteId, table.tagId] }),
  }),
);
```

**注記:**
- `noteTagRelations` テーブルはNote集約の実装詳細
- NoteRepositoryがこのテーブルを管理し、`tagIds` 配列として抽象化
- ドメイン層からは中間テーブルの存在を隠蔽

### インデックス

```typescript
// 全文検索用
export const notesContentIndex = index("notes_content_idx").on(notes.content);

// ソート用
export const notesCreatedAtIndex = index("notes_created_at_idx").on(notes.createdAt);
export const notesUpdatedAtIndex = index("notes_updated_at_idx").on(notes.updatedAt);

// タグ検索用（中間テーブル）
export const noteTagRelationsNoteIdIndex = index("note_tag_relations_note_id_idx")
  .on(noteTagRelations.noteId);
export const noteTagRelationsTagIdIndex = index("note_tag_relations_tag_id_idx")
  .on(noteTagRelations.tagId);
```

## テスト要件

各ユースケースに対して、以下のテストケースを作成します：

1. **正常系テスト**
   - 正しい入力で期待される出力が得られること

2. **異常系テスト**
   - バリデーションエラーが適切に発生すること
   - 存在しないリソースに対してNotFoundErrorが発生すること

3. **境界値テスト**
   - 最小長/最大長の入力が正しく処理されること

4. **統合テスト**
   - 複数のユースケースを組み合わせた動作が正しいこと

テストケースの詳細は `spec/testcases/note/` に格納されます。

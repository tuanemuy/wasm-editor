# Note ドメイン

## 概要

Noteドメインは、ノートの作成、更新、削除、取得、検索、フィルタリング、ソート、およびタグの自動解析と管理を担当します。

## 責務

- ノートのライフサイクル管理（作成、更新、削除、取得）
- ノート本文からのタグ自動解析（`#タグ名` 形式）
- ノートの検索（全文検索、タグ検索、複合検索）
- ノートのソート（作成日/更新日、昇順/降順）
- タグによるノートのフィルタリング（複数タグのAND検索）
- タグ一覧の管理

## エンティティ

### Note

ノートを表すエンティティ。

```typescript
type Note = Readonly<{
  id: NoteId;
  content: NoteContent;
  tags: TagName[];
  createdAt: Date;
  updatedAt: Date;
}>;
```

**プロパティ**:
- `id`: ノートの一意識別子（UUID v7）
- `content`: ノートの本文（Markdown形式）
- `tags`: ノートに含まれるタグのリスト（自動解析）
- `createdAt`: ノートの作成日時
- `updatedAt`: ノートの更新日時

**ファクトリ関数**:
- `createNote(params: CreateNoteParams): Result<Note, ValidationError>`
  - 新規ノートを作成
  - 空のノートも作成可能（content は空文字列）
  - tags は空配列で初期化

- `reconstructNote(data: RawNoteData): Result<Note, ValidationError>`
  - DBから取得した生データからノートエンティティを再構築

**ドメインメソッド**:
- `updateNoteContent(note: Note, newContent: NoteContent): Result<Note, ValidationError>`
  - ノートの本文を更新し、updatedAt を現在時刻に設定
  - タグは再解析される

- `extractTagsFromContent(content: NoteContent): TagName[]`
  - ノート本文から `#タグ名` 形式のタグを抽出
  - タグ名のルール:
    - 英数字、ひらがな、カタカナ、漢字を使用可能
    - スペースを含まない
    - ハイフン、アンダースコアは使用可能
    - 特殊文字は使用不可

---

### Tag

タグを表すエンティティ。

```typescript
type Tag = Readonly<{
  name: TagName;
  usageCount: number;
}>;
```

**プロパティ**:
- `name`: タグ名
- `usageCount`: タグが使用されているノートの数

**ファクトリ関数**:
- `reconstructTag(data: RawTagData): Result<Tag, ValidationError>`
  - DBから取得した生データからタグエンティティを再構築

---

## 値オブジェクト

### NoteId

ノートの一意識別子。

```typescript
const noteIdSchema = z.uuid().brand<"NoteId">();
type NoteId = z.infer<typeof noteIdSchema>;

function generateNoteId(): NoteId {
  return uuidv7() as NoteId;
}
```

---

### NoteContent

ノートの本文（Markdown形式）。

```typescript
const noteContentSchema = z.string();
type NoteContent = z.infer<typeof noteContentSchema>;
```

**制約**:
- 文字数制限なし（空文字列も許可）

---

### TagName

タグ名を表す値オブジェクト。

```typescript
const tagNameSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\-_]+$/);

type TagName = z.infer<typeof tagNameSchema>;
```

**制約**:
- 1〜50文字
- 英数字、ひらがな、カタカナ、漢字、ハイフン、アンダースコアのみ
- スペースや特殊文字は使用不可

---

### SortBy

ノートのソート順を表す値オブジェクト。

```typescript
const sortBySchema = z.enum([
  "created_asc",
  "created_desc",
  "updated_asc",
  "updated_desc",
]);

type SortBy = z.infer<typeof sortBySchema>;
```

---

## ポート（インターフェース）

### NoteRepository

ノートの永続化を担当するリポジトリインターフェース。

```typescript
interface NoteRepository {
  create(note: Note): Promise<Result<Note, RepositoryError>>;

  findById(id: NoteId): Promise<Result<Note | null, RepositoryError>>;

  findAll(
    pagination: Pagination,
    sortBy: SortBy
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>>;

  update(note: Note): Promise<Result<Note, RepositoryError>>;

  delete(id: NoteId): Promise<Result<void, RepositoryError>>;

  search(
    query: string,
    pagination: Pagination,
    sortBy: SortBy
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>>;

  findByTags(
    tags: TagName[],
    pagination: Pagination,
    sortBy: SortBy
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>>;

  combinedSearch(
    query: string,
    tags: TagName[],
    pagination: Pagination,
    sortBy: SortBy
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>>;
}
```

**メソッド**:
- `create`: 新規ノートを作成
- `findById`: IDでノートを取得
- `findAll`: すべてのノートを取得（ページネーション、ソート付き）
- `update`: ノートを更新
- `delete`: ノートを削除
- `search`: 全文検索（ノート本文を対象）
- `findByTags`: タグでノートを検索（複数タグのAND検索）
- `combinedSearch`: 全文検索とタグ検索を組み合わせ

---

### TagRepository

タグの取得を担当するリポジトリインターフェース。

```typescript
interface TagRepository {
  findAll(): Promise<Result<Tag[], RepositoryError>>;

  findByName(name: TagName): Promise<Result<Tag | null, RepositoryError>>;
}
```

**メソッド**:
- `findAll`: すべてのタグを取得（使用回数と共に）
- `findByName`: タグ名でタグを取得

---

## ユースケース

### createNote

新規ノートを作成します。

```typescript
type CreateNoteInput = {
  content: NoteContent;
};

async function createNote(
  context: Context,
  input: CreateNoteInput
): Promise<Result<Note, ApplicationError>>
```

**処理フロー**:
1. 空のノートエンティティを作成（content は引数から、tags は空配列）
2. ノートをリポジトリに保存
3. 保存されたノートを返す

**エラー**:
- ValidationError: バリデーション失敗
- RepositoryError: DB保存失敗

---

### getNote

IDでノートを取得します。

```typescript
type GetNoteInput = {
  id: NoteId;
};

async function getNote(
  context: Context,
  input: GetNoteInput
): Promise<Result<Note | null, ApplicationError>>
```

**処理フロー**:
1. リポジトリからノートを取得
2. ノートが存在しない場合は null を返す

**エラー**:
- RepositoryError: DB取得失敗

---

### getNotes

ノート一覧を取得します（ページネーション、ソート付き）。

```typescript
type GetNotesInput = {
  pagination: Pagination;
  sortBy: SortBy;
};

async function getNotes(
  context: Context,
  input: GetNotesInput
): Promise<Result<{ items: Note[]; count: number }, ApplicationError>>
```

**処理フロー**:
1. リポジトリからノート一覧を取得（ページネーション、ソート付き）
2. ノートのリストと総数を返す

**エラー**:
- RepositoryError: DB取得失敗

---

### updateNote

ノートを更新します（自動保存）。

```typescript
type UpdateNoteInput = {
  id: NoteId;
  content: NoteContent;
};

async function updateNote(
  context: Context,
  input: UpdateNoteInput
): Promise<Result<Note, ApplicationError>>
```

**処理フロー**:
1. リポジトリから既存のノートを取得
2. ノートが存在しない場合はエラーを返す
3. ノートの本文を更新（updatedAt も更新）
4. タグを再解析
5. 更新されたノートをリポジトリに保存
6. 保存されたノートを返す

**エラー**:
- ValidationError: バリデーション失敗
- RepositoryError: DB取得/保存失敗
- ApplicationError: ノートが存在しない

---

### deleteNote

ノートを削除します。

```typescript
type DeleteNoteInput = {
  id: NoteId;
};

async function deleteNote(
  context: Context,
  input: DeleteNoteInput
): Promise<Result<void, ApplicationError>>
```

**処理フロー**:
1. リポジトリからノートを削除
2. 削除に成功したら void を返す

**エラー**:
- RepositoryError: DB削除失敗

---

### searchNotes

ノートを全文検索します。

```typescript
type SearchNotesInput = {
  query: string;
  pagination: Pagination;
  sortBy: SortBy;
};

async function searchNotes(
  context: Context,
  input: SearchNotesInput
): Promise<Result<{ items: Note[]; count: number }, ApplicationError>>
```

**処理フロー**:
1. リポジトリでノート本文を検索
2. 検索結果のリストと総数を返す

**エラー**:
- RepositoryError: DB検索失敗

---

### searchNotesByTags

タグでノートを検索します（複数タグのAND検索）。

```typescript
type SearchNotesByTagsInput = {
  tags: TagName[];
  pagination: Pagination;
  sortBy: SortBy;
};

async function searchNotesByTags(
  context: Context,
  input: SearchNotesByTagsInput
): Promise<Result<{ items: Note[]; count: number }, ApplicationError>>
```

**処理フロー**:
1. リポジトリでタグによる検索（複数タグのAND検索）
2. 検索結果のリストと総数を返す

**エラー**:
- RepositoryError: DB検索失敗

---

### combinedSearch

全文検索とタグ検索を組み合わせて検索します。

```typescript
type CombinedSearchInput = {
  query: string;
  tags: TagName[];
  pagination: Pagination;
  sortBy: SortBy;
};

async function combinedSearch(
  context: Context,
  input: CombinedSearchInput
): Promise<Result<{ items: Note[]; count: number }, ApplicationError>>
```

**処理フロー**:
1. リポジトリで全文検索とタグ検索を組み合わせて検索
2. 検索結果のリストと総数を返す

**エラー**:
- RepositoryError: DB検索失敗

---

### getTags

すべてのタグを取得します。

```typescript
async function getTags(
  context: Context
): Promise<Result<Tag[], ApplicationError>>
```

**処理フロー**:
1. リポジトリからすべてのタグを取得（使用回数と共に）
2. タグのリストを返す

**エラー**:
- RepositoryError: DB取得失敗

---

## データベーススキーマ

### notes テーブル

```typescript
const notes = sqliteTable("notes", {
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
```

---

### tags テーブル

```typescript
const tags = sqliteTable("tags", {
  name: text("name").primaryKey(),
});
```

---

### note_tags テーブル（中間テーブル）

```typescript
const noteTags = sqliteTable(
  "note_tags",
  {
    noteId: text("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagName: text("tag_name")
      .notNull()
      .references(() => tags.name, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.noteId, table.tagName] }),
  })
);
```

---

## 実装のポイント

### タグの自動解析

- ノート本文から `#タグ名` 形式のタグを正規表現で抽出
- 抽出されたタグは `tags` テーブルと `note_tags` テーブルに保存
- ノート更新時にタグを再解析し、変更があれば更新

### 全文検索

- SQLite の FTS5（Full-Text Search）を使用
- ノート本文を対象に検索
- 検索キーワードはハイライト表示のためにフロントエンドに渡す

### タグ検索

- `note_tags` テーブルを使用して複数タグのAND検索を実現
- SQL の `GROUP BY` と `HAVING COUNT(DISTINCT tag_name) = ?` を使用

### 複合検索

- 全文検索とタグ検索の結果を `INTERSECT` で組み合わせる

---

## 関連するドメイン

- **Revision**: ノートの変更履歴を管理
- **Export**: ノートをエクスポート
- **Database**: ノートのデータを永続化

# Revision ドメイン

## 概要

Revisionドメインは、ノートの変更履歴の保存、取得、復元を担当します。
ノートの内容をスナップショットとして保存し、過去の状態に戻すことができます。

## 責務

- ノートの変更履歴（リビジョン）の保存
- リビジョンの取得（ノートIDに紐づく全リビジョン）
- 特定リビジョンの取得
- 過去のリビジョンへの復元

## エンティティ

### Revision

ノートのリビジョンを表すエンティティ。

```typescript
type Revision = Readonly<{
  id: RevisionId;
  noteId: NoteId;
  content: NoteContent;
  savedAt: Date;
}>;
```

**プロパティ**:
- `id`: リビジョンの一意識別子（UUID v7）
- `noteId`: リビジョンが属するノートのID
- `content`: リビジョン時点のノート本文（スナップショット）
- `savedAt`: リビジョンの保存日時

**ファクトリ関数**:
- `createRevision(params: CreateRevisionParams): Result<Revision, ValidationError>`
  - 新規リビジョンを作成
  - ノートの現在の内容をスナップショットとして保存

- `reconstructRevision(data: RawRevisionData): Result<Revision, ValidationError>`
  - DBから取得した生データからリビジョンエンティティを再構築

---

## 値オブジェクト

### RevisionId

リビジョンの一意識別子。

```typescript
const revisionIdSchema = z.uuid().brand<"RevisionId">();
type RevisionId = z.infer<typeof revisionIdSchema>;

function generateRevisionId(): RevisionId {
  return uuidv7() as RevisionId;
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

### NoteContent

ノートの本文（Noteドメインから参照）。

```typescript
const noteContentSchema = z.string();
type NoteContent = z.infer<typeof noteContentSchema>;
```

---

## ポート（インターフェース）

### RevisionRepository

リビジョンの永続化を担当するリポジトリインターフェース。

```typescript
interface RevisionRepository {
  create(revision: Revision): Promise<Result<Revision, RepositoryError>>;

  findByNoteId(
    noteId: NoteId
  ): Promise<Result<Revision[], RepositoryError>>;

  findById(
    id: RevisionId
  ): Promise<Result<Revision | null, RepositoryError>>;

  deleteByNoteId(noteId: NoteId): Promise<Result<void, RepositoryError>>;
}
```

**メソッド**:
- `create`: 新規リビジョンを作成
- `findByNoteId`: ノートIDに紐づくすべてのリビジョンを取得（新しい順）
- `findById`: リビジョンIDでリビジョンを取得
- `deleteByNoteId`: ノートIDに紐づくすべてのリビジョンを削除（ノート削除時に使用）

---

## ユースケース

### saveRevision

ノートのリビジョンを保存します。

```typescript
type SaveRevisionInput = {
  noteId: NoteId;
  content: NoteContent;
};

async function saveRevision(
  context: Context,
  input: SaveRevisionInput
): Promise<Result<Revision, ApplicationError>>
```

**処理フロー**:
1. リビジョンエンティティを作成
2. リポジトリに保存
3. 保存されたリビジョンを返す

**保存タイミング**:
- 手動保存時
- 一定時間ごと（例: 10分）
- ノートを閉じた時

**エラー**:
- ValidationError: バリデーション失敗
- RepositoryError: DB保存失敗

---

### getRevisions

ノートのリビジョン一覧を取得します。

```typescript
type GetRevisionsInput = {
  noteId: NoteId;
};

async function getRevisions(
  context: Context,
  input: GetRevisionsInput
): Promise<Result<Revision[], ApplicationError>>
```

**処理フロー**:
1. リポジトリからノートIDに紐づくリビジョンを取得（新しい順）
2. リビジョンのリストを返す

**エラー**:
- RepositoryError: DB取得失敗

---

### getRevision

特定のリビジョンを取得します。

```typescript
type GetRevisionInput = {
  id: RevisionId;
};

async function getRevision(
  context: Context,
  input: GetRevisionInput
): Promise<Result<Revision | null, ApplicationError>>
```

**処理フロー**:
1. リポジトリからリビジョンを取得
2. リビジョンが存在しない場合は null を返す

**エラー**:
- RepositoryError: DB取得失敗

---

### restoreRevision

過去のリビジョンからノートを復元します。

```typescript
type RestoreRevisionInput = {
  revisionId: RevisionId;
};

async function restoreRevision(
  context: Context,
  input: RestoreRevisionInput
): Promise<Result<Note, ApplicationError>>
```

**処理フロー**:
1. リポジトリからリビジョンを取得
2. リビジョンが存在しない場合はエラーを返す
3. リビジョンの内容でノートを更新（updateNote ユースケースを使用）
4. 更新されたノートを返す

**注意**:
- 復元時に新しいリビジョンが作成される（復元前の状態も履歴として残る）

**エラー**:
- RepositoryError: DB取得/保存失敗
- ApplicationError: リビジョンが存在しない

---

## データベーススキーマ

### revisions テーブル

```typescript
const revisions = sqliteTable("revisions", {
  id: text("id").primaryKey(),
  noteId: text("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  savedAt: integer("saved_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// インデックス: noteId で高速検索
const noteIdIndex = index("revisions_note_id_idx").on(revisions.noteId);
```

---

## 実装のポイント

### リビジョンの保存タイミング

リビジョンの保存タイミングは以下の通り：
1. **手動保存時**: ユーザーが明示的に保存ボタンを押した時
2. **一定時間ごと**: ノート編集中、10分ごとに自動保存
3. **ノートを閉じた時**: ノート詳細ページから離れる時

これらはフロントエンド側で制御し、適切なタイミングで `saveRevision` ユースケースを呼び出します。

### リビジョンの削除

- ノートが削除された場合、関連するリビジョンも自動的に削除される（`onDelete: "cascade"`）
- 古いリビジョンを定期的に削除する機能は、将来的な拡張として検討

### リビジョン数の制限

- リビジョン数が多くなると DB サイズが増大するため、将来的には以下の対策を検討：
  - ノートごとのリビジョン数を制限（例: 最新50件まで）
  - 古いリビジョンを定期的に削除
  - リビジョンの圧縮（差分保存）

---

## 関連するドメイン

- **Note**: リビジョンはノートのスナップショット
- **Database**: リビジョンのデータを永続化

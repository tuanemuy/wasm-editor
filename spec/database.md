# データベース設計

## 概要

本アプリケーションは、クライアント側で動作する SQLite データベース（`@tursodatabase/database-wasm`）を使用します。
Drizzle ORM を使用してスキーマ定義とクエリを管理します。

## 設計原則

### 1. ドメイン駆動設計との整合性
- 各テーブルは対応するドメインエンティティを永続化
- 集約ルートに対してのみテーブルを作成
- 中間テーブルは集約の実装詳細として管理

### 2. パフォーマンス最適化
- 検索頻度の高いカラムにインデックスを作成
- 全文検索用のインデックスを配置
- JOIN が必要な複雑なクエリは QueryService で最適化

### 3. データ整合性
- 外部キー制約による参照整合性の保証
- CASCADE DELETE による自動削除
- NOT NULL 制約による必須データの保証

## テーブル一覧

| テーブル名 | 説明 | 対応ドメイン | 集約ルート |
|-----------|------|-------------|-----------|
| `notes` | メモエンティティ | Note | ✓ |
| `tags` | タグエンティティ | Tag | ✓ |
| `noteTagRelations` | メモとタグの関連付け | Note (実装詳細) | - |

**Settings ドメイン**は localStorage を使用するため、データベーステーブルはありません。

## テーブル定義

### notes (メモ)

メモエンティティを永続化するテーブル。

**カラム定義:**

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|-----|------|
| `id` | TEXT | PRIMARY KEY | メモID (UUID v7) |
| `content` | TEXT (JSON) | NOT NULL | メモ本文 (リッチテキストエディタの構造化されたJSON) |
| `text` | TEXT | NOT NULL | プレーンテキスト (検索用) |
| `created_at` | INTEGER | NOT NULL, DEFAULT (unixepoch()) | 作成日時 (Unix timestamp) |
| `updated_at` | INTEGER | NOT NULL, DEFAULT (unixepoch()) | 更新日時 (Unix timestamp、自動更新) |

**Drizzle スキーマ定義:**

```typescript
// app/core/adapters/drizzleSqlite/schema.ts

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  content: text("content", { mode: "json" }).notNull(), // 構造化されたJSON
  text: text("text").notNull(), // プレーンテキスト
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});
```

**インデックス:**

```typescript
// 全文検索用（プレーンテキストに対して）
export const notesTextIndex = index("notes_text_idx").on(notes.text);

// ソート用
export const notesCreatedAtIndex = index("notes_created_at_idx").on(notes.createdAt);
export const notesUpdatedAtIndex = index("notes_updated_at_idx").on(notes.updatedAt);
```

**ビジネスルール:**
- テキスト (text) は空であってはならない (最低1文字必要) - アプリケーション層で検証
- テキストの最大長は100,000文字 - アプリケーション層で検証
- content は有効なJSON構造でなければならない - アプリケーション層で検証
- content と text は常に同期していること - アプリケーション層で保証
- 作成日時は変更不可
- 更新日時は自動更新される

**注記:**
- `content` カラムはJSON型として保存され、リッチテキストエディタの状態を格納
- 具体的なエディタ（Tiptapなど）に依存しない汎用的なJSON構造
- `text` カラムは全文検索専用で、contentから抽出されたプレーンテキスト
- 全文検索は `text` カラムに対して実行される

---

### tags (タグ)

タグエンティティを永続化するテーブル。

**カラム定義:**

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|-----|------|
| `id` | TEXT | PRIMARY KEY | タグID (UUID v7) |
| `name` | TEXT | NOT NULL, UNIQUE | タグ名 |
| `created_at` | INTEGER | NOT NULL, DEFAULT (unixepoch()) | 作成日時 (Unix timestamp) |
| `updated_at` | INTEGER | NOT NULL, DEFAULT (unixepoch()) | 更新日時 (Unix timestamp、自動更新) |

**Drizzle スキーマ定義:**

```typescript
// app/core/adapters/drizzleSqlite/schema.ts

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});
```

**インデックス:**

```typescript
// タグ名検索用
export const tagsNameIndex = index("tags_name_idx").on(tags.name);
```

**ビジネスルール:**
- タグ名は一意である (重複不可) - UNIQUE 制約で保証
- タグ名は空であってはならない - アプリケーション層で検証
- タグ名は最大50文字 - アプリケーション層で検証
- 使用可能文字: 英数字、ひらがな、カタカナ、漢字、ハイフン、アンダースコア - アプリケーション層で検証

---

### noteTagRelations (メモとタグの関連付け)

メモとタグの多対多関係を表現する中間テーブル。
Note 集約の実装詳細として管理され、`NoteRepository` が内部的に操作します。

**カラム定義:**

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|-----|------|
| `note_id` | TEXT | NOT NULL, FOREIGN KEY (notes.id) ON DELETE CASCADE | メモID |
| `tag_id` | TEXT | NOT NULL, FOREIGN KEY (tags.id) ON DELETE CASCADE | タグID |
| `created_at` | INTEGER | NOT NULL, DEFAULT (unixepoch()) | 関連付け作成日時 (Unix timestamp) |

**複合主キー:** `(note_id, tag_id)`

**Drizzle スキーマ定義:**

```typescript
// app/core/adapters/drizzleSqlite/schema.ts

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

**インデックス:**

```typescript
// タグ検索用（中間テーブル）
export const noteTagRelationsNoteIdIndex = index("note_tag_relations_note_id_idx")
  .on(noteTagRelations.noteId);
export const noteTagRelationsTagIdIndex = index("note_tag_relations_tag_id_idx")
  .on(noteTagRelations.tagId);
```

**注記:**
- このテーブルは Note 集約の実装詳細
- `NoteRepository` がこのテーブルを管理し、`tagIds` 配列として抽象化
- ドメイン層からは中間テーブルの存在を隠蔽
- `TagQueryService` は読み取り専用でこのテーブルを参照

**外部キー制約:**
- `note_id`: `notes.id` への参照、DELETE CASCADE
  - メモが削除されると、関連付けも自動削除
- `tag_id`: `tags.id` への参照、DELETE CASCADE
  - タグが削除されると、関連付けも自動削除

---

## ER 図

```
┌──────────────────┐
│      notes       │
├──────────────────┤
│ id (PK)          │
│ content          │
│ created_at       │
│ updated_at       │
└──────────────────┘
         │
         │ 1
         │
         │
         │ N
         ▼
┌─────────────────────┐
│ noteTagRelations    │
├─────────────────────┤
│ note_id (FK, PK)    │───┐
│ tag_id (FK, PK)     │───┼────────┐
│ created_at          │   │        │
└─────────────────────┘   │        │
                          │        │
                          │ N      │ N
                          │        │
                          │        │
                          │ 1      │ 1
                          ▼        ▼
                    ┌──────────────────┐
                    │      tags         │
                    ├──────────────────┤
                    │ id (PK)          │
                    │ name (UNIQUE)    │
                    │ created_at       │
                    │ updated_at       │
                    └──────────────────┘
```

## リレーションシップ

### Note → Tag (多対多)

- **関連:** 1つのメモは複数のタグを持つ、1つのタグは複数のメモに属する
- **実装:** `noteTagRelations` 中間テーブル
- **所有者:** Note 集約
- **削除ルール:**
  - メモ削除時: 関連付けも削除 (CASCADE DELETE)
  - タグ削除時: 関連付けも削除 (CASCADE DELETE)

### Tag の使用回数

- **実装:** JOIN クエリで集計
- **責務:** `TagQueryService.findAllWithUsage()`
- **SQL 例:**
  ```sql
  SELECT
    tags.id,
    tags.name,
    tags.created_at,
    tags.updated_at,
    COUNT(noteTagRelations.note_id) AS usage_count
  FROM tags
  LEFT JOIN noteTagRelations ON tags.id = noteTagRelations.tag_id
  GROUP BY tags.id
  ORDER BY usage_count DESC
  ```

## Settings の永続化

Settings ドメインはデータベーステーブルではなく、localStorage を使用します。

**ストレージキー:** `app_settings`

**データ形式:**
```typescript
{
  defaultOrder: string;          // "asc" | "desc"
  defaultOrderBy: string;        // "created_at" | "updated_at"
  autoSaveInterval: number;      // ミリ秒 (500-10000)
}
```

**実装パス:** `app/core/adapters/browser/settingsRepositoryAdapter.ts`

## クエリパターン

### 1. メモ一覧取得 (ページネーション、ソート付き)

**責務:** `NoteRepository.findAll()`

```sql
SELECT * FROM notes
ORDER BY {orderBy} {order}
LIMIT {limit}
OFFSET {offset}
```

### 2. 全文検索

**責務:** `NoteQueryService.combinedSearch()`

```sql
SELECT * FROM notes
WHERE text LIKE '%' || {query} || '%'
ORDER BY {orderBy} {order}
LIMIT {limit}
OFFSET {offset}
```

### 3. タグ検索 (単一タグ)

**責務:** `NoteQueryService.combinedSearch()`

```sql
SELECT notes.* FROM notes
INNER JOIN noteTagRelations ON notes.id = noteTagRelations.note_id
WHERE noteTagRelations.tag_id = {tagId}
ORDER BY notes.{orderBy} {order}
LIMIT {limit}
OFFSET {offset}
```

### 4. タグ検索 (複数タグ、AND検索)

**責務:** `NoteQueryService.combinedSearch()`

```sql
SELECT notes.* FROM notes
WHERE notes.id IN (
  SELECT note_id FROM noteTagRelations
  WHERE tag_id IN ({tagIds})
  GROUP BY note_id
  HAVING COUNT(DISTINCT tag_id) = {tagIdsCount}
)
ORDER BY notes.{orderBy} {order}
LIMIT {limit}
OFFSET {offset}
```

### 5. 複合検索 (全文検索 + タグ検索)

**責務:** `NoteQueryService.combinedSearch()`

```sql
SELECT notes.* FROM notes
WHERE
  text LIKE '%' || {query} || '%'
  AND notes.id IN (
    SELECT note_id FROM noteTagRelations
    WHERE tag_id IN ({tagIds})
    GROUP BY note_id
    HAVING COUNT(DISTINCT tag_id) = {tagIdsCount}
  )
ORDER BY notes.{orderBy} {order}
LIMIT {limit}
OFFSET {offset}
```

### 6. タグ一覧取得 (使用回数付き)

**責務:** `TagQueryService.findAllWithUsage()`

```sql
SELECT
  tags.id,
  tags.name,
  tags.created_at,
  tags.updated_at,
  COUNT(noteTagRelations.note_id) AS usage_count
FROM tags
LEFT JOIN noteTagRelations ON tags.id = noteTagRelations.tag_id
GROUP BY tags.id
ORDER BY usage_count DESC
```

### 7. 未使用タグ取得

**責務:** `TagQueryService.findUnused()`

```sql
SELECT tags.* FROM tags
LEFT JOIN noteTagRelations ON tags.id = noteTagRelations.tag_id
WHERE noteTagRelations.note_id IS NULL
```

## マイグレーション

### 初期スキーマ

アプリケーション初回起動時に以下のテーブルを作成します。

**実装パス:** `app/core/adapters/drizzleSqlite/migration/0000_initial.sql`

```sql
-- notes テーブル
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL, -- JSON形式で保存
  text TEXT NOT NULL, -- プレーンテキスト (検索用)
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- tags テーブル
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- noteTagRelations テーブル
CREATE TABLE IF NOT EXISTS note_tag_relations (
  note_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS notes_text_idx ON notes(text);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at);
CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes(updated_at);
CREATE INDEX IF NOT EXISTS tags_name_idx ON tags(name);
CREATE INDEX IF NOT EXISTS note_tag_relations_note_id_idx ON note_tag_relations(note_id);
CREATE INDEX IF NOT EXISTS note_tag_relations_tag_id_idx ON note_tag_relations(tag_id);
```

### マイグレーション管理

Drizzle ORM のマイグレーション機能を使用してスキーマバージョンを管理します。

**実装パス:**
- `app/core/adapters/drizzleSqlite/migrations/` - マイグレーションファイル格納
- `drizzle.config.ts` - Drizzle 設定ファイル

**コマンド:**
```bash
# マイグレーションファイル生成
pnpm drizzle-kit generate

# マイグレーション実行
pnpm drizzle-kit migrate
```

## パフォーマンス考慮事項

### インデックス戦略

1. **全文検索最適化**
   - `notes.text` にインデックスを作成
   - SQLite の LIKE 演算子を使用（部分一致検索）
   - プレーンテキストに対してインデックスを作成することで高速な全文検索を実現

2. **ソート最適化**
   - `notes.created_at` と `notes.updated_at` にインデックスを作成
   - ORDER BY クエリのパフォーマンス向上

3. **タグ検索最適化**
   - `noteTagRelations.note_id` と `noteTagRelations.tag_id` にインデックスを作成
   - JOIN クエリのパフォーマンス向上

4. **タグ名検索最適化**
   - `tags.name` にインデックスを作成
   - タグ名の一意性チェックとタグ検索のパフォーマンス向上

### クエリ最適化

1. **ページネーション**
   - LIMIT/OFFSET を使用した効率的なページング
   - カーソルベースのページネーションも検討可能

2. **JOIN の最適化**
   - 必要なカラムのみを SELECT
   - WHERE 句での絞り込みを先に実行

3. **集計クエリの最適化**
   - COUNT() を使用した効率的な集計
   - GROUP BY でのグループ化

## データ整合性

### 外部キー制約

- `noteTagRelations.note_id` → `notes.id` (CASCADE DELETE)
- `noteTagRelations.tag_id` → `tags.id` (CASCADE DELETE)

### トランザクション管理

複数テーブルにまたがる操作は、トランザクションで保護します。

**例: メモの保存とタグの関連付け**

```typescript
// NoteRepository の save() メソッド内で実装
await db.transaction(async (tx) => {
  // メモを保存
  await tx.insert(notes).values({
    id: note.id,
    content: note.content, // JSON形式
    text: note.text, // プレーンテキスト
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  });

  // 既存の関連付けを削除
  await tx.delete(noteTagRelations).where(eq(noteTagRelations.noteId, note.id));

  // 新しい関連付けを作成
  if (note.tagIds.length > 0) {
    await tx.insert(noteTagRelations).values(
      note.tagIds.map(tagId => ({
        noteId: note.id,
        tagId: tagId,
        createdAt: new Date(),
      }))
    );
  }
});
```

### クリーンアップ処理

**未使用タグの削除:**
- メモ削除後やタグ同期後に自動実行
- `TagQueryService.findUnused()` で未使用タグを検出
- `TagRepository.deleteMany()` で一括削除

## セキュリティ考慮事項

### SQLインジェクション対策

- Drizzle ORM のパラメータバインディングを使用
- 生のSQL文字列連結は使用しない

### データ検証

- アプリケーション層でビジネスルールを検証
- データベース制約（NOT NULL, UNIQUE）で整合性を保証

## バックアップとリストア

### バックアップ

ブラウザの IndexedDB に保存されているデータベースファイルをエクスポートします。

**実装方法:**
- File System Access API を使用してファイルを保存
- SQLite データベースファイル全体をエクスポート

### リストア

エクスポートしたデータベースファイルをインポートします。

**実装方法:**
- File System Access API を使用してファイルを読み込み
- SQLite データベースファイルを復元

## 将来の拡張

### 1. 全文検索の強化

SQLite の FTS5 (Full-Text Search) 拡張を検討:
- より高度な全文検索機能
- トークナイザーによる日本語対応
- 検索結果のランキング
- 現在は `text` カラムに LIKE 検索を使用しているが、FTS5 仮想テーブルへの移行で高速化が可能

### 2. メモのバージョン管理

メモの編集履歴を保存する機能:
- `note_versions` テーブルの追加
- 差分管理
- ロールバック機能

### 3. 添付ファイル対応

メモに画像やファイルを添付する機能:
- `attachments` テーブルの追加
- Blob データの保存
- ファイルサイズ制限

### 4. 同期機能

複数デバイス間でのデータ同期:
- 変更履歴の管理
- コンフリクト解決
- 差分同期

## 参考資料

- SQLite Documentation: https://www.sqlite.org/docs.html
- Drizzle ORM Documentation: https://orm.drizzle.team/
- @tursodatabase/database-wasm: https://github.com/tursodatabase/libsql-wasm

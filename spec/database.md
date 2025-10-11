# データベース設計

## テーブル一覧

1. **notes** - ノート情報
2. **tags** - タグ情報
3. **note_tags** - ノートとタグの中間テーブル
4. **revisions** - ノートのリビジョン履歴
5. **assets** - 画像などのファイル資産
6. **settings** - アプリケーション設定
7. **database_metadata** - データベースメタデータ

---

## テーブル定義

### 1. notes テーブル

ノートのメイン情報を保存します。

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

| カラム名 | 型 | NULL許可 | デフォルト値 | 説明 |
|---------|-----|---------|------------|------|
| id | TEXT | NO | - | ノートID（UUID v7） |
| content | TEXT | NO | - | ノート本文（Markdown） |
| created_at | INTEGER | NO | unixepoch() | 作成日時（Unixタイムスタンプ） |
| updated_at | INTEGER | NO | unixepoch() | 更新日時（Unixタイムスタンプ） |

**制約**:
- PRIMARY KEY: id

**インデックス**:
- 全文検索用FTS5仮想テーブル（実装時に検討）

---

### 2. tags テーブル

タグのマスター情報を保存します。

```typescript
const tags = sqliteTable("tags", {
  name: text("name").primaryKey(),
});
```

| カラム名 | 型 | NULL許可 | デフォルト値 | 説明 |
|---------|-----|---------|------------|------|
| name | TEXT | NO | - | タグ名 |

**制約**:
- PRIMARY KEY: name

**備考**:
- タグの使用回数（usageCount）は、note_tags テーブルから動的に集計

---

### 3. note_tags テーブル

ノートとタグの多対多リレーションを管理する中間テーブルです。

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

| カラム名 | 型 | NULL許可 | デフォルト値 | 説明 |
|---------|-----|---------|------------|------|
| note_id | TEXT | NO | - | ノートID |
| tag_name | TEXT | NO | - | タグ名 |

**制約**:
- PRIMARY KEY: (note_id, tag_name)
- FOREIGN KEY: note_id → notes.id (ON DELETE CASCADE)
- FOREIGN KEY: tag_name → tags.name (ON DELETE CASCADE)

**備考**:
- ノート削除時、関連するタグとの紐付けも自動削除
- タグ削除時、関連するノートとの紐付けも自動削除

---

### 4. revisions テーブル

ノートのリビジョン（変更履歴）を保存します。

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

| カラム名 | 型 | NULL許可 | デフォルト値 | 説明 |
|---------|-----|---------|------------|------|
| id | TEXT | NO | - | リビジョンID（UUID v7） |
| note_id | TEXT | NO | - | ノートID |
| content | TEXT | NO | - | リビジョン時点のノート本文 |
| saved_at | INTEGER | NO | unixepoch() | 保存日時（Unixタイムスタンプ） |

**制約**:
- PRIMARY KEY: id
- FOREIGN KEY: note_id → notes.id (ON DELETE CASCADE)

**インデックス**:
- revisions_note_id_idx: note_id

**備考**:
- ノート削除時、関連するリビジョンも自動削除

---

### 5. assets テーブル

画像などのファイル資産の情報を保存します。

```typescript
const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  noteId: text("note_id")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  filePath: text("file_path").notNull(),
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

| カラム名 | 型 | NULL許可 | デフォルト値 | 説明 |
|---------|-----|---------|------------|------|
| id | TEXT | NO | - | アセットID（UUID v7） |
| note_id | TEXT | NO | - | ノートID |
| file_path | TEXT | NO | - | ファイルパス（相対パス） |
| file_name | TEXT | NO | - | ファイル名 |
| file_size | INTEGER | NO | - | ファイルサイズ（バイト） |
| mime_type | TEXT | NO | - | MIMEタイプ |
| created_at | INTEGER | NO | unixepoch() | 作成日時（Unixタイムスタンプ） |

**制約**:
- PRIMARY KEY: id
- FOREIGN KEY: note_id → notes.id (ON DELETE CASCADE)

**インデックス**:
- assets_note_id_idx: note_id

**備考**:
- ノート削除時、関連するアセット情報も自動削除
- 実際のファイルはローカルファイルシステムに保存

---

### 6. settings テーブル

アプリケーション設定を保存します（シングルトン）。

```typescript
const settings = sqliteTable("settings", {
  id: integer("id").primaryKey().default(1), // シングルトン（常に1行のみ）
  defaultSortBy: text("default_sort_by").notNull().default("updated_desc"),
  autoSaveInterval: integer("auto_save_interval").notNull().default(2000),
  revisionInterval: integer("revision_interval").notNull().default(600000),
  editorFontSize: integer("editor_font_size").notNull().default(16),
  editorTheme: text("editor_theme").notNull().default("light"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
});
```

| カラム名 | 型 | NULL許可 | デフォルト値 | 説明 |
|---------|-----|---------|------------|------|
| id | INTEGER | NO | 1 | 設定ID（常に1固定） |
| default_sort_by | TEXT | NO | "updated_desc" | デフォルトソート順 |
| auto_save_interval | INTEGER | NO | 2000 | 自動保存間隔（ミリ秒） |
| revision_interval | INTEGER | NO | 600000 | リビジョン保存間隔（ミリ秒） |
| editor_font_size | INTEGER | NO | 16 | エディターフォントサイズ（px） |
| editor_theme | TEXT | NO | "light" | エディターテーマ |
| updated_at | INTEGER | NO | unixepoch() | 更新日時（Unixタイムスタンプ） |

**制約**:
- PRIMARY KEY: id

**備考**:
- シングルトンパターン（id は常に 1）
- アプリケーション全体で1つの設定のみ存在

---

### 7. database_metadata テーブル

データベースのメタデータを保存します。

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

| カラム名 | 型 | NULL許可 | デフォルト値 | 説明 |
|---------|-----|---------|------------|------|
| key | TEXT | NO | - | メタデータキー |
| value | TEXT | NO | - | メタデータ値 |
| updated_at | INTEGER | NO | unixepoch() | 更新日時（Unixタイムスタンプ） |

**制約**:
- PRIMARY KEY: key

**用途**:
- データベースバージョン管理
- 作成日時の記録
- その他のメタデータ

**例**:
```typescript
{ key: "version", value: "1.0.0" }
{ key: "created_at", value: "2024-01-01T00:00:00Z" }
```

---

## リレーション図

```
┌─────────────────┐
│     notes       │
│─────────────────│
│ PK  id          │
│     content     │
│     created_at  │
│     updated_at  │
└─────────────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│   note_tags     │  │   revisions     │
│─────────────────│  │─────────────────│
│ PK  note_id     │  │ PK  id          │
│ PK  tag_name    │  │ FK  note_id     │
│ FK  → notes.id  │  │     content     │
│ FK  → tags.name │  │     saved_at    │
└─────────────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐  ┌─────────────────┐
│      tags       │  │     assets      │
│─────────────────│  │─────────────────│
│ PK  name        │  │ PK  id          │
└─────────────────┘  │ FK  note_id     │
                     │     file_path   │
                     │     file_name   │
┌─────────────────┐  │     file_size   │
│    settings     │  │     mime_type   │
│─────────────────│  │     created_at  │
│ PK  id (=1)     │  └─────────────────┘
│     ...         │           ▲
└─────────────────┘           │
                              │
┌─────────────────┐          FK
│database_metadata│           │
│─────────────────│    ┌─────────────┐
│ PK  key         │    │   notes.id  │
│     value       │    └─────────────┘
└─────────────────┘
```

### リレーション説明

1. **notes ⇔ note_tags**: 1対多
   - 1つのノートは複数のタグを持つ
   - CASCADE DELETE: ノート削除時、関連する note_tags も削除

2. **tags ⇔ note_tags**: 1対多
   - 1つのタグは複数のノートに使用される
   - CASCADE DELETE: タグ削除時、関連する note_tags も削除

3. **notes ⇔ revisions**: 1対多
   - 1つのノートは複数のリビジョンを持つ
   - CASCADE DELETE: ノート削除時、関連するリビジョンも削除

4. **notes ⇔ assets**: 1対多
   - 1つのノートは複数のアセットを持つ
   - CASCADE DELETE: ノート削除時、関連するアセットも削除

5. **settings**: 独立（シングルトン）
   - アプリケーション全体で1レコードのみ

6. **database_metadata**: 独立
   - キーバリュー形式でメタデータを保存

---

## 実装のポイント

### 1. 全文検索（FTS5）

ノートの全文検索には、SQLite の FTS5（Full-Text Search）を使用します。

```typescript
// FTS5 仮想テーブルの作成例
const notesFts = sqliteTable("notes_fts", {
  id: text("id"),
  content: text("content"),
}, {
  useFts5: true,
  contentTable: "notes",
});
```

**実装時の検討事項**:
- FTS5 仮想テーブルと notes テーブルの同期
- トークナイザーの選択（日本語対応が必要な場合）
- 検索結果のハイライト表示

### 2. タグ検索

複数タグによるAND検索は、以下のようなSQLクエリで実現します。

```sql
SELECT n.*
FROM notes n
JOIN note_tags nt ON n.id = nt.note_id
WHERE nt.tag_name IN ('tag1', 'tag2', 'tag3')
GROUP BY n.id
HAVING COUNT(DISTINCT nt.tag_name) = 3
ORDER BY n.updated_at DESC;
```

### 3. ページネーション

無限スクロールのために、LIMIT と OFFSET を使用します。

```sql
SELECT * FROM notes
ORDER BY updated_at DESC
LIMIT 20 OFFSET 0;
```

### 4. トランザクション管理

- ノート更新時のタグ再解析は、トランザクション内で実行
- リビジョン保存時も、トランザクションで一貫性を保証

### 5. インデックス戦略

**必須インデックス**:
- `revisions_note_id_idx`: リビジョン取得の高速化
- `assets_note_id_idx`: アセット取得の高速化

**検討中のインデックス**:
- `notes_updated_at_idx`: ソート性能向上
- `notes_created_at_idx`: ソート性能向上

### 6. データ整合性

**CASCADE DELETE による自動削除**:
- ノート削除時:
  - note_tags の関連レコードを削除
  - revisions の関連レコードを削除
  - assets の関連レコードを削除
  - ファイルシステムのアセットファイルも削除（アプリケーション層で実施）

**孤立データの防止**:
- タグは note_tags から参照されなくなった場合でも残る（将来的に削除機能を検討）
- アセットファイルは DB レコード削除時にファイルシステムからも削除

### 7. マイグレーション

Drizzle ORM のマイグレーション機能を使用してスキーマ変更を管理します。

```bash
# マイグレーションファイルの生成
pnpm drizzle-kit generate:sqlite

# マイグレーションの実行
pnpm drizzle-kit migrate
```

### 8. バックアップ

- `Database` ドメインの `exportDatabase` を使用してDBファイルをバックアップ
- ユーザーは任意の場所にバックアップファイルを保存可能

---

## パフォーマンス考慮事項

### 1. FTS5 の日本語対応

- デフォルトのトークナイザーは英語向け
- 日本語検索には、以下の対応が必要：
  - カスタムトークナイザーの導入（MeCab、Kuromoji など）
  - または、bigram/trigram トークナイザーの使用

### 2. リビジョン数の制限

- リビジョンが増えすぎると DB サイズが肥大化
- 将来的な対策：
  - ノートごとのリビジョン数を制限（例: 最新50件まで）
  - 古いリビジョンの自動削除
  - リビジョンの圧縮（差分保存）

### 3. 大量データ対策

- ノート数が増えた場合のパフォーマンス対策：
  - 適切なインデックスの追加
  - クエリの最適化
  - 仮想スクロールの実装（UI層）

---

## セキュリティ考慮事項

### 1. SQLインジェクション対策

- Drizzle ORM のプリペアドステートメントを使用
- ユーザー入力は必ずバインドパラメータで処理

### 2. ファイルアクセス制限

- File System Access API はユーザーの明示的な許可が必要
- アクセス許可はブラウザが管理

### 3. データ暗号化

- 現時点では暗号化は実装しない
- 将来的な拡張として検討：
  - SQLite の暗号化拡張（SQLCipher など）
  - アプリケーション層での暗号化

---

## まとめ

本データベース設計は、以下の要件を満たします：

✅ **機能要件**:
- ノートの作成、更新、削除、取得
- タグの自動解析と管理
- 全文検索とタグ検索
- リビジョン管理
- 画像などのファイル資産管理
- アプリケーション設定の永続化

✅ **非機能要件**:
- オフラインファースト（ローカルDB）
- ブラウザ内で完結（@tursodatabase/database-wasm）
- File System Access API によるファイル管理
- 適切なインデックスによる高速検索

✅ **拡張性**:
- ドメイン駆動設計による疎結合
- マイグレーションによるスキーマ変更管理
- 将来的な機能追加に対応可能な設計

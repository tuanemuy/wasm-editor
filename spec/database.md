# データベース設計

## 概要

本アプリケーションは、@tursodatabase/database-wasm を使用したクライアントサイドSQLiteデータベースを採用しています。
すべてのデータはローカルファイルシステムに保存され、オフラインで動作します。

## データベース技術スタック

- **DBMS**: SQLite (WASM版)
- **ライブラリ**: @tursodatabase/database-wasm
- **ORM**: Drizzle ORM
- **保存場所**: ローカルファイルシステム（File System Access API経由）

## テーブル設計

### 1. notes（メモ）

メモの基本情報を格納するテーブル。

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | TEXT | PRIMARY KEY | メモのID（UUID v4） |
| body | TEXT | NOT NULL DEFAULT '' | メモ本文（Markdown形式） |
| created_at | INTEGER | NOT NULL | 作成日時（Unix timestamp ミリ秒） |
| updated_at | INTEGER | NOT NULL | 更新日時（Unix timestamp ミリ秒） |

**インデックス**:
- `idx_notes_created_at`: created_at（ソート用）
- `idx_notes_updated_at`: updated_at（ソート用）

**DDL**:
```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  body TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_notes_created_at ON notes(created_at);
CREATE INDEX idx_notes_updated_at ON notes(updated_at);
```

### 2. tags（タグ）

タグのマスターテーブル。

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | TEXT | PRIMARY KEY | タグのID（UUID v4） |
| name | TEXT | UNIQUE NOT NULL | タグ名 |
| usage_count | INTEGER | NOT NULL DEFAULT 0 | 使用回数（このタグを持つメモの数） |

**インデックス**:
- `name`: UNIQUE制約により自動的にインデックスが作成される

**DDL**:
```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0
);
```

### 3. note_tags（メモ-タグ関連）

メモとタグの多対多関係を管理する中間テーブル。

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| note_id | TEXT | FOREIGN KEY → notes(id) | メモID |
| tag_id | TEXT | FOREIGN KEY → tags(id) | タグID |

**主キー**: (note_id, tag_id)

**インデックス**:
- `idx_note_tags_note_id`: note_id（メモからタグを検索）
- `idx_note_tags_tag_id`: tag_id（タグからメモを検索）

**外部キー制約**:
- note_id → notes(id) ON DELETE CASCADE
- tag_id → tags(id) ON DELETE CASCADE

**DDL**:
```sql
CREATE TABLE note_tags (
  note_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX idx_note_tags_tag_id ON note_tags(tag_id);
```

### 4. revisions（リビジョン）

メモの変更履歴を保存するテーブル。

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | TEXT | PRIMARY KEY | リビジョンID（UUID v4） |
| note_id | TEXT | FOREIGN KEY → notes(id) | 対象メモのID |
| content | TEXT | NOT NULL DEFAULT '' | その時点のメモ本文 |
| created_at | INTEGER | NOT NULL | リビジョン作成日時（Unix timestamp ミリ秒） |

**インデックス**:
- `idx_revisions_note_id`: note_id（メモからリビジョンを検索）
- `idx_revisions_created_at`: created_at（新しい順にソート）
- `idx_revisions_note_created`: (note_id, created_at)（複合インデックス、ページネーション用）

**外部キー制約**:
- note_id → notes(id) ON DELETE CASCADE

**DDL**:
```sql
CREATE TABLE revisions (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX idx_revisions_note_id ON revisions(note_id);
CREATE INDEX idx_revisions_created_at ON revisions(created_at);
CREATE INDEX idx_revisions_note_created ON revisions(note_id, created_at);
```

### 5. images（画像）

画像のメタデータを保存するテーブル。実際の画像ファイルはローカルファイルシステムに保存される。

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | TEXT | PRIMARY KEY | 画像ID（UUID v4） |
| file_name | TEXT | NOT NULL | 元のファイル名 |
| mime_type | TEXT | NOT NULL | MIMEタイプ（例: image/jpeg） |
| size | INTEGER | NOT NULL | ファイルサイズ（バイト） |
| width | INTEGER | NOT NULL | 画像の幅（ピクセル） |
| height | INTEGER | NOT NULL | 画像の高さ（ピクセル） |
| storage_path | TEXT | NOT NULL | ローカルストレージ上のパス |
| uploaded_at | INTEGER | NOT NULL | アップロード日時（Unix timestamp ミリ秒） |

**インデックス**:
- `idx_images_uploaded_at`: uploaded_at（アップロード順にソート）

**DDL**:
```sql
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at INTEGER NOT NULL
);

CREATE INDEX idx_images_uploaded_at ON images(uploaded_at);
```

### 6. settings（設定）

アプリケーション全体の設定を保存するテーブル。シングルトンパターンで1レコードのみ存在する。

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| id | TEXT | PRIMARY KEY | 固定値 'default' |
| general | TEXT | NOT NULL | 一般設定（JSON形式） |
| editor | TEXT | NOT NULL | エディター設定（JSON形式） |
| revision | TEXT | NOT NULL | リビジョン設定（JSON形式） |
| image | TEXT | NOT NULL | 画像設定（JSON形式） |
| updated_at | INTEGER | NOT NULL | 最終更新日時（Unix timestamp ミリ秒） |

**DDL**:
```sql
CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  general TEXT NOT NULL,
  editor TEXT NOT NULL,
  revision TEXT NOT NULL,
  image TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- デフォルト設定を挿入
INSERT INTO settings (id, general, editor, revision, image, updated_at)
VALUES (
  'default',
  '{"defaultSortOrder":"UPDATED_DESC","autoSaveInterval":2000,"itemsPerPage":20}',
  '{"fontSize":"MEDIUM","theme":"AUTO","fontFamily":"SYSTEM","lineHeight":1.6,"showLineNumbers":false}',
  '{"autoRevisionInterval":10,"maxRevisionsPerNote":50,"enableAutoRevision":true}',
  '{"maxImageSize":10485760,"imageQuality":0.85,"autoOptimize":true}',
  strftime('%s', 'now') * 1000
);
```

## Entity Relationship Diagram (ER図)

```
┌─────────┐       ┌──────────┐       ┌──────┐
│  notes  │──────<│note_tags │>──────│ tags │
└─────────┘       └──────────┘       └──────┘
     │
     │ 1
     │
     │ *
     ├─────────────┐
     │             │
     v             v
┌───────────┐  ┌────────┐
│ revisions │  │ images │
└───────────┘  └────────┘
                (間接参照)

         ┌──────────┐
         │ settings │
         └──────────┘
         (シングルトン)
```

**リレーションシップの説明**:
- `notes` ↔ `tags`: 多対多（中間テーブル `note_tags`）
- `notes` → `revisions`: 1対多（CASCADE DELETE）
- `notes` → `images`: 間接的な関係（メモ本文に `![alt](image://id)` 形式で参照）
- `settings`: 独立（シングルトン）

## データ型の選択理由

### TEXTをID型に使用する理由
- UUID v4を文字列として保存
- SQLiteにはUUID型が存在しないため、TEXT型を使用
- 可読性が高く、デバッグが容易

### INTEGERを日時型に使用する理由
- Unix timestamp（ミリ秒）を整数で保存
- JavaScriptの `Date.now()` と親和性が高い
- ソートやフィルタリングのパフォーマンスが良好
- タイムゾーンの問題を回避

### JSONをTEXTとして保存する理由（settings）
- 設定項目が柔軟に変更可能
- TypeScriptの型定義と連携しやすい
- 正規化すると過度に複雑になるため、非正規化を選択

## インデックス戦略

### 検索パフォーマンス重視
- メモ一覧表示: `created_at`, `updated_at` にインデックス
- タグ検索: `note_tags` の両方の外部キーにインデックス
- リビジョン取得: `(note_id, created_at)` 複合インデックス

### ストレージ最適化
- 必要最小限のインデックスのみ作成
- 全文検索が必要な場合はFTS（Full-Text Search）の検討

## 制約と整合性

### 外部キー制約
```sql
PRAGMA foreign_keys = ON;
```
- すべての外部キー制約を有効化
- CASCADE DELETE で関連データを自動削除

### UNIQUE制約
- `tags.name`: 同じ名前のタグは1つのみ
- `note_tags.(note_id, tag_id)`: 同じメモ-タグの組み合わせは1つのみ

### NOT NULL制約
- 必須フィールドにはすべてNOT NULL制約を設定

## データマイグレーション

### マイグレーション管理
- Drizzle ORM のマイグレーション機能を使用
- バージョン管理された DDL ファイルを保持
- マイグレーション履歴を記録

### 初期化SQL
```sql
-- 外部キー制約を有効化
PRAGMA foreign_keys = ON;

-- テーブル作成（上記DDL参照）
-- ...

-- デフォルト設定を挿入（上記settings DDL参照）
-- ...
```

## 全文検索（FTS）

### FTS5仮想テーブル（オプション）

将来的にパフォーマンスが必要になった場合、FTS5を使用した全文検索テーブルを追加可能：

```sql
CREATE VIRTUAL TABLE notes_fts USING fts5(
  body,
  content=notes,
  content_rowid=rowid,
  tokenize='unicode61 tokenchars "_"'
);

-- トリガーで自動同期
CREATE TRIGGER notes_fts_insert AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, body) VALUES (new.rowid, new.body);
END;

CREATE TRIGGER notes_fts_update AFTER UPDATE ON notes BEGIN
  UPDATE notes_fts SET body = new.body WHERE rowid = old.rowid;
END;

CREATE TRIGGER notes_fts_delete AFTER DELETE ON notes BEGIN
  DELETE FROM notes_fts WHERE rowid = old.rowid;
END;
```

**注**: 初期実装では単純な LIKE 検索を使用し、パフォーマンス要件に応じてFTS5に移行することを推奨。

## パフォーマンス考慮事項

### クエリ最適化
1. **メモ一覧取得**:
   ```sql
   SELECT * FROM notes
   ORDER BY updated_at DESC
   LIMIT 20 OFFSET 0;
   ```
   - インデックス `idx_notes_updated_at` を使用

2. **タグによる検索（AND検索）**:
   ```sql
   SELECT n.* FROM notes n
   WHERE n.id IN (
     SELECT note_id FROM note_tags
     WHERE tag_id IN ('tag1', 'tag2')
     GROUP BY note_id
     HAVING COUNT(DISTINCT tag_id) = 2
   )
   ORDER BY n.updated_at DESC;
   ```

3. **メモのリビジョン取得**:
   ```sql
   SELECT * FROM revisions
   WHERE note_id = ?
   ORDER BY created_at DESC
   LIMIT 50;
   ```
   - 複合インデックス `idx_revisions_note_created` を使用

### バッチ処理
- 大量のデータ操作はトランザクションでまとめる
- リビジョン削除時は古いものから一括削除

### ストレージ最適化
- 定期的に VACUUM コマンドを実行してデータベースファイルを最適化
- 未使用画像の定期的なクリーンアップ

## セキュリティ考慮事項

### SQLインジェクション対策
- Drizzle ORM のパラメータ化されたクエリを使用
- ユーザー入力を直接SQL文字列に結合しない

### データ整合性
- トランザクションを適切に使用
- 外部キー制約による参照整合性の保証

### バックアップ
- ユーザーがDBファイルを任意の場所に保存可能
- ファイルシステムレベルでのバックアップをユーザーに推奨

## データベース初期化手順

1. **データベースファイルの作成**:
   - File System Access API を使用してファイルを作成
   - @tursodatabase/database-wasm で接続

2. **テーブルの作成**:
   - Drizzle ORM のマイグレーション実行
   - 上記DDLを順番に実行

3. **初期データの挿入**:
   - デフォルト設定を settings テーブルに挿入

4. **外部キー制約の有効化**:
   ```sql
   PRAGMA foreign_keys = ON;
   ```

## 参考情報

### 関連ドメイン
- [Note ドメイン](./domains/note.md)
- [Tag ドメイン](./domains/tag.md)
- [Revision ドメイン](./domains/revision.md)
- [Image ドメイン](./domains/image.md)
- [Settings ドメイン](./domains/settings.md)
- [Database ドメイン](./domains/database.md)

### 技術ドキュメント
- [@tursodatabase/database-wasm](https://github.com/tursodatabase/database-wasm)
- [Drizzle ORM](https://orm.drizzle.team/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)

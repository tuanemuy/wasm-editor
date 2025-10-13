# Tag ドメイン

## 概要

**ドメイン名:** Tag (タグ)

Tagドメインは、メモ本文からのタグ自動解析、タグ管理、タグによる検索を担当するサポートドメインです。
メモの整理と検索性向上を支援します。

## エンティティ

### Tag (タグ)

タグエンティティは、メモに付与されるタグの情報を表現します。

**属性:**
- `id: TagId` - タグの一意識別子 (UUID v7)
- `name: TagName` - タグ名
- `createdAt: Date` - 作成日時
- `updatedAt: Date` - 更新日時

**ビジネスルール:**
1. タグ名は一意である (重複不可)
2. タグ名は空であってはならない
3. タグ名は最大50文字
4. 使用回数が0のタグは削除される (クリーンアップ)

**エンティティ操作:**
- `createTag(params: CreateTagParams): Tag` - 新規タグを作成

```typescript
export type Tag = {
  id: TagId;
  name: TagName;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTagParams = {
  name: string;
};

/**
 * 新規タグを作成
 */
export function createTag(params: CreateTagParams): Tag;
```

### TagWithUsage (使用回数付きタグ)

タグと使用回数を組み合わせた DTO (Data Transfer Object)。

**属性:**
- `id: TagId` - タグの一意識別子
- `name: TagName` - タグ名
- `usageCount: number` - 使用回数 (このタグを持つメモの数、JOIN で集計)
- `createdAt: Date` - 作成日時
- `updatedAt: Date` - 更新日時

**用途:**
- タグ一覧の表示（使用回数でソート）
- タグクラウドの表示

```typescript
export type TagWithUsage = Tag & {
  usageCount: number;
};
```


## 値オブジェクト

### TagId (タグID)

タグを一意に識別するID。UUID v7形式を使用。

**生成ルール:**
- UUID v7を使用
- 自動生成されるため、ユーザーが指定することはない

```typescript
export type TagId = string & { readonly brand: "TagId" };

export function createTagId(id: string): TagId;
export function generateTagId(): TagId;
```

### TagName (タグ名)

タグの名前を表す値オブジェクト。

**バリデーションルール:**
1. 空文字列は許可しない
2. 最大長は50文字
3. 使用可能文字: 英数字、ひらがな、カタカナ、漢字、ハイフン、アンダースコア
4. スペースは使用不可
5. 先頭・末尾の空白はトリミング
6. 大文字小文字は区別する

**正規表現:**
```regex
^[a-zA-Z0-9ぁ-んァ-ヶー一-龯\-_]+$
```

```typescript
export type TagName = string & { readonly brand: "TagName" };

export function createTagName(name: string): TagName;
```

## エラーコード

Tagドメインで発生するエラーコードを定義します。

```typescript
export const TagErrorCode = {
  // タグ名関連
  NameEmpty: "TAG_NAME_EMPTY",
  NameTooLong: "TAG_NAME_TOO_LONG",
  NameInvalidCharacter: "TAG_NAME_INVALID_CHARACTER",
} as const;
```

## ポート (インターフェース)

### TagRepository (タグリポジトリ)

Tag集約の永続化を担当するポート。

**責務:**
- タグの保存、取得、削除
- タグ一覧の取得
- 基本的なクエリ操作

**注記:**
- TagRepositoryはTag集約の永続化のみを担当
- メモとタグの関連付けはNote集約が管理（NoteRepository経由）
- 使用回数の集計などの複雑なクエリはTagQueryServiceが担当

```typescript
export interface TagRepository {
  /**
   * タグを保存 (作成または更新)
   */
  save(tag: Tag): Promise<void>;

  /**
   * タグ名でタグを取得
   * @returns タグが存在しない場合は null
   */
  findByName(name: TagName): Promise<Tag | null>;

  /**
   * タグIDでタグを取得
   * @throws NotFoundError タグが見つからない場合
   */
  findById(id: TagId): Promise<Tag>;

  /**
   * 複数のタグIDでタグを取得
   */
  findByIds(ids: TagId[]): Promise<Tag[]>;

  /**
   * すべてのタグを取得
   */
  findAll(): Promise<Tag[]>;

  /**
   * タグを削除
   */
  delete(id: TagId): Promise<void>;

  /**
   * 複数のタグを一括削除
   */
  deleteMany(ids: TagId[]): Promise<void>;

  /**
   * タグが存在するかチェック
   */
  exists(id: TagId): Promise<boolean>;
}
```

### TagQueryService (タグクエリサービス)

複雑なタグ関連のクエリを担当するポート。読み取り専用。

**責務:**
- 使用回数付きタグ一覧の取得
- 未使用タグの検出

**注記:**
- QueryServiceは読み取り専用
- 複数テーブルをJOINする複雑なクエリを実装
- データベースレベルでの最適化を許容

```typescript
export interface TagQueryService {
  /**
   * すべてのタグを取得 (使用回数付き、使用回数の降順)
   *
   * @description
   * - noteTagRelations テーブルとJOINして使用回数を集計
   * - 使用回数の降順でソート
   * - 使用回数が0のタグも含む
   */
  findAllWithUsage(): Promise<TagWithUsage[]>;

  /**
   * 使用回数が0のタグを取得
   *
   * @description
   * - noteTagRelations テーブルとLEFT JOINして使用回数が0のタグを検出
   * - クリーンアップ処理で使用
   */
  findUnused(): Promise<Tag[]>;
}
```

### TagExtractorPort (タグ抽出)

メモ本文からタグを抽出する外部サービス。

**責務:**
- マークダウンテキストからタグをパースする
- タグ名のバリデーション
- 重複タグの除去

**注記:**
- シンプルな正規表現を使った実装も可能
- より高度なマークダウンパーサー（unified, remarkなど）を使った実装も可能
- 実装の詳細をドメイン層から隠蔽し、将来的に差し替え可能にする

```typescript
export interface TagExtractorPort {
  /**
   * メモ本文からタグを抽出する
   *
   * @param content - メモ本文
   * @returns 抽出されたタグ名のリスト (重複なし、大文字小文字区別)
   *
   * ビジネスルール:
   * - タグは `#タグ名` の形式で記述
   * - タグ名は英数字、ひらがな、カタカナ、漢字、ハイフン、アンダースコアのみ
   * - スペースを含むタグは無効
   * - 重複するタグは1つにまとめる
   * - 大文字小文字は区別する
   *
   * 正規表現パターン: #([a-zA-Z0-9ぁ-んァ-ヶー一-龯\-_]+)
   */
  extractTags(content: string): Promise<string[]>;
}
```

**実装例:**
- `app/core/adapters/browser/tagExtractorAdapter.ts` - 正規表現を使ったシンプルな実装
- `app/core/adapters/markdown/tagExtractorAdapter.ts` - マークダウンパーサーを使った高度な実装

## ユースケース

Tagドメインで提供されるユースケース一覧。

### 1. syncNoteTags (タグ同期)

メモの本文を解析して、タグの関連付けを同期します。

**入力:**
- `noteId: NoteId` - メモID
- `content: string` - メモ本文

**出力:**
- `void`

**ビジネスルール:**
1. メモ本文からタグを抽出（TagExtractorPortを使用）
2. 既存の関連付けと比較
3. 新しいタグを追加（存在しないタグは作成）
4. Noteのタグリストを更新

**処理フロー:**
1. TagExtractorPort の `extractTags()` で本文からタグ名を抽出
2. NoteRepository の `findById()` でメモを取得
3. TagRepository の `findByIds()` で現在のタグエンティティを取得
4. 抽出されたタグ名に対して:
   - TagRepository の `findByName()` でタグを検索
   - 存在しない場合は `createTag()` + `save()` で新規作成
5. 新しいタグIDリストを作成
6. Note の `updateTagIds()` でタグIDリストを更新
7. NoteRepository の `save()` でメモを保存

**エラー:**
- `NotFoundError` - メモが見つからない
- `SystemError` - 保存に失敗

**実装パス:** `app/core/application/tag/syncNoteTags.ts`

---

### 2. cleanupUnusedTags (未使用タグ削除)

使用回数が0のタグを削除します。

**入力:**
- なし

**出力:**
- `void`

**ビジネスルール:**
- 使用回数が0のタグを削除
- データベースの整合性を保つため、定期的に実行することを推奨

**処理フロー:**
1. TagQueryService の `findUnused()` で使用回数が0のタグを取得
2. TagRepository の `deleteMany()` で一括削除

**エラー:**
- `SystemError` - 削除に失敗

**実装パス:** `app/core/application/tag/cleanupUnusedTags.ts`

**注記:** このユースケースは以下のタイミングで呼び出されます：
- メモ削除後
- タグ同期後（必要に応じて）
- 定期的なメンテナンス処理

---

### 3. getTags (タグ一覧取得)

すべてのタグを取得します (使用回数付き、使用回数の降順)。

**入力:**
- なし

**出力:**
- `TagWithUsage[]` - 使用回数付きタグ一覧

**ビジネスルール:**
- 使用回数の降順でソート
- 使用回数が0のタグも含まれる

**処理フロー:**
1. TagQueryService の `findAllWithUsage()` でタグ一覧を取得

**エラー:**
- `SystemError` - 取得に失敗

**実装パス:** `app/core/application/tag/getTags.ts`

---

### 4. getTagsByNote (メモのタグ取得)

メモに関連付けられたタグを取得します。

**入力:**
- `noteId: NoteId` - メモID

**出力:**
- `Tag[]` - タグ一覧

**ビジネスルール:**
- タグ名のアルファベット順でソート

**処理フロー:**
1. NoteRepository の `findById()` でメモを取得
2. メモの `tagIds` を使用して TagRepository の `findByIds()` でタグエンティティを取得
3. タグ名でソート

**エラー:**
- `NotFoundError` - メモが見つからない
- `SystemError` - 取得に失敗

**実装パス:** `app/core/application/tag/getTagsByNote.ts`

---

### 5. deleteTagsByNote (タグ関連付け削除)

メモのすべてのタグ関連付けを削除します。

**入力:**
- `noteId: NoteId` - メモID

**出力:**
- `void`

**ビジネスルール:**
1. メモのすべての関連付けを削除
2. 必要に応じて未使用タグをクリーンアップ

**処理フロー:**
1. NoteRepository の `findById()` でメモを取得
2. Note の `updateTagIds()` で空の配列を設定
3. NoteRepository の `save()` でメモを保存
4. 必要に応じて `cleanupUnusedTags` を呼び出す

**エラー:**
- `NotFoundError` - メモが見つからない
- `SystemError` - 削除に失敗

**実装パス:** `app/core/application/tag/deleteTagsByNote.ts`

## データモデル

### DBテーブル定義

```typescript
// app/core/adapters/drizzleSqlite/schema.ts

// タグテーブル
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

**注記:**
- `noteTagRelations` テーブルはNote集約の実装詳細として、Noteドメインで定義される
- TagRepositoryは `tags` テーブルのみを操作する
- TagQueryServiceは `noteTagRelations` テーブルを参照してクエリを実行する（読み取り専用）

### インデックス

```typescript
// タグ名検索用
export const tagsNameIndex = index("tags_name_idx").on(tags.name);
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
   - タグ名に使用可能/不可能な文字が正しく処理されること

4. **統合テスト**
   - タグの自動解析と同期が正しく動作すること
   - タグの使用回数が正しく更新されること
   - 未使用タグが自動削除されること

テストケースの詳細は `spec/testcases/tag/` に格納されます。

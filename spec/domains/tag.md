# Tag ドメイン

## 概要

**ドメイン名**: Tag

メモ本文からのタグ自動解析とタグベースのフィルタリングを管理するドメイン。
タグは `#タグ名` の形式で記述され、メモ本文から自動的に抽出される。

## エンティティ

### Tag

タグを表すエンティティ。

**属性**:
- `id: TagId` - タグの一意識別子
- `name: TagName` - タグ名
- `usageCount: UsageCount` - 使用回数（このタグを持つメモの数）

**不変条件**:
- IDは一意でなければならない
- nameは一意でなければならない
- usageCountは0以上でなければならない

**ビジネスルール**:
- タグが新しいメモで使用されるとusageCountが増加
- タグを持つメモが削除されるとusageCountが減少
- usageCountが0になったタグは自動的に削除される

## 値オブジェクト

### TagId

タグの一意識別子。

**型**: `string` (UUID v4)

**バリデーション**:
- UUID v4 形式であること

### TagName

タグ名を表す値オブジェクト。

**型**: `string`

**バリデーション**:
- 空文字列ではないこと
- 1文字以上50文字以下
- 英数字、ひらがな、カタカナ、漢字、ハイフン、アンダースコアのみ
- スペースを含まない
- 先頭に `#` を含まない（`#` は表示時に付与される）

**正規表現**:
```
^[a-zA-Z0-9ぁ-んァ-ヶ一-龠々ー\-_]+$
```

### UsageCount

タグの使用回数。

**型**: `number`

**バリデーション**:
- 0以上の整数

## ポート

### TagRepository

タグの永続化を担当するリポジトリインターフェース。

**メソッド**:

```typescript
interface TagRepository {
  // タグの作成
  // @throws {SystemError} DB保存エラー
  create(tag: Tag): Promise<Tag>

  // タグの更新（主にusageCountの更新）
  // @throws {SystemError} DB保存エラー
  update(tag: Tag): Promise<Tag>

  // タグの削除
  // @throws {SystemError} DB削除エラー
  delete(id: TagId): Promise<void>

  // IDでタグを取得
  // @throws {SystemError} DB取得エラー
  findById(id: TagId): Promise<Tag | null>

  // 名前でタグを取得
  // @throws {SystemError} DB取得エラー
  findByName(name: TagName): Promise<Tag | null>

  // タグ一覧を取得（使用回数の多い順）
  // @throws {SystemError} DB取得エラー
  findAll(): Promise<Tag[]>

  // 複数のタグ名でタグを取得
  // @throws {SystemError} DB取得エラー
  findByNames(names: TagName[]): Promise<Tag[]>

  // 使用回数を増減
  // @throws {SystemError} DB更新エラー
  incrementUsageCount(id: TagId): Promise<void>
  // @throws {SystemError} DB更新エラー
  decrementUsageCount(id: TagId): Promise<void>

  // 使用されていないタグ（usageCount = 0）を削除
  // @throws {SystemError} DB削除エラー
  deleteUnusedTags(): Promise<void>
}
```

### NoteTagRelationRepository

メモとタグの多対多の関連を管理するリポジトリインターフェース。

**メソッド**:

```typescript
interface NoteTagRelationRepository {
  // メモとタグの関連を作成
  // @throws {SystemError} DB保存エラー
  addRelation(noteId: NoteId, tagId: TagId): Promise<void>

  // メモとタグの関連を削除
  // @throws {SystemError} DB削除エラー
  removeRelation(noteId: NoteId, tagId: TagId): Promise<void>

  // メモの全タグ関連を削除
  // @throws {SystemError} DB削除エラー
  removeAllRelationsByNote(noteId: NoteId): Promise<void>

  // メモに関連するタグを取得
  // @throws {SystemError} DB取得エラー
  findTagsByNote(noteId: NoteId): Promise<Tag[]>

  // タグに関連するメモIDを取得
  // @throws {SystemError} DB取得エラー
  findNotesByTag(tagId: TagId): Promise<NoteId[]>

  // 複数タグに関連するメモIDを取得（AND検索）
  // @throws {SystemError} DB取得エラー
  findNotesByTags(tagIds: TagId[]): Promise<NoteId[]>
}
```

## ユースケース

### getTags

すべてのタグ一覧を取得する。

**入力**:
- なし

**出力**:
- `Promise<Tag[]>`

**処理フロー**:
1. TagRepository.findAllでタグ一覧を取得
2. 使用回数の多い順にソート
3. タグ一覧を返す

**例外**:
- `SystemError`: DB取得エラー

### extractTagsFromContent

メモ本文からタグを抽出する。

**入力**:
- `content: string` - メモ本文（Markdown）

**出力**:
- `TagName[]`

**処理フロー**:
1. 本文から `#タグ名` パターンを正規表現で抽出
2. 抽出した各タグ名をバリデート
3. 重複を除去
4. バリデート済みのタグ名リストを返す

**正規表現パターン**:
```
#([a-zA-Z0-9ぁ-んァ-ヶ一-龠々ー\-_]+)
```

**例外**:
- `ValidationError`: タグ名のバリデーションエラー

### syncNoteTags

メモの本文からタグを抽出し、メモとタグの関連を同期する。

**入力**:
- `noteId: NoteId` - メモID
- `content: string` - メモ本文

**出力**:
- `Promise<Tag[]>`

**処理フロー**:
1. extractTagsFromContentで本文からタグ名を抽出
2. 抽出したタグ名それぞれについて:
   a. TagRepository.findByNameでタグが既に存在するか確認
   b. 存在しない場合は新規作成（usageCount: 0）
   c. TagRepository.createで保存
3. NoteTagRelationRepository.removeAllRelationsByNoteで既存の関連を削除
4. 抽出した各タグについて:
   a. NoteTagRelationRepository.addRelationでメモとタグを関連付け
   b. TagRepository.incrementUsageCountで使用回数を増加
5. TagRepository.deleteUnusedTagsで未使用タグを削除
6. 関連付けられたタグのリストを返す

**例外**:
- `ValidationError`: タグ名のバリデーションエラー
- `SystemError`: DB操作エラー

### getTagsByNote

メモに関連するタグ一覧を取得する。

**入力**:
- `noteId: NoteId` - メモID

**出力**:
- `Promise<Tag[]>`

**処理フロー**:
1. NoteTagRelationRepository.findTagsByNoteでタグ一覧を取得
2. タグ一覧を返す

**例外**:
- `SystemError`: DB取得エラー

### findNoteIdsByTag

タグに関連するメモIDのリストを取得する。

**入力**:
- `tagName: TagName` - タグ名

**出力**:
- `Promise<NoteId[]>`

**処理フロー**:
1. タグ名をバリデート
2. TagRepository.findByNameでタグを取得
3. タグが存在しない場合はNotFoundErrorを投げる
4. NoteTagRelationRepository.findNotesByTagでメモIDのリストを取得
5. メモIDのリストを返す

**例外**:
- `ValidationError`: タグ名のバリデーションエラー
- `NotFoundError`: タグが見つからない
- `SystemError`: DB取得エラー

### findNoteIdsByTags

複数のタグに関連するメモIDのリストを取得する（AND検索）。

**入力**:
- `tagNames: TagName[]` - タグ名のリスト

**出力**:
- `Promise<NoteId[]>`

**処理フロー**:
1. 各タグ名をバリデート
2. TagRepository.findByNamesでタグのリストを取得
3. 存在しないタグがある場合は空のリストを返す
4. NoteTagRelationRepository.findNotesByTagsでメモIDのリストを取得（AND検索）
5. メモIDのリストを返す

**例外**:
- `ValidationError`: タグ名のバリデーションエラー
- `SystemError`: DB取得エラー

### deleteTagsByNote

メモに関連するすべてのタグ関連を削除する。

**入力**:
- `noteId: NoteId` - メモID

**出力**:
- `Promise<void>`

**処理フロー**:
1. NoteTagRelationRepository.findTagsByNoteでメモに関連するタグを取得
2. 各タグについて:
   a. TagRepository.decrementUsageCountで使用回数を減少
3. NoteTagRelationRepository.removeAllRelationsByNoteで関連を削除
4. TagRepository.deleteUnusedTagsで未使用タグを削除

**例外**:
- `SystemError`: DB操作エラー

## 他ドメインとの関係

### Note ドメイン

- Noteの作成・更新時にsyncNoteTagsを呼び出してタグを同期
- Noteの削除時にdeleteTagsByNoteを呼び出してタグ関連を削除
- タグ検索時にfindNoteIdsByTagsを使用してメモIDを取得

## ビジネスルールの補足

### タグの自動管理

- タグはメモ本文から自動的に抽出される
- ユーザーが明示的にタグを作成することはできない
- タグの使用回数は自動的に管理される
- 使用されていないタグは自動的に削除される

### タグ名のルール

- タグ名は `#タグ名` の形式で記述
- タグ名に使用できる文字は限定される（英数字、ひらがな、カタカナ、漢字、ハイフン、アンダースコア）
- スペースを含むタグは認識されない
- 同じタグ名は一つのメモに複数回記述しても1つとして扱われる

### パフォーマンス考慮

- タグ一覧の取得は頻繁に行われるため、キャッシュの検討が必要
- タグとメモの多対多関連のクエリ最適化が重要

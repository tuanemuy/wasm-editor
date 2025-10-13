# Revision ドメイン

## 概要

**ドメイン名**: Revision

メモの変更履歴を管理し、過去のバージョンへの復元を可能にするドメイン。
リビジョンは定期的に自動保存され、ユーザーが過去の状態に戻すことができる。

## エンティティ

### Revision

リビジョンを表すエンティティ。メモの特定時点のスナップショット。

**属性**:
- `id: RevisionId` - リビジョンの一意識別子
- `noteId: NoteId` - 対象メモのID
- `content: RevisionContent` - その時点のメモ本文（Markdown）
- `createdAt: Timestamp` - リビジョン作成日時

**不変条件**:
- IDは一意でなければならない
- noteIdは存在するメモを参照しなければならない
- contentは空でも良い
- createdAtは変更不可

**ビジネスルール**:
- リビジョンは作成後変更できない（イミュータブル）
- メモが削除されると関連するすべてのリビジョンも削除される

## 値オブジェクト

### RevisionId

リビジョンの一意識別子。

**型**: `string` (UUID v4)

**バリデーション**:
- UUID v4 形式であること

### RevisionContent

リビジョンの本文内容。

**型**: `string` (Markdown)

**バリデーション**:
- なし（空文字列も許可）

### Timestamp

日時を表す値オブジェクト。

**型**: `Date`

### RevisionTrigger

リビジョン作成のトリガーを表す。

**型**: `enum`
- `MANUAL` - 手動保存
- `AUTO` - 自動保存（一定時間ごと）
- `CLOSE` - メモを閉じた時

## ポート

### RevisionRepository

リビジョンの永続化を担当するリポジトリインターフェース。

**メソッド**:

```typescript
interface RevisionRepository {
  // リビジョンの作成
  // @throws {SystemError} DB保存エラー
  create(revision: Revision): Promise<Revision>

  // リビジョンの削除
  // @throws {SystemError} DB削除エラー
  delete(id: RevisionId): Promise<void>

  // IDでリビジョンを取得
  // @throws {SystemError} DB取得エラー
  findById(id: RevisionId): Promise<Revision | null>

  // メモIDでリビジョン一覧を取得（新しい順）
  // @throws {SystemError} DB取得エラー
  findByNoteId(noteId: NoteId): Promise<Revision[]>

  // メモIDでリビジョン一覧を取得（ページネーション付き）
  // @throws {SystemError} DB取得エラー
  findByNoteIdWithPagination(noteId: NoteId, params: {
    offset: number
    limit: number
  }): Promise<Revision[]>

  // メモに関連するすべてのリビジョンを削除
  // @throws {SystemError} DB削除エラー
  deleteByNoteId(noteId: NoteId): Promise<void>

  // メモの最新リビジョンを取得
  // @throws {SystemError} DB取得エラー
  findLatestByNoteId(noteId: NoteId): Promise<Revision | null>

  // メモのリビジョン数を取得
  // @throws {SystemError} DB取得エラー
  countByNoteId(noteId: NoteId): Promise<number>

  // 古いリビジョンを削除（保持数制限）
  // @throws {SystemError} DB削除エラー
  deleteOldRevisions(noteId: NoteId, keepCount: number): Promise<void>
}
```

## ユースケース

### createRevision

メモのリビジョンを作成する。

**入力**:
- `noteId: NoteId` - メモID
- `content: string` - メモ本文
- `trigger: RevisionTrigger` - トリガー（オプション、デフォルト: MANUAL）

**出力**:
- `Promise<Revision>`

**処理フロー**:
1. NoteRepository.findByIdでメモが存在するか確認
2. メモが存在しない場合はNotFoundErrorを投げる
3. 新しいRevisionエンティティを生成
   - IDを自動生成
   - noteIdを設定
   - contentを設定
   - createdAtに現在時刻を設定
4. RevisionRepository.createで保存
5. 設定に基づいてリビジョンの保持数を確認
6. 保持数を超える場合は古いリビジョンを削除
7. 作成したリビジョンを返す

**例外**:
- `NotFoundError`: メモが見つからない
- `SystemError`: DB保存エラー

### getRevisions

メモのリビジョン一覧を取得する。

**入力**:
- `noteId: NoteId` - メモID
- `pagination: { offset: number, limit: number }` - ページネーション（オプション）

**出力**:
- `Promise<{ revisions: Revision[], total: number }>`

**処理フロー**:
1. NoteRepository.findByIdでメモが存在するか確認
2. メモが存在しない場合はNotFoundErrorを投げる
3. paginationが指定されている場合:
   - RevisionRepository.findByNoteIdWithPaginationでリビジョン一覧を取得
4. paginationが指定されていない場合:
   - RevisionRepository.findByNoteIdでリビジョン一覧を取得
5. RevisionRepository.countByNoteIdで総数を取得
6. リビジョン一覧と総数を返す

**例外**:
- `NotFoundError`: メモが見つからない
- `SystemError`: DB取得エラー

### getRevision

特定のリビジョンを取得する。

**入力**:
- `id: RevisionId` - リビジョンID

**出力**:
- `Promise<Revision>`

**処理フロー**:
1. RevisionRepository.findByIdでリビジョンを取得
2. リビジョンが存在しない場合はNotFoundErrorを投げる
3. リビジョンを返す

**例外**:
- `NotFoundError`: リビジョンが見つからない
- `SystemError`: DB取得エラー

### restoreRevision

リビジョンからメモを復元する。

**入力**:
- `revisionId: RevisionId` - リビジョンID

**出力**:
- `Promise<Note>`

**処理フロー**:
1. RevisionRepository.findByIdでリビジョンを取得
2. リビジョンが存在しない場合はNotFoundErrorを投げる
3. NoteRepository.findByIdでメモを取得
4. メモが存在しない場合はNotFoundErrorを投げる
5. メモの本文をリビジョンの内容で上書き
6. メモのupdatedAtを現在時刻に更新
7. 本文からタグを再抽出（Tagドメイン経由）
8. NoteRepository.updateでメモを保存
9. 復元後のメモに対して新しいリビジョンを作成（trigger: MANUAL）
10. 復元したメモを返す

**例外**:
- `NotFoundError`: リビジョンまたはメモが見つからない
- `SystemError`: DB保存エラー

### deleteRevisionsByNote

メモに関連するすべてのリビジョンを削除する。

**入力**:
- `noteId: NoteId` - メモID

**出力**:
- `Promise<void>`

**処理フロー**:
1. RevisionRepository.deleteByNoteIdで削除

**例外**:
- `SystemError`: DB削除エラー

### shouldCreateAutoRevision

自動リビジョンを作成すべきかを判定する。

**入力**:
- `noteId: NoteId` - メモID
- `autoSaveInterval: number` - 自動保存間隔（分）

**出力**:
- `Promise<boolean>`

**処理フロー**:
1. RevisionRepository.findLatestByNoteIdで最新リビジョンを取得
2. 最新リビジョンが存在しない場合はtrueを返す
3. 最新リビジョンの作成日時と現在時刻の差分を計算
4. 差分が自動保存間隔以上の場合はtrueを返す
5. そうでない場合はfalseを返す

**例外**:
- `SystemError`: DB取得エラー

## 他ドメインとの関係

### Note ドメイン

- Noteの更新時に定期的にリビジョンを作成
- Noteの削除時に関連するすべてのリビジョンを削除
- リビジョンからNoteを復元

### Settings ドメイン

- リビジョン保存間隔の設定を参照
- リビジョン保持数の設定を参照

## ビジネスルールの補足

### リビジョン作成のタイミング

リビジョンは以下のタイミングで作成される：

1. **手動保存時** (MANUAL)
   - ユーザーが明示的に保存ボタンを押した時

2. **自動保存時** (AUTO)
   - 前回のリビジョン作成から一定時間（デフォルト: 10分）経過後
   - メモに変更があった場合のみ

3. **メモを閉じた時** (CLOSE)
   - メモ詳細ページから離れる時
   - 最新のリビジョンと内容が異なる場合のみ

### リビジョンの保持数

- デフォルトでは各メモにつき最大50件のリビジョンを保持
- 設定で変更可能（10〜100件）
- 保持数を超えた場合、古いリビジョンから自動削除

### パフォーマンス考慮

- リビジョンはメモの完全なスナップショットとして保存
- 差分管理は初期実装では行わない（将来的な最適化として検討）
- リビジョン一覧取得時はページネーションを推奨

### ストレージ最適化

- 同一内容のリビジョンは重複して作成しない
- 最新リビジョンと比較して内容が同じ場合は作成をスキップ

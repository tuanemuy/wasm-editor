# コンポーネント・フック リファクタリング計画

Date: 2025-10-14
Status: Planning

## 現状分析

### 実装済みページ

- ホーム（メモ一覧）: `/` (407行)
- メモ詳細・編集: `/memos/:id` (292行)
- 設定: `/settings` (229行)

### 主な問題点

#### 1. コンポーネントの責任が大きすぎる

各ルートコンポーネントが以下をすべて担当している:
- データフェッチロジック
- 状態管理
- URLパラメータの処理
- UI表示
- イベントハンドリング

**例**: `home.tsx` は407行で以下を含む:
- メモ一覧の取得・表示
- タグ一覧の取得・表示
- 検索機能
- フィルタリング機能
- ページネーション
- メモ作成

#### 2. 重複コード

以下の機能が複数箇所で重複:
- `extractTitle` (home.tsx, memos.$id.tsx)
- `formatDate` (home.tsx)
- データフェッチパターン (loading, error handling)
- 保存状態の管理

#### 3. カスタムフックの不足

現在のカスタムフック:
- `useAppContext` (context管理)
- `useMobile` (レスポンシブ判定)

必要だが存在しないカスタムフック:
- メモ一覧の取得・管理
- 個別メモの取得・更新
- タグ管理
- 検索・フィルタリング
- 自動保存
- URL状態管理

#### 4. コンポーネント分割が不十分

spec/pages.md で定義された以下のコンポーネントが未実装:
- ホームページ: 15個のコンポーネント（現在は1つの巨大コンポーネント）
- メモ詳細ページ: 10個のコンポーネント（現在は1つの巨大コンポーネント）
- 設定ページ: 比較的良好だが改善の余地あり

#### 5. テスタビリティの低さ

- ロジックとUIが密結合
- モック化しづらい
- 単体テストが書きにくい

## リファクタリングの目標

### 1. Single Responsibility Principle (単一責任の原則)

- 各コンポーネントは1つの責任のみを持つ
- ロジックとプレゼンテーションを分離

### 2. DRY (Don't Repeat Yourself)

- 重複コードをカスタムフックやユーティリティに抽出
- 共通パターンの統一

### 3. Reusability (再利用性)

- 汎用的なコンポーネント・フックの作成
- プロジェクト全体で一貫したパターンの使用

### 4. Testability (テスト可能性)

- ロジックを独立してテスト可能に
- 依存関係の注入を活用

### 5. Maintainability (保守性)

- コードの見通しを良くする
- ファイルサイズを適切に保つ（100-200行程度）

## リファクタリング計画

### Phase 1: カスタムフックの作成

#### 1.1 データフェッチ系フック

**app/hooks/useNotes.ts**
```typescript
// メモ一覧の取得と管理
export function useNotes(options: {
  searchQuery?: string;
  tagFilters?: string[];
  sortOption?: SortOption;
  pageSize?: number;
}) {
  // notes, loading, error, hasMore, loadMore を返す
}
```

**app/hooks/useNote.ts**
```typescript
// 個別メモの取得と更新
export function useNote(noteId: string) {
  // note, loading, error, updateContent, saveNote を返す
}
```

**app/hooks/useTags.ts**
```typescript
// タグ一覧の取得と管理
export function useTags() {
  // tags, loading, error を返す
}
```

**app/hooks/useNoteTags.ts**
```typescript
// 複数メモのタグを一括取得
export function useNoteTags(noteIds: string[]) {
  // noteTagsMap, loading を返す
}
```

#### 1.2 状態管理系フック

**app/hooks/useAutoSave.ts**
```typescript
// 自動保存ロジック
export function useAutoSave(
  content: string,
  onSave: (content: string) => Promise<void>,
  interval?: number
) {
  // saveStatus, saveNow を返す
}
```

**app/hooks/useSearchParams.ts**
```typescript
// URLパラメータの管理を簡素化
export function useSearchParams<T extends Record<string, string>>() {
  // params, setParam, deleteParam, clearParams を返す
}
```

#### 1.3 UI状態管理フック

**app/hooks/useDialog.ts**
```typescript
// ダイアログの開閉状態管理
export function useDialog(initialOpen = false) {
  // isOpen, open, close, toggle を返す
}
```

**app/hooks/useAsync.ts**
```typescript
// 非同期処理の状態管理（loading, error）
export function useAsync<T>(asyncFn: () => Promise<T>, deps: unknown[]) {
  // data, loading, error, execute を返す
}
```

### Phase 2: ユーティリティ関数の作成

**app/lib/note-utils.ts**
```typescript
// メモ関連のユーティリティ
export function extractTitle(content: string): string
export function formatNoteContent(content: string): string
export function generateNotePreview(content: string, maxLength: number): string
```

**app/lib/date-utils.ts**
```typescript
// 日付フォーマット関連
export function formatDate(date: Date, format?: string): string
export function formatRelativeTime(date: Date): string
```

**app/lib/sort-utils.ts**
```typescript
// ソート関連
export type SortOption = "created_desc" | "created_asc" | "updated_desc" | "updated_asc"
export function parseSortOption(option: SortOption): { orderBy: string; order: string }
export function buildSortLabel(option: SortOption): string
```

### Phase 3: コンポーネントの分割

#### 3.1 ホームページ (app/routes/home.tsx)

**現状**: 407行の単一コンポーネント

**リファクタリング後の構造**:

```
app/
├── routes/
│   └── home.tsx (100-150行)
│       ├── データフェッチ（カスタムフック使用）
│       └── レイアウト構造のみ
├── components/
│   └── home/
│       ├── HomeHeader.tsx (60-80行)
│       │   ├── SearchBar.tsx (30行)
│       │   ├── SortSelect.tsx (40行)
│       │   └── FilterBadges.tsx (50行)
│       ├── TagSidebar.tsx (80-100行)
│       │   ├── TagList.tsx (50行)
│       │   └── TagItem.tsx (30行)
│       ├── NoteList.tsx (80-100行)
│       │   ├── NoteCard.tsx (60-80行)
│       │   ├── EmptyState.tsx (30行)
│       │   └── LoadMoreButton.tsx (30行)
│       └── CreateNoteFAB.tsx (40行)
```

#### 3.2 メモ詳細ページ (app/routes/memos.$id.tsx)

**現状**: 292行の単一コンポーネント

**リファクタリング後の構造**:

```
app/
├── routes/
│   └── memos.$id.tsx (80-100行)
│       ├── データフェッチ（カスタムフック使用）
│       └── レイアウト構造のみ
├── components/
│   └── memo/
│       ├── MemoHeader.tsx (80行)
│       │   ├── BackButton.tsx (20行)
│       │   ├── MemoTitle.tsx (30行)
│       │   ├── SaveStatusIndicator.tsx (40行)
│       │   └── MemoActions.tsx (50行)
│       └── DeleteConfirmDialog.tsx (40行)
```

#### 3.3 設定ページ (app/routes/settings.tsx)

**現状**: 229行（比較的良好）

**リファクタリング後の構造**:

```
app/
├── routes/
│   └── settings.tsx (60-80行)
│       ├── データフェッチ（カスタムフック使用）
│       └── レイアウト構造のみ
├── components/
│   └── settings/
│       ├── SettingsHeader.tsx (40行)
│       ├── SortSettingsCard.tsx (60行)
│       └── AutoSaveSettingsCard.tsx (60行)
```

### Phase 4: 共通コンポーネントの整理

**app/components/common/** (新規作成)
- `LoadingSpinner.tsx`: ローディング表示の統一
- `ErrorMessage.tsx`: エラー表示の統一
- `EmptyState.tsx`: 空状態表示の統一

### Phase 5: 型定義の整理

**app/types/** (新規作成)
```
app/types/
├── ui.ts (UI関連の型定義)
│   ├── SaveStatus
│   ├── SortOption
│   └── AsyncState
├── params.ts (URLパラメータの型定義)
│   ├── HomeSearchParams
│   └── MemoSearchParams
└── index.ts (型のエクスポート)
```

## 実装順序

### Step 1: 基礎の準備 (1-2h)

1. ユーティリティ関数の作成
   - `app/lib/note-utils.ts`
   - `app/lib/date-utils.ts`
   - `app/lib/sort-utils.ts`
2. 型定義の作成
   - `app/types/ui.ts`
   - `app/types/params.ts`

### Step 2: カスタムフックの実装 (3-4h)

1. データフェッチ系
   - `useNotes`
   - `useNote`
   - `useTags`
   - `useNoteTags`
2. 状態管理系
   - `useAutoSave`
   - `useDialog`
   - `useAsync`

### Step 3: ホームページのリファクタリング (4-5h)

1. ヘッダーコンポーネントの分割
2. サイドバーコンポーネントの分割
3. メモリストコンポーネントの分割
4. FABコンポーネントの分割
5. ルートコンポーネントの簡素化

### Step 4: メモ詳細ページのリファクタリング (2-3h)

1. ヘッダーコンポーネントの分割
2. アクションコンポーネントの分割
3. ルートコンポーネントの簡素化

### Step 5: 設定ページのリファクタリング (1-2h)

1. 設定カードコンポーネントの分割
2. ルートコンポーネントの簡素化

### Step 6: テストとレビュー (2-3h)

1. 型チェック
2. リンターチェック
3. 動作確認
4. パフォーマンステスト

**総見積時間: 13-19時間**

## 成功の指標

### コード品質

- [ ] 各コンポーネントが100-200行以内
- [ ] 重複コードが50%以上削減
- [ ] カスタムフックが8個以上作成
- [ ] 型エラーゼロ
- [ ] Lint警告ゼロ

### 機能品質

- [ ] すべてのページが正常に動作
- [ ] 既存の機能が保持されている
- [ ] パフォーマンスが維持または向上

### 保守性

- [ ] 新機能の追加が容易
- [ ] テストコードが書きやすい
- [ ] ドキュメントが整備されている

## リスクと対策

### リスク1: リファクタリング中のバグ混入

**対策**:
- 小さな単位で変更してテスト
- 動作確認を頻繁に実施
- Gitで段階的にコミット

### リスク2: パフォーマンスの劣化

**対策**:
- React.memo の適切な使用
- useMemo / useCallback の活用
- 過度なコンポーネント分割を避ける

### リスク3: 時間超過

**対策**:
- 優先順位を明確にする
- 完璧を目指さず、段階的に改善
- 必要に応じてスコープを調整

## 参考資料

- React公式ドキュメント: https://react.dev/
- React Router v7: https://reactrouter.com/
- カスタムフックのベストプラクティス
- コンポーネント設計パターン

## 次のステップ

1. この計画をレビュー
2. 実装を開始する前に `spec/pages.md` を再確認
3. Step 1から順次実装開始
4. 各ステップ完了後に動作確認とコミット

---

**Note**: この計画は実装しながら調整する可能性があります。状況に応じて柔軟に対応します。

# SPAコードレビュー

**レビュー日時**: 2025-10-15 14:03
**レビュー対象**: SPAの実装（プレゼンテーション層）
**レビュー範囲**: レイアウト、ページ、コンポーネント、hooks、utilities

## 概要

`spec/requirements.md` および `spec/pages.md` に定義された仕様に基づいて、SPAの実装をレビューしました。
全体として、仕様に従った実装がなされており、コード品質も高いレベルにあります。

## アーキテクチャ評価

### ✅ 良い点

1. **Hexagonal Architecture の適用**
   - ドメイン層、アプリケーション層、アダプター層が適切に分離されている
   - プレゼンテーション層からはアプリケーション層の use case を呼び出している
   - DIコンテナによる依存性注入が適切に実装されている (app/lib/context.tsx:14)

2. **適切なコンポーネント分割**
   - レイアウトコンポーネント（app/components/layout/）
   - ドメイン固有コンポーネント（app/components/note/, app/components/tag/, app/components/settings/）
   - 共通コンポーネント（app/components/common/）
   - UIコンポーネント（shadcn/ui）
   - 責務が明確に分離されている

3. **カスタムHooksによるロジック分離**
   - `useNotes`: メモ一覧の取得・検索・フィルタリング・ページネーション
   - `useNote`: 単一メモの取得・更新・削除・エクスポート
   - `useAutoSave`: 自動保存機能
   - `useUIState`: UI状態管理（検索、ソート、タグフィルター）
   - ビジネスロジックがコンポーネントから分離され、再利用可能

4. **型安全性の確保**
   - TypeScriptによる厳密な型定義
   - ドメインモデルの型を活用
   - Props interfaceの適切な定義

5. **エラーハンドリング**
   - try-catch による例外処理
   - toast による UX の良いエラー通知 (app/hooks/useNote.ts:54, 94, 112)
   - ローディング状態の管理

6. **React Router v7 Framework mode の適用**
   - ファイルベースルーティングの活用
   - meta関数によるSEO対応
   - ErrorBoundaryの実装 (app/root.tsx:58)

## 仕様への準拠度

### ✅ 実装済み機能

#### 1. メモ管理機能

- **FR-MEMO-001**: 新規メモ作成 (app/routes/home.tsx:47)
- **FR-MEMO-002**: メモの属性（ID、本文、作成日時、更新日時）
- **FR-MEMO-003**: 即座にDB保存
- **FR-MEMO-004**: メモ編集 (app/routes/memos.$id.tsx)
- **FR-MEMO-005**: 自動保存 (app/hooks/useAutoSave.ts)
- **FR-MEMO-006**: 自動保存のタイミング（編集停止後2秒）✅
- **FR-MEMO-007**: メモ削除 (app/hooks/useNote.ts:84)
- **FR-MEMO-008**: 削除確認ダイアログ (app/components/note/DeleteConfirmDialog.tsx)
- **FR-MEMO-009**: メモ詳細閲覧
- **FR-MEMO-010**: 閲覧/編集モード切り替え ⚠️ 未実装

#### 2. エディタ機能

- **FR-EDITOR-001**: Tiptapエディター (app/components/editor/TiptapEditor.tsx)
- **FR-EDITOR-002**: リッチテキスト機能（見出し、太字、斜体、リスト、引用、コードブロック、リンク）✅

#### 3. 自動保存機能

- **FR-DATA-003**: 自動保存 ✅
- **FR-DATA-004**: 保存状態通知 (app/components/note/SaveStatusIndicator.tsx) ✅
- **FR-DATA-005**: 保存失敗時のエラー表示 ✅
- **FR-DATA-006**: 自動保存間隔設定 (app/routes/settings.tsx:32) ✅

#### 4. ホーム画面機能

- **FR-HOME-001**: メモ一覧表示 (app/components/note/NoteList.tsx) ✅
- **FR-HOME-002**: プレビュー、日時、タグ表示 (app/components/note/NoteCard.tsx) ✅
- **FR-HOME-003**: タイムライン風表示 ✅
- **FR-HOME-004**: デフォルトソート順（作成日時降順）✅
- **FR-HOME-005**: 無限スクロール ⚠️ Load Moreボタンで実装 (app/components/common/LoadMoreButton.tsx)
- **FR-HOME-006**: 段階的読み込み ✅
- **FR-HOME-007**: 初回20件読み込み ✅
- **FR-HOME-008**: ソート対象設定 ✅
- **FR-HOME-009**: ソート順設定 ✅
- **FR-HOME-010**: ソート設定のDB保存 ✅

#### 5. タグ機能

- **FR-TAG-001**: タグ自動解析 ✅（ドメイン層で実装）
- **FR-TAG-002**: `#タグ名` 形式 ✅
- **FR-TAG-003**: タグ名ルール ⚠️ バリデーションの詳細未確認
- **FR-TAG-004**: タグのDB保存 ✅
- **FR-TAG-005**: タグ一覧表示 (app/components/tag/TagSidebar.tsx) ✅
- **FR-TAG-006**: 使用回数表示 (app/components/tag/TagItem.tsx) ✅

#### 6. 検索機能

- **FR-SEARCH-001**: 全文検索 (app/hooks/useNotes.ts) ✅
- **FR-SEARCH-002**: 本文を検索対象 ✅
- **FR-SEARCH-003**: リアルタイム更新 ✅
- **FR-SEARCH-004**: キーワードハイライト ❌ 未実装
- **FR-SEARCH-005**: タグクリックで絞り込み ✅
- **FR-SEARCH-006**: 複数タグでAND検索 ✅
- **FR-SEARCH-007**: タグフィルタ解除 ✅
- **FR-SEARCH-007** (複合検索): 全文検索とタグ検索の組み合わせ ✅
- **FR-SEARCH-008**: 複合検索でのページネーション ✅

#### 7. エクスポート機能

- **FR-EXPORT-001**: Markdownエクスポート ✅ (app/hooks/useNote.ts:102)
- **FR-EXPORT-002**: ファイル名形式 ⚠️ 確認必要
- **FR-EXPORT-003**: 一括エクスポート ❌ 未実装

### ⚠️ 仕様との差異・未実装

2. **無限スクロール (FR-HOME-005)**
   - 仕様: 無限スクロール
   - 現状: Load Moreボタン
   - 影響: UXが仕様と異なる
   - 重要度: 🟡 中

3. **検索キーワードハイライト (FR-SEARCH-004)**
   - 未実装
   - 重要度: 🟡 中

4. **エクスポートダイアログ (spec/pages.md:92, 142)**
   - 仕様: エクスポート形式選択ダイアログ
   - 現状: 未実装（ワンクリックでエクスポート）
   - 重要度: 🟢 低

5. **一括エクスポート (FR-EXPORT-003, spec/pages.md:89)**
   - 仕様: 複数メモの一括エクスポート、一括選択モード
   - 現状: 未実装
   - 重要度: 🟡 中

6. **HTMLプレビューのグラデーション (FR-HOME-002)**
   - 仕様: はみ出す部分をグラデーションで隠す
   - 現状: `line-clamp-3` で切り捨て (app/components/note/NoteCard.tsx:26)
   - 影響: 視覚的な差異
   - 重要度: 🟢 低

7. **エディター閲覧/編集モード切り替え (FR-MEMO-010, spec/pages.md:138)**
   - 仕様: ViewModeToggle
   - 現状: 常に編集モード
   - 重要度: 🟡 中

8. **エディターからフォーカスが外れた時の自動保存 (FR-MEMO-006)**
   - 仕様: フォーカス外れた時、ページ遷移時に自動保存
   - 現状: 編集停止後2秒のみ（ページ遷移時は unmount 時に保存）
   - 重要度: 🟢 低（unmount時に保存されているため）

## コード品質評価

### ✅ 良い実装

#### 1. Hooks設計

**useNotes.ts**
```typescript
// ページネーション、検索、フィルタリング、ソートを統合
// 依存配列の最適化（tagFiltersKey）
// ローディング状態とエラーハンドリング
```
- クリーンで再利用可能
- 適切な依存配列管理
- エラーハンドリング

**useAutoSave.ts**
```typescript
// debounce による自動保存
// unmount 時の保存処理
// 保存状態の管理
```
- 適切なタイミングで保存
- メモリリーク対策

**useUIState (uiStateContext.tsx)**
```typescript
// 検索、ソート、タグフィルターの集中管理
// Context APIによるグローバル状態管理
```
- 状態管理の集約
- Props drillingの回避

#### 2. コンポーネント設計

**NoteList.tsx**
- ローディング、空状態、エラー状態の適切な処理
- Skeleton UIによるローディング表示

**TiptapEditor.tsx** (app/components/editor/TiptapEditor.tsx)
- 豊富なフォーマット機能
- カーソル位置の保持（content更新時）
- immediatelyRender: false による最適化

**MemoHeader / HomeHeader / SettingsHeader**
- 各ページに適したヘッダーコンポーネント
- 適切な責務分離

#### 3. エラーハンドリング

- try-catch による例外処理
- sonner toastによるユーザーフレンドリーなエラー通知
- ErrorBoundary の実装

#### 4. ローディング状態管理

- Skeleton UI (NoteCardSkeleton.tsx)
- Spinner (memos.$id.tsx:59-63)
- ボタンのdisabled状態管理

### ⚠️ 改善提案

#### 2. 無限スクロールの実装 🟡

**現状**: Load Moreボタン
**推奨**: Intersection Observer API を使用した無限スクロール

```typescript
// 例: useInfiniteScroll hook
function useInfiniteScroll(callback: () => void, hasMore: boolean) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          callback();
        }
      },
      { threshold: 0.1 }
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => observer.disconnect();
  }, [callback, hasMore]);

  return targetRef;
}
```

**影響箇所**:
- app/components/note/NoteList.tsx
- app/components/common/LoadMoreButton.tsx を削除

#### 4. キーワードハイライト 🟡

検索結果でキーワードをハイライト表示する機能の追加。

```typescript
// 例: ハイライトコンポーネント
function highlightText(text: string, query: string) {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.split(regex).map((part, i) =>
    regex.test(part) ? <mark key={i}>{part}</mark> : part
  );
}
```

**影響箇所**:
- app/components/note/NoteCard.tsx
- app/lib/note-utils.ts

#### 5. 一括操作機能 🟡

**必要な実装**:
- 一括選択モード
- チェックボックス
- 一括エクスポートバー
- 複数メモのエクスポート

**新規コンポーネント**:
- BulkSelectMode
- SelectCheckbox
- BulkActionBar

**影響箇所**:
- app/routes/home.tsx
- app/components/note/NoteList.tsx
- app/components/note/NoteCard.tsx

#### 6. エディター閲覧モード 🟡

**推奨実装**:
- 閲覧モード/編集モード切り替えボタン
- 閲覧モードでは Tiptap を `editable: false` に設定
- Markdownプレビュー表示

```typescript
const [isEditing, setIsEditing] = useState(false);

const editor = useEditor({
  editable: isEditing,
  // ...
});
```

**影響箇所**:
- app/components/editor/TiptapEditor.tsx
- app/components/layout/MemoHeader.tsx

#### 7. その他の小さな改善

**a. HTMLプレビューのグラデーション**
```css
/* NoteCard のプレビュー部分 */
.preview {
  position: relative;
  max-height: 4.5rem;
  overflow: hidden;
}

.preview::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1.5rem;
  background: linear-gradient(transparent, white);
}
```

**b. エクスポートダイアログ**
- ファイル名のプレビュー
- エクスポート形式選択（現状はMarkdownのみだが、将来の拡張性）

**c. タグバリデーション**
- ドメイン層でのバリデーションルールの確認
- 特殊文字、スペースの処理

## パフォーマンス評価

### ✅ 良い点

1. **React 19 の活用**
   - 最新のReact機能を使用

2. **適切なメモ化**
   - `useCallback` による関数メモ化 (useAutoSave.ts:37, useNote.ts:62)

3. **Lazy loading**
   - ページネーションによる段階的読み込み

4. **依存配列の最適化**
   - `tagFiltersKey` による配列のシリアライズ (useNotes.ts:50)

5. **Tiptap の最適化**
   - `immediatelyRender: false` (TiptapEditor.tsx:64)

### ⚠️ 改善提案

1. **コンポーネントの memo 化**
   - 頻繁に再レンダリングされる可能性のあるコンポーネント（NoteCard, TagItem等）に `React.memo` を適用

2. **仮想化リスト**
   - 大量のメモがある場合、`react-window` や `react-virtualized` の使用を検討

## アクセシビリティ

### ⚠️ 改善提案

1. **キーボードナビゲーション**
   - TABキーによるフォーカス移動の確認
   - Enterキーでの操作対応

2. **ARIA属性**
   - ダイアログに適切な `role`, `aria-label` の追加
   - ローディング状態に `aria-busy` の追加

3. **セマンティックHTML**
   - 適切な見出しレベル（h1, h2, h3）の使用

## テスト

### ❌ 未確認

- フロントエンドのテストコードは確認していない
- 以下のテストが必要:
  - hooks のユニットテスト
  - コンポーネントのユニットテスト
  - E2Eテスト（検索、フィルタリング、CRUD操作）

## セキュリティ

### ✅ 良い点

1. **XSS対策**
   - Reactによる自動エスケープ
   - DOMへの直接挿入なし

2. **型安全性**
   - TypeScriptによる型チェック

### ⚠️ 確認事項

1. **ユーザー入力のサニタイズ**
   - Tiptapエディターの入力内容
   - 特にリンク挿入時の URL バリデーション (TiptapEditor.tsx:92-106)

2. **ファイルエクスポート**
   - パストラバーサル対策の確認

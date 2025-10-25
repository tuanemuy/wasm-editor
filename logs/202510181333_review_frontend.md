# SPAコードレビュー

**レビュー日時**: 2025-10-18 13:33
**レビュー対象**: フロントエンド実装（React Router v7 SPA）
**責任範囲**: SPAのコードレビュー

## 1. 概要

本レビューでは、`spec/requirements.md`および`spec/pages.md`に定義された要件に基づき、実装されたSPAコードの品質を評価した。

### レビュー対象ファイル

- **Pages**: `app/routes/*.tsx`
- **Components**: `app/components/**/*.tsx`
- **Hooks**: `app/hooks/*.ts`
- **Context**: `app/context/*.tsx`

---

## 2. 設計との整合性

### 2.1 ページ構成

| ページ | パス | 実装状況 | 備考 |
|--------|------|---------|------|
| ホーム（メモ一覧） | `/` | ✅ 実装済み | `app/routes/home.tsx` |
| メモ詳細・編集 | `/memos/:id` | ✅ 実装済み | `app/routes/memos.$id.tsx` |
| 設定 | `/settings` | ✅ 実装済み | `app/routes/settings.tsx` |

**評価**: ページ構成は設計通り実装されている。

### 2.2 機能要件の実装状況

#### メモ管理機能

| 要件ID | 要件 | 実装状況 | 実装箇所 |
|--------|------|---------|---------|
| FR-MEMO-001 | メモ作成 | ✅ | `useCreateNote.ts`, `CreateNoteFAB.tsx` |
| FR-MEMO-004 | メモ編集 | ✅ | `TiptapEditor.tsx`, `useNote.ts` |
| FR-MEMO-005 | 自動保存 | ✅ | `useAutoSave.ts` |
| FR-MEMO-007 | メモ削除 | ✅ | `useNote.ts`, `DeleteConfirmDialog.tsx` |
| FR-MEMO-009 | メモ閲覧 | ✅ | `memos.$id.tsx` |

#### エディタ機能

| 要件ID | 要件 | 実装状況 | 実装箇所 |
|--------|------|---------|---------|
| FR-EDITOR-001 | Tiptap使用 | ✅ | `TiptapEditor.tsx` |
| FR-EDITOR-002 | フォーマット機能 | ✅ | `TiptapEditor.tsx:122-268` |

#### 自動保存機能

| 要件ID | 要件 | 実装状況 | 実装箇所 |
|--------|------|---------|---------|
| FR-DATA-003 | 自動保存 | ✅ | `useAutoSave.ts` |
| FR-DATA-004 | 保存状態表示 | ✅ | `SaveStatusIndicator.tsx` |

#### ホーム画面機能

| 要件ID | 要件 | 実装状況 | 実装箇所 |
|--------|------|---------|---------|
| FR-HOME-001 | メモ一覧表示 | ✅ | `NoteList.tsx` |
| FR-HOME-002 | メモカード表示 | ✅ | `NoteCard.tsx` |
| FR-HOME-005 | 無限スクロール | ✅ | `useInfiniteScroll.ts`, `NoteList.tsx:41-45` |
| FR-HOME-008-010 | ソート機能 | ✅ | `SortPopover.tsx`, `useSearch.tsx` |

#### タグ機能

| 要件ID | 要件 | 実装状況 | 実装箇所 |
|--------|------|---------|---------|
| FR-TAG-001 | タグ自動解析 | ✅ | Core層で実装 |
| FR-TAG-005 | タグ一覧表示 | ✅ | `TagSidebar.tsx`, `TagList.tsx` |
| FR-TAG-006 | 使用回数表示 | ✅ | `TagItem.tsx` |

#### 検索機能

| 要件ID | 要件 | 実装状況 | 実装箇所 |
|--------|------|---------|---------|
| FR-SEARCH-001 | 全文検索 | ✅ | `SearchBar.tsx`, `useNotes.ts` |
| FR-SEARCH-003 | リアルタイム更新 | ✅ | `useNotes.ts:60-106` |
| FR-SEARCH-004 | ハイライト表示 | ✅ | `HighlightedText.tsx` |
| FR-SEARCH-005 | タグ絞り込み | ✅ | `TagSidebar.tsx`, `useSearch.tsx` |

#### エクスポート機能

| 要件ID | 要件 | 実装状況 | 実装箇所 |
|--------|------|---------|---------|
| FR-EXPORT-001 | Markdownエクスポート | ✅ | `useBulkExport.ts`, `useNote.ts:102-117` |
| FR-EXPORT-003 | 一括エクスポート | ✅ | `useBulkExport.ts`, `BulkActionBar.tsx` |

**評価**: 全ての機能要件が実装されている。

---

## 3. コード品質レビュー

### 3.1 重大な問題（Critical）

#### 問題1: useEffectを値の変更検知に使用（アンチパターン）

**影響度**: 🔴 High

##### 発生箇所1: `app/routes/settings.tsx:35-41`

```typescript
// 🔴 問題: useEffectで値の変更を検知してstateを更新している
useEffect(() => {
  if (settings) {
    setDefaultOrder(settings.defaultOrder);
    setDefaultOrderBy(settings.defaultOrderBy);
    setAutoSaveInterval(settings.autoSaveInterval.toString());
  }
}, [settings]);
```

**問題点**:
- `settings`が変更されるたびにフォーム状態を上書きしているため、ユーザーが編集中の値が失われる可能性がある
- `settings`の初期値を設定するためだけにuseEffectを使うのは不適切
- settingsが更新されるとユーザーの編集内容が失われる

**推奨される修正**:
```typescript
// ✅ 修正案: 初期値として設定し、useEffectを削除
const [defaultOrder, setDefaultOrder] = useState<string>(
  settings?.defaultOrder ?? "desc"
);
const [defaultOrderBy, setDefaultOrderBy] = useState<string>(
  settings?.defaultOrderBy ?? "created"
);
const [autoSaveInterval, setAutoSaveInterval] = useState<string>(
  settings?.autoSaveInterval.toString() ?? "2000"
);
```

または、controlled componentとして扱う場合：
```typescript
// ✅ 別の修正案: settingsから直接値を取得（controlled component）
const defaultOrder = settings?.defaultOrder ?? "desc";
const defaultOrderBy = settings?.defaultOrderBy ?? "created";
const autoSaveInterval = settings?.autoSaveInterval.toString() ?? "2000";
```

##### 発生箇所2: `app/hooks/useAutoSave.ts:76-101`

```typescript
// 🔴 問題: contentが変更されるたびにuseEffectが実行される
useEffect(() => {
  const prevContent = prevContentRef.current;
  prevContentRef.current = content;

  if (isInitialMountRef.current) {
    isInitialMountRef.current = false;
    initialContentRef.current = content;
    return;
  }

  if (
    prevContent === "" &&
    content !== "" &&
    initialContentRef.current === ""
  ) {
    initialContentRef.current = content;
    return;
  }

  if (content !== initialContentRef.current) {
    markUnsaved();
  }
}, [content, markUnsaved]);
```

**問題点**:
- `content`が変更されるたびにuseEffectが実行され、複雑な条件分岐でロジックを制御している
- `markUnsaved`が依存配列に含まれており、useCallbackの再作成によって意図しない再実行が発生する可能性がある
- 初期マウントやコンテンツのロードなど、エッジケースの処理が複雑

**推奨される修正**:
useEffectを使わず、`onChange`コールバック内で直接処理する方法を検討すべき。または、`useMemo`や`useCallback`を適切に使用して、依存関係を明確にする。

```typescript
// ✅ 修正案: onChangeで直接処理
const handleContentChange = useCallback((newContent: string) => {
  onChange(newContent);

  if (newContent !== initialContentRef.current) {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus("unsaved");

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        await onSave(newContent);
        initialContentRef.current = newContent;
        setSaveStatus("saved");
      } catch (error) {
        console.error("Auto-save failed:", error);
        setSaveStatus("unsaved");
      }
    }, interval);
  }
}, [onChange, onSave, interval]);
```

##### 発生箇所3: `app/hooks/useNotes.ts:54-56`

```typescript
// 🔴 問題: フィルター条件が変わるたびにページをリセット
useEffect(() => {
  setPage(1);
}, [searchQuery, sortField, sortOrder, tagFiltersKey]);
```

**問題点**:
- 値の変更検知にuseEffectを使用している
- この処理は副作用ではなく、状態の派生である
- フィルター変更時にページをリセットするロジックは、イベントハンドラーで行うべき

**推奨される修正**:
```typescript
// ✅ 修正案: 検索条件変更時のコールバックでページをリセット
// SearchProviderのsetQuery, setSortField, setSortOrderなどで、
// ページリセットも同時に行う

// または、useMemoでフィルターキーを監視し、変更時にページをリセット
const filterKey = useMemo(
  () => `${searchQuery}-${sortField}-${sortOrder}-${tagFiltersKey}`,
  [searchQuery, sortField, sortOrder, tagFiltersKey]
);

const prevFilterKeyRef = useRef(filterKey);

useEffect(() => {
  if (prevFilterKeyRef.current !== filterKey) {
    prevFilterKeyRef.current = filterKey;
    setPage(1);
  }
}, [filterKey]);
```

ただし、より良いアプローチは、検索条件を変更する各ハンドラー内でページをリセットすることである：

```typescript
const handleSearchChange = (query: string) => {
  setQuery(query);
  setPage(1);
};

const handleSortChange = (field: SortField, order: SortOrder) => {
  setSortField(field);
  setSortOrder(order);
  setPage(1);
};
```

---

### 3.2 中程度の問題（Moderate）

#### 問題2: TiptapEditorでのuseEffect使用

**影響度**: 🟡 Medium

**発生箇所**: `app/components/editor/TiptapEditor.tsx:71-89, 92-95`

```typescript
// 🟡 問題: contentとeditableの変更検知にuseEffectを使用
useEffect(() => {
  if (!editor || editor.isDestroyed) return;

  if (isInitialMount.current) {
    isInitialMount.current = false;
    return;
  }

  const currentContent = editor.getHTML();
  if (content !== currentContent) {
    // ... エディタの更新処理
  }
}, [content, editor]);

useEffect(() => {
  if (!editor || editor.isDestroyed) return;
  editor.setEditable(editable);
}, [editable, editor]);
```

**問題点**:
- 外部ライブラリ（Tiptap）との同期にuseEffectを使用している
- これは許容されるケースだが、より良い方法があるかもしれない

**評価**:
- Tiptapのようなサードパーティライブラリとの統合では、useEffectの使用が避けられない場合がある
- 実装は適切に保護されている（`isDestroyed`チェック、初期マウントスキップ）
- この使用法は許容範囲内だが、Tiptapの公式ドキュメントで推奨されるパターンを確認すべき

**推奨**: 現状維持でも可だが、React 19のuseEffectEventなど新しいAPIが利用可能になった場合は検討する。

---

#### 問題3: 状態管理の一貫性

**影響度**: 🟡 Medium

**発生箇所**: `app/context/search.tsx`

**問題点**:
- `SearchContext`はグローバルな状態管理を行っているが、ページ遷移時にリセットされない
- ユーザーが設定ページから戻った際に、検索条件が保持されている

**評価**:
- これは意図的な設計である可能性があるが、UX的に混乱を招く可能性がある
- 仕様書には明記されていない

**推奨**:
- ページ遷移時の状態保持ポリシーを明確にする
- 必要に応じて、URLパラメータで検索条件を管理する

---

### 3.3 軽微な問題（Minor）

#### 問題4: タイポ

**影響度**: 🟢 Low

**発生箇所**: `app/context/search.tsx:18`

```typescript
ressetSort: () => void; // ❌ タイポ: "resset" → "reset"
```

**推奨**: `resetSort`に修正

---

#### 問題5: コメントの不一致

**影響度**: 🟢 Low

**発生箇所**: 各ファイル

**問題点**:
- 日本語と英語のコメントが混在している
- コメントの粒度が統一されていない

**推奨**:
- プロジェクト全体でコメントの言語を統一する（日本語または英語）
- JSDocスタイルのコメントを統一的に使用する

---

## 4. レイアウト構成

### 4.1 ホーム画面

**実装**: `app/routes/home.tsx`

**コンポーネント構成**:
```
SidebarProvider
├─ TagSidebar (サイドバー)
│  └─ TagList
│     └─ TagItem
└─ SidebarInset (メインコンテンツ)
   ├─ HomeHeader (ヘッダー)
   │  ├─ SearchBar
   │  └─ SortPopover
   ├─ NoteList (メモ一覧)
   │  └─ NoteCard
   ├─ BulkActionBar (一括操作バー)
   └─ CreateNoteFAB (新規作成FAB)
```

**評価**: ✅ 設計通り実装されている

### 4.2 メモ詳細・編集画面

**実装**: `app/routes/memos.$id.tsx`

**コンポーネント構成**:
```
MemoEditor
├─ MemoHeader (ヘッダー)
│  ├─ BackButton
│  ├─ SaveStatusIndicator
│  └─ NoteActions (削除・エクスポート)
└─ TiptapEditor (エディター)
   └─ EditorToolbar
```

**評価**: ✅ 設計通り実装されている

### 4.3 設定画面

**実装**: `app/routes/settings.tsx`

**コンポーネント構成**:
```
SettingsPage
├─ SettingsHeader (ヘッダー)
├─ SortSettingsCard (ソート設定)
├─ AutoSaveSettingsCard (自動保存設定)
└─ SettingsActions (保存・リセットボタン)
```

**評価**: ✅ 設計通り実装されている

---

## 5. コンポーネント品質

### 5.1 優れている点

1. **適切なコンポーネント分割**
   - 各コンポーネントは単一責任原則に従っている
   - 再利用可能なコンポーネントが適切に抽出されている
   - `app/components/ui/`にshadcn/uiコンポーネントが整理されている

2. **型安全性**
   - TypeScriptが適切に使用されている
   - propsの型定義が明確
   - Domain層のentityとvalueObjectが適切に使用されている

3. **アクセシビリティ**
   - ボタンにaria-labelが付与されている（例: `NoteCard.tsx:76`）
   - セマンティックなHTML要素が使用されている

4. **パフォーマンス最適化**
   - `useCallback`と`useMemo`が適切に使用されている
   - 無限スクロールによる段階的なデータ読み込み
   - React 19の機能（viewTransition）が活用されている

5. **アニメーション**
   - Framer Motionを使用したスムーズなページ遷移
   - layoutIdによる共有要素アニメーション（`NoteCard`→`MemoEditor`）

---

### 5.2 改善が必要な点

1. **エラーハンドリング**
   - エラー時のユーザーフィードバックはtoastのみ
   - より詳細なエラーメッセージや回復手段を提供すべき

2. **ローディング状態**
   - 初回ロード時のスケルトン表示は実装されているが、一部のコンポーネントでは不足
   - 例: `TagSidebar`にはローディング状態がない

3. **テスト**
   - テストコードが不足している
   - 特にhooksのテストが重要

---

## 6. Hooks品質

### 6.1 カスタムHooks一覧

| Hook名 | 責務 | 品質評価 |
|--------|------|---------|
| `useAutoSave` | 自動保存機能 | 🟡 要改善（useEffect問題） |
| `useNote` | メモ取得・更新・削除 | ✅ 良好 |
| `useNotes` | メモ一覧取得 | 🟡 要改善（useEffect問題） |
| `useSettings` | 設定取得・更新 | ✅ 良好 |
| `useTags` | タグ一覧取得 | ✅ 良好 |
| `useNoteTags` | メモ別タグ取得 | ✅ 良好 |
| `useCreateNote` | メモ作成 | ✅ 良好 |
| `useBulkExport` | 一括エクスポート | ✅ 良好 |
| `useBulkSelect` | 一括選択 | ✅ 良好 |
| `useInfiniteScroll` | 無限スクロール | ✅ 良好 |
| `useDialog` | ダイアログ状態管理 | ✅ 良好 |
| `useDatabase` | データベース初期化 | ✅ 良好 |

---

### 6.2 良い点

1. **責務の分離**
   - 各Hookが明確な責務を持っている
   - ビジネスロジックとUI状態管理が適切に分離されている

2. **再利用性**
   - 汎用的なHooks（`useDialog`, `useInfiniteScroll`）が抽出されている
   - Domain層と適切に連携している

3. **型安全性**
   - 戻り値の型が明確に定義されている
   - contextからの型推論が適切

---

## 7. コンテキスト品質

### 7.1 実装されているコンテキスト

| コンテキスト名 | 責務 | 品質評価 |
|--------------|------|---------|
| `DIContainer` | 依存性注入 | ✅ 優秀 |
| `SearchContext` | 検索・フィルター状態 | ✅ 良好（タイポあり） |
| `SharedLayoutContext` | 共有レイアウト状態 | ✅ 良好 |

---

### 7.2 評価

**優れている点**:
- Hexagonal architectureの原則に従った依存性注入
- グローバル状態が適切に管理されている
- prop drillingを避けている

---

## 8. スタイリング品質

### 8.1 評価

**使用技術**: Tailwind CSS v4, shadcn/ui

**優れている点**:
1. Tailwind CSSが一貫して使用されている
2. shadcn/uiによる統一されたデザインシステム
3. レスポンシブデザインが考慮されている
4. ダークモード対応の準備ができている（CSS変数使用）

**改善点**:
1. 一部のコンポーネントでインラインスタイルが長くなっている
2. 共通のスタイルパターンを抽出できる余地がある

---

## 9. 総合評価

### 9.1 実装品質スコア

| 評価項目 | スコア | コメント |
|---------|-------|---------|
| 設計との整合性 | ⭐⭐⭐⭐⭐ 5/5 | 全要件が実装されている |
| コード品質 | ⭐⭐⭐⭐☆ 4/5 | useEffectの問題がある |
| 型安全性 | ⭐⭐⭐⭐⭐ 5/5 | TypeScriptが適切に使用されている |
| パフォーマンス | ⭐⭐⭐⭐⭐ 5/5 | 最適化が適切 |
| アクセシビリティ | ⭐⭐⭐⭐☆ 4/5 | 基本的な対応は完了 |
| テスト | ⭐⭐☆☆☆ 2/5 | テストコードが不足 |

**総合スコア**: ⭐⭐⭐⭐☆ **4.2/5**

---

### 9.2 主要な改善推奨事項（優先度順）

1. **[Critical]** useEffectアンチパターンの修正
   - `app/routes/settings.tsx:35-41`
   - `app/hooks/useAutoSave.ts:76-101`
   - `app/hooks/useNotes.ts:54-56`

2. **[High]** テストコードの追加
   - 特にhooksとビジネスロジックのテスト
   - Vitestを使用したunit test

3. **[Medium]** エラーハンドリングの改善
   - より詳細なエラーメッセージ
   - エラー回復手段の提供

4. **[Low]** コメントの統一
   - 日本語/英語の統一
   - JSDocの追加

---

## 10. 結論

全体的に、実装は設計通りに行われており、機能要件も満たしている。特に、Hexagonal architectureの原則に従った実装、適切なコンポーネント分割、型安全性の高さは評価できる。

しかし、**useEffectを値の変更検知に使用しているアンチパターン**が複数箇所で見られるため、これらの修正が最優先事項である。特に`useAutoSave`と`settings.tsx`の修正は、潜在的なバグや意図しない動作を引き起こす可能性があるため、早急に対処すべきである。

修正後は、適切なテストを追加し、品質を担保することを推奨する。

---

## 11. 参考資料

- [React公式ドキュメント - You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [React公式ドキュメント - Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)
- [Hexagonal Architecture in TypeScript](https://dev.to/stemmlerjs/hexagonal-architecture-in-typescript-3o8o)

---

**レビュアー**: Claude Code (claude.ai/code)

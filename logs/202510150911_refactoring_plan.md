# SPAリファクタリング計画

## 概要

SPA実装後のリファクタリング計画。UI状態管理をReact Contextに移行し、責務ごとのカスタムフック分離、shadcn/uiコンポーネントの最大活用を目的とする。

**作成日時**: 2025-10-15 09:11
**最終更新**: 2025-10-15 10:00（shadcn/ui活用を大幅に拡張）

### 主な変更点

1. **URLクエリパラメータからContextへの移行**
   - 検索・ソート・フィルター状態を`UIStateContext`で一元管理
   - ページ遷移後も状態が保持される
   - URLパラメータ解析・更新の複雑なロジックを削除

2. **Context の役割分離**
   - `AppContext`: Core Architectureの依存性注入（既存）
   - `UIStateContext`: UI状態の管理（新規）

3. **カスタムフックの簡素化**
   - `useSearch`、`useSort`、`useTagFilter`は単純なContext wrapper
   - ロジックはContextに集約、フックは状態の取得・操作のみ提供

4. **shadcn/uiコンポーネントの活用**
   - カスタム実装を shadcn/ui の標準コンポーネントで置き換え
   - `EmptyState` → `Empty`
   - `TagSidebar` → `Sidebar`（折りたたみ、レスポンシブ対応）
   - 設定フォーム → `Field`
   - ローディング状態 → `Skeleton`

5. **期待される効果**
   - ルートコンポーネントの大幅な簡素化（-35%以上）
   - 状態の永続化によるUX向上
   - テスタビリティの向上
   - レスポンシブ対応の実現（Sidebarによる）
   - レイアウトシフトの防止（Skeletonによる）

## 現状の課題

### 1. URLクエリパラメータへの依存

現在、`app/routes/home.tsx`では検索クエリ、ソート順、タグフィルターをURLクエリパラメータで管理している。

```typescript
// home.tsx:31-43
const searchQuery = searchParams.get("q") || "";
const orderByParam = searchParams.get("order_by") || "created_at";
const orderParam = searchParams.get("order") || "desc";
const tagFilters = searchParams.get("tags")?.split(",").filter(Boolean) || [];
```

**問題点**:
- 設定をURLで管理する必要性がない（ユーザー要件により不要と判断）
- URLパラメータの解析・更新ロジックが散在している（home.tsx:60-106）
- ブラウザの戻る/進むボタンの動作が複雑になる
- **ページ遷移後に状態が失われる**（最大の問題点）

**Contextアプローチの優位性**:
- ページ遷移後も状態が保持される（UX向上）
- URLパラメータの解析・更新ロジックが不要（コード削減）
- ルーティングの外側で状態を管理できる（アーキテクチャの改善）

### 2. ルートコンポーネントへのロジック集中

`app/routes/home.tsx`に多くのビジネスロジックが直接記述されている:
- 検索クエリの更新（handleSearch）
- ソート順の更新（handleSortFieldChange, handleSortOrderChange）
- タグフィルターのトグル（handleTagClick）
- フィルタークリア（handleClearFilters）
- ノート作成（handleCreateNote）

**問題点**:
- コンポーネントが肥大化している（162行）
- ロジックの再利用が困難
- テストが難しい

### 3. 設定管理の重複

`app/routes/settings.tsx`で設定を管理しているが、以下の問題がある:
- ローカルステートとDB状態の同期ロジックが複雑（settings.tsx:32-44）
- 保存・リセット処理がコンポーネントに直接記述されている
- 設定の読み込みをカスタムフックで管理していない

### 4. エディターページのロジック

`app/routes/memos.$id.tsx`では:
- ノート読み込みロジックが`useEffect`に直接記述されている（memos.$id.tsx:40-57）
- 削除・エクスポート処理がコンポーネントに直接記述されている
- `useNote`フックが存在するが、編集ページでは使われていない

## リファクタリング目標

### 原則

1. **責務の分離**: ロジックを適切な粒度のカスタムフックに分離
2. **状態管理の簡素化**: URLクエリパラメータを廃止し、React Contextで管理
3. **再利用性の向上**: 小さく、テスト可能なユニットに分割
4. **状態の永続化**: ページ遷移後も検索・ソート・フィルター状態を保持
5. **shadcn/ui活用**: カスタムコンポーネントをshadcn/uiで置き換え可能な箇所を特定

### 具体的な改善点

1. URLクエリパラメータをReact Contextに置き換え
2. UI専用のContext（`UIStateContext`）を作成し、検索・ソート・フィルター状態を管理
3. 検索・ソート・フィルターの各操作をカスタムフックで提供
4. 設定管理をカスタムフックに集約
5. エディターページのロジックを既存の`useNote`フックに統合

### アーキテクチャ設計

#### Context の役割分離

**既存**: `AppContext` (app/lib/context.tsx)
- Core Architectureの依存性注入（DI）用
- リポジトリやアダプターのインスタンスを提供
- アプリケーションサービスで使用

**新規**: `UIStateContext` (app/lib/uiStateContext.tsx)
- UI状態の管理専用
- 検索クエリ、ソート順、タグフィルターなどの状態を保持
- ページ遷移後も状態を保持（メモリ内）

この分離により：
- Core Architecture（domain, adapter, application）とUI状態が明確に分離
- 各Contextが単一責任を持つ
- テストが容易になる

## リファクタリングタスク

### Phase 0: UIStateContextの作成

#### 0.1 UIStateContextの実装

**新規作成**: `app/lib/uiStateContext.tsx`

```typescript
import { createContext, useContext, useState, type ReactNode } from "react";
import type { SortField, SortOrder } from "@/lib/sort-utils";

export interface UIState {
  // 検索状態
  searchQuery: string;

  // ソート状態
  sortField: SortField;
  sortOrder: SortOrder;

  // タグフィルター状態
  selectedTagIds: string[];
}

export interface UIStateContextValue {
  state: UIState;

  // 検索操作
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  // ソート操作
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;
  resetSort: () => void;

  // タグフィルター操作
  toggleTag: (tagId: string) => void;
  addTag: (tagId: string) => void;
  removeTag: (tagId: string) => void;
  clearTags: () => void;
  isTagSelected: (tagId: string) => boolean;

  // 全フィルタークリア
  clearAllFilters: () => void;
}

export function UIStateProvider({ children }: { children: ReactNode }): JSX.Element;
export function useUIState(): UIStateContextValue;
```

**責務**:
- UI状態の一元管理
- 検索・ソート・フィルターの状態と操作を提供
- ページ遷移後も状態を保持（メモリ内）

**実装のポイント**:
- 状態はProvider内でuseStateで管理
- 各操作関数はuseCallbackでメモ化
- デフォルト値は定数として定義（DEFAULT_SORT_FIELD、DEFAULT_SORT_ORDER）

#### 0.2 Providerの配置

**変更**: `app/root.tsx`

```typescript
import { AppContextProvider } from "@/lib/context";
import { UIStateProvider } from "@/lib/uiStateContext";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <AppContextProvider>
      <UIStateProvider>
        {children}
      </UIStateProvider>
    </AppContextProvider>
  );
}
```

**配置の理由**:
- AppContextProviderの内側に配置（Core Architectureの初期化後）
- すべてのルートコンポーネントでUI状態が共有される
- ルーティングの外側なので、ページ遷移後も状態が保持される

### Phase 1: カスタムフックの作成

#### 1.1 検索機能のフック

**新規作成**: `app/hooks/useSearch.ts`

```typescript
import { useUIState } from "@/lib/uiStateContext";

export interface UseSearchResult {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

/**
 * UIStateContextから検索状態を取得・操作するフック
 */
export function useSearch(): UseSearchResult {
  const { state, setSearchQuery, clearSearch } = useUIState();

  return {
    searchQuery: state.searchQuery,
    setSearchQuery,
    clearSearch,
  };
}
```

**責務**:
- UIStateContextから検索関連の状態・操作のみを抽出
- コンポーネントがContextの全体構造を知る必要をなくす

#### 1.2 ソート機能のフック

**新規作成**: `app/hooks/useSort.ts`

```typescript
import { useUIState } from "@/lib/uiStateContext";
import type { SortField, SortOrder } from "@/lib/sort-utils";

export interface UseSortResult {
  sortField: SortField;
  sortOrder: SortOrder;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;
  resetSort: () => void;
}

/**
 * UIStateContextからソート状態を取得・操作するフック
 */
export function useSort(): UseSortResult {
  const {
    state,
    setSortField,
    setSortOrder,
    toggleSortOrder,
    resetSort
  } = useUIState();

  return {
    sortField: state.sortField,
    sortOrder: state.sortOrder,
    setSortField,
    setSortOrder,
    toggleSortOrder,
    resetSort,
  };
}
```

**責務**:
- UIStateContextからソート関連の状態・操作のみを抽出
- コンポーネントがContextの全体構造を知る必要をなくす

#### 1.3 タグフィルター機能のフック

**新規作成**: `app/hooks/useTagFilter.ts`

```typescript
import { useUIState } from "@/lib/uiStateContext";

export interface UseTagFilterResult {
  selectedTagIds: string[];
  toggleTag: (tagId: string) => void;
  addTag: (tagId: string) => void;
  removeTag: (tagId: string) => void;
  clearTags: () => void;
  isTagSelected: (tagId: string) => boolean;
}

/**
 * UIStateContextからタグフィルター状態を取得・操作するフック
 */
export function useTagFilter(): UseTagFilterResult {
  const {
    state,
    toggleTag,
    addTag,
    removeTag,
    clearTags,
    isTagSelected
  } = useUIState();

  return {
    selectedTagIds: state.selectedTagIds,
    toggleTag,
    addTag,
    removeTag,
    clearTags,
    isTagSelected,
  };
}
```

**責務**:
- UIStateContextからタグフィルター関連の状態・操作のみを抽出
- コンポーネントがContextの全体構造を知る必要をなくす

#### 1.4 設定管理の分離

**新規作成**: `app/hooks/useSettings.ts`

```typescript
export interface UseSettingsResult {
  settings: Settings | null;
  loading: boolean;
  saving: boolean;
  resetting: boolean;
  error: Error | null;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export function useSettings(): UseSettingsResult;
```

**責務**:
- 設定の読み込み・保存・リセット
- 保存状態・リセット状態の管理
- エラーハンドリング

#### 1.5 ノート操作の統合

**既存フックの拡張**: `app/hooks/useNote.ts`

現在のインターフェース:
```typescript
export interface UseNoteResult {
  note: Note | null;
  loading: boolean;
  error: Error | null;
  updateContent: (content: string) => Promise<void>;
}
```

拡張後のインターフェース:
```typescript
export interface UseNoteResult {
  note: Note | null;
  loading: boolean;
  error: Error | null;
  deleting: boolean;
  exporting: boolean;
  updateContent: (content: string) => Promise<void>;
  deleteNote: () => Promise<void>;
  exportNote: () => Promise<void>;
}
```

**責務**:
- ノートの読み込み・更新・削除・エクスポート
- 各操作の状態管理（loading, deleting, exporting）
- エラーハンドリング

#### 1.6 ノート作成の分離

**新規作成**: `app/hooks/useCreateNote.ts`

```typescript
export interface UseCreateNoteResult {
  creating: boolean;
  createNote: () => Promise<Note>;
}

export function useCreateNote(): UseCreateNoteResult;
```

**責務**:
- 新規ノートの作成
- 作成中状態の管理

### Phase 2: ルートコンポーネントのリファクタリング

#### 2.1 `app/routes/home.tsx`

**変更前**:
- 162行
- URLクエリパラメータの解析・更新ロジック
- 検索・ソート・フィルターのハンドラー関数
- ノート作成ロジック

**変更後**:
```typescript
export default function Home() {
  const navigate = useNavigate();

  // UI state from context (自動的に状態が保持される)
  const { searchQuery, setSearchQuery } = useSearch();
  const { sortField, sortOrder, setSortField, setSortOrder } = useSort();
  const { selectedTagIds, toggleTag } = useTagFilter();
  const { clearAllFilters } = useUIState();

  // Data hooks
  const { tags } = useTags();
  const { notes, loading, hasMore, loadMore } = useNotes({
    searchQuery,
    tagFilters: selectedTagIds,
    sortField,
    sortOrder,
    pageSize: 20,
  });
  const { noteTagsMap } = useNoteTags(notes.map((note) => note.id));

  // Actions
  const { creating, createNote } = useCreateNote();

  const handleCreateNote = async () => {
    const note = await createNote();
    navigate(`/memos/${note.id}`);
  };

  const hasFilters = searchQuery || selectedTagIds.length > 0;

  return (
    <div className="flex h-screen">
      <TagSidebar
        tags={tags}
        selectedTagIds={selectedTagIds}
        onTagClick={toggleTag}
      />

      <main className="flex-1 flex flex-col">
        <HomeHeader
          searchQuery={searchQuery}
          sortField={sortField}
          sortOrder={sortOrder}
          tagFilters={selectedTagIds}
          tags={tags}
          onSearchChange={setSearchQuery}
          onSortFieldChange={setSortField}
          onSortOrderChange={setSortOrder}
          onClearFilters={clearAllFilters}
        />

        <NoteList
          notes={notes}
          noteTagsMap={noteTagsMap}
          loading={loading}
          hasMore={hasMore}
          hasFilters={hasFilters}
          sortField={sortField}
          sortOrder={sortOrder}
          onLoadMore={loadMore}
        />
      </main>

      <CreateNoteFAB creating={creating} onClick={handleCreateNote} />
    </div>
  );
}
```

**削減される行数**: 約162行 → 約65行（△97行、-60%）

**改善点**:
- URLクエリパラメータの処理が完全に削除
- UI状態はContextで管理され、ページ遷移後も保持される
- すべてのロジックがカスタムフックに委譲
- コンポーネントはUIの組み立てに専念
- `useAppContext()`の呼び出しも不要（各フック内で使用）

#### 2.2 `app/routes/memos.$id.tsx`

**変更前**:
- 153行
- ノート読み込みロジックが`useEffect`に直接記述
- 削除・エクスポート処理がコンポーネントに直接記述
- `useNote`フックが未使用

**変更後**:
```typescript
export default function MemoDetail() {
  const params = useParams();
  const navigate = useNavigate();

  // Use extended useNote hook
  const {
    note,
    loading,
    deleting,
    exporting,
    updateContent,
    deleteNote,
    exportNote,
  } = useNote(params.id);

  // Dialog state
  const deleteDialog = useDialog(false);

  // Auto-save with note content
  const [content, setContent] = useState(note?.content || "");

  useEffect(() => {
    if (note) {
      setContent(note.content);
    }
  }, [note]);

  const { saveStatus } = useAutoSave(content, {
    onSave: updateContent,
    interval: 2000,
  });

  // Handle note deletion with navigation
  const handleDelete = async () => {
    await deleteNote();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!note) {
    navigate("/");
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <MemoHeader
        content={content}
        saveStatus={saveStatus}
        exporting={exporting}
        onExport={exportNote}
        onDelete={deleteDialog.open}
      />

      <div className="flex-1 overflow-hidden">
        <ClientOnly
          fallback={
            <div className="flex items-center justify-center h-full">
              <Spinner className="h-8 w-8" />
            </div>
          }
        >
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your note..."
          />
        </ClientOnly>
      </div>

      <DeleteConfirmDialog
        open={deleteDialog.isOpen}
        deleting={deleting}
        onOpenChange={deleteDialog.close}
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

**削減される行数**: 約153行 → 約85行（△68行、-44%）

**改善点**:
- ノート読み込み・削除・エクスポートが`useNote`フックに集約
- エラーハンドリングがフック内に隠蔽
- コンポーネントがシンプルに

#### 2.3 `app/routes/settings.tsx`

**変更前**:
- 141行
- 設定の読み込み・保存・リセットロジックがすべてコンポーネント内
- フォーム状態とDB状態の同期が複雑

**変更後**:
```typescript
export default function SettingsPage() {
  const {
    settings,
    loading,
    saving,
    resetting,
    updateSettings,
    resetSettings,
  } = useSettings();

  // Form state
  const [defaultOrder, setDefaultOrder] = useState<string>("desc");
  const [defaultOrderBy, setDefaultOrderBy] = useState<string>("created");
  const [autoSaveInterval, setAutoSaveInterval] = useState<string>("2000");

  // Sync form state with settings
  useEffect(() => {
    if (settings) {
      setDefaultOrder(settings.defaultOrder);
      setDefaultOrderBy(settings.defaultOrderBy);
      setAutoSaveInterval(settings.autoSaveInterval.toString());
    }
  }, [settings]);

  // Save settings
  const handleSave = async () => {
    const interval = Number.parseInt(autoSaveInterval, 10);
    if (Number.isNaN(interval) || interval < 1000) {
      toast.error("Auto-save interval must be at least 1000ms");
      return;
    }

    await updateSettings({
      defaultOrder,
      defaultOrderBy,
      autoSaveInterval: interval,
    });
  };

  // Reset settings
  const handleReset = async () => {
    await resetSettings();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const hasChanges =
    settings &&
    (defaultOrder !== settings.defaultOrder ||
      defaultOrderBy !== settings.defaultOrderBy ||
      autoSaveInterval !== settings.autoSaveInterval.toString());

  return (
    <div className="min-h-screen bg-muted/40">
      <SettingsHeader />

      <main className="max-w-4xl mx-auto p-4 space-y-6 py-8">
        <SortSettingsCard
          defaultOrderBy={defaultOrderBy}
          defaultOrder={defaultOrder}
          onOrderByChange={setDefaultOrderBy}
          onOrderChange={setDefaultOrder}
        />

        <AutoSaveSettingsCard
          autoSaveInterval={autoSaveInterval}
          onChange={setAutoSaveInterval}
        />

        <SettingsActions
          hasChanges={!!hasChanges}
          saving={saving}
          resetting={resetting}
          onSave={handleSave}
          onReset={handleReset}
        />
      </main>
    </div>
  );
}
```

**削減される行数**: 約141行 → 約85行（△56行、-40%）

**改善点**:
- 設定の読み込み・保存・リセットロジックが`useSettings`フックに集約
- エラーハンドリングがフック内に隠蔽
- トースト通知もフック内で管理

### Phase 3: shadcn/uiコンポーネントの活用

現在使用中のshadcn/uiコンポーネント:
- ✅ Button, Button Group
- ✅ Card
- ✅ Dialog, AlertDialog
- ✅ Input, Input Group
- ✅ Select
- ✅ ScrollArea
- ✅ Spinner
- ✅ Badge
- ✅ Separator
- ✅ Toast (Sonner)
- ✅ Label

**インストール済みだが未使用のコンポーネント**:
- Empty
- Field
- Sidebar
- Item
- Skeleton
- Tooltip
- Command
- Form
など

#### 3.1 カスタム実装をshadcn/uiで置き換え（高優先度）

以下のカスタムコンポーネントをshadcn/uiの標準コンポーネントで置き換えます：

##### EmptyState → Empty コンポーネント

**現状**: `app/components/common/EmptyState.tsx`
```typescript
// カスタム実装（19行）
export function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">
        {hasFilters ? "No notes found" : "No notes yet"}
      </p>
      {!hasFilters && (
        <p className="text-sm text-muted-foreground mt-2">
          Click the + button to create your first note
        </p>
      )}
    </div>
  );
}
```

**改善案**: shadcn/uiの`Empty`コンポーネントを使用
- より統一されたデザイン
- アイコン、タイトル、説明、アクションボタンのサポート
- アクセシビリティの向上

**優先度**: 高

##### TagSidebar → Sidebar コンポーネント

**現状**: `app/components/tag/TagSidebar.tsx`（シンプルなasideタグ）
```typescript
// カスタム実装（28行）
export function TagSidebar({ tags, selectedTagIds, onTagClick }: TagSidebarProps) {
  return (
    <aside className="w-64 border-r bg-muted/40 flex flex-col">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Tags</h2>
        <TagList tags={tags} selectedTagIds={selectedTagIds} onTagClick={onTagClick} />
      </div>
    </aside>
  );
}
```

**改善案**: shadcn/uiの`Sidebar`コンポーネントを使用
- 折りたたみ機能
- レスポンシブ対応（モバイルでDrawerに変換）
- より高機能なサイドバーUI
- `SidebarProvider`, `SidebarTrigger`, `SidebarContent`などの構造化されたAPI

**優先度**: 高（レスポンシブ対応とUX向上）

##### 設定フォーム → Field コンポーネント

**現状**: `app/components/settings/SortSettingsCard.tsx`、`AutoSaveSettingsCard.tsx`
- Label + Select/Input を手動で組み合わせ
- space-y-2 でレイアウト管理

**改善案**: shadcn/uiの`Field`コンポーネントを使用
```typescript
// Before
<div className="space-y-2">
  <Label htmlFor="defaultOrderBy">Sort by</Label>
  <Select value={defaultOrderBy} onValueChange={onOrderByChange}>
    <SelectTrigger id="defaultOrderBy">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>...</SelectContent>
  </Select>
</div>

// After (Field使用)
<Field label="Sort by">
  <Select value={defaultOrderBy} onValueChange={onOrderByChange}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>...</SelectContent>
  </Select>
</Field>
```

**優先度**: 高（フォーム実装の統一）

##### ローディング状態 → Skeleton コンポーネント

**現状**: `app/components/note/NoteList.tsx`、`app/routes/settings.tsx`など
- Spinnerのみでローディング表示
- レイアウトシフトが発生する可能性

**改善案**: shadcn/uiの`Skeleton`コンポーネントを使用
```typescript
// NoteList loading state
{loading && page === 1 ? (
  <div className="space-y-4">
    <NoteCardSkeleton />
    <NoteCardSkeleton />
    <NoteCardSkeleton />
  </div>
) : ...}

// Settings loading state
{loading ? (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  </div>
) : ...}
```

**優先度**: 高（UX向上に大きく寄与、レイアウトシフト防止）

#### 3.2 React Hook Form + Form コンポーネント（中優先度）

**現状**: `app/routes/settings.tsx`
- useState でフォーム状態を管理（32-34行）
- バリデーションを手動で実装（56-60行）
- エラーハンドリングをトーストで実装

**改善案**: shadcn/uiの`Form`コンポーネント + React Hook Formを使用
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

const settingsSchema = z.object({
  defaultOrder: z.enum(["asc", "desc"]),
  defaultOrderBy: z.enum(["created", "updated"]),
  autoSaveInterval: z.number().min(1000),
});

export default function SettingsPage() {
  const form = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: { ... },
  });

  const handleSave = form.handleSubmit(async (data) => {
    await updateSettings(context, data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSave}>
        <FormField
          control={form.control}
          name="defaultOrderBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort by</FormLabel>
              <FormControl>
                <Select {...field}>...</Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

**メリット**:
- 宣言的なバリデーション（Zod）
- 自動的なエラー表示
- フォーム状態の一元管理
- より堅牢なフォーム実装

**優先度**: 中（フォームが複雑化した場合に有用）

#### 3.3 その他の検討事項（低優先度）

以下は現状で問題ないため、低優先度として記録のみ：

- **Command**: 現状の SearchBar で十分機能している
- **Tooltip**: 必要に応じて追加可能だが、現状は明確なUI
- **Dropdown Menu**: Select で十分
- **Tabs**: 編集モードのみで問題なし
- **Item**: TagItem は現状の実装で問題なし（Button + Badge の組み合わせ）

### Phase 4: コンポーネントの細分化（オプション）

**注意**: このフェーズはオプションです。現状のコンポーネントで問題なく動作しているため、実装は不要と判断します。将来的にコンポーネントが肥大化した場合のみ検討します。

#### 4.1 NoteCard の分割（実装不要）

**現状**: `app/components/note/NoteCard.tsx`
- 単一のコンポーネントで完結している
- 責務が明確（ノートカードの表示）

**将来的な改善案**（必要になった場合のみ）:
- `NoteCardPreview`: Markdownプレビュー部分
- `NoteCardMeta`: メタ情報（日時、タグ）部分
- `NoteCardActions`: アクション（クリック、削除等）部分

#### 4.2 HomeHeader の分割（実装不要）

**現状**: `app/components/layout/HomeHeader.tsx`
- 単一のコンポーネントで完結している
- 責務が明確（ホームページのヘッダー）

**将来的な改善案**（必要になった場合のみ）:
- `SearchSection`: 検索バー部分
- `FilterSection`: ソート・フィルター部分
- `ActionSection`: 設定リンク部分

### Phase 5: 型定義の整理

#### 5.1 共通型の集約

**現状**: `app/types/index.ts`に型定義があるが、一部のファイルでexportしている

**改善案**:
- すべての共通型を`app/types/index.ts`に集約
- ドメイン固有の型は各ドメインディレクトリに配置
- UIコンポーネント用の型は`app/types/ui.ts`に分離

**優先度**: 中

#### 5.2 Props型のネーミング規則

**現状**: 一部のコンポーネントでProps型の命名が統一されていない

**改善案**:
- すべてのPropsインターフェースを`{ComponentName}Props`に統一
- 例: `HomeHeaderProps`, `NoteCardProps`

**優先度**: 低

## 実装順序

### Step 0: UIStateContextの作成（Phase 0）
1. `app/lib/uiStateContext.tsx`の実装
2. `app/root.tsx`にUIStateProviderを追加
3. 動作確認（デフォルト値が正しく設定されているか）

**見積もり**: 1時間

### Step 1: カスタムフック作成（Phase 1）
1. `useSearch.ts`（UIStateContextから状態を取得）
2. `useSort.ts`（UIStateContextから状態を取得）
3. `useTagFilter.ts`（UIStateContextから状態を取得）
4. `useCreateNote.ts`（既存のcreateNoteを呼び出すだけ）
5. `useSettings.ts`（設定の読み込み・保存・リセット）
6. `useNote.ts`（拡張：削除・エクスポート機能を追加）

**見積もり**: 6フック × 20分 = 2時間

### Step 2: home.tsx リファクタリング（Phase 2.1）
1. 新しいカスタムフックを使用するように変更
2. URLクエリパラメータ関連コードを削除
3. 動作確認とバグフィックス
4. 型チェックとリンター実行

**見積もり**: 1時間

### Step 3: memos.$id.tsx リファクタリング（Phase 2.2）
1. 拡張した`useNote`フックを使用するように変更
2. 削除・エクスポートロジックを削除
3. 動作確認とバグフィックス
4. 型チェックとリンター実行

**見積もり**: 1時間

### Step 4: settings.tsx リファクタリング（Phase 2.3）
1. `useSettings`フックを使用するように変更
2. 設定管理ロジックを削除
3. 動作確認とバグフィックス
4. 型チェックとリンター実行

**見積もり**: 1時間

### Step 5: shadcn/uiコンポーネント置き換え（Phase 3.1）

#### 5.1 EmptyState → Empty コンポーネント
1. `app/components/common/EmptyState.tsx`をEmptyコンポーネントを使った実装に変更
2. `app/components/note/NoteList.tsx`の使用箇所を更新
3. 動作確認

**見積もり**: 20分

#### 5.2 Skeleton コンポーネントの追加
1. `app/components/note/NoteCardSkeleton.tsx`を作成
2. `app/components/note/NoteList.tsx`でローディング状態にSkeletonを使用
3. `app/routes/settings.tsx`でローディング状態にSkeletonを使用
4. 動作確認（レイアウトシフトがないか）

**見積もり**: 30分

#### 5.3 設定フォーム → Field コンポーネント
1. `app/components/settings/SortSettingsCard.tsx`をFieldコンポーネントを使った実装に変更
2. `app/components/settings/AutoSaveSettingsCard.tsx`をFieldコンポーネントを使った実装に変更
3. 動作確認

**見積もり**: 30分

#### 5.4 TagSidebar → Sidebar コンポーネント
1. `app/components/tag/TagSidebar.tsx`をSidebarコンポーネントを使った実装に変更
2. `app/routes/home.tsx`でSidebarProviderを追加
3. モバイルでの動作確認（レスポンシブ対応）
4. 折りたたみ機能の動作確認

**見積もり**: 1時間

**Phase 3.1 合計**: 約2.5時間

### Step 6: 型定義整理（Phase 5）
1. 共通型の集約
2. Props型のネーミング統一

**見積もり**: 1時間

**合計見積もり**:
- Step 0（UIStateContext）: 1時間
- Step 1（カスタムフック）: 2時間
- Step 2（home.tsx）: 1時間
- Step 3（memos.$id.tsx）: 1時間
- Step 4（settings.tsx）: 1時間
- Step 5（shadcn/ui置き換え）: 2.5時間
- Step 6（型定義整理）: 1時間
- **合計**: 約9.5時間

## 検証項目

### 機能テスト
- [ ] ノート一覧の表示
- [ ] 検索機能
- [ ] ソート機能
- [ ] タグフィルター機能
- [ ] ノート作成
- [ ] ノート編集
- [ ] ノート削除
- [ ] ノートエクスポート
- [ ] 設定の保存・リセット
- [ ] 自動保存機能

### パフォーマンステスト
- [ ] 大量のノート（100件以上）での動作確認
- [ ] 無限スクロールの動作確認
- [ ] 自動保存の動作確認

### コード品質
- [ ] `pnpm typecheck`が通る
- [ ] `pnpm lint`が通る
- [ ] `pnpm format:check`が通る
- [ ] すべてのカスタムフックに適切な型定義がある
- [ ] すべてのコンポーネントに適切なProps型がある

## リスクと対策

### リスク1: URLクエリパラメータ廃止による機能低下
**リスク**: ブラウザの戻る/進むボタンが使えなくなる、URL共有ができなくなる

**対策**:
- UIStateContextで管理することで、ページ遷移後も状態が保持される
- ホームページ（`/`）から編集ページ（`/memos/:id`）に遷移し、戻ってきた際も検索・ソート・フィルター状態が保持される
- URL共有については、ユーザー要件により不要と判断済み
- 将来的に必要であれば、UIStateContextの状態をURLと同期する仕組みを追加可能

**メリット**:
- ページ遷移後も状態が保持されるため、UXが向上
- URLパラメータ解析・更新の複雑なロジックが不要
- React Routerの`searchParams`依存がなくなり、テストが容易

### リスク2: Contextの肥大化
**リスク**: UIStateContextに状態が増えすぎて管理が複雑になる

**対策**:
- UIStateContextは検索・ソート・フィルターのみに限定
- 他のUI状態（モーダルの開閉等）は各コンポーネントのローカルステートで管理
- 将来的に状態が増えた場合は、useReducerでの実装に移行

### リスク3: カスタムフック分離による複雑性の増加
**リスク**: フックが多すぎて管理が複雑になる

**対策**:
- 各フックは単一責任の原則に従う
- `useSearch`、`useSort`、`useTagFilter`は単純なContext wrapper
- フック間の依存関係を最小限に抑える
- 適切なドキュメント（JSDoc）を記載

### リスク4: 既存の実装との互換性
**リスク**: リファクタリング中に既存機能が壊れる

**対策**:
- 段階的なリファクタリング（Step by Step）
- 各ステップで動作確認
- 型チェックとリンターを常に実行
- UIStateContextを先に実装し、テストしてから各ページをリファクタリング

## 成功基準

1. **コードの削減**: 全体で約200行以上の削減（-35%以上）
2. **状態管理の改善**:
   - URLクエリパラメータ関連コードが完全に削除される
   - UI状態がContextで一元管理される
   - ページ遷移後も状態が保持される
3. **shadcn/uiコンポーネントの活用**:
   - カスタム実装が shadcn/ui の標準コンポーネントで置き換えられる
   - `EmptyState` → `Empty`
   - `TagSidebar` → `Sidebar`（折りたたみ、レスポンシブ対応）
   - 設定フォーム → `Field`
   - ローディング状態 → `Skeleton`（レイアウトシフト防止）
4. **テスタビリティ**: すべてのロジックがカスタムフックに分離され、単体テスト可能
5. **保守性**:
   - 各コンポーネントが100行以下
   - 各フックが150行以下
   - ルートコンポーネントが70行以下
6. **品質**: 型チェック・リンター・フォーマッターがすべて通る
7. **機能**: すべての既存機能が動作する
8. **UX**:
   - ページ遷移後も検索・ソート・フィルター状態が保持される
   - レイアウトシフトが発生しない（Skeletonによる）
   - レスポンシブ対応（Sidebarによる）

## メリットの整理

### Context管理による主なメリット

1. **状態の永続化**
   - ページ遷移後も検索・ソート・フィルター状態が保持される
   - ノート詳細から戻った際、前回の検索結果やフィルター状態が維持される

2. **コードの簡素化**
   - URLパラメータの解析・更新ロジックが不要
   - `useSearchParams`、`setSearchParams`の呼び出しが削除される
   - 各ハンドラー関数が大幅に簡素化される

3. **アーキテクチャの明確化**
   - Core Architecture（DI用のAppContext）とUI状態（UIStateContext）が分離
   - 単一責任の原則に従った設計

4. **テスタビリティの向上**
   - Context単体でテスト可能
   - ルートコンポーネントはContextから状態を受け取るだけなのでテストが容易

5. **将来の拡張性**
   - 状態の永続化（localStorage等）を追加しやすい
   - 必要に応じてURLとの同期も後から追加可能

### shadcn/ui活用による主なメリット

1. **デザインの統一性**
   - shadcn/uiの標準コンポーネントを使用することで、デザインの一貫性が向上
   - カスタム実装よりもアクセシビリティが高い
   - 将来的なデザイン変更が容易（Themeingの統一）

2. **開発効率の向上**
   - カスタム実装の削減により、バグの混入リスクが低下
   - メンテナンスコストの削減
   - 新しいコンポーネント追加時の学習コストが低い

3. **UX向上**
   - **Empty**: より視覚的で分かりやすい空状態の表示
   - **Sidebar**: 折りたたみ機能、レスポンシブ対応（モバイルでDrawer）
   - **Skeleton**: レイアウトシフトの防止、ローディング状態の視覚化
   - **Field**: フォームフィールドの統一されたレイアウト、エラー表示

4. **レスポンシブ対応**
   - Sidebarコンポーネントにより、デスクトップとモバイルで最適なUIを自動提供
   - モバイルではDrawerに自動変換

5. **パフォーマンス**
   - Skeletonによるレイアウトシフト防止
   - ユーザー体験の向上（CLS: Cumulative Layout Shift の改善）

6. **将来の拡張性**
   - shadcn/uiの新しいコンポーネントを簡単に追加可能
   - コミュニティで開発されたカスタムコンポーネントの利用

## 参考資料

- [spec/pages.md](../spec/pages.md): ページ構成と詳細
- [spec/pages.list.tsv](../spec/pages.list.tsv): 実装すべきページリスト
- [docs/shadcn.txt](../docs/shadcn.txt): shadcn/uiコンポーネント一覧
- [CLAUDE.md](../CLAUDE.md): プロジェクト全体のガイドライン
- [app/lib/context.tsx](../app/lib/context.tsx): 既存のDI用Context実装

## 次のステップ

1. ✅ このリファクタリング計画をレビュー
2. 必要に応じて計画を調整
3. Step 0から順次実装開始
   - Step 0: UIStateContextの作成とテスト
   - Step 1: カスタムフックの作成
   - Step 2-4: 各ページのリファクタリング
   - Step 5-6: UI改善と型定義整理
4. 各ステップ完了後に動作確認と型チェック・リンターを実行
5. すべての検証項目をチェック

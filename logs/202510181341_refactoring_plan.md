# フロントエンドリファクタリング計画

**作成日時**: 2025-10-18 13:41
**ベースレビュー**: `logs/202510181333_review_frontend.md`
**対象**: React Router v7 SPA実装の品質改善

---

## 1. エグゼクティブサマリー

SPAコードレビュー（`202510181333_review_frontend.md`）の結果、全機能要件は満たしているものの、以下の問題が検出された：

- 🔴 **Critical**: useEffectアンチパターン（3箇所）
- 🟡 **High**: テストコードの不足
- 🟡 **Medium**: エラーハンドリングの改善余地
- 🟢 **Low**: タイポ、コメントの統一性

本ドキュメントでは、これらの問題を段階的に解決するためのリファクタリング計画を策定する。

---

## 2. 問題一覧と優先度

| ID | 問題 | 影響度 | 優先度 | 対象ファイル | 工数見積 |
|----|------|--------|--------|-------------|---------|
| RF-01 | settings.tsxのuseEffect問題 | 🔴 Critical | P0 | `app/routes/settings.tsx` | 1h |
| RF-02 | useAutoSaveのuseEffect問題 | 🔴 Critical | P0 | `app/hooks/useAutoSave.ts` | 3h |
| RF-03 | useNotesのuseEffect問題 | 🔴 Critical | P1 | `app/hooks/useNotes.ts` | 2h |
| RF-04 | TiptapEditorの最適化検討 | 🟡 Medium | P2 | `app/components/editor/TiptapEditor.tsx` | 2h |
| RF-05 | タイポ修正 | 🟢 Low | P3 | `app/context/search.tsx` | 0.5h |
| RF-06 | hooksのテスト追加 | 🟡 High | P1 | `app/hooks/**/*.ts` | 8h |
| RF-07 | エラーハンドリング改善 | 🟡 Medium | P2 | 複数ファイル | 4h |
| RF-08 | コメント統一 | 🟢 Low | P3 | 全体 | 2h |

**合計工数見積**: 約22.5時間

---

## 3. フェーズ別リファクタリング計画

### Phase 1: Critical修正（優先度P0）

**期間**: 1日
**目的**: useEffectアンチパターンの排除
**対象**: RF-01, RF-02

#### Phase 1.1: settings.tsx修正

**工数**: 1時間
**リスク**: 低

**修正内容**:
1. useEffectを削除
2. 初期値をsettingsから取得するロジックに変更
3. フォーム状態管理の見直し

#### Phase 1.2: useAutoSave修正

**工数**: 3時間
**リスク**: 中（自動保存ロジックの変更）

**修正内容**:
1. useEffectを削除
2. onChangeコールバック内で直接処理
3. refを活用した状態管理の改善
4. エッジケース処理の簡素化

---

### Phase 2: High修正（優先度P1）

**期間**: 2日
**目的**: データフェッチロジックの改善とテスト追加
**対象**: RF-03, RF-06

#### Phase 2.1: useNotes修正

**工数**: 2時間
**リスク**: 低

**修正内容**:
1. ページリセットロジックをSearchContextに移動
2. useEffectの削減

#### Phase 2.2: テスト追加

**工数**: 8時間
**リスク**: 低

**修正内容**:
1. useAutoSaveのテスト
2. useNote, useNotesのテスト
3. useSettingsのテスト
4. 検索・フィルター機能のテスト

---

### Phase 3: Medium修正（優先度P2）

**期間**: 2日
**目的**: コード品質の向上
**対象**: RF-04, RF-07

#### Phase 3.1: TiptapEditor最適化検討

**工数**: 2時間
**リスク**: 低（調査フェーズ）

**修正内容**:
1. Tiptap公式ドキュメントの確認
2. React 19互換性の確認
3. 必要に応じた最適化実施

#### Phase 3.2: エラーハンドリング改善

**工数**: 4時間
**リスク**: 低

**修正内容**:
1. エラーバウンダリの追加
2. より詳細なエラーメッセージ
3. リトライ機能の追加
4. オフライン対応の改善

---

### Phase 4: Low修正（優先度P3）

**期間**: 0.5日
**目的**: コードの可読性向上
**対象**: RF-05, RF-08

#### Phase 4.1: タイポ修正とコメント統一

**工数**: 2.5時間
**リスク**: なし

**修正内容**:
1. `ressetSort` → `resetSort`
2. コメントを英語に統一
3. JSDocの追加

---

## 4. 詳細なリファクタリング手順

### RF-01: settings.tsx修正

#### 現在の問題コード

```typescript
// ❌ 問題: useEffectで値の変更を検知
const [defaultOrder, setDefaultOrder] = useState<string>("desc");
const [defaultOrderBy, setDefaultOrderBy] = useState<string>("created");
const [autoSaveInterval, setAutoSaveInterval] = useState<string>("2000");

useEffect(() => {
  if (settings) {
    setDefaultOrder(settings.defaultOrder);
    setDefaultOrderBy(settings.defaultOrderBy);
    setAutoSaveInterval(settings.autoSaveInterval.toString());
  }
}, [settings]);
```

#### 修正後のコード（オプション1: Uncontrolled Component）

```typescript
// ✅ 修正案1: 初期値として設定
const [defaultOrder, setDefaultOrder] = useState<string>(
  settings?.defaultOrder ?? "desc"
);
const [defaultOrderBy, setDefaultOrderBy] = useState<string>(
  settings?.defaultOrderBy ?? "created"
);
const [autoSaveInterval, setAutoSaveInterval] = useState<string>(
  settings?.autoSaveInterval.toString() ?? "2000"
);

// useEffectは不要
```

**問題点**: settingsがundefinedからロードされた値に変わる際、初期値が反映されない

#### 修正後のコード（オプション2: useMemoで初期値管理）

```typescript
// ✅ 修正案2: useMemoで初期値を計算
const initialValues = useMemo(() => {
  if (!settings) {
    return {
      defaultOrder: "desc",
      defaultOrderBy: "created",
      autoSaveInterval: "2000",
    };
  }
  return {
    defaultOrder: settings.defaultOrder,
    defaultOrderBy: settings.defaultOrderBy,
    autoSaveInterval: settings.autoSaveInterval.toString(),
  };
}, [settings?.defaultOrder, settings?.defaultOrderBy, settings?.autoSaveInterval]);

const [defaultOrder, setDefaultOrder] = useState<string>(initialValues.defaultOrder);
const [defaultOrderBy, setDefaultOrderBy] = useState<string>(initialValues.defaultOrderBy);
const [autoSaveInterval, setAutoSaveInterval] = useState<string>(initialValues.autoSaveInterval);

// settingsがロードされた際にフォームをリセット
useEffect(() => {
  if (settings) {
    setDefaultOrder(settings.defaultOrder);
    setDefaultOrderBy(settings.defaultOrderBy);
    setAutoSaveInterval(settings.autoSaveInterval.toString());
  }
}, [settings]); // settingsのロード完了を検知（1回のみ）
```

**問題点**: まだuseEffectを使っている

#### 修正後のコード（オプション3: key propでリセット - 推奨）

```typescript
// ✅ 修正案3: key propを使ってコンポーネントをリセット（推奨）
function SettingsForm({ settings }: { settings: Settings }) {
  const [defaultOrder, setDefaultOrder] = useState<string>(settings.defaultOrder);
  const [defaultOrderBy, setDefaultOrderBy] = useState<string>(settings.defaultOrderBy);
  const [autoSaveInterval, setAutoSaveInterval] = useState<string>(
    settings.autoSaveInterval.toString()
  );

  // ... rest of the component
}

export default function SettingsPage() {
  const { settings, loading, /* ... */ } = useSettings();

  if (loading || !settings) {
    return <LoadingSkeleton />;
  }

  // settingsがロードされたらkeyで新しいインスタンスを作成
  return <SettingsForm key={settings.id || "default"} settings={settings} />;
}
```

#### 実装手順

1. `SettingsForm`コンポーネントを分離
2. `SettingsPage`で`key` propを使用
3. useEffectを削除
4. 動作確認

#### テストケース

```typescript
// ✅ テストケース
describe("SettingsPage", () => {
  it("should initialize form with loaded settings", async () => {
    const mockSettings = {
      defaultOrder: "asc",
      defaultOrderBy: "updated",
      autoSaveInterval: 3000,
    };

    render(<SettingsPage />);

    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByDisplayValue("asc")).toBeInTheDocument();
      expect(screen.getByDisplayValue("updated")).toBeInTheDocument();
      expect(screen.getByDisplayValue("3000")).toBeInTheDocument();
    });
  });

  it("should not lose user input when settings change", async () => {
    // Test that user edits are preserved
  });
});
```

---

### RF-02: useAutoSave修正

#### 現在の問題コード

```typescript
// ❌ 問題: contentが変更されるたびにuseEffectが実行される
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

#### 修正後のコード（推奨アプローチ）

```typescript
/**
 * Hook for managing auto-save functionality
 * Uses a debounced approach without relying on useEffect for change detection
 */
export function useAutoSave(
  content: string,
  options: UseAutoSaveOptions,
): UseAutoSaveResult {
  const { interval = 2000, onSave } = options;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef(content);
  const isSavingRef = useRef(false);

  // Save function
  const performSave = useCallback(
    async (contentToSave: string) => {
      if (isSavingRef.current) return;
      if (contentToSave === lastSavedContentRef.current) return;

      isSavingRef.current = true;
      setSaveStatus("saving");

      try {
        await onSave(contentToSave);
        lastSavedContentRef.current = contentToSave;
        setSaveStatus("saved");
      } catch (error) {
        console.error("Auto-save failed:", error);
        setSaveStatus("unsaved");
        throw error;
      } finally {
        isSavingRef.current = false;
      }
    },
    [onSave],
  );

  // Debounced save - exposed to be called from onChange
  const debouncedSave = useCallback(
    (contentToSave: string) => {
      // Skip if content hasn't changed
      if (contentToSave === lastSavedContentRef.current) {
        return;
      }

      setSaveStatus("unsaved");

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        performSave(contentToSave);
      }, interval);
    },
    [interval, performSave],
  );

  // Immediate save
  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    return performSave(content);
  }, [content, performSave]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save immediately on unmount if there are unsaved changes
      if (content !== lastSavedContentRef.current && !isSavingRef.current) {
        onSave(content).catch((error) => {
          console.error("Failed to save on unmount:", error);
        });
      }
    };
  }, [content, onSave]);

  return {
    saveStatus,
    saveNow,
    debouncedSave, // NEW: expose this to be called from onChange
  };
}
```

#### TiptapEditorでの使用方法

```typescript
// app/routes/memos.$id.tsx
function MemoEditor({ note, updateContent, ... }: MemoEditorProps) {
  const [content, setContent] = useState<string>(note.content);

  const { saveStatus, debouncedSave } = useAutoSave(content, {
    onSave: updateContent,
    interval: 2000,
  });

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      debouncedSave(newContent);
    },
    [debouncedSave],
  );

  return (
    <TiptapEditor
      content={content}
      onChange={handleContentChange}
      // ...
    />
  );
}
```

#### 実装手順

1. `useAutoSave`を新しい実装に置き換え
2. `debouncedSave`を戻り値に追加
3. `MemoEditor`で`handleContentChange`を実装
4. useEffectを削除
5. 動作確認（自動保存が正しく動作するか）

#### テストケース

```typescript
describe("useAutoSave", () => {
  it("should debounce save calls", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave("initial", { onSave, interval: 1000 })
    );

    // Call debouncedSave multiple times quickly
    act(() => {
      result.current.debouncedSave("change1");
      result.current.debouncedSave("change2");
      result.current.debouncedSave("change3");
    });

    // Should not save immediately
    expect(onSave).not.toHaveBeenCalled();

    // Wait for debounce interval
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    });

    // Should save only once with the latest content
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("change3");
  });

  it("should save immediately when saveNow is called", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave("initial", { onSave })
    );

    act(() => {
      result.current.debouncedSave("new content");
    });

    await act(async () => {
      await result.current.saveNow();
    });

    expect(onSave).toHaveBeenCalledWith("new content");
  });

  it("should handle save errors gracefully", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Save failed"));
    const { result } = renderHook(() =>
      useAutoSave("initial", { onSave, interval: 100 })
    );

    act(() => {
      result.current.debouncedSave("new content");
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(result.current.saveStatus).toBe("unsaved");
  });
});
```

---

### RF-03: useNotes修正

#### 現在の問題コード

```typescript
// ❌ 問題: フィルター条件が変わるたびにページをリセット
useEffect(() => {
  setPage(1);
}, [searchQuery, sortField, sortOrder, tagFiltersKey]);
```

#### 修正後のコード（オプション1: SearchContext拡張）

```typescript
// app/context/search.tsx
export type Search = {
  // ... existing fields

  // NEW: Add page management
  page: number;
  setPage: (page: number) => void;
  resetPage: () => void;
};

export function SearchProvider(props: { children: React.ReactNode }) {
  const [query, setQuery] = useState<string>(DEFAULT_SEARCH_QUERY);
  const [sortField, setSortField] = useState<SortField>(DEFAULT_SORT_FIELD);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT_ORDER);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    DEFAULT_SELECTED_TAG_IDS,
  );
  const [page, setPage] = useState(1);

  // Wrap setters to reset page
  const setQueryAndResetPage = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setPage(1);
  }, []);

  const setSortFieldAndResetPage = useCallback((field: SortField) => {
    setSortField(field);
    setPage(1);
  }, []);

  const setSortOrderAndResetPage = useCallback((order: SortOrder) => {
    setSortOrder(order);
    setPage(1);
  }, []);

  const toggleTagAndResetPage = useCallback((tagId: string) => {
    setSelectedTagIds((prevTagIds) =>
      prevTagIds.includes(tagId)
        ? prevTagIds.filter((id) => id !== tagId)
        : [...prevTagIds, tagId],
    );
    setPage(1);
  }, []);

  // ... rest of the implementation
}
```

#### 修正後のコード（オプション2: useSyncExternalStore - より高度）

```typescript
// app/hooks/useNotes.ts
export function useNotes(options: UseNotesOptions = {}): UseNotesResult {
  const {
    searchQuery = "",
    tagFilters = [],
    sortField = "created_at",
    sortOrder = "desc",
    pageSize = 20,
  } = options;

  const context = useDIContainer();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Compute filter key
  const filterKey = useMemo(
    () => `${searchQuery}|${sortField}|${sortOrder}|${tagFilters.join(",")}`,
    [searchQuery, sortField, sortOrder, tagFilters]
  );

  // Reset page when filter changes
  const prevFilterKeyRef = useRef(filterKey);
  if (prevFilterKeyRef.current !== filterKey) {
    prevFilterKeyRef.current = filterKey;
    if (page !== 1) {
      setPage(1); // This will be batched by React 19
    }
  }

  // Load notes
  useEffect(() => {
    // ... existing load logic
  }, [context, page, filterKey, pageSize]);

  // ... rest of the hook
}
```

**推奨**: オプション1（SearchContext拡張）の方がシンプルで理解しやすい。

#### 実装手順

1. `SearchContext`にページ管理を追加
2. 各setter関数でページをリセット
3. `useNotes`からuseEffectを削除
4. `home.tsx`で`page`を`SearchContext`から取得
5. 動作確認

#### テストケース

```typescript
describe("Search context with page management", () => {
  it("should reset page when search query changes", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    act(() => {
      result.current.setPage(3);
    });

    expect(result.current.page).toBe(3);

    act(() => {
      result.current.setQuery("new query");
    });

    expect(result.current.page).toBe(1);
  });

  it("should reset page when sort changes", () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: SearchProvider,
    });

    act(() => {
      result.current.setPage(2);
      result.current.setSortField("updated_at");
    });

    expect(result.current.page).toBe(1);
  });
});
```

---

### RF-04: TiptapEditor最適化検討

#### 調査項目

1. **Tiptap公式ドキュメントの確認**
   - React統合のベストプラクティス
   - React 19との互換性
   - useEffect使用の必要性

2. **代替アプローチの検討**
   - Controlled vs Uncontrolled component
   - `useEditor`のオプション設定

3. **パフォーマンス測定**
   - 現在の実装でのレンダリング回数
   - 最適化後のレンダリング回数

#### 調査後の判断基準

- Tiptapの仕様上useEffectが必須の場合 → 現状維持
- 代替手段がある場合 → リファクタリング実施

---

### RF-05: タイポ修正

#### 修正内容

```typescript
// app/context/search.tsx
export type Search = {
  // ...
  ressetSort: () => void; // ❌ タイポ
  resetSort: () => void;  // ✅ 修正
};
```

#### 実装手順

1. `search.tsx`の型定義を修正
2. 実装を修正
3. 使用箇所を修正（`home.tsx`など）
4. 全文検索で`resset`が残っていないか確認

---

### RF-06: テスト追加

#### テスト対象とテストケース

##### 1. useAutoSave

```typescript
// app/hooks/__tests__/useAutoSave.test.ts
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAutoSave } from "../useAutoSave";

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with saved status", () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useAutoSave("initial content", { onSave })
    );

    expect(result.current.saveStatus).toBe("saved");
  });

  it("should debounce save calls", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave("initial", { onSave, interval: 1000 })
    );

    act(() => {
      result.current.debouncedSave("change1");
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    act(() => {
      result.current.debouncedSave("change2");
    });

    expect(onSave).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith("change2");
    });
  });

  it("should save immediately when saveNow is called", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave("initial", { onSave })
    );

    await act(async () => {
      result.current.debouncedSave("new content");
      await result.current.saveNow();
    });

    expect(onSave).toHaveBeenCalledWith("new content");
    expect(result.current.saveStatus).toBe("saved");
  });

  it("should update status to unsaved when content changes", () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useAutoSave("initial", { onSave })
    );

    act(() => {
      result.current.debouncedSave("new content");
    });

    expect(result.current.saveStatus).toBe("unsaved");
  });

  it("should handle save errors", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() =>
      useAutoSave("initial", { onSave, interval: 100 })
    );

    act(() => {
      result.current.debouncedSave("new content");
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(result.current.saveStatus).toBe("unsaved");
    });
  });

  it("should not save if content is the same", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave("initial", { onSave, interval: 100 })
    );

    act(() => {
      result.current.debouncedSave("initial");
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
```

##### 2. useNotes

```typescript
// app/hooks/__tests__/useNotes.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useNotes } from "../useNotes";
import { DIContainerProvider } from "@/context/di";

const mockContext = {
  // mock context
};

describe("useNotes", () => {
  it("should load notes on mount", async () => {
    const { result } = renderHook(() => useNotes(), {
      wrapper: ({ children }) => (
        <DIContainerProvider databasePath=":memory:">
          {children}
        </DIContainerProvider>
      ),
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notes).toBeDefined();
  });

  it("should filter notes by search query", async () => {
    const { result } = renderHook(
      () => useNotes({ searchQuery: "test" }),
      {
        wrapper: ({ children }) => (
          <DIContainerProvider databasePath=":memory:">
            {children}
          </DIContainerProvider>
        ),
      }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Verify filtered results
  });

  it("should support pagination", async () => {
    const { result } = renderHook(() => useNotes({ pageSize: 10 }), {
      wrapper: ({ children }) => (
        <DIContainerProvider databasePath=":memory:">
          {children}
        </DIContainerProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.page).toBe(1);

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.page).toBe(2);
    });
  });
});
```

##### 3. useSettings

```typescript
// app/hooks/__tests__/useSettings.test.ts
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useSettings } from "../useSettings";

describe("useSettings", () => {
  it("should load settings on mount", async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: DIContainerProvider,
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.settings).toBeDefined();
    });
  });

  it("should update settings", async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: DIContainerProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateSettings({
        defaultOrder: "asc",
        autoSaveInterval: 3000,
      });
    });

    expect(result.current.settings?.defaultOrder).toBe("asc");
    expect(result.current.settings?.autoSaveInterval).toBe(3000);
  });

  it("should reset settings to defaults", async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: DIContainerProvider,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Change settings
    await act(async () => {
      await result.current.updateSettings({
        defaultOrder: "asc",
      });
    });

    // Reset
    await act(async () => {
      await result.current.resetSettings();
    });

    expect(result.current.settings?.defaultOrder).toBe("desc");
  });
});
```

#### テストカバレッジ目標

- Hooks: 80%以上
- Components: 70%以上（UIコンポーネントは除く）
- Utils: 90%以上

---

### RF-07: エラーハンドリング改善

#### 実装内容

##### 1. エラーバウンダリの追加

```typescript
// app/components/common/ErrorBoundary.tsx
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            {this.state.error.message}
          </p>
          <Button onClick={this.reset}>Try again</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

##### 2. リトライ機能の追加

```typescript
// app/lib/retry.ts
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: "linear" | "exponential";
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = "exponential" } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const waitTime =
        backoff === "exponential" ? delay * Math.pow(2, attempt - 1) : delay * attempt;

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}
```

##### 3. オフライン検出

```typescript
// app/hooks/useOnlineStatus.ts
import { useEffect, useState } from "react";

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
```

##### 4. エラーメッセージの改善

```typescript
// app/lib/error-messages.ts
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "ネットワークエラーが発生しました。インターネット接続を確認してください。",
  NOT_FOUND: "指定されたデータが見つかりませんでした。",
  VALIDATION_ERROR: "入力内容に誤りがあります。",
  SAVE_FAILED: "保存に失敗しました。もう一度お試しください。",
  DELETE_FAILED: "削除に失敗しました。もう一度お試しください。",
  EXPORT_FAILED: "エクスポートに失敗しました。もう一度お試しください。",
  UNKNOWN_ERROR: "予期しないエラーが発生しました。",
} as const;

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Map specific error types to user-friendly messages
    if (error.message.includes("network")) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    return error.message;
  }
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}
```

#### 実装手順

1. ErrorBoundaryコンポーネントを作成
2. root.tsxで全体をラップ
3. retry関数を実装
4. 各hook（useNote, useNotesなど）でretryを使用
5. useOnlineStatusを実装
6. オフライン時の警告表示
7. エラーメッセージを統一

---

### RF-08: コメント統一

#### ガイドライン

1. **言語**: 英語に統一
2. **形式**: JSDocスタイルを使用
3. **対象**:
   - 全てのpublic関数
   - 複雑なロジック
   - 型定義

#### Before/After例

```typescript
// ❌ Before
/**
 * 設定の読み込み・保存・リセットを管理するフック
 */
export function useSettings(): UseSettingsResult {
  // ...
}

// ✅ After
/**
 * Hook for managing application settings
 * Handles loading, saving, and resetting settings
 *
 * @returns Settings state and operations
 * @example
 * ```tsx
 * const { settings, updateSettings } = useSettings();
 * await updateSettings({ defaultOrder: "asc" });
 * ```
 */
export function useSettings(): UseSettingsResult {
  // ...
}
```

---

## 5. テスト計画

### 5.1 テスト環境

- **Framework**: Vitest
- **Testing Library**: @testing-library/react
- **Coverage Tool**: c8 (Vite内蔵)

### 5.2 テスト対象の優先順位

1. **P0 - Critical**: Hooks（useAutoSave, useNote, useNotes）
2. **P1 - High**: ビジネスロジック（検索、フィルタリング）
3. **P2 - Medium**: Components（NoteCard, TiptapEditor）
4. **P3 - Low**: Utils、Helpers

### 5.3 CI/CDへの統合

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## 6. リスク管理

### 6.1 潜在的リスク

| リスク | 影響度 | 確率 | 対策 |
|--------|--------|------|------|
| 自動保存機能の破損 | High | Low | RF-02実施前に十分なテスト |
| 既存機能の退行 | Medium | Medium | 各Phaseでリグレッションテスト |
| パフォーマンス低下 | Low | Low | パフォーマンステスト実施 |
| 予期しない副作用 | Medium | Low | 段階的リリース |

### 6.2 ロールバック計画

各Phaseごとに：
1. Gitブランチで作業
2. PRレビュー
3. テスト実施
4. マージ後、問題発生時はrevert

---

## 7. リリース計画

### 7.1 段階的リリース

| Phase | リリース日 | 内容 | ロールアウト |
|-------|-----------|------|------------|
| Phase 1 | Week 1 | Critical修正 | 即時 |
| Phase 2 | Week 2 | High修正 | 段階的（50% → 100%） |
| Phase 3 | Week 3 | Medium修正 | 段階的 |
| Phase 4 | Week 4 | Low修正 | 即時 |

### 7.2 モニタリング

- エラーレート
- 自動保存成功率
- ページロード時間
- ユーザーフィードバック

---

## 8. 成功基準

### 8.1 定量的指標

- ✅ useEffectアンチパターン: 0箇所
- ✅ テストカバレッジ: Hooks 80%以上
- ✅ エラーレート: 1%以下
- ✅ 自動保存成功率: 99%以上

### 8.2 定性的指標

- ✅ コードレビューでの承認
- ✅ ユーザーからの不具合報告なし
- ✅ パフォーマンス改善の確認

---

## 9. 次のステップ

1. **Phase 1開始**: settings.tsx修正（RF-01）
2. **並行作業**: テスト環境のセットアップ
3. **週次レビュー**: 進捗確認とリスク評価

---

## 10. 参考資料

- [React - You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [React - Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro)
- [Tiptap React Integration](https://tiptap.dev/installation/react)

---

**ドキュメント履歴**:
- 2025-10-18 13:41: 初版作成

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import type { SortField, SortOrder } from "@/lib/sort-utils";

// Default values
const DEFAULT_SEARCH_QUERY = "";
const DEFAULT_SORT_FIELD: SortField = "created_at";
const DEFAULT_SORT_ORDER: SortOrder = "desc";
const DEFAULT_SELECTED_TAG_IDS: string[] = [];

export interface UIState {
  // Search state
  searchQuery: string;

  // Sort state
  sortField: SortField;
  sortOrder: SortOrder;

  // Tag filter state
  selectedTagIds: string[];
}

export interface UIStateContextValue {
  state: UIState;

  // Search operations
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  // Sort operations
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;
  resetSort: () => void;

  // Tag filter operations
  toggleTag: (tagId: string) => void;
  addTag: (tagId: string) => void;
  removeTag: (tagId: string) => void;
  clearTags: () => void;
  isTagSelected: (tagId: string) => boolean;

  // Clear all filters
  clearAllFilters: () => void;
}

const UIStateContext = createContext<UIStateContextValue | undefined>(
  undefined,
);

export function UIStateProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  const [state, setState] = useState<UIState>({
    searchQuery: DEFAULT_SEARCH_QUERY,
    sortField: DEFAULT_SORT_FIELD,
    sortOrder: DEFAULT_SORT_ORDER,
    selectedTagIds: DEFAULT_SELECTED_TAG_IDS,
  });

  // Search operations
  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const clearSearch = useCallback(() => {
    setState((prev) => ({ ...prev, searchQuery: DEFAULT_SEARCH_QUERY }));
  }, []);

  // Sort operations
  const setSortField = useCallback((field: SortField) => {
    setState((prev) => ({ ...prev, sortField: field }));
  }, []);

  const setSortOrder = useCallback((order: SortOrder) => {
    setState((prev) => ({ ...prev, sortOrder: order }));
  }, []);

  const toggleSortOrder = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  }, []);

  const resetSort = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DEFAULT_SORT_ORDER,
    }));
  }, []);

  // Tag filter operations
  const toggleTag = useCallback((tagId: string) => {
    setState((prev) => {
      const isSelected = prev.selectedTagIds.includes(tagId);
      return {
        ...prev,
        selectedTagIds: isSelected
          ? prev.selectedTagIds.filter((id) => id !== tagId)
          : [...prev.selectedTagIds, tagId],
      };
    });
  }, []);

  const addTag = useCallback((tagId: string) => {
    setState((prev) => {
      if (prev.selectedTagIds.includes(tagId)) {
        return prev;
      }
      return {
        ...prev,
        selectedTagIds: [...prev.selectedTagIds, tagId],
      };
    });
  }, []);

  const removeTag = useCallback((tagId: string) => {
    setState((prev) => ({
      ...prev,
      selectedTagIds: prev.selectedTagIds.filter((id) => id !== tagId),
    }));
  }, []);

  const clearTags = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedTagIds: DEFAULT_SELECTED_TAG_IDS,
    }));
  }, []);

  const isTagSelected = useCallback(
    (tagId: string) => {
      return state.selectedTagIds.includes(tagId);
    },
    [state.selectedTagIds],
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setState({
      searchQuery: DEFAULT_SEARCH_QUERY,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DEFAULT_SORT_ORDER,
      selectedTagIds: DEFAULT_SELECTED_TAG_IDS,
    });
  }, []);

  const value: UIStateContextValue = {
    state,
    setSearchQuery,
    clearSearch,
    setSortField,
    setSortOrder,
    toggleSortOrder,
    resetSort,
    toggleTag,
    addTag,
    removeTag,
    clearTags,
    isTagSelected,
    clearAllFilters,
  };

  return (
    <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>
  );
}

export function useUIState(): UIStateContextValue {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error("useUIState must be used within a UIStateProvider");
  }
  return context;
}

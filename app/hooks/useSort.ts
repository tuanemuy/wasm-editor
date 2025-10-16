import type { SortField, SortOrder } from "@/lib/sort-utils";
import { useUIState } from "@/lib/uiStateContext";

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
  const { state, setSortField, setSortOrder, toggleSortOrder, resetSort } =
    useUIState();

  return {
    sortField: state.sortField,
    sortOrder: state.sortOrder,
    setSortField,
    setSortOrder,
    toggleSortOrder,
    resetSort,
  };
}

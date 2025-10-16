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

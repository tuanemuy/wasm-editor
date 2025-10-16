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
  const { state, toggleTag, addTag, removeTag, clearTags, isTagSelected } =
    useUIState();

  return {
    selectedTagIds: state.selectedTagIds,
    toggleTag,
    addTag,
    removeTag,
    clearTags,
    isTagSelected,
  };
}

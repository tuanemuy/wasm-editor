import { createContext, useCallback, useContext, useState } from "react";
import type { SortField, SortOrder } from "@/lib/sort-utils";

const DEFAULT_SEARCH_QUERY = "";
const DEFAULT_SORT_FIELD: SortField = "created_at";
const DEFAULT_SORT_ORDER: SortOrder = "desc";
const DEFAULT_SELECTED_TAG_IDS: string[] = [];

export type SearchParams = {
  searchQuery: string;
  tagIds: string[];
  sortField: SortField;
  sortOrder: SortOrder;
};

export type Search = {
  query: string;
  changeQuery: (query: string) => void;

  sortField: SortField;
  sortOrder: SortOrder;
  changeSortField: (field: SortField) => void;
  changeSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;
  resetSort: () => void;

  tagIds: string[];
  toggleTag: (tagId: string) => void;
  addTag: (tagId: string) => void;
  removeTag: (tagId: string) => void;
  clearTags: () => void;
  isTagSelected: (tagId: string) => boolean;

  clearAllFilters: () => void;
};

const SearchContext = createContext<Search>({} as Search);

export function SearchProvider(props: {
  onChangeParams?: (params: SearchParams) => void;
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState<string>(DEFAULT_SEARCH_QUERY);
  const [sortField, setSortField] = useState<SortField>(DEFAULT_SORT_FIELD);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT_ORDER);
  const [tagIds, setTagIds] = useState<string[]>(DEFAULT_SELECTED_TAG_IDS);

  const changeQuery = useCallback(
    (value: string) => {
      setQuery(value);
      props.onChangeParams?.({
        searchQuery: value,
        tagIds,
        sortField,
        sortOrder,
      });
    },
    [props.onChangeParams, tagIds, sortField, sortOrder],
  );

  const changeSortField = useCallback(
    (field: SortField) => {
      setSortField(field);
      props.onChangeParams?.({
        searchQuery: query,
        tagIds,
        sortField: field,
        sortOrder,
      });
    },
    [props.onChangeParams, query, tagIds, sortOrder],
  );

  const changeSortOrder = useCallback(
    (order: SortOrder) => {
      setSortOrder(order);
      props.onChangeParams?.({
        searchQuery: query,
        tagIds,
        sortField,
        sortOrder: order,
      });
    },
    [props.onChangeParams, query, tagIds, sortField],
  );

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prevOrder) => {
      const newOrder = prevOrder === "asc" ? "desc" : "asc";
      props.onChangeParams?.({
        searchQuery: query,
        tagIds,
        sortField,
        sortOrder: newOrder,
      });
      return newOrder;
    });
  }, [props.onChangeParams, query, tagIds, sortField]);

  const resetSort = useCallback(() => {
    setSortField(DEFAULT_SORT_FIELD);
    setSortOrder(DEFAULT_SORT_ORDER);
    props.onChangeParams?.({
      searchQuery: query,
      tagIds,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DEFAULT_SORT_ORDER,
    });
  }, [props.onChangeParams, query, tagIds]);

  const toggleTag = useCallback(
    (tagId: string) => {
      setTagIds((prevTagIds) => {
        const newTagIds = prevTagIds.includes(tagId)
          ? prevTagIds.filter((id) => id !== tagId)
          : [...prevTagIds, tagId];
        props.onChangeParams?.({
          searchQuery: query,
          tagIds: newTagIds,
          sortField,
          sortOrder,
        });
        return newTagIds;
      });
    },
    [props.onChangeParams, query, sortField, sortOrder],
  );

  const addTag = useCallback(
    (tagId: string) => {
      setTagIds((prevTagIds) => {
        const newTagIds = prevTagIds.includes(tagId)
          ? prevTagIds
          : [...prevTagIds, tagId];

        props.onChangeParams?.({
          searchQuery: query,
          tagIds: newTagIds,
          sortField,
          sortOrder,
        });
        return newTagIds;
      });
    },
    [props.onChangeParams, query, sortField, sortOrder],
  );

  const removeTag = useCallback(
    (tagId: string) => {
      setTagIds((prevTagIds) => {
        const newTagIds = prevTagIds.filter((id) => id !== tagId);
        props.onChangeParams?.({
          searchQuery: query,
          tagIds: newTagIds,
          sortField,
          sortOrder,
        });
        return newTagIds;
      });
    },
    [props.onChangeParams, query, sortField, sortOrder],
  );

  const clearTags = useCallback(() => {
    setTagIds([]);
    props.onChangeParams?.({
      searchQuery: query,
      tagIds: [],
      sortField,
      sortOrder,
    });
  }, [props.onChangeParams, query, sortField, sortOrder]);

  const isTagSelected = useCallback(
    (tagId: string) => tagIds.includes(tagId),
    [tagIds],
  );

  const clearAllFilters = useCallback(() => {
    setQuery(DEFAULT_SEARCH_QUERY);
    setTagIds(DEFAULT_SELECTED_TAG_IDS);
    setSortField(DEFAULT_SORT_FIELD);
    setSortOrder(DEFAULT_SORT_ORDER);
    props.onChangeParams?.({
      searchQuery: DEFAULT_SEARCH_QUERY,
      tagIds: DEFAULT_SELECTED_TAG_IDS,
      sortField: DEFAULT_SORT_FIELD,
      sortOrder: DEFAULT_SORT_ORDER,
    });
  }, [props.onChangeParams]);

  return (
    <SearchContext.Provider
      value={{
        query,
        changeQuery,
        sortField,
        sortOrder,
        changeSortField,
        changeSortOrder,
        toggleSortOrder,
        resetSort,
        tagIds,
        toggleTag,
        addTag,
        removeTag,
        clearTags,
        isTagSelected,
        clearAllFilters,
      }}
    >
      {props.children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}

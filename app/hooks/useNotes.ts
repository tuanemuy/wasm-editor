import { useCallback, useState } from "react";
import { withContainer } from "@/di";
import { combinedSearch as combinedSearchService } from "@/core/application/note/combinedSearch";
import type { Note } from "@/core/domain/note/entity";
import { createTagId } from "@/core/domain/tag/valueObject";
import { createPagination } from "@/lib/pagination";
import type { SortField, SortOrder } from "@/lib/sort-utils";
import {
  defaultNotification,
  type Notification,
} from "@/presenters/notification";
import { request } from "@/presenters/request";

const combinedSearch = withContainer(combinedSearchService);

export type SearchOptions = {
  searchQuery?: string;
  tagIds?: string[];
  sortField?: SortField;
  sortOrder?: SortOrder;
};

export type UseNotesOptions = Notification & {
  pageSize?: number;
};

export type InitialData = {
  notes: Note[];
  counts: number;
};

export interface UseNotesResult {
  notes: Note[];
  loading: boolean;
  hasMore: boolean;
  fetch: (page: number, options?: SearchOptions) => void;
  loadMore: (options?: SearchOptions) => void;
}

export function useNotes(
  { pageSize = 20, err }: UseNotesOptions = defaultNotification,
  initialData?: InitialData,
): UseNotesResult {
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState<Note[]>(initialData?.notes || []);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialData ? initialData.counts > initialData?.notes.length : false,
  );

  const fetch = useCallback(
    async (
      page: number,
      { searchQuery, tagIds, sortField, sortOrder }: SearchOptions = {},
    ) => {
      setLoading(true);

      await request(
        combinedSearch({
          query: searchQuery || "",
          tagIds: (tagIds || []).map((id) => createTagId(id)),
          pagination: createPagination(page, pageSize),
          orderBy: sortField || "created_at",
          order: sortOrder || "desc",
        }),
        {
          onSuccess: ({ items, count }) => {
            if (page === 1) {
              setNotes(items);
            } else {
              setNotes((prevNotes) => [...prevNotes, ...items]);
            }
            setHasMore(count / pageSize > page);
            setPage(page);
          },
          onError: (error) => err?.("Failed to load notes", error),
        },
      );

      setLoading(false);
    },
    [pageSize, err],
  );

  const loadMore = useCallback(
    (options?: SearchOptions) => {
      if (loading || !hasMore) return;
      fetch(page + 1, options);
    },
    [fetch, hasMore, loading, page],
  );

  return {
    notes,
    loading,
    hasMore,
    fetch,
    loadMore,
  };
}

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { combinedSearch } from "@/core/application/note/combinedSearch";
import { getNotes } from "@/core/application/note/getNotes";
import type { Note } from "@/core/domain/note/entity";
import { createTagId } from "@/core/domain/tag/valueObject";
import { useAppContext } from "@/lib/context";
import { createPagination } from "@/lib/pagination";
import type { SortField, SortOrder } from "@/lib/sort-utils";

export interface UseNotesOptions {
  searchQuery?: string;
  tagFilters?: string[];
  sortField?: SortField;
  sortOrder?: SortOrder;
  pageSize?: number;
}

export interface UseNotesResult {
  notes: Note[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  page: number;
  loadMore: () => void;
  resetPage: () => void;
}

/**
 * Hook for fetching and managing notes list
 * Supports search, filtering by tags, sorting, and pagination
 */
export function useNotes(options: UseNotesOptions = {}): UseNotesResult {
  const {
    searchQuery = "",
    tagFilters = [],
    sortField = "created_at",
    sortOrder = "desc",
    pageSize = 20,
  } = options;

  const context = useAppContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Serialize tagFilters to avoid dependency array size changes
  const tagFiltersKey = tagFilters.join(",");

  // Reset page when filters change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Using serialized tagFiltersKey to avoid array size changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortField, sortOrder, tagFiltersKey]);

  // Load notes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Using serialized tagFiltersKey to avoid array size changes
  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadNotes = async () => {
      try {
        const result =
          searchQuery || tagFilters.length > 0
            ? await combinedSearch(context, {
                query: searchQuery,
                tagIds: tagFilters.map((id) => createTagId(id)),
                pagination: createPagination(page, pageSize),
                orderBy: sortField,
                order: sortOrder,
              })
            : await getNotes(context, {
                pagination: createPagination(page, pageSize),
                orderBy: sortField,
                order: sortOrder,
              });

        if (page === 1) {
          setNotes(result.items);
        } else {
          setNotes((prev) => [...prev, ...result.items]);
        }
        setHasMore(result.items.length === pageSize);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Failed to load notes:", error);
        setError(error);
        toast.error("Failed to load notes");
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [
    context,
    page,
    searchQuery,
    sortField,
    sortOrder,
    tagFiltersKey,
    pageSize,
  ]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((p) => p + 1);
    }
  };

  const resetPage = () => {
    setPage(1);
  };

  return {
    notes,
    loading,
    error,
    hasMore,
    page,
    loadMore,
    resetPage,
  };
}

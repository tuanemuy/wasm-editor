import { EmptyState } from "@/components/common/EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Note } from "@/core/domain/note/entity";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { SortField, SortOrder } from "@/lib/sort-utils";
import { NoteCard } from "./NoteCard";
import { NoteCardSkeleton } from "./NoteCardSkeleton";

export interface NoteListProps {
  notes: Note[];
  noteTagsMap: Map<string, TagWithUsage[]>;
  loading: boolean;
  hasMore: boolean;
  hasFilters: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  page: number;
  searchQuery?: string;
  isSelectMode?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onLoadMore: () => void;
}

export function NoteList({
  notes,
  noteTagsMap,
  loading,
  hasMore,
  hasFilters,
  sortField,
  sortOrder,
  page,
  searchQuery = "",
  isSelectMode = false,
  selectedIds = [],
  onToggleSelect,
  onLoadMore,
}: NoteListProps) {
  const targetRef = useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading: loading,
  });

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4 max-w-4xl mx-auto w-full">
        {loading && page === 1 ? (
          <>
            <NoteCardSkeleton />
            <NoteCardSkeleton />
            <NoteCardSkeleton />
          </>
        ) : notes.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            {notes.map((note) => {
              const noteTags = noteTagsMap.get(note.id) || [];
              return (
                <NoteCard
                  key={note.id}
                  note={note}
                  tags={noteTags}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  searchQuery={searchQuery}
                  isSelectMode={isSelectMode}
                  isSelected={selectedIds.includes(note.id)}
                  onToggleSelect={onToggleSelect}
                />
              );
            })}
            {hasMore && (
              <div ref={targetRef} className="py-4 flex justify-center">
                <div className="text-sm text-muted-foreground">
                  {loading ? "読み込み中..." : ""}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}

import { EmptyState } from "@/components/common/EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useSearch } from "@/context/search";
import type { Note } from "@/core/domain/note/entity";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { NoteCard } from "./NoteCard";
import { NoteCardSkeleton } from "./NoteCardSkeleton";

export interface NoteListProps {
  notes: Note[];
  noteTagsMap: Map<string, TagWithUsage[]>;
  loading: boolean;
  hasMore: boolean;
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
  isSelectMode = false,
  selectedIds = [],
  onToggleSelect,
  onLoadMore,
}: NoteListProps) {
  const { query, sortField, sortOrder, tagIds } = useSearch();
  const hasFilters = !!query || tagIds.length > 0;
  const targetRef = useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading: loading,
  });

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-4 max-w-4xl mx-auto w-full">
        {loading ? (
          <NoteListSkeleton />
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
                  isSelectMode={isSelectMode}
                  isSelected={selectedIds.includes(note.id)}
                  onToggleSelect={onToggleSelect}
                />
              );
            })}
            {hasMore && (
              <div ref={targetRef} className="py-4 flex justify-center">
                <Spinner className="size-6" />
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}

export function NoteListSkeleton() {
  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto w-full">
      <NoteCardSkeleton />
      <NoteCardSkeleton />
      <NoteCardSkeleton />
    </div>
  );
}

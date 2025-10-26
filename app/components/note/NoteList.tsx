import { EmptyState } from "@/components/common/EmptyState";
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
  onLoadMore: () => void;
}

export function NoteList({
  notes,
  noteTagsMap,
  loading,
  hasMore,
  onLoadMore,
}: NoteListProps) {
  const { query, tagIds } = useSearch();
  const hasFilters = !!query || tagIds.length > 0;
  const targetRef = useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading: loading,
  });

  return (
    <div className="p-4 max-w-4xl mx-auto w-full flex flex-col gap-4">
      {loading ? (
        <NoteListSkeleton />
      ) : notes.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          {notes.map((note) => {
            const noteTags = noteTagsMap.get(note.id) || [];
            return <NoteCard key={note.id} note={note} tags={noteTags} />;
          })}
          {hasMore && (
            <div ref={targetRef} className="py-4 flex justify-center">
              <Spinner className="size-6" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function NoteListSkeleton() {
  return (
    <div className="p-4 max-w-4xl mx-auto w-full flex flex-col gap-4">
      <NoteCardSkeleton />
      <NoteCardSkeleton />
      <NoteCardSkeleton />
    </div>
  );
}

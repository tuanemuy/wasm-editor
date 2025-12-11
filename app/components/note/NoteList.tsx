import { Spinner } from "@/components/ui/spinner";
import { useSearch } from "@/context/search";
import type { Note } from "@/core/domain/note/entity";

import type { TagWithUsage } from "@/core/domain/tag/entity";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { NoteCard } from "./NoteCard";
import { NoteCardSkeleton } from "./NoteCardSkeleton";

export type NoteListProps = React.ComponentProps<"div"> & {
  notes: Note[];
  noteTagsMap: Map<string, TagWithUsage[]>;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
};

export function NoteList({
  notes,
  noteTagsMap,
  loading,
  hasMore,
  onLoadMore,
  className,
  ...props
}: NoteListProps) {
  const { query, tagIds } = useSearch();
  const hasFilters = !!query || tagIds.length > 0;
  const targetRef = useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading: loading,
  });

  return (
    <div className={cn("w-full flex flex-col gap-3", className)} {...props}>
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
    <div className="w-full flex flex-col gap-3">
      <NoteCardSkeleton />
      <NoteCardSkeleton />
      <NoteCardSkeleton />
    </div>
  );
}

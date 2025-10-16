import { useNavigate } from "react-router";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { BulkActionBar } from "@/components/note/BulkActionBar";
import { CreateNoteFAB } from "@/components/note/CreateNoteFAB";
import { NoteList } from "@/components/note/NoteList";
import { TagSidebar } from "@/components/tag/TagSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useBulkExport } from "@/hooks/useBulkExport";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import { useCreateNote } from "@/hooks/useCreateNote";
import { useNotes } from "@/hooks/useNotes";
import { useNoteTags } from "@/hooks/useNoteTags";
import { useSearch } from "@/hooks/useSearch";
import { useSort } from "@/hooks/useSort";
import { useTagFilter } from "@/hooks/useTagFilter";
import { useTags } from "@/hooks/useTags";
import { useUIState } from "@/lib/uiStateContext";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "WASM Editor - Home" },
    { name: "description", content: "Your notes, all in one place" },
  ];
}

export default function Home() {
  const navigate = useNavigate();

  // UI state from context (automatically persisted across page navigation)
  const { searchQuery, setSearchQuery } = useSearch();
  const { sortField, sortOrder, setSortField, setSortOrder } = useSort();
  const { selectedTagIds, toggleTag } = useTagFilter();
  const { clearAllFilters } = useUIState();

  // Bulk selection
  const {
    isSelectMode,
    selectedIds,
    toggleSelectMode,
    toggleSelect,
    exitSelectMode,
  } = useBulkSelect();

  // Data hooks
  const { tags } = useTags();
  const { notes, loading, hasMore, page, loadMore } = useNotes({
    searchQuery,
    tagFilters: selectedTagIds,
    sortField,
    sortOrder,
    pageSize: 20,
  });
  const { noteTagsMap } = useNoteTags(notes.map((note) => note.id));

  // Actions
  const { creating, createNote } = useCreateNote();
  const { exporting, exportNotes } = useBulkExport();

  const handleCreateNote = async () => {
    const note = await createNote();
    navigate(`/memos/${note.id}`);
  };

  const handleBulkExport = async () => {
    const selectedNotes = notes.filter((note) => selectedIds.includes(note.id));
    await exportNotes(selectedNotes);
    exitSelectMode();
  };

  const hasFilters = searchQuery || selectedTagIds.length > 0;

  return (
    <SidebarProvider>
      <TagSidebar
        tags={tags}
        selectedTagIds={selectedTagIds}
        onTagClick={toggleTag}
      />

      <SidebarInset className="flex flex-col">
        <HomeHeader
          searchQuery={searchQuery}
          sortField={sortField}
          sortOrder={sortOrder}
          tagFilters={selectedTagIds}
          tags={tags}
          isSelectMode={isSelectMode}
          onSearchChange={setSearchQuery}
          onSortFieldChange={setSortField}
          onSortOrderChange={setSortOrder}
          onClearFilters={clearAllFilters}
          onToggleSelectMode={toggleSelectMode}
        />

        <NoteList
          notes={notes}
          noteTagsMap={noteTagsMap}
          loading={loading}
          hasMore={hasMore}
          hasFilters={!!hasFilters}
          sortField={sortField}
          sortOrder={sortOrder}
          page={page}
          searchQuery={searchQuery}
          isSelectMode={isSelectMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onLoadMore={loadMore}
        />

        {isSelectMode && (
          <BulkActionBar
            selectedCount={selectedIds.length}
            exporting={exporting}
            onExport={handleBulkExport}
            onCancel={exitSelectMode}
          />
        )}

        {!isSelectMode && (
          <CreateNoteFAB creating={creating} onClick={handleCreateNote} />
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}

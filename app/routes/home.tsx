import { useNavigate } from "react-router";
import { withContainer } from "@/di";
import { combinedSearch as combinedSearchService } from "@/core/application/note/combinedSearch";
import { HomeHeader } from "@/components/layout/HomeHeader";
import { BulkActionBar } from "@/components/note/BulkActionBar";
import { CreateNoteFAB } from "@/components/note/CreateNoteFAB";
import { NoteList } from "@/components/note/NoteList";
import { TagSidebar } from "@/components/tag/TagSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useDIContainer } from "@/context/di";
import { SearchProvider } from "@/context/search";
import { useBulkExport } from "@/hooks/useBulkExport";
import { useBulkSelect } from "@/hooks/useBulkSelect";
import { useCreateNote } from "@/hooks/useCreateNote";
import { useNotes } from "@/hooks/useNotes";
import { useNoteTags } from "@/hooks/useNoteTags";
import { defaultNotification } from "@/presenters/notification";
import type { Route } from "./+types/home";

const PAGE_SIZE = 20;
const DEFAULT_SORT_FIELD = "created_at";
const DEFAULT_SORT_ORDER = "desc";

const combinedSearch = withContainer(combinedSearchService);

export function meta(_: Route.MetaArgs) {
  return [
    { title: "WASM Editor - Home" },
    { name: "description", content: "Your notes, all in one place" },
  ];
}

export async function clientLoader(_: Route.ClientLoaderArgs) {
  const notes = await combinedSearch({
    query: "",
    tagIds: [],
    pagination: { page: 1, limit: PAGE_SIZE },
    orderBy: DEFAULT_SORT_FIELD,
    order: DEFAULT_SORT_ORDER,
  });
  return notes;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();

  const {
    isSelectMode,
    selectedIds,
    toggleSelectMode,
    toggleSelect,
    exitSelectMode,
  } = useBulkSelect();

  const { notes, loading, hasMore, fetch, loadMore } = useNotes(
    {
      pageSize: PAGE_SIZE,
      ...defaultNotification,
    },
    {
      notes: loaderData.items,
      counts: loaderData.count,
    },
  );

  const { noteTagsMap } = useNoteTags(notes.map((note) => note.id));

  const { creating, createNote } = useCreateNote();
  const { exporting, exportNotes } = useBulkExport();

  const handleCreateNote = async () => {
    const note = await createNote();
    if (note) {
      navigate(`/memos/${note.id}`);
    }
  };

  const handleBulkExport = async () => {
    const selectedNotes = notes.filter((note) => selectedIds.includes(note.id));
    await exportNotes(selectedNotes);
    exitSelectMode();
  };

  return (
    <SearchProvider onChangeParams={(params) => fetch(1, params)}>
      <SidebarProvider>
        <TagSidebar />

        <SidebarInset className="flex flex-col">
          <HomeHeader
            isSelectMode={isSelectMode}
            onToggleSelectMode={toggleSelectMode}
          />

          <NoteList
            notes={notes}
            noteTagsMap={noteTagsMap}
            loading={loading}
            hasMore={hasMore}
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
    </SearchProvider>
  );
}

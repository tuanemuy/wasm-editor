import { EyeIcon, PencilIcon } from "lucide-react";
import { Suspense, use, useCallback } from "react";
import { useNavigate } from "react-router";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { MemoHeader } from "@/components/layout/MemoHeader";
import { DeleteConfirmDialog } from "@/components/note/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { getNote as getNoteService } from "@/core/application/note/getNote";
import { createNoteId } from "@/core/domain/note/valueObject";
import { withContainer } from "@/di";
import { useDialog } from "@/hooks/useDialog";
import { useNote } from "@/hooks/useNote";
import { createNotification } from "@/presenters/notification";
import type { Route } from "./+types/memos.$id";

const getNote = withContainer(getNoteService);

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Edit Note - WASM Editor" },
    { name: "description", content: "Edit your note" },
  ];
}

export async function clientLoader({ params: { id } }: Route.ClientLoaderArgs) {
  const note = await getNote({ id: createNoteId(id) });
  return note;
}

export default function MemoDetail({ params: { id } }: Route.ComponentProps) {
  const fetchNote = getNote({ id: createNoteId(id) });

  return (
    <Suspense>
      <_MemoDetail fetchNote={fetchNote} />
    </Suspense>
  );
}

export function _MemoDetail(props: { fetchNote: ReturnType<typeof getNote> }) {
  const navigate = useNavigate();
  const note = use(props.fetchNote);

  // Use extended useNote hook
  const {
    deleting,
    exporting,
    editable,
    saveStatus,
    save,
    deleteNote,
    exportNote,
    toggleEditable,
  } = useNote(note.id, createNotification());

  // Dialog state
  const deleteDialog = useDialog(false);

  // Handle note deletion with navigation
  const handleDelete = useCallback(async () => {
    await deleteNote();
    navigate("/");
  }, [deleteNote, navigate]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <MemoHeader
        content={note.content}
        saveStatus={saveStatus}
        exporting={exporting}
        onExport={exportNote}
        onDelete={deleteNote}
      />
      <div className="flex-1 overflow-hidden p-4 relative">
        <div className="h-full bg-card rounded-xl border shadow-sm">
          <TiptapEditor
            content={note.content}
            onChange={save}
            placeholder="Start writing your note..."
            editable={editable}
          />
        </div>
        {/* FAB button to toggle edit/view mode */}
        <Button
          size="lg"
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg"
          onClick={toggleEditable}
          title={editable ? "閲覧モードに切り替え" : "編集モードに切り替え"}
        >
          {editable ? (
            <EyeIcon className="h-5 w-5" />
          ) : (
            <PencilIcon className="h-5 w-5" />
          )}
        </Button>
      </div>
      <DeleteConfirmDialog
        open={deleteDialog.isOpen}
        deleting={deleting}
        onOpenChange={deleteDialog.close}
        onConfirm={handleDelete}
      />
    </div>
  );
}

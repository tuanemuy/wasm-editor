import { use, useCallback, Suspense } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { withContainer } from "@/di";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { MemoHeader } from "@/components/layout/MemoHeader";
import { DeleteConfirmDialog } from "@/components/note/DeleteConfirmDialog";
import { Spinner } from "@/components/ui/spinner";
import { useDialog } from "@/hooks/useDialog";
import { useNote } from "@/hooks/useNote";
import { createNotification } from "@/presenters/notification";
import { createNoteId } from "@/core/domain/note/valueObject";
import { getNote as getNoteService } from "@/core/application/note/getNote";
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
        isEditing={editable}
        onToggleEdit={toggleEditable}
        onExport={exportNote}
        onDelete={deleteNote}
      />
      <motion.div
        layoutId={`note-${note.id}`}
        className="flex-1 overflow-hidden"
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        <TiptapEditor
          content={note.content}
          onChange={save}
          placeholder="Start writing your note..."
          editable={editable}
        />
      </motion.div>
      <DeleteConfirmDialog
        open={deleteDialog.isOpen}
        deleting={deleting}
        onOpenChange={deleteDialog.close}
        onConfirm={handleDelete}
      />
    </div>
  );
}

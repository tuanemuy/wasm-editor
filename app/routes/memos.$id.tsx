import type { Editor } from "@tiptap/react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { BackButton } from "@/components/layout/BackButton";
import { Header } from "@/components/layout/Header";
import { Inset } from "@/components/layout/Inset";
import { DeleteConfirmDialog } from "@/components/note/DeleteConfirmDialog";
import { NoteActions } from "@/components/note/NoteActions";
import { SaveStatusIndicator } from "@/components/note/SaveStatusIndicator";
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

export default function MemoDetail({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const note = loaderData;

  // Use extended useNote hook
  const { deleting, exporting, saveStatus, save, deleteNote, exportNote } =
    useNote(note.id, createNotification());

  const [editor, setEditor] = useState<Editor | null>(null);

  // Dialog state
  const deleteDialog = useDialog(false);

  // Handle note deletion with navigation
  const handleDelete = useCallback(async () => {
    await deleteNote();
    navigate("/");
  }, [deleteNote, navigate]);

  return (
    <main className="bg-background">
      <Inset>
        <Header
          leading={<BackButton />}
          trailing={
            <div className="flex items-center gap-1">
              <SaveStatusIndicator status={saveStatus} />
              <NoteActions
                exporting={exporting}
                onExport={exportNote}
                onDelete={deleteDialog.open}
              />
            </div>
          }
          className="sticky z-2 top-0"
        >
          {editor && <EditorToolbar editor={editor} onToggleLink={() => {}} />}
        </Header>
        <TiptapEditor
          content={note.content}
          onChange={save}
          placeholder="Start writing your note..."
          onEditorReady={setEditor}
        />
        <DeleteConfirmDialog
          open={deleteDialog.isOpen}
          deleting={deleting}
          onOpenChange={deleteDialog.setOpen}
          onConfirm={handleDelete}
        />
      </Inset>
    </main>
  );
}

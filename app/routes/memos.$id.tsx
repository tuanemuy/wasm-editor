import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ClientOnly } from "@/components/ClientOnly";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { MemoHeader } from "@/components/layout/MemoHeader";
import { DeleteConfirmDialog } from "@/components/note/DeleteConfirmDialog";
import { Spinner } from "@/components/ui/spinner";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useDialog } from "@/hooks/useDialog";
import { useNote } from "@/hooks/useNote";
import type { Route } from "./+types/memos.$id";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Edit Note - WASM Editor" },
    { name: "description", content: "Edit your note" },
  ];
}

export default function MemoDetail() {
  const params = useParams();
  const navigate = useNavigate();

  // Use extended useNote hook
  const {
    note,
    loading,
    deleting,
    exporting,
    updateContent,
    deleteNote,
    exportNote,
  } = useNote(params.id);

  // Dialog state
  const deleteDialog = useDialog(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(true);

  // Auto-save with note content
  const [content, setContent] = useState(note?.content || "");

  useEffect(() => {
    if (note) {
      setContent(note.content);
    }
  }, [note]);

  const { saveStatus } = useAutoSave(content, {
    onSave: updateContent,
    interval: 2000,
  });

  const handleToggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  // Handle note deletion with navigation
  const handleDelete = useCallback(async () => {
    await deleteNote();
    navigate("/");
  }, [deleteNote, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!note) {
    navigate("/");
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <MemoHeader
        content={content}
        saveStatus={saveStatus}
        exporting={exporting}
        isEditing={isEditing}
        onToggleEdit={handleToggleEdit}
        onExport={exportNote}
        onDelete={deleteDialog.open}
      />

      <div className="flex-1 overflow-hidden">
        <ClientOnly
          fallback={
            <div className="flex items-center justify-center h-full">
              <Spinner className="h-8 w-8" />
            </div>
          }
        >
          <TiptapEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your note..."
            editable={isEditing}
          />
        </ClientOnly>
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

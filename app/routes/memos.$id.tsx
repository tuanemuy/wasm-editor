import {
  ArrowLeftIcon,
  CheckIcon,
  DownloadIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { deleteNote } from "@/core/application/note/deleteNote";
import { exportNoteAsMarkdown } from "@/core/application/note/exportNoteAsMarkdown";
import { getNote } from "@/core/application/note/getNote";
import { updateNote } from "@/core/application/note/updateNote";
import type { Note } from "@/core/domain/note/entity";
import { createNoteId } from "@/core/domain/note/valueObject";
import { useAppContext } from "@/lib/context";
import type { Route } from "./+types/memos.$id";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Edit Note - WASM Editor" },
    { name: "description", content: "Edit your note" },
  ];
}

type SaveStatus = "saved" | "saving" | "unsaved";

export default function MemoDetail() {
  const context = useAppContext();
  const navigate = useNavigate();
  const params = useParams();
  const noteId = params.id;

  // State
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Auto-save timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef(content);

  // Update content ref
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Load note
  useEffect(() => {
    if (!noteId) {
      navigate("/");
      return;
    }

    getNote(context, { id: createNoteId(noteId) })
      .then((loadedNote) => {
        setNote(loadedNote);
        setContent(loadedNote.content);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load note:", error);
        toast.error("Failed to load note");
        navigate("/");
      });
  }, [context, noteId, navigate]);

  // Save note
  const saveNote = useCallback(async () => {
    if (!note || !noteId) return;

    setSaveStatus("saving");
    try {
      await updateNote(context, {
        id: createNoteId(noteId),
        content: contentRef.current,
      });
      setSaveStatus("saved");
    } catch (error) {
      console.error("Failed to save note:", error);
      toast.error("Failed to save note");
      setSaveStatus("unsaved");
    }
  }, [context, note, noteId]);

  // Handle content change
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      setSaveStatus("unsaved");

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        saveNote();
      }, 2000);
    },
    [saveNote],
  );

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save immediately on unmount if there are unsaved changes
      if (contentRef.current !== note?.content) {
        saveNote();
      }
    };
  }, [note, saveNote]);

  // Delete note
  const handleDelete = async () => {
    if (!noteId || deleting) return;

    setDeleting(true);
    try {
      await deleteNote(context, { id: createNoteId(noteId) });
      toast.success("Note deleted");
      navigate("/");
    } catch (error) {
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete note");
      setDeleting(false);
    }
  };

  // Export note
  const handleExport = async () => {
    if (!noteId || exporting) return;

    setExporting(true);
    try {
      await exportNoteAsMarkdown(context, { id: createNoteId(noteId) });
      toast.success("Note exported");
    } catch (error) {
      console.error("Failed to export note:", error);
      toast.error("Failed to export note");
    } finally {
      setExporting(false);
    }
  };

  // Extract title from content
  const extractTitle = (noteContent: string) => {
    const firstLine = noteContent.split("\n")[0];
    const title = firstLine.replace(/^#+\s*/, "").trim();
    return title || "Untitled";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!note) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b p-4 flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        </Link>

        <h1 className="text-xl font-semibold flex-1 truncate">
          {extractTitle(content)}
        </h1>

        <div className="flex items-center gap-2">
          {/* Save status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {saveStatus === "saved" && (
              <>
                <CheckIcon className="h-4 w-4 text-green-600" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === "saving" && (
              <>
                <Spinner className="h-4 w-4" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <>
                <SaveIcon className="h-4 w-4" />
                <span>Unsaved</span>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Spinner className="h-4 w-4 mr-2" />
            ) : (
              <DownloadIcon className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2Icon className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <TiptapEditor
          content={content}
          onChange={handleContentChange}
          placeholder="Start writing your note..."
        />
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Spinner className="h-4 w-4 mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

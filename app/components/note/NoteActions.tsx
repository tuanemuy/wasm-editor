import { DownloadIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export interface NoteActionsProps {
  exporting: boolean;
  onExport: () => void;
  onDelete: () => void;
}

export function NoteActions({
  exporting,
  onExport,
  onDelete,
}: NoteActionsProps) {
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={exporting}
      >
        {exporting ? (
          <Spinner className="h-4 w-4 mr-2" />
        ) : (
          <DownloadIcon className="h-4 w-4 mr-2" />
        )}
        Export
      </Button>

      <Button variant="destructive" size="sm" onClick={onDelete}>
        <Trash2Icon className="h-4 w-4 mr-2" />
        Delete
      </Button>
    </>
  );
}

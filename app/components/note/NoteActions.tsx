import { DownloadIcon, MoreVerticalIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="More actions">
          <MoreVerticalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExport} disabled={exporting}>
          {exporting ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <DownloadIcon className="h-4 w-4" />
          )}
          Export
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2Icon className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

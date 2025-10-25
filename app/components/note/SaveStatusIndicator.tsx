import { CheckIcon, SaveIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { SaveStatus } from "@/types";

export interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {status === "saved" && (
        <>
          <CheckIcon className="h-4 w-4 text-green-600" />
          <span>Saved</span>
        </>
      )}
      {status === "saving" && (
        <>
          <Spinner className="h-4 w-4" />
          <span>Saving...</span>
        </>
      )}
      {status === "unsaved" && (
        <>
          <SaveIcon className="h-4 w-4" />
          <span>Unsaved</span>
        </>
      )}
    </div>
  );
}

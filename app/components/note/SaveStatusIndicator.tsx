import { CheckIcon, SaveIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { SaveStatus } from "@/types";

export interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  const statusText =
    status === "saved"
      ? "Saved"
      : status === "saving"
        ? "Saving..."
        : "Unsaved";

  return (
    <div className="flex items-center text-muted-foreground" title={statusText}>
      {status === "saved" && <CheckIcon className="h-4 w-4 text-green-600" />}
      {status === "saving" && <Spinner className="h-4 w-4" />}
      {status === "unsaved" && <SaveIcon className="h-4 w-4" />}
    </div>
  );
}

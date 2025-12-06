import { Check, RefreshCcw } from "lucide-react";
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
      {status === "saved" && <Check className="size-4 text-green-600" />}
      {status === "saving" && <RefreshCcw className="size-4" />}
      {status === "unsaved" && <RefreshCcw className="size-4" />}
    </div>
  );
}

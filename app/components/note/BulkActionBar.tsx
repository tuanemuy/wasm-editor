import { DownloadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BulkActionBarProps {
  selectedCount: number;
  exporting: boolean;
  onExport: () => void;
  onCancel: () => void;
}

export function BulkActionBar({
  selectedCount,
  exporting,
  onExport,
  onCancel,
}: BulkActionBarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-4 z-50">
      <span className="font-medium">{selectedCount}件選択中</span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onExport}
          disabled={exporting || selectedCount === 0}
        >
          <DownloadIcon className="h-4 w-4 mr-2" />
          {exporting ? "エクスポート中..." : "エクスポート"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <XIcon className="h-4 w-4 mr-2" />
          キャンセル
        </Button>
      </div>
    </div>
  );
}

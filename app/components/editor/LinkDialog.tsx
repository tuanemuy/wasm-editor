import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LinkDialogProps = {
  isOpen: boolean;
  initialUrl?: string;
  onConfirm: (url: string) => void;
  onCancel: () => void;
};

/**
 * Dialog component for editing links in the editor
 */
export function LinkDialog({
  isOpen,
  initialUrl = "",
  onConfirm,
  onCancel,
}: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setError(null);
    }
  }, [isOpen, initialUrl]);

  const handleConfirm = () => {
    // Empty URL means remove link
    if (url === "") {
      onConfirm("");
      return;
    }

    // Validate URL
    try {
      const parsed = new URL(url);
      // Prevent javascript: URLs for security
      if (parsed.protocol === "javascript:") {
        setError("javascript: URLs are not allowed for security reasons");
        return;
      }
      onConfirm(url);
    } catch {
      setError(
        "Invalid URL format. Please enter a valid URL (e.g., https://example.com)",
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Link</DialogTitle>
          <DialogDescription>
            Enter a URL for the link. Leave empty to remove the link.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            {url === "" ? "Remove Link" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export interface CreateNoteFABProps {
  creating: boolean;
  onClick: () => void;
}

export function CreateNoteFAB({ creating, onClick }: CreateNoteFABProps) {
  return (
    <Button
      size="icon"
      className="fixed bottom-6 right-6 size-14 rounded-full shadow-lg"
      onClick={onClick}
      disabled={creating}
    >
      {creating ? (
        <Spinner className="size-6" />
      ) : (
        <PenSquare className="size-6" />
      )}
    </Button>
  );
}

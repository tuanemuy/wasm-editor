import { PenSquare } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export interface CreateNoteFABProps {
  creating: boolean;
  onClick: () => void;
}

export function CreateNoteFAB({ creating, onClick }: CreateNoteFABProps) {
  return (
    <button
      type="button"
      className="fixed bottom-6 right-6 flex justify-center items-center size-14 rounded-full glass text-foreground"
      onClick={onClick}
      disabled={creating}
    >
      {creating ? (
        <Spinner className="size-5" />
      ) : (
        <PenSquare className="size-5" />
      )}
    </button>
  );
}

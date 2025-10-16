import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export interface LoadMoreButtonProps {
  loading: boolean;
  onClick: () => void;
}

export function LoadMoreButton({ loading, onClick }: LoadMoreButtonProps) {
  return (
    <div className="flex justify-center py-4">
      <Button variant="outline" onClick={onClick} disabled={loading}>
        {loading ? <Spinner className="h-4 w-4" /> : "Load more"}
      </Button>
    </div>
  );
}

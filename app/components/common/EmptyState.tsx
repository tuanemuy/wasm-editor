import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export interface EmptyStateProps {
  hasFilters: boolean;
}

export function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <Empty className="py-12">
      <EmptyHeader>
        <EmptyTitle>
          {hasFilters ? "No notes found" : "No notes yet"}
        </EmptyTitle>
        {!hasFilters && (
          <EmptyDescription>
            Click the + button to create your first note
          </EmptyDescription>
        )}
      </EmptyHeader>
    </Empty>
  );
}

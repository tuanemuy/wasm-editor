import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TagWithUsage } from "@/core/domain/tag/entity";

export interface FilterBadgesProps {
  searchQuery?: string;
  tagFilters: string[];
  tags: TagWithUsage[];
  onClear: () => void;
}

export function FilterBadges({
  searchQuery,
  tagFilters,
  tags,
  onClear,
}: FilterBadgesProps) {
  const hasFilters = searchQuery || tagFilters.length > 0;

  if (!hasFilters) {
    return null;
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Filters:</span>
      {searchQuery && <Badge variant="secondary">Search: {searchQuery}</Badge>}
      {tagFilters.map((tagId) => {
        const tag = tags.find((t) => t.id === tagId);
        return tag ? (
          <Badge key={tagId} variant="secondary">
            #{tag.name}
          </Badge>
        ) : null;
      })}
      <Button variant="ghost" size="sm" onClick={onClear} className="h-6 px-2">
        <XIcon className="h-3 w-3 mr-1" />
        Clear
      </Button>
    </div>
  );
}

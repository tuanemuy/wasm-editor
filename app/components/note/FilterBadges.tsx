import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/context/search";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import { cn } from "@/lib/utils";

export type FilterBadgesProps = React.ComponentProps<"div"> & {
  tags: TagWithUsage[];
};

export function FilterBadges({ tags, className, ...props }: FilterBadgesProps) {
  const { query, tagIds, clearAllFilters } = useSearch();

  const hasFilters = query || tagIds.length > 0;

  if (!hasFilters) {
    return null;
  }

  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    >
      {tagIds.map((tagId) => {
        const tag = tags.find((t) => t.id === tagId);
        return tag ? (
          <Badge key={tagId} variant="secondary">
            #{tag.name}
          </Badge>
        ) : null;
      })}
      <Button
        variant="ghost"
        size="sm"
        onClick={clearAllFilters}
        className="text-sm"
      >
        <XIcon className="size-4" />
        Clear
      </Button>
    </div>
  );
}

import { ScrollArea } from "@/components/ui/scroll-area";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import { TagItem } from "./TagItem";

export interface TagListProps {
  tags: TagWithUsage[];
  selectedTagIds: string[];
  onTagClick: (tagId: string) => void;
}

export function TagList({ tags, selectedTagIds, onTagClick }: TagListProps) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-3 py-2">No tags yet</p>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-1">
        {tags.map((tag) => (
          <TagItem
            key={tag.id}
            tag={tag}
            isSelected={selectedTagIds.includes(tag.id)}
            onClick={onTagClick}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

import { Badge } from "@/components/ui/badge";
import type { TagWithUsage } from "@/core/domain/tag/entity";

export interface TagItemProps {
  tag: TagWithUsage;
  isSelected: boolean;
  onClick: (tagId: string) => void;
}

export function TagItem({ tag, isSelected, onClick }: TagItemProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(tag.id)}
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
    >
      <div className="flex items-center justify-between">
        <span>#{tag.name}</span>
        <Badge variant="secondary" className="text-xs">
          {tag.usageCount}
        </Badge>
      </div>
    </button>
  );
}

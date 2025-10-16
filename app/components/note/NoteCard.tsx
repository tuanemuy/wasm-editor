import { Link } from "react-router";
import { HighlightedText } from "@/components/common/HighlightedText";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { Note } from "@/core/domain/note/entity";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import { formatDate } from "@/lib/date-utils";
import { extractTitle, generateNotePreview } from "@/lib/note-utils";
import type { SortField, SortOrder } from "@/lib/sort-utils";

export interface NoteCardProps {
  note: Note;
  tags: TagWithUsage[];
  sortField: SortField;
  sortOrder: SortOrder;
  searchQuery?: string;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function NoteCard({
  note,
  tags,
  sortField,
  searchQuery = "",
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
}: NoteCardProps) {
  const displayDate =
    sortField === "updated_at" ? note.updatedAt : note.createdAt;
  const title = extractTitle(note.content);
  const preview = generateNotePreview(note.content);

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectMode && onToggleSelect) {
      e.preventDefault();
      onToggleSelect(note.id);
    }
  };

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(note.id);
    }
  };

  const content = (
    <Card
      className={`hover:bg-muted/50 transition-colors ${isSelected ? "ring-2 ring-primary" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {isSelectMode && (
            <button
              type="button"
              className="flex items-start pt-1"
              onClick={handleCheckboxChange}
              aria-label={isSelected ? "選択を解除" : "選択"}
            >
              <Checkbox checked={isSelected} />
            </button>
          )}
          <div className="flex-1">
            <h3 className="font-semibold mb-2">
              <HighlightedText text={title} query={searchQuery} />
            </h3>
            <div className="relative mb-3">
              <p className="text-sm text-muted-foreground line-clamp-3">
                <HighlightedText text={preview} query={searchQuery} />
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {tags.map((tag) => (
                  <Badge key={tag.id} variant="outline" className="text-xs">
                    #{tag.name}
                  </Badge>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(displayDate)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isSelectMode) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="cursor-pointer w-full text-left"
      >
        {content}
      </button>
    );
  }

  return <Link to={`/memos/${note.id}`}>{content}</Link>;
}

import DOMPurify from "dompurify";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { useSearch } from "@/context/search";
import type { Note } from "@/core/domain/note/entity";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import { formatDate } from "@/presenters/date";
import { generateNoteHTML, highlightHTMLContent } from "@/presenters/note";

export interface NoteCardProps {
  note: Note;
  tags: TagWithUsage[];
}

export function NoteCard({ note, tags }: NoteCardProps) {
  const { query, sortField } = useSearch();
  const displayDate =
    sortField === "updated_at" ? note.updatedAt : note.createdAt;
  const html = generateNoteHTML(note.content);
  const highlightedHtml = highlightHTMLContent(html, query);

  return (
    <Link to={`/memos/${note.id}`} viewTransition>
      <div className="group p-4 lg:p-6 bg-background rounded-xl hover:bg-white transition-colors">
        <div className="relative">
          <div
            className="article max-h-[32rem] overflow-hidden"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(highlightedHtml),
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-16 max-h-full bg-gradient-to-t from-background group-hover:from-white to-transparent transition-colors pointer-events-none" />
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="default"
                className="text-primary-foreground"
              >
                #{tag.name}
              </Badge>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          {formatDate(displayDate)}
        </p>
      </div>
    </Link>
  );
}

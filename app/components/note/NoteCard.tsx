import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSearch } from "@/context/search";
import type { Note } from "@/core/domain/note/entity";
import type { TagWithUsage } from "@/core/domain/tag/entity";
import { formatDate } from "@/presenters/date";
import { generateNoteHTML } from "@/presenters/note";

export interface NoteCardProps {
  note: Note;
  tags: TagWithUsage[];
}

export function NoteCard({ note, tags }: NoteCardProps) {
  const { sortField } = useSearch();
  const displayDate =
    sortField === "updated_at" ? note.updatedAt : note.createdAt;
  const html = generateNoteHTML(note.content);

  return (
    <Link to={`/memos/${note.id}`} viewTransition>
      <Card className="group py-6 hover:bg-muted transition-colors">
        <CardContent className="px-4">
          <div className="relative">
            <div
              className="article article__preview max-h-[50dvh] overflow-hidden"
              dangerouslySetInnerHTML={{ __html: html }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card group-hover:from-muted to-transparent transition-colors pointer-events-none" />
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-s">
                  #{tag.name}
                </Badge>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            {formatDate(displayDate)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

import type { NoteId } from "@/core/domain/note/valueObject";
import {
  createRevisionContent,
  generateRevisionId,
  nowTimestamp,
  type RevisionContent,
  type RevisionId,
  type Timestamp,
} from "./valueObject";

export type Revision = Readonly<{
  id: RevisionId;
  noteId: NoteId;
  content: RevisionContent;
  createdAt: Timestamp;
}>;

export type CreateRevisionParams = {
  noteId: NoteId;
  content: string;
};

export function createRevision(params: CreateRevisionParams): Revision {
  return {
    id: generateRevisionId(),
    noteId: params.noteId,
    content: createRevisionContent(params.content),
    createdAt: nowTimestamp(),
  };
}

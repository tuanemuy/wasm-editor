import type { Tag } from "@/core/domain/tag/entity";
import {
  createNoteBody,
  generateNoteId,
  type NoteBody,
  type NoteId,
  nowTimestamp,
  type Timestamp,
} from "./valueObject";

export type Note = Readonly<{
  id: NoteId;
  body: NoteBody;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tags: Tag[];
}>;

export type CreateNoteParams = {
  body?: string;
};

export function createNote(params: CreateNoteParams): Note {
  const now = nowTimestamp();
  return {
    id: generateNoteId(),
    body: createNoteBody(params.body || ""),
    createdAt: now,
    updatedAt: now,
    tags: [],
  };
}

export type UpdateNoteBodyParams = {
  body: string;
  tags: Tag[];
};

export function updateNoteBody(note: Note, params: UpdateNoteBodyParams): Note {
  return {
    ...note,
    body: createNoteBody(params.body),
    updatedAt: nowTimestamp(),
    tags: params.tags,
  };
}

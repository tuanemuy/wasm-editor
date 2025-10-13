import type { ImageRepository } from "@/core/domain/image/ports/imageRepository";
import type { NoteRepository } from "@/core/domain/note/ports/noteRepository";
import type { RevisionRepository } from "@/core/domain/revision/ports/revisionRepository";
import type { SettingsRepository } from "@/core/domain/settings/ports/settingsRepository";
import type { NoteTagRelationRepository } from "@/core/domain/tag/ports/noteTagRelationRepository";
import type { TagRepository } from "@/core/domain/tag/ports/tagRepository";

export type Repositories = {
  noteRepository: NoteRepository;
  tagRepository: TagRepository;
  noteTagRelationRepository: NoteTagRelationRepository;
  revisionRepository: RevisionRepository;
  imageRepository: ImageRepository;
  settingsRepository: SettingsRepository;
};

export interface UnitOfWorkProvider {
  run<T>(fn: (repositories: Repositories) => Promise<T>): Promise<T>;
}

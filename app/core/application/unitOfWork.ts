import type { AssetRepository } from "@/core/domain/asset/ports/assetRepository";
import type { NoteRepository } from "@/core/domain/note/ports/noteRepository";
import type { TagRepository } from "@/core/domain/note/ports/tagRepository";
import type { RevisionRepository } from "@/core/domain/revision/ports/revisionRepository";
import type { SettingsRepository } from "@/core/domain/settings/ports/settingsRepository";

export type Repositories = {
  noteRepository: NoteRepository;
  tagRepository: TagRepository;
  revisionRepository: RevisionRepository;
  assetRepository: AssetRepository;
  settingsRepository: SettingsRepository;
};

export interface UnitOfWorkProvider {
  run<T>(fn: (repositories: Repositories) => Promise<T>): Promise<T>;
}

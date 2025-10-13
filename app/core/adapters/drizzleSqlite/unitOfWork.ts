import type {
  Repositories,
  UnitOfWorkProvider,
} from "@/core/application/unitOfWork";
import type { Database, Transaction } from "./client";
import { DrizzleSqliteImageRepository } from "./imageRepository";
import { DrizzleSqliteNoteRepository } from "./noteRepository";
import { DrizzleSqliteNoteTagRelationRepository } from "./noteTagRelationRepository";
import { DrizzleSqliteRevisionRepository } from "./revisionRepository";
import { DrizzleSqliteSettingsRepository } from "./settingsRepository";
import { DrizzleSqliteTagRepository } from "./tagRepository";

export class DrizzleSqliteUnitOfWorkProvider implements UnitOfWorkProvider {
  constructor(private readonly db: Database) {}

  async run<T>(fn: (repositories: Repositories) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx: Transaction) => {
      const repositories: Repositories = {
        noteRepository: new DrizzleSqliteNoteRepository(tx),
        tagRepository: new DrizzleSqliteTagRepository(tx),
        noteTagRelationRepository: new DrizzleSqliteNoteTagRelationRepository(
          tx,
        ),
        revisionRepository: new DrizzleSqliteRevisionRepository(tx),
        imageRepository: new DrizzleSqliteImageRepository(tx),
        settingsRepository: new DrizzleSqliteSettingsRepository(tx),
      };

      return fn(repositories);
    });
  }
}

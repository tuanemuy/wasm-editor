import type {
  UnitOfWorkProvider,
  Repositories,
} from "@/core/application/unitOfWork";
import { DrizzleSqliteAssetRepository } from "./assetRepository";
import { DrizzleSqliteNoteRepository } from "./noteRepository";
import { DrizzleSqliteTagRepository } from "./tagRepository";
import { DrizzleSqliteRevisionRepository } from "./revisionRepository";
import { DrizzleSqliteSettingsRepository } from "./settingsRepository";
import type { Database, Transaction } from "./client";

export class DrizzleSqliteUnitOfWorkProvider implements UnitOfWorkProvider {
  constructor(private readonly db: Database) {}

  async run<T>(fn: (repositories: Repositories) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx: Transaction) => {
      const repositories: Repositories = {
        assetRepository: new DrizzleSqliteAssetRepository(tx),
        noteRepository: new DrizzleSqliteNoteRepository(tx),
        tagRepository: new DrizzleSqliteTagRepository(tx),
        revisionRepository: new DrizzleSqliteRevisionRepository(tx),
        settingsRepository: new DrizzleSqliteSettingsRepository(tx),
      };
      return fn(repositories);
    });
  }
}

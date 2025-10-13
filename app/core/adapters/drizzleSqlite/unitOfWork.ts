import type {
  Repositories,
  UnitOfWorkProvider,
} from "@/core/application/unitOfWork";
import type { Database, Transaction } from "./client";
import { DrizzleSqliteNoteRepository } from "./noteRepository";
import { DrizzleSqliteTagRepository } from "./tagRepository";

export class DrizzleSqliteUnitOfWorkProvider implements UnitOfWorkProvider {
  constructor(private readonly db: Database) {}

  async run<T>(fn: (repositories: Repositories) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx: Transaction) => {
      const repositories: Repositories = {
        noteRepository: new DrizzleSqliteNoteRepository(tx),
        tagRepository: new DrizzleSqliteTagRepository(tx),
      };

      return fn(repositories);
    });
  }
}

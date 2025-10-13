import type {
  Repositories,
  UnitOfWorkProvider,
} from "@/core/application/unitOfWork";
import type { Database, Transaction } from "./client";
// import { DrizzleSqlite${Entity}Repository } from "./${entity}Repository";

export class DrizzleSqliteUnitOfWorkProvider implements UnitOfWorkProvider {
  constructor(private readonly db: Database) {}

  async run<T>(fn: (repositories: Repositories) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx: Transaction) => {
      const repositories: Repositories = {
        // ${entity}Repository: new DrizzleSqlite${Entity}Repository(tx),
      };

      return fn(repositories);
    });
  }
}

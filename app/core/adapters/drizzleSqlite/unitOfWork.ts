import type {
  Repositories,
  UnitOfWorkProvider,
} from "@/core/application/unitOfWork";
import type { Database, Transaction } from "./client";

export class DrizzleSqliteUnitOfWorkProvider implements UnitOfWorkProvider {
  constructor(private readonly db: Database) {}

  async run<T>(fn: (repositories: Repositories) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx: Transaction) => {
      const repositories: Repositories = {
        // Initialize your repositories here, passing `tx` as the executor
      };
      return fn(repositories);
    });
  }
}

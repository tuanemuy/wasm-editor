/**
 * Turso WASM Unit of Work Provider
 *
 * Provides repository access for database operations.
 *
 * Note: Transaction management is not implemented due to complexity with Turso WASM.
 * Each repository operation is auto-committed.
 */

import type {
  Repositories,
  UnitOfWorkProvider,
} from "@/core/application/unitOfWork";
import type { Database } from "./client";
import { TursoWasmNoteRepository } from "./noteRepository";
import { TursoWasmTagRepository } from "./tagRepository";

export class TursoWasmUnitOfWorkProvider implements UnitOfWorkProvider {
  constructor(private readonly db: Database) {}

  async run<T>(fn: (repositories: Repositories) => Promise<T>): Promise<T> {
    // Create repositories with the database connection
    const repositories: Repositories = {
      noteRepository: new TursoWasmNoteRepository(this.db),
      tagRepository: new TursoWasmTagRepository(this.db),
    };

    // Execute the function without transaction management
    return fn(repositories);
  }
}

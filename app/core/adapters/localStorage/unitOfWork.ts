/**
 * LocalStorage Unit of Work Provider
 *
 * Provides repository access for localStorage operations.
 *
 * Note: Transaction management is not implemented for localStorage.
 * Each repository operation is immediately persisted.
 */

import type {
  Repositories,
  UnitOfWorkProvider,
} from "@/core/application/unitOfWork";
import { LocalStorageNoteRepository } from "./noteRepository";
import { LocalStorageTagRepository } from "./tagRepository";

export class LocalStorageUnitOfWorkProvider implements UnitOfWorkProvider {
  async run<T>(fn: (repositories: Repositories) => Promise<T>): Promise<T> {
    // Create repositories
    const repositories: Repositories = {
      noteRepository: new LocalStorageNoteRepository(),
      tagRepository: new LocalStorageTagRepository(),
    };

    // Execute the function without transaction management
    return fn(repositories);
  }
}

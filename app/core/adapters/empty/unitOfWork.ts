/**
 * Empty Unit of Work Provider
 *
 * Stub implementation for testing purposes.
 * Use vi.spyOn to mock methods in tests.
 */
import type {
  Repositories,
  UnitOfWorkProvider,
} from "@/core/application/unitOfWork";
import { EmptyNoteRepository } from "./noteRepository";
import { EmptyTagRepository } from "./tagRepository";

export class EmptyUnitOfWorkProvider implements UnitOfWorkProvider {
  private repositories: Repositories = {
    noteRepository: new EmptyNoteRepository(),
    tagRepository: new EmptyTagRepository(),
  };

  async run<T>(fn: (repositories: Repositories) => Promise<T>): Promise<T> {
    return fn(this.repositories);
  }

  getRepositories(): Repositories {
    return this.repositories;
  }
}

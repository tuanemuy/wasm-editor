import type { Result } from "neverthrow";
import type { RepositoryError } from "@/core/error/adapter";
import type { Note } from "../entity";
import type { NoteId, SortBy, TagName } from "../valueObject";

/**
 * Pagination parameters
 */
export type Pagination = {
  page: number;
  limit: number;
};

/**
 * Note repository interface
 */
export interface NoteRepository {
  /**
   * Create a new note
   */
  create(note: Note): Promise<Result<Note, RepositoryError>>;

  /**
   * Find a note by ID
   */
  findById(id: NoteId): Promise<Result<Note | null, RepositoryError>>;

  /**
   * Find all notes with pagination and sorting
   */
  findAll(
    pagination: Pagination,
    sortBy: SortBy,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>>;

  /**
   * Update a note
   */
  update(note: Note): Promise<Result<Note, RepositoryError>>;

  /**
   * Delete a note by ID
   */
  delete(id: NoteId): Promise<Result<void, RepositoryError>>;

  /**
   * Search notes by full-text query
   */
  search(
    query: string,
    pagination: Pagination,
    sortBy: SortBy,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>>;

  /**
   * Find notes by tags (AND search)
   */
  findByTags(
    tags: TagName[],
    pagination: Pagination,
    sortBy: SortBy,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>>;

  /**
   * Combined search: full-text search + tag filtering
   */
  combinedSearch(
    query: string,
    tags: TagName[],
    pagination: Pagination,
    sortBy: SortBy,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>>;
}

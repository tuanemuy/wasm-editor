/**
 * Note Domain - Repository Port
 *
 * Defines the interface for Note aggregate persistence.
 * Responsible for basic CRUD operations and simple queries on Note entities.
 */
import type { Pagination, PaginationResult } from "@/lib/pagination";
import type { Note } from "../entity";
import type { NoteId, OrderBy, SortOrder } from "../valueObject";

export interface NoteRepository {
  /**
   * Save a note (create or update)
   *
   * @param note - Note entity to save
   * @throws {SystemError} If save operation fails
   */
  save(note: Note): Promise<void>;

  /**
   * Find a note by ID
   *
   * @param id - Note ID
   * @returns Note entity
   * @throws {NotFoundError} If note is not found
   * @throws {SystemError} If find operation fails
   */
  findById(id: NoteId): Promise<Note>;

  /**
   * Find all notes with pagination and sorting
   *
   * @param params - Query parameters
   * @returns Paginated note list
   * @throws {SystemError} If find operation fails
   */
  findAll(params: {
    pagination: Pagination;
    order: SortOrder;
    orderBy: OrderBy;
  }): Promise<PaginationResult<Note>>;

  /**
   * Delete a note
   *
   * @param id - Note ID
   * @throws {NotFoundError} If note is not found
   * @throws {SystemError} If delete operation fails
   */
  delete(id: NoteId): Promise<void>;

  /**
   * Check if a note exists
   *
   * @param id - Note ID
   * @returns True if note exists, false otherwise
   * @throws {SystemError} If check operation fails
   */
  exists(id: NoteId): Promise<boolean>;
}

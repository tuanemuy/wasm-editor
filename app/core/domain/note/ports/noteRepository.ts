import type { Note } from "../entity";
import type {
  NoteId,
  PaginationParams,
  SearchQuery,
  SortOrder,
} from "../valueObject";

export interface NoteRepository {
  /**
   * Create a note
   * @throws {SystemError} DB save error
   */
  create(note: Note): Promise<Note>;

  /**
   * Update a note
   * @throws {SystemError} DB save error
   */
  update(note: Note): Promise<Note>;

  /**
   * Delete a note
   * @throws {SystemError} DB delete error
   */
  delete(id: NoteId): Promise<void>;

  /**
   * Find a note by ID
   * @throws {SystemError} DB fetch error
   */
  findById(id: NoteId): Promise<Note | null>;

  /**
   * Find all notes with pagination
   * @throws {SystemError} DB fetch error
   */
  findAll(params: {
    sortOrder: SortOrder;
    pagination: PaginationParams;
  }): Promise<Note[]>;

  /**
   * Count total notes
   * @throws {SystemError} DB fetch error
   */
  count(): Promise<number>;

  /**
   * Search notes by full-text query
   * @throws {SystemError} DB search error
   */
  search(
    query: SearchQuery,
    params: {
      sortOrder: SortOrder;
      pagination: PaginationParams;
    },
  ): Promise<Note[]>;

  /**
   * Find notes by tags (AND search)
   * @throws {SystemError} DB search error
   */
  findByTags(
    tagNames: string[],
    params: {
      sortOrder: SortOrder;
      pagination: PaginationParams;
    },
  ): Promise<Note[]>;

  /**
   * Search notes with full-text query and tags
   * @throws {SystemError} DB search error
   */
  searchWithTags(
    query: SearchQuery,
    tagNames: string[],
    params: {
      sortOrder: SortOrder;
      pagination: PaginationParams;
    },
  ): Promise<Note[]>;
}

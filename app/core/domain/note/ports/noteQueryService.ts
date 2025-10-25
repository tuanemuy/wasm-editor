/**
 * Note Domain - Query Service Port
 *
 * Defines the interface for complex read-only queries on Notes.
 * Handles queries that span multiple entities (e.g., JOIN with tags).
 */

import type { TagId } from "@/core/domain/tag/valueObject";
import type { Pagination, PaginationResult } from "@/lib/pagination";
import type { Note } from "../entity";
import type { NoteId, OrderBy, SortOrder } from "../valueObject";

export interface NoteQueryService {
  /**
   * Combined search with full-text and tag filtering
   *
   * @param params - Search parameters
   * @param params.query - Search query (empty string = no full-text search)
   * @param params.tagIds - Tag IDs to filter by (empty array = no tag filtering)
   * @param params.pagination - Pagination settings
   * @param params.order - Sort order (asc/desc)
   * @param params.orderBy - Sort field (created_at/updated_at)
   *
   * @returns Paginated search results
   *
   * @description
   * - If both query and tagIds are specified: AND search
   * - If only query is specified: full-text search only
   * - If only tagIds are specified: tag search only
   * - If both are empty: returns all notes (equivalent to findAll)
   * - Tag search is implemented using JOIN on noteTagRelations table
   * - Multiple tagIds are combined with AND logic (all tags must match)
   *
   * @throws {SystemError} If search operation fails
   */
  combinedSearch(params: {
    query: string;
    tagIds: TagId[];
    pagination: Pagination;
    order: SortOrder;
    orderBy: OrderBy;
  }): Promise<PaginationResult<Note>>;

  /**
   * Find note IDs associated with a tag
   *
   * @param tagId - Tag ID
   * @returns List of note IDs
   *
   * @description
   * Retrieves note IDs by JOINing with noteTagRelations table
   *
   * @throws {SystemError} If find operation fails
   */
  findNoteIdsByTagId(tagId: TagId): Promise<NoteId[]>;

  /**
   * Find note IDs associated with multiple tags (AND search)
   *
   * @param tagIds - List of tag IDs
   * @returns List of note IDs that have all specified tags
   *
   * @description
   * - Returns only notes that have ALL specified tags (AND search)
   * - Implemented using JOIN on noteTagRelations table
   *
   * @throws {SystemError} If find operation fails
   */
  findNoteIdsByTagIds(tagIds: TagId[]): Promise<NoteId[]>;
}

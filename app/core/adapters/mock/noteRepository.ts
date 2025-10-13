import { err, ok, type Result } from "neverthrow";
import type { Note } from "@/core/domain/note/entity";
import type {
  NoteRepository,
  Pagination,
} from "@/core/domain/note/ports/noteRepository";
import type { NoteId, SortBy, TagName } from "@/core/domain/note/valueObject";
import { RepositoryError } from "@/core/error/adapter";

/**
 * Mock note repository for testing
 */
export class MockNoteRepository implements NoteRepository {
  private notes: Map<NoteId, Note> = new Map();
  private shouldFailCreate = false;
  private shouldFailFindById = false;
  private shouldFailFindAll = false;
  private shouldFailUpdate = false;
  private shouldFailDelete = false;
  private shouldFailSearch = false;
  private shouldFailFindByTags = false;
  private shouldFailCombinedSearch = false;

  constructor(initialNotes?: Note[]) {
    if (initialNotes) {
      for (const note of initialNotes) {
        this.notes.set(note.id, note);
      }
    }
  }

  /**
   * Set whether create should fail
   */
  setShouldFailCreate(shouldFail: boolean): void {
    this.shouldFailCreate = shouldFail;
  }

  /**
   * Set whether findById should fail
   */
  setShouldFailFindById(shouldFail: boolean): void {
    this.shouldFailFindById = shouldFail;
  }

  /**
   * Set whether findAll should fail
   */
  setShouldFailFindAll(shouldFail: boolean): void {
    this.shouldFailFindAll = shouldFail;
  }

  /**
   * Set whether update should fail
   */
  setShouldFailUpdate(shouldFail: boolean): void {
    this.shouldFailUpdate = shouldFail;
  }

  /**
   * Set whether delete should fail
   */
  setShouldFailDelete(shouldFail: boolean): void {
    this.shouldFailDelete = shouldFail;
  }

  /**
   * Set whether search should fail
   */
  setShouldFailSearch(shouldFail: boolean): void {
    this.shouldFailSearch = shouldFail;
  }

  /**
   * Set whether findByTags should fail
   */
  setShouldFailFindByTags(shouldFail: boolean): void {
    this.shouldFailFindByTags = shouldFail;
  }

  /**
   * Set whether combinedSearch should fail
   */
  setShouldFailCombinedSearch(shouldFail: boolean): void {
    this.shouldFailCombinedSearch = shouldFail;
  }

  /**
   * Create a new note
   */
  async create(note: Note): Promise<Result<Note, RepositoryError>> {
    if (this.shouldFailCreate) {
      return err(new RepositoryError("Mock repository error"));
    }

    this.notes.set(note.id, note);
    return ok(note);
  }

  /**
   * Find a note by ID
   */
  async findById(id: NoteId): Promise<Result<Note | null, RepositoryError>> {
    if (this.shouldFailFindById) {
      return err(new RepositoryError("Mock repository error"));
    }

    const note = this.notes.get(id);
    return ok(note ?? null);
  }

  /**
   * Find all notes with pagination and sorting
   */
  async findAll(
    pagination: Pagination,
    sortBy: SortBy,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>> {
    if (this.shouldFailFindAll) {
      return err(new RepositoryError("Mock repository error"));
    }

    let allNotes = Array.from(this.notes.values());

    // Sort
    allNotes = this.sortNotes(allNotes, sortBy);

    // Paginate
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    const items = allNotes.slice(start, end);

    return ok({ items, count: allNotes.length });
  }

  /**
   * Update a note
   */
  async update(note: Note): Promise<Result<Note, RepositoryError>> {
    if (this.shouldFailUpdate) {
      return err(new RepositoryError("Mock repository error"));
    }

    this.notes.set(note.id, note);
    return ok(note);
  }

  /**
   * Delete a note by ID
   */
  async delete(id: NoteId): Promise<Result<void, RepositoryError>> {
    if (this.shouldFailDelete) {
      return err(new RepositoryError("Mock repository error"));
    }

    this.notes.delete(id);
    return ok(undefined);
  }

  /**
   * Search notes by full-text query
   */
  async search(
    query: string,
    pagination: Pagination,
    sortBy: SortBy,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>> {
    if (this.shouldFailSearch) {
      return err(new RepositoryError("Mock repository error"));
    }

    let allNotes = Array.from(this.notes.values());

    // Filter by query (simple content search)
    if (query) {
      allNotes = allNotes.filter((note) =>
        note.content.toLowerCase().includes(query.toLowerCase()),
      );
    }

    // Sort
    allNotes = this.sortNotes(allNotes, sortBy);

    // Paginate
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    const items = allNotes.slice(start, end);

    return ok({ items, count: allNotes.length });
  }

  /**
   * Find notes by tags (AND search)
   */
  async findByTags(
    tags: TagName[],
    pagination: Pagination,
    sortBy: SortBy,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>> {
    if (this.shouldFailFindByTags) {
      return err(new RepositoryError("Mock repository error"));
    }

    let allNotes = Array.from(this.notes.values());

    // Filter by tags (AND search - note must have all tags)
    if (tags.length > 0) {
      allNotes = allNotes.filter((note) =>
        tags.every((tag) => note.tags.includes(tag)),
      );
    }

    // Sort
    allNotes = this.sortNotes(allNotes, sortBy);

    // Paginate
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    const items = allNotes.slice(start, end);

    return ok({ items, count: allNotes.length });
  }

  /**
   * Combined search: full-text search + tag filtering
   */
  async combinedSearch(
    query: string,
    tags: TagName[],
    pagination: Pagination,
    sortBy: SortBy,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>> {
    if (this.shouldFailCombinedSearch) {
      return err(new RepositoryError("Mock repository error"));
    }

    let allNotes = Array.from(this.notes.values());

    // Filter by query
    if (query) {
      allNotes = allNotes.filter((note) =>
        note.content.toLowerCase().includes(query.toLowerCase()),
      );
    }

    // Filter by tags
    if (tags.length > 0) {
      allNotes = allNotes.filter((note) =>
        tags.every((tag) => note.tags.includes(tag)),
      );
    }

    // Sort
    allNotes = this.sortNotes(allNotes, sortBy);

    // Paginate
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    const items = allNotes.slice(start, end);

    return ok({ items, count: allNotes.length });
  }

  /**
   * Sort notes by the specified order
   */
  private sortNotes(notes: Note[], sortBy: SortBy): Note[] {
    return notes.sort((a, b) => {
      switch (sortBy) {
        case "created_asc":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "created_desc":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "updated_asc":
          return a.updatedAt.getTime() - b.updatedAt.getTime();
        case "updated_desc":
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        default:
          return 0;
      }
    });
  }

  /**
   * Reset the repository state
   */
  reset(): void {
    this.notes.clear();
    this.shouldFailCreate = false;
    this.shouldFailFindById = false;
    this.shouldFailFindAll = false;
    this.shouldFailUpdate = false;
    this.shouldFailDelete = false;
    this.shouldFailSearch = false;
    this.shouldFailFindByTags = false;
    this.shouldFailCombinedSearch = false;
  }
}

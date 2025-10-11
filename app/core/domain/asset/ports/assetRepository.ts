import type { Result } from "neverthrow";
import type { RepositoryError } from "@/core/error/adapter";
import type { Asset } from "../entity";
import type { AssetId, NoteId } from "../valueObject";

/**
 * Asset repository interface
 */
export interface AssetRepository {
  /**
   * Create a new asset
   */
  create(asset: Asset): Promise<Result<Asset, RepositoryError>>;

  /**
   * Find an asset by ID
   */
  findById(id: AssetId): Promise<Result<Asset | null, RepositoryError>>;

  /**
   * Find all assets for a note
   */
  findByNoteId(noteId: NoteId): Promise<Result<Asset[], RepositoryError>>;

  /**
   * Delete an asset by ID
   */
  delete(id: AssetId): Promise<Result<void, RepositoryError>>;

  /**
   * Delete all assets for a note
   */
  deleteByNoteId(noteId: NoteId): Promise<Result<void, RepositoryError>>;
}

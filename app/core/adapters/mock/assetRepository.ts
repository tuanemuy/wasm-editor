import { err, ok, type Result } from "neverthrow";
import type { Asset } from "@/core/domain/asset/entity";
import type { AssetRepository } from "@/core/domain/asset/ports/assetRepository";
import type { AssetId, NoteId } from "@/core/domain/asset/valueObject";
import { RepositoryError } from "@/core/error/adapter";

/**
 * Mock asset repository for testing
 */
export class MockAssetRepository implements AssetRepository {
  private assets: Map<AssetId, Asset> = new Map();
  private shouldFailCreate = false;
  private shouldFailFindById = false;
  private shouldFailFindByNoteId = false;
  private shouldFailDelete = false;
  private shouldFailDeleteByNoteId = false;

  constructor(initialAssets?: Asset[]) {
    if (initialAssets) {
      for (const asset of initialAssets) {
        this.assets.set(asset.id, asset);
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
   * Set whether findByNoteId should fail
   */
  setShouldFailFindByNoteId(shouldFail: boolean): void {
    this.shouldFailFindByNoteId = shouldFail;
  }

  /**
   * Set whether delete should fail
   */
  setShouldFailDelete(shouldFail: boolean): void {
    this.shouldFailDelete = shouldFail;
  }

  /**
   * Set whether deleteByNoteId should fail
   */
  setShouldFailDeleteByNoteId(shouldFail: boolean): void {
    this.shouldFailDeleteByNoteId = shouldFail;
  }

  /**
   * Create a new asset
   */
  async create(asset: Asset): Promise<Result<Asset, RepositoryError>> {
    if (this.shouldFailCreate) {
      return err(new RepositoryError("Mock repository error"));
    }

    this.assets.set(asset.id, asset);
    return ok(asset);
  }

  /**
   * Find an asset by ID
   */
  async findById(id: AssetId): Promise<Result<Asset | null, RepositoryError>> {
    if (this.shouldFailFindById) {
      return err(new RepositoryError("Mock repository error"));
    }

    const asset = this.assets.get(id);
    return ok(asset ?? null);
  }

  /**
   * Find all assets for a note
   */
  async findByNoteId(
    noteId: NoteId,
  ): Promise<Result<Asset[], RepositoryError>> {
    if (this.shouldFailFindByNoteId) {
      return err(new RepositoryError("Mock repository error"));
    }

    const assets = Array.from(this.assets.values()).filter(
      (asset) => asset.noteId === noteId,
    );
    return ok(assets);
  }

  /**
   * Delete an asset by ID
   */
  async delete(id: AssetId): Promise<Result<void, RepositoryError>> {
    if (this.shouldFailDelete) {
      return err(new RepositoryError("Mock repository error"));
    }

    this.assets.delete(id);
    return ok(undefined);
  }

  /**
   * Delete all assets for a note
   */
  async deleteByNoteId(noteId: NoteId): Promise<Result<void, RepositoryError>> {
    if (this.shouldFailDeleteByNoteId) {
      return err(new RepositoryError("Mock repository error"));
    }

    for (const [id, asset] of this.assets.entries()) {
      if (asset.noteId === noteId) {
        this.assets.delete(id);
      }
    }

    return ok(undefined);
  }

  /**
   * Reset the repository state
   */
  reset(): void {
    this.assets.clear();
    this.shouldFailCreate = false;
    this.shouldFailFindById = false;
    this.shouldFailFindByNoteId = false;
    this.shouldFailDelete = false;
    this.shouldFailDeleteByNoteId = false;
  }
}

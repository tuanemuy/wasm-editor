import { eq } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import { type Asset, reconstructAsset } from "@/core/domain/asset/entity";
import type { AssetRepository } from "@/core/domain/asset/ports/assetRepository";
import type { AssetId, NoteId } from "@/core/domain/asset/valueObject";
import { RepositoryError } from "@/core/error/adapter";
import type { Executor } from "./client";
import { assets } from "./schema";

export class DrizzleSqliteAssetRepository implements AssetRepository {
  constructor(private readonly executor: Executor) {}

  async create(asset: Asset): Promise<Result<Asset, RepositoryError>> {
    try {
      await this.executor.insert(assets).values({
        id: asset.id,
        noteId: asset.noteId,
        path: asset.path,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
        mimeType: asset.mimeType,
        createdAt: asset.createdAt,
      });

      return ok(asset);
    } catch (error) {
      return err(new RepositoryError("Failed to create asset", error));
    }
  }

  async findById(id: AssetId): Promise<Result<Asset | null, RepositoryError>> {
    try {
      const result = await this.executor
        .select()
        .from(assets)
        .where(eq(assets.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return reconstructAsset({
        id: result[0].id,
        noteId: result[0].noteId,
        path: result[0].path,
        fileName: result[0].fileName,
        fileSize: result[0].fileSize,
        mimeType: result[0].mimeType,
        createdAt: result[0].createdAt,
      }).mapErr((error) => new RepositoryError("Invalid asset data", error));
    } catch (error) {
      return err(new RepositoryError("Failed to find asset", error));
    }
  }

  async findByNoteId(
    noteId: NoteId,
  ): Promise<Result<Asset[], RepositoryError>> {
    try {
      const result = await this.executor
        .select()
        .from(assets)
        .where(eq(assets.noteId, noteId));

      const assetList = result
        .map((row) =>
          reconstructAsset({
            id: row.id,
            noteId: row.noteId,
            path: row.path,
            fileName: row.fileName,
            fileSize: row.fileSize,
            mimeType: row.mimeType,
            createdAt: row.createdAt,
          }).unwrapOr(null),
        )
        .filter((asset): asset is Asset => asset !== null);

      return ok(assetList);
    } catch (error) {
      return err(
        new RepositoryError("Failed to find assets by note ID", error),
      );
    }
  }

  async delete(id: AssetId): Promise<Result<void, RepositoryError>> {
    try {
      await this.executor.delete(assets).where(eq(assets.id, id));
      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete asset", error));
    }
  }

  async deleteByNoteId(noteId: NoteId): Promise<Result<void, RepositoryError>> {
    try {
      await this.executor.delete(assets).where(eq(assets.noteId, noteId));
      return ok(undefined);
    } catch (error) {
      return err(
        new RepositoryError("Failed to delete assets by note ID", error),
      );
    }
  }
}

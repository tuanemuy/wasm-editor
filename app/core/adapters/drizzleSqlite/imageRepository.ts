import type { InferSelectModel } from "drizzle-orm";
import { eq, notInArray, sql } from "drizzle-orm";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Image } from "@/core/domain/image/entity";
import type { ImageRepository } from "@/core/domain/image/ports/imageRepository";
import type {
  FileName,
  FileSize,
  ImageId,
  MimeType,
  StoragePath,
  Timestamp,
} from "@/core/domain/image/valueObject";
import type { Executor } from "./client";
import { images, notes } from "./schema";

type ImageDataModel = InferSelectModel<typeof images>;

export class DrizzleSqliteImageRepository implements ImageRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: ImageDataModel): Image {
    return {
      id: data.id as ImageId,
      fileName: data.fileName as FileName,
      mimeType: data.mimeType as MimeType,
      size: data.size as FileSize,
      width: data.width,
      height: data.height,
      storagePath: data.storagePath as StoragePath,
      uploadedAt: data.uploadedAt as Timestamp,
    };
  }

  async create(image: Image): Promise<Image> {
    try {
      await this.executor.insert(images).values({
        id: image.id,
        fileName: image.fileName,
        mimeType: image.mimeType,
        size: image.size,
        width: image.width,
        height: image.height,
        storagePath: image.storagePath,
        uploadedAt: new Date(image.uploadedAt),
      });

      return image;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to create image",
        error,
      );
    }
  }

  async delete(id: ImageId): Promise<void> {
    try {
      await this.executor.delete(images).where(eq(images.id, id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete image",
        error,
      );
    }
  }

  async findById(id: ImageId): Promise<Image | null> {
    try {
      const result = await this.executor
        .select()
        .from(images)
        .where(eq(images.id, id))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.into(result[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find image by ID",
        error,
      );
    }
  }

  async findAll(): Promise<Image[]> {
    try {
      const result = await this.executor.select().from(images);

      return result.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find all images",
        error,
      );
    }
  }

  async findUsedImageIds(): Promise<ImageId[]> {
    try {
      // Find all note bodies and extract image IDs using pattern matching
      // Pattern: ![alt](image://[image-id])
      const allNotes = await this.executor
        .select({ body: notes.body })
        .from(notes);

      const usedImageIds = new Set<string>();
      const pattern = /!\[.*?\]\(image:\/\/([a-f0-9-]+)\)/g;

      for (const note of allNotes) {
        const matches = note.body.matchAll(pattern);
        for (const match of matches) {
          usedImageIds.add(match[1]);
        }
      }

      return Array.from(usedImageIds) as ImageId[];
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find used image IDs",
        error,
      );
    }
  }

  async deleteUnusedImages(usedIds: ImageId[]): Promise<number> {
    try {
      if (usedIds.length === 0) {
        // If no images are used, delete all images
        const result = await this.executor
          .select({ count: sql<number>`count(*)` })
          .from(images);

        const count = Number(result[0].count);

        if (count > 0) {
          await this.executor.delete(images);
        }

        return count;
      }

      // Delete images that are not in the usedIds list
      const result = await this.executor
        .select({ count: sql<number>`count(*)` })
        .from(images)
        .where(notInArray(images.id, usedIds));

      const count = Number(result[0].count);

      if (count > 0) {
        await this.executor
          .delete(images)
          .where(notInArray(images.id, usedIds));
      }

      return count;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete unused images",
        error,
      );
    }
  }
}

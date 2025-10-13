import type { Image } from "../entity";
import type { ImageId } from "../valueObject";

export interface ImageRepository {
  /**
   * Create image metadata
   * @throws {SystemError}
   */
  create(image: Image): Promise<Image>;

  /**
   * Delete image metadata
   * @throws {SystemError}
   */
  delete(id: ImageId): Promise<void>;

  /**
   * Find image by ID
   * @throws {SystemError}
   */
  findById(id: ImageId): Promise<Image | null>;

  /**
   * Find all images
   * @throws {SystemError}
   */
  findAll(): Promise<Image[]>;

  /**
   * Find used image IDs (referenced in notes)
   * @throws {SystemError}
   */
  findUsedImageIds(): Promise<ImageId[]>;

  /**
   * Delete unused images
   * @throws {SystemError}
   */
  deleteUnusedImages(usedIds: ImageId[]): Promise<number>;
}

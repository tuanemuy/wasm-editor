export interface ImageProcessingPort {
  /**
   * Get image dimensions
   * @throws {SystemError}
   */
  getImageDimensions(file: File): Promise<{ width: number; height: number }>;

  /**
   * Resize image if needed
   * @throws {SystemError}
   */
  resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<Blob>;

  /**
   * Optimize image
   * @throws {SystemError}
   */
  optimizeImage(file: File, quality: number): Promise<Blob>;
}

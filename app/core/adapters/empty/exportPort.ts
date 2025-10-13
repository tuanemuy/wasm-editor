/**
 * Empty Export Port
 *
 * Stub implementation for testing purposes.
 * Use vi.spyOn to mock methods in tests.
 */
import type { Note } from "@/core/domain/note/entity";
import type {
  ExportedFile,
  ExportPort,
} from "@/core/domain/note/ports/exportPort";

export class EmptyExportPort implements ExportPort {
  async exportAsMarkdown(_note: Note): Promise<ExportedFile> {
    throw new Error("Not implemented");
  }

  async exportMultipleAsMarkdown(_notes: Note[]): Promise<Blob> {
    throw new Error("Not implemented");
  }
}

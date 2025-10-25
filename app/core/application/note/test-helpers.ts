/**
 * Test helpers for Note domain
 */
import type { StructuredContent } from "@/core/domain/note/valueObject";

/**
 * Create a simple StructuredContent for testing
 * Mimics a basic Tiptap document structure
 */
export function createTestContent(text?: string): StructuredContent {
  return {
    type: "doc",
    content: text
      ? [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text,
              },
            ],
          },
        ]
      : [],
  };
}

/**
 * Create an empty StructuredContent for testing
 */
export function createEmptyContent(): StructuredContent {
  return {
    type: "doc",
    content: [],
  };
}

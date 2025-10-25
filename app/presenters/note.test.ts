import { describe, expect, it } from "vitest";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { extractTitle, generateNotePreview } from "./note";

describe("extractTitle", () => {
  it("should extract first line as title", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ text: "First line" }],
        },
        {
          type: "paragraph",
          content: [{ text: "Second line" }],
        },
      ],
    };

    expect(extractTitle(content)).toBe("First line");
  });

  it("should return 'Untitled' for empty content", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [],
    };

    expect(extractTitle(content)).toBe("Untitled");
  });

  it("should handle whitespace-only content", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ text: "   " }],
        },
      ],
    };

    expect(extractTitle(content)).toBe("Untitled");
  });

  it("should trim whitespace from title", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ text: "  Title with spaces  " }],
        },
      ],
    };

    expect(extractTitle(content)).toBe("Title with spaces");
  });

  it("should handle headings", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ text: "Heading Title" }],
        },
      ],
    };

    expect(extractTitle(content)).toBe("Heading Title");
  });
});

describe("generateNotePreview", () => {
  it("should generate preview from multiple paragraphs", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ text: "First paragraph" }],
        },
        {
          type: "paragraph",
          content: [{ text: "Second paragraph" }],
        },
        {
          type: "paragraph",
          content: [{ text: "Third paragraph" }],
        },
      ],
    };

    expect(generateNotePreview(content)).toBe(
      "First paragraph Second paragraph Third paragraph",
    );
  });

  it("should truncate preview at max length", () => {
    const longText = "a".repeat(200);
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ text: longText }],
        },
      ],
    };

    const preview = generateNotePreview(content, 150);
    expect(preview.length).toBe(153); // 150 + "..."
    expect(preview.endsWith("...")).toBe(true);
  });

  it("should return 'Empty note' for empty content", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [],
    };

    expect(generateNotePreview(content)).toBe("Empty note");
  });

  it("should skip empty lines", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ text: "First" }],
        },
        {
          type: "paragraph",
          content: [{ text: "" }],
        },
        {
          type: "paragraph",
          content: [{ text: "Second" }],
        },
      ],
    };

    expect(generateNotePreview(content)).toBe("First Second");
  });

  it("should handle nested content", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { text: "Bold " },
            { text: "text", marks: [{ type: "bold" }] },
          ],
        },
      ],
    };

    expect(generateNotePreview(content)).toBe("Bold text");
  });

  it("should limit to 3 lines", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ text: "Line 1" }] },
        { type: "paragraph", content: [{ text: "Line 2" }] },
        { type: "paragraph", content: [{ text: "Line 3" }] },
        { type: "paragraph", content: [{ text: "Line 4" }] },
        { type: "paragraph", content: [{ text: "Line 5" }] },
      ],
    };

    expect(generateNotePreview(content)).toBe("Line 1 Line 2 Line 3");
  });

  it("should handle malformed content gracefully", () => {
    const content = null as unknown as StructuredContent;
    expect(generateNotePreview(content)).toBe("Empty note");
  });
});

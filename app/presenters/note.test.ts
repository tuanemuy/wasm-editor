import { describe, expect, it } from "vitest";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { extractTitle, generateNotePreview } from "./note";

describe("extractTitle", () => {
  it("should extract first heading as title", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ text: "My Title" }],
        },
        {
          type: "paragraph",
          content: [{ text: "First paragraph" }],
        },
      ],
    };

    expect(extractTitle(content)).toBe("My Title");
  });

  it("should use first heading even if there are paragraphs before it", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ text: "Some text before heading" }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ text: "First Heading" }],
        },
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ text: "Second Heading" }],
        },
      ],
    };

    expect(extractTitle(content)).toBe("First Heading");
  });

  it("should extract first 50 characters when no heading exists", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ text: "This is a long paragraph without any headings" }],
        },
      ],
    };

    expect(extractTitle(content)).toBe(
      "This is a long paragraph without any headings",
    );
  });

  it("should truncate text to 50 characters with ellipsis", () => {
    const longText =
      "This is a very long text that exceeds fifty characters and should be truncated";
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ text: longText }],
        },
      ],
    };

    const result = extractTitle(content);
    expect(result).toBe(
      "This is a very long text that exceeds fifty charac...",
    );
    expect(result.length).toBe(53); // 50 + "..."
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
          type: "heading",
          attrs: { level: 1 },
          content: [{ text: "  Title with spaces  " }],
        },
      ],
    };

    expect(extractTitle(content)).toBe("Title with spaces");
  });

  it("should handle heading with multiple text nodes", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [
            { text: "Bold " },
            { text: "Title", marks: [{ type: "bold" }] },
          ],
        },
      ],
    };

    expect(extractTitle(content)).toBe("Bold Title");
  });

  it("should skip empty headings and use next heading", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ text: "   " }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ text: "Valid Heading" }],
        },
      ],
    };

    expect(extractTitle(content)).toBe("Valid Heading");
  });

  it("should extract heading from nested structures", () => {
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ text: "Nested Heading" }],
            },
          ],
        },
      ],
    };

    expect(extractTitle(content)).toBe("Nested Heading");
  });

  it("should handle emoji and surrogate pairs correctly when truncating", () => {
    // Create a text with exactly 50 emoji characters
    const emojiText = "🤖".repeat(50);
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ text: emojiText }],
        },
      ],
    };

    const result = extractTitle(content);
    // Should not truncate as it's exactly 50 code points
    expect(result).toBe(emojiText);
    expect(Array.from(result).length).toBe(50);
  });

  it("should truncate emoji text correctly at code point boundaries", () => {
    // Create a text with 60 emoji characters
    const emojiText = "🤖".repeat(60);
    const content: StructuredContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ text: emojiText }],
        },
      ],
    };

    const result = extractTitle(content);
    // Should truncate to 50 emoji + "..."
    expect(result).toBe(`${"🤖".repeat(50)}...`);
    // Verify we have exactly 50 emoji characters (not counting the ellipsis)
    const withoutEllipsis = result.slice(0, -3);
    expect(Array.from(withoutEllipsis).length).toBe(50);
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

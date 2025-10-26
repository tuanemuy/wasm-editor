import type { Editor } from "@tiptap/react";
import { useCallback } from "react";

type UseLinkHandlerOptions = {
  editor: Editor | null;
};

/**
 * Custom hook for handling link operations in the editor
 */
export function useLinkHandler({ editor }: UseLinkHandlerOptions) {
  const toggleLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // User cancelled
    if (url === null) {
      return;
    }

    // Remove link if empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // Validate URL
    try {
      const parsed = new URL(url);
      // Prevent javascript: URLs for security
      if (parsed.protocol === "javascript:") {
        alert("javascript: URLs are not allowed for security reasons");
        return;
      }
    } catch {
      // Invalid URL format - show error
      alert(
        "Invalid URL format. Please enter a valid URL (e.g., https://example.com)",
      );
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return { toggleLink };
}

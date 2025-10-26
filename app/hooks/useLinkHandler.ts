import type { Editor } from "@tiptap/react";
import { useCallback, useState } from "react";

type UseLinkHandlerOptions = {
  editor: Editor | null;
};

type LinkDialogState = {
  isOpen: boolean;
  initialUrl: string;
};

/**
 * Custom hook for handling link operations in the editor
 * Returns dialog state and handlers for use with LinkDialog component
 */
export function useLinkHandler({ editor }: UseLinkHandlerOptions) {
  const [dialogState, setDialogState] = useState<LinkDialogState>({
    isOpen: false,
    initialUrl: "",
  });

  const openLinkDialog = useCallback(() => {
    if (!editor) return;

    const linkAttrs = editor.getAttributes("link");
    const previousUrl =
      typeof linkAttrs.href === "string" ? linkAttrs.href : "";
    setDialogState({
      isOpen: true,
      initialUrl: previousUrl,
    });
  }, [editor]);

  const handleConfirm = useCallback(
    (url: string) => {
      if (!editor) return;

      // Remove link if empty
      if (url === "") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: url })
          .run();
      }

      setDialogState({ isOpen: false, initialUrl: "" });
    },
    [editor],
  );

  const handleCancel = useCallback(() => {
    setDialogState({ isOpen: false, initialUrl: "" });
  }, []);

  return {
    dialogState,
    openLinkDialog,
    handleConfirm,
    handleCancel,
  };
}

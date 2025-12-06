import { mergeAttributes, Node } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { CustomBlockNodeView } from "./CustomBlockNodeView";
import {
  handleBlockquoteEnter,
  handleCodeBlockEnter,
  handleHeadingEnter,
  handleListItemEnter,
} from "./handlers";
import { findNodeDepth } from "./helpers";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customBlock: {
      setCustomBlock: (position?: number) => ReturnType;
    };
  }
}

export const CustomBlock = Node.create({
  name: "customBlock",
  priority: 1000,
  group: "customBlock",
  content: "block",
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [{ tag: '[data-type="tiptap-custom-block"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-content": node.child.name,
        "data-type": "tiptap-custom-block",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomBlockNodeView);
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const {
          selection: { $head, from },
        } = editor.state;

        // Check if we're inside a customBlock
        const customBlockDepth = findNodeDepth($head, "customBlock");
        if (customBlockDepth === -1) return false;

        const currentNode = $head.parent;

        // Handle Enter in lists
        // If in a list, delegate to list handler
        if (editor.isActive("bulletList") || editor.isActive("orderedList")) {
          const result = handleListItemEnter(editor);
          // If false, let default list behavior handle it
          return result === false ? false : result;
        }

        // Handle Enter in code blocks
        // If in a code block, delegate to code block handler
        if (editor.isActive("codeBlock")) {
          const result = handleCodeBlockEnter(editor);
          // If false, let default code block behavior handle it
          return result === false ? false : result;
        }

        // Handle Enter in blockquotes
        // If in a blockquote, delegate to blockquote handler
        if (editor.isActive("blockquote")) {
          return handleBlockquoteEnter(editor);
        }

        // Handle Enter in headings
        if (currentNode.type.name === "heading") {
          return handleHeadingEnter(editor);
        }

        // Default behavior: split current block
        return editor
          .chain()
          .command(({ tr }) => {
            const { schema } = tr.doc.type;
            const customBlockType = schema.nodes.customBlock;
            const paragraphType = schema.nodes.paragraph;

            // Get content after cursor in current node
            const contentAfter = currentNode.content.cut($head.parentOffset);

            // Delete content after cursor from current node
            if (contentAfter.size > 0) {
              tr.delete(from, from + contentAfter.size);
            }

            // Create new customBlock with paragraph containing the content after cursor
            const newParagraph = paragraphType.create(null, contentAfter);
            const newBlock = customBlockType.create(null, newParagraph);

            // Insert new block after current customBlock
            const afterCustomBlock = tr.mapping.map(
              $head.after(customBlockDepth),
            );
            tr.insert(afterCustomBlock, newBlock);

            // Set selection to start of new paragraph
            const newPos = afterCustomBlock + 2; // +1 for customBlock, +1 for paragraph
            tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)));

            return true;
          })
          .run();
      },
    };
  },
});

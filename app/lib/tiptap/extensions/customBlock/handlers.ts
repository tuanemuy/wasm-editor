import type { Editor } from "@tiptap/core";
import type { Node, ResolvedPos } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import {
  createParagraphBlock,
  findNodeDepth,
  isEmptyListItem,
  replaceWithParagraphBlock,
} from "./helpers";

/**
 * Check if there is a parent list node (bulletList or orderedList)
 */
function hasParentListNode(
  $pos: ResolvedPos,
  currentListDepth: number,
): boolean {
  for (let d = currentListDepth - 1; d > 0; d--) {
    const node = $pos.node(d);
    if (node.type.name === "bulletList" || node.type.name === "orderedList") {
      return true;
    }
  }
  return false;
}

/**
 * Handle Enter key in list items
 */
export function handleListItemEnter(editor: Editor): boolean {
  const { state } = editor;
  const { $head } = state.selection;

  // Find list item depth
  const listItemDepth = findNodeDepth($head, "listItem");
  if (listItemDepth === -1) return false;

  const listItemNode = $head.node(listItemDepth);

  // Check if list item is empty
  if (!isEmptyListItem(listItemNode)) {
    return false; // Let default behavior handle non-empty items
  }

  const listDepth = listItemDepth - 1;
  const listNode = $head.node(listDepth);
  const listPos = $head.before(listDepth);
  const listItemIndex = $head.index(listDepth);
  const isLastItem = listItemIndex === listNode.childCount - 1;

  // Not the last item: insert new empty list item
  if (!isLastItem) {
    return editor
      .chain()
      .command(({ tr }) => {
        const listItemType = tr.doc.type.schema.nodes.listItem;
        const paragraphType = tr.doc.type.schema.nodes.paragraph;

        const afterCurrentItem = $head.after(listItemDepth);
        const newListItem = listItemType.create(null, paragraphType.create());

        tr.insert(afterCurrentItem, newListItem);
        tr.setSelection(
          TextSelection.near(tr.doc.resolve(afterCurrentItem + 2)),
        );

        return true;
      })
      .run();
  }

  // Check if parent has a list (nested list)
  const hasParentList = hasParentListNode($head, listDepth);

  if (hasParentList) {
    // Nested list: lift to parent level
    return editor.commands.liftListItem("listItem");
  }

  // Top-level list: exit to paragraph
  return editor
    .chain()
    .command(({ tr }) => {
      const listItemPos = $head.before(listItemDepth);

      // If this is the only item in the list, replace entire list
      if (listNode.childCount === 1) {
        return replaceWithParagraphBlock(editor, listPos, listNode.nodeSize);
      }

      // Otherwise, delete this item and insert paragraph after list
      const listEnd = listPos + listNode.nodeSize;
      tr.delete(listItemPos, listItemPos + listItemNode.nodeSize);

      // Insert new paragraph after list (after deletion)
      const afterList = tr.mapping.map(listEnd);
      const block = createParagraphBlock(editor);
      tr.insert(afterList, block);
      tr.setSelection(TextSelection.near(tr.doc.resolve(afterList + 2)));

      return true;
    })
    .run();
}

/**
 * Handle Enter key in code blocks
 */
export function handleCodeBlockEnter(editor: Editor): boolean {
  const { $from } = editor.state.selection;

  // Find the code block node
  const codeBlockDepth = findNodeDepth($from, "codeBlock");
  if (codeBlockDepth === -1) return false;

  const codeBlockNode = $from.node(codeBlockDepth);
  const textContent = codeBlockNode.textContent;
  const cursorPos = $from.parentOffset;

  // Check if current line (where cursor is) is empty
  const textBefore = textContent.substring(0, cursorPos);
  const textAfter = textContent.substring(cursorPos);

  // Get text on current line before cursor
  const lastNewlineBeforeIndex = textBefore.lastIndexOf("\n");
  const textBeforeOnLine =
    lastNewlineBeforeIndex === -1
      ? textBefore
      : textBefore.substring(lastNewlineBeforeIndex + 1);

  // Get text on current line after cursor
  const nextNewlineAfterIndex = textAfter.indexOf("\n");
  const textAfterOnLine =
    nextNewlineAfterIndex === -1
      ? textAfter
      : textAfter.substring(0, nextNewlineAfterIndex);

  const isCurrentLineEmpty =
    textBeforeOnLine.trim() === "" && textAfterOnLine.trim() === "";
  const isLastLine =
    nextNewlineAfterIndex === -1 && textAfterOnLine.trim() === "";

  if (!isCurrentLineEmpty || !isLastLine) {
    return false; // Let the code block handle Enter key for non-empty content
  }

  return editor
    .chain()
    .command(({ tr }) => {
      // Calculate position of empty line start (from last newline to cursor)
      const codeBlockStart = $from.start(codeBlockDepth);
      const emptyLineStart =
        lastNewlineBeforeIndex === -1
          ? codeBlockStart
          : codeBlockStart + lastNewlineBeforeIndex;
      const emptyLineEnd = $from.pos;

      // Delete the empty line
      tr.delete(emptyLineStart, emptyLineEnd);

      // Insert new paragraph after code block
      const afterCodeBlock = tr.mapping.map($from.after(codeBlockDepth));
      const block = createParagraphBlock(editor);
      tr.insert(afterCodeBlock, block);

      // Move cursor to new paragraph
      tr.setSelection(TextSelection.near(tr.doc.resolve(afterCodeBlock + 2)));
      return true;
    })
    .run();
}

/**
 * Handle Enter key in blockquotes
 */
export function handleBlockquoteEnter(editor: Editor): boolean {
  const { state } = editor;
  const { $from } = state.selection;
  const currentNode = $from.parent;

  // Check if current paragraph is empty
  const isCurrentParagraphEmpty =
    currentNode.type.name === "paragraph" && currentNode.content.size === 0;

  if (isCurrentParagraphEmpty) {
    return handleEmptyBlockquoteParagraph(editor, $from, currentNode);
  }

  return handleNonEmptyBlockquoteParagraph(editor, $from, currentNode);
}

/**
 * Handle Enter in empty blockquote paragraph
 */
function handleEmptyBlockquoteParagraph(
  editor: Editor,
  $from: ResolvedPos,
  currentNode: Node,
): boolean {
  const blockquoteDepth = findNodeDepth($from, "blockquote");
  if (blockquoteDepth === -1) return false;

  const blockquoteNode = $from.node(blockquoteDepth);
  const blockquotePos = $from.before(blockquoteDepth);
  const paragraphIndex = $from.index(blockquoteDepth);
  const isLastParagraph = paragraphIndex === blockquoteNode.childCount - 1;

  // Not the last paragraph: create new paragraph in blockquote
  if (!isLastParagraph) {
    return editor.commands.splitBlock();
  }

  return editor
    .chain()
    .command(({ tr }) => {
      // If blockquote has only one paragraph (this empty one), replace entire blockquote
      if (blockquoteNode.childCount === 1) {
        return replaceWithParagraphBlock(
          editor,
          blockquotePos,
          blockquoteNode.nodeSize,
        );
      }

      // If blockquote has multiple paragraphs, delete just the empty one
      const paragraphPos = $from.before($from.depth);
      const blockquoteEnd = blockquotePos + blockquoteNode.nodeSize;

      tr.delete(paragraphPos, paragraphPos + currentNode.nodeSize);

      // Calculate position after blockquote (after deletion)
      const afterBlockquote = tr.mapping.map(blockquoteEnd);
      const block = createParagraphBlock(editor);
      tr.insert(afterBlockquote, block);

      // Move cursor to new paragraph
      tr.setSelection(TextSelection.near(tr.doc.resolve(afterBlockquote + 2)));
      return true;
    })
    .run();
}

/**
 * Handle Enter in non-empty blockquote paragraph
 */
function handleNonEmptyBlockquoteParagraph(
  editor: Editor,
  $from: ResolvedPos,
  currentNode: Node,
): boolean {
  return editor
    .chain()
    .command(({ tr, state }) => {
      const paragraphType = tr.doc.type.schema.nodes.paragraph;

      // Get text after cursor
      const textAfter = currentNode.textBetween(
        $from.parentOffset,
        currentNode.content.size,
        "\n",
      );

      // Delete text after cursor from current paragraph
      if (textAfter) {
        const deleteFrom = $from.pos;
        const deleteTo = $from.pos + textAfter.length;
        tr.delete(deleteFrom, deleteTo);
      }

      // Insert new paragraph after current one
      const afterCurrentParagraph = tr.mapping.map($from.after($from.depth));

      // Create new paragraph with the text that was after cursor
      const newParagraph = paragraphType.create(
        null,
        textAfter ? state.schema.text(textAfter) : undefined,
      );

      tr.insert(afterCurrentParagraph, newParagraph);
      tr.setSelection(
        TextSelection.near(tr.doc.resolve(afterCurrentParagraph + 1)),
      );

      return true;
    })
    .run();
}

/**
 * Handle Enter key in headings
 */
export function handleHeadingEnter(editor: Editor): boolean {
  const { state } = editor;
  const { $head, from } = state.selection;
  const currentNode = $head.parent;

  // Check if we're in a customBlock
  const customBlockDepth = findNodeDepth($head, "customBlock");
  if (customBlockDepth === -1) {
    // Not in customBlock, use default behavior
    return editor
      .chain()
      .command(({ tr }) => {
        tr.split($head.pos, 1);
        const afterPos = tr.mapping.map($head.pos);
        const $afterPos = tr.doc.resolve(afterPos);

        if ($afterPos.parent.type.name === "heading") {
          tr.setNodeMarkup(
            $afterPos.before(),
            tr.doc.type.schema.nodes.paragraph,
          );
        }
        return true;
      })
      .run();
  }

  // In customBlock, use custom logic to preserve content
  return editor
    .chain()
    .command(({ tr }) => {
      const { schema } = tr.doc.type;
      const customBlockType = schema.nodes.customBlock;
      const paragraphType = schema.nodes.paragraph;

      // Get content after cursor in current heading
      const contentAfter = currentNode.content.cut($head.parentOffset);

      // Delete content after cursor from current heading
      if (contentAfter.size > 0) {
        tr.delete(from, from + contentAfter.size);
      }

      // Create new customBlock with paragraph containing the content after cursor
      const newParagraph = paragraphType.create(null, contentAfter);
      const newBlock = customBlockType.create(null, newParagraph);

      // Insert new block after current customBlock
      const afterCustomBlock = tr.mapping.map($head.after(customBlockDepth));
      tr.insert(afterCustomBlock, newBlock);

      // Set selection to start of new paragraph
      const newPos = afterCustomBlock + 2; // +1 for customBlock, +1 for paragraph
      tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)));

      return true;
    })
    .run();
}

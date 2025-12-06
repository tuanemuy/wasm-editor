import type { Editor } from "@tiptap/core";
import type { Node, ResolvedPos } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";

/**
 * Find the depth of a specific node type in the resolved position
 */
export function findNodeDepth(
  $pos: ResolvedPos,
  nodeTypeName: string,
  maxDepth?: number,
): number {
  const endDepth = maxDepth !== undefined ? maxDepth : 0;
  for (let d = $pos.depth; d > endDepth; d--) {
    if ($pos.node(d).type.name === nodeTypeName) {
      return d;
    }
  }
  return -1;
}

/**
 * Create a customBlock containing a paragraph
 */
export function createParagraphBlock(editor: Editor) {
  const { schema } = editor.state;
  const paragraphType = schema.nodes.paragraph;
  const customBlockType = schema.nodes.customBlock;

  return customBlockType.create(null, paragraphType.create());
}

/**
 * Insert a paragraph block at the specified position and move cursor to it
 */
export function insertParagraphBlockAt(editor: Editor, pos: number): boolean {
  return editor
    .chain()
    .command(({ tr }) => {
      const block = createParagraphBlock(editor);
      tr.insert(pos, block);
      tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 2)));
      return true;
    })
    .run();
}

/**
 * Check if a node is an empty paragraph
 */
export function isEmptyParagraph(node: Node): boolean {
  return node.type.name === "paragraph" && node.content.size === 0;
}

/**
 * Check if a list item is empty (contains only an empty paragraph)
 */
export function isEmptyListItem(node: Node): boolean {
  return (
    node.childCount === 1 &&
    node.firstChild?.type.name === "paragraph" &&
    node.firstChild.content.size === 0
  );
}

/**
 * Replace a node with a paragraph block
 */
export function replaceWithParagraphBlock(
  editor: Editor,
  nodePos: number,
  nodeSize: number,
): boolean {
  return editor
    .chain()
    .command(({ tr }) => {
      const block = createParagraphBlock(editor);
      tr.delete(nodePos, nodePos + nodeSize);
      tr.insert(nodePos, block);
      tr.setSelection(TextSelection.near(tr.doc.resolve(nodePos + 2)));
      return true;
    })
    .run();
}
